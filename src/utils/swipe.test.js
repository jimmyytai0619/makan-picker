import { describe, it, expect } from 'vitest'
import { swipeDecision } from './swipe'

describe('swipeDecision', () => {
  it('a long drag to the right is a like', () => {
    expect(swipeDecision(150, 600)).toBe('right')
  })

  it('a long drag to the left is a nope', () => {
    expect(swipeDecision(-150, 600)).toBe('left')
  })

  it('a short, slow drag springs back', () => {
    expect(swipeDecision(60, 800)).toBeNull()
    expect(swipeDecision(-20, 100)).toBeNull()
  })

  it('a short but fast flick still counts', () => {
    expect(swipeDecision(50, 60)).toBe('right') // 0.83 px/ms
    expect(swipeDecision(-50, 60)).toBe('left')
  })

  it('does not crash when no time has passed', () => {
    expect(swipeDecision(50, 0)).toBeNull()
  })
})
