import { describe, expect, it } from 'vitest'
import { mergeRemoved, withEntry, withoutId } from './removedList'

const a = { id: 'osm-node-1', name: 'A', category: 'cafe', removedAt: 1 }
const b = { id: 'osm-node-2', name: 'B', category: 'cafe', removedAt: 2 }
const c = { id: 'osm-node-3', name: 'C', category: 'cafe', removedAt: 3 }

describe('withEntry', () => {
  it('adds a new entry at the top', () => {
    expect(withEntry([a], b)).toEqual([b, a])
  })

  it('ignores a place that is already removed', () => {
    const list = [a]
    expect(withEntry(list, { ...a, removedAt: 99 })).toBe(list)
  })
})

describe('withoutId', () => {
  it('drops only that place', () => {
    expect(withoutId([a, b, c], b.id)).toEqual([a, c])
  })
})

describe('mergeRemoved', () => {
  it('keeps removals that only this phone knows about', () => {
    // The bug: the shared list was empty, so phone-only removals came back.
    expect(mergeRemoved([], [a, b])).toEqual([a, b])
  })

  it('does not list a place twice when the server already has it', () => {
    expect(mergeRemoved([a, c], [a, b])).toEqual([b, a, c])
  })

  it('is just the shared list when the phone has nothing extra', () => {
    expect(mergeRemoved([a], [])).toEqual([a])
  })
})
