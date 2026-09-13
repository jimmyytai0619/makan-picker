import { describe, it, expect } from 'vitest'
import { addLike } from './likes'

const cafe = (id) => ({ id, name: `Cafe ${id}` })

describe('addLike', () => {
  it('adds a new place to the end', () => {
    expect(addLike([cafe('a')], cafe('b')).map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('does not add the same place twice (bug: Back from roulette, then like again)', () => {
    const liked = [cafe('c'), cafe('b')]
    expect(addLike(liked, cafe('c')).map((r) => r.id)).toEqual(['c', 'b'])
  })

  it('never changes the original array', () => {
    const liked = [cafe('a')]
    addLike(liked, cafe('b'))
    expect(liked).toHaveLength(1)
  })
})
