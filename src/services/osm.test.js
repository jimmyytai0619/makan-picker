import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchNearbyPlaces } from './osm'

// A fake server answer, shaped like what fetch() gives back.
const answer = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body })

const ONE_PLACE = {
  elements: [{ type: 'node', id: 1, lat: 3.05, lon: 101.76, tags: { name: 'Tealive', amenity: 'cafe' } }],
}

// Each test searches a different spot, so the in-memory cache never interferes.
let spot = 0
const search = () =>
  searchNearbyPlaces({ center: { lat: 3 + ++spot / 100, lng: 101.7 }, radiusKm: 3, placeTypes: ['cafe'] })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('searchNearbyPlaces retry', () => {
  it('tries again once when the map server is busy (502), and returns the places', async () => {
    vi.useFakeTimers()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(answer(502, { error: 'busy' }))
      .mockResolvedValueOnce(answer(200, ONE_PLACE))
    vi.stubGlobal('fetch', fetch)

    const result = search()
    await vi.runAllTimersAsync() // skip the short wait before the retry
    const places = await result

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(places.map((p) => p.name)).toEqual(['Tealive'])
  })

  it('shows the server message if the retry is also busy', async () => {
    vi.useFakeTimers()
    const busy = answer(502, { error: 'The free map servers are busy right now. Please try again in a minute.' })
    const fetch = vi.fn().mockResolvedValue(busy)
    vi.stubGlobal('fetch', fetch)

    const result = search()
    const check = expect(result).rejects.toThrow('The free map servers are busy')
    await vi.runAllTimersAsync()
    await check
    expect(fetch).toHaveBeenCalledTimes(2) // one retry only, never an endless loop
  })

  it('does NOT retry a real mistake like bad input (400)', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(400, { error: 'lat must be a number between -90 and 90' }))
    vi.stubGlobal('fetch', fetch)

    await expect(search()).rejects.toThrow('lat must be a number')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
