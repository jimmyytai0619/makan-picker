import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanFilters, loadPreviousSearch, readStored, writeStored, validPlaces, rememberWinner } from './preferences'

afterEach(() => vi.unstubAllGlobals())
const place = id => ({ id, name: `Cafe ${id}`, category: 'cafe' })
const filters = { location: { lat: 3.1, lng: 101.7, label: 'Cheras' }, source: 'nearby', maxDistanceKm: 5, playStyle: 'roulette', cuisineKeyword: 'mamak', hideClosed: true, avoidRecent: true }

function storage(raw) {
  vi.stubGlobal('localStorage', { getItem: vi.fn(() => raw), setItem: vi.fn() })
}

describe('remembered preferences', () => {
  it('restores the selected area and all filters', () => { expect(cleanFilters(filters)).toEqual(filters) })
  it('rejects invalid coordinates and out-of-range distances', () => {
    expect(cleanFilters({ location: { lat: 91, lng: 0, label: 'bad' }, maxDistanceKm: 100, source: 'bad' })).toMatchObject({ location: null, maxDistanceKm: 3, source: 'nearby' })
    expect(cleanFilters(null).location).toBeNull()
  })
  it('handles corrupt or unavailable storage', () => {
    storage('{bad'); expect(readStored('filters', {})).toEqual({})
    vi.stubGlobal('localStorage', { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('full') } })
    expect(readStored('filters', {})).toEqual({})
    expect(() => writeStored('filters', filters)).not.toThrow()
  })
})
describe('previous search recovery', () => {
  it('restores results with their original area and timestamp', () => {
    storage(JSON.stringify({ filters, places: [place('a')], updatedAt: 123 }))
    expect(loadPreviousSearch()).toEqual({ filters, places: [place('a')], updatedAt: 123 })
  })
  it('rejects empty, corrupt, or saved-cafe search snapshots', () => {
    for (const value of [null, {}, { filters, places: [], updatedAt: 1 }, { filters: { ...filters, source: 'saved' }, places: [place('a')], updatedAt: 1 }]) {
      storage(JSON.stringify(value)); expect(loadPreviousSearch()).toBeNull()
    }
  })
})
describe('personal place library', () => {
  it('moves a repeat winner to the front without duplicates', () => {
    expect(rememberWinner([place('a'), place('b')], place('b'), 100)).toEqual([{ ...place('b'), wonAt: 100 }, place('a')])
  })
  it('keeps only 20 distinct recent winners', () => {
    const history = Array.from({ length: 20 }, (_, i) => place(String(i)))
    const updated = rememberWinner(history, place('new'), 100)
    expect(updated).toHaveLength(20); expect(updated.at(-1).id).toBe('18')
  })
  it('ignores malformed saved list entries', () => {
    expect(validPlaces({})).toEqual([])
    expect(validPlaces([null, {}, place('a')])).toEqual([place('a')])
  })
})
