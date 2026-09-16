import { describe, expect, it } from 'vitest'
import { withEntry, withoutId } from './removedList'

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
