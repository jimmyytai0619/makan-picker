import { describe, expect, it } from 'vitest'
import { undoLastSwipe } from './swipeHistory'

const places = ['a', 'b', 'c', 'd'].map((id) => ({ id: `osm-node-${id}`, name: id.toUpperCase() }))
const [A, B, C] = places

describe('undoLastSwipe', () => {
  it('has nothing to undo before the first swipe', () => {
    expect(undoLastSwipe([], places)).toBeNull()
  })

  it('brings back the last card and says it was a like', () => {
    const history = [
      { id: A.id, liked: false },
      { id: B.id, liked: true },
    ]
    expect(undoLastSwipe(history, places)).toEqual({
      history: [{ id: A.id, liked: false }],
      index: 1, // B is the 2nd card
      entry: { id: B.id, liked: true },
    })
  })

  it('can undo again and again, back to the first card', () => {
    let history = [
      { id: A.id, liked: true },
      { id: B.id, liked: false },
    ]
    history = undoLastSwipe(history, places).history
    const second = undoLastSwipe(history, places)
    expect(second.index).toBe(0)
    expect(second.history).toEqual([])
    expect(undoLastSwipe(second.history, places)).toBeNull()
  })

  it('finds the right card even after an earlier card was removed (closed down)', () => {
    const history = [
      { id: A.id, liked: false },
      { id: C.id, liked: true },
    ]
    const withoutA = places.filter((p) => p.id !== A.id) // A removed: C is now the 2nd card
    expect(undoLastSwipe(history, withoutA).index).toBe(1)
  })

  it('skips a swiped place that has since been removed', () => {
    const history = [
      { id: A.id, liked: false },
      { id: B.id, liked: true },
    ]
    const withoutB = places.filter((p) => p.id !== B.id)
    expect(undoLastSwipe(history, withoutB)).toEqual({ history: [], index: 0, entry: { id: A.id, liked: false } })
  })
})
