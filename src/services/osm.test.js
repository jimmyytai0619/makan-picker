import { afterEach, describe, expect, it, vi } from 'vitest'
import { locationCandidates, searchNearbyPlaces } from './osm'

// A fake server answer, shaped like what fetch() gives back.
const answer = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body })

const ONE_PLACE = {
  elements: [{ type: 'node', id: 1, lat: 3.01, lon: 101.7, tags: { name: 'Tealive', amenity: 'cafe' } }],
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


describe('nearby distance accuracy', () => {
  it('recalculates exact distances when two centers share a rounded cache key', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(200, {
      elements: [{ type: 'node', id: 77, lat: 4.1, lon: 102.7, tags: { name: 'Cafe', amenity: 'cafe' } }],
    }))
    vi.stubGlobal('fetch', fetch)
    const options = { radiusKm: 3, placeTypes: ['cafe'] }
    const first = await searchNearbyPlaces({ ...options, center: { lat: 4.1001, lng: 102.7 } })
    const second = await searchNearbyPlaces({ ...options, center: { lat: 4.1004, lng: 102.7 } })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(second[0].distanceInKm).toBeGreaterThan(first[0].distanceInKm * 3)
  })
  it('drops invalid coordinates and places outside the requested radius', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(200, { elements: [
      { type: 'node', id: 1, lat: 3, lon: 103, tags: { name: 'Inside' } },
      { type: 'node', id: 2, lat: 4, lon: 103, tags: { name: 'Outside' } },
      { type: 'node', id: 3, lat: '3', lon: 103, tags: { name: 'Invalid' } },
    ] })))
    const places = await searchNearbyPlaces({ center: { lat: 3, lng: 103 }, radiusKm: 1, placeTypes: ['cafe'] })
    expect(places.map(p => p.name)).toEqual(['Inside'])
  })
})


it('keeps similarly named landmarks distinct and exposes the location type', () => {
  const candidates = locationCandidates([
    { lat: '3.1015294', lon: '101.6851476', type: 'bus_stop', display_name: 'Faber Towers (Opp), Jalan Desa Bahagia, Taman Danau Desa, Taman Desa, Kuala Lumpur' },
    { lat: '3.2', lon: '101.6', type: 'building', display_name: 'Faber Towers, Damansara' },
    { lat: 'bad', lon: '101', display_name: 'Broken' },
  ])
  expect(candidates).toHaveLength(2)
  expect(candidates[0].label).toContain('Taman Desa')
  expect(candidates[0].locationType).toBe('bus stop')
  expect(candidates[1].label).toContain('Damansara')
})
