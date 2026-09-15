import { describe, it, expect } from 'vitest'
import { formatDistance, formatTimeAgo } from './format'

describe('formatDistance', () => {
  it('shows metres under 1 km', () => {
    expect(formatDistance(0.04)).toBe('40 m')
    expect(formatDistance(0.999)).toBe('999 m')
  })

  it('shows km with one decimal from 1 km', () => {
    expect(formatDistance(1)).toBe('1.0 km')
    expect(formatDistance(1.26)).toBe('1.3 km')
  })
})

describe('formatTimeAgo', () => {
  const now = 10 * 24 * 60 * 60 * 1000 // any fixed "now"
  const MIN = 60 * 1000

  it('says how long ago, in words people use', () => {
    expect(formatTimeAgo(now - 20 * 1000, now)).toBe('just now')
    expect(formatTimeAgo(now - 5 * MIN, now)).toBe('5 min ago')
    expect(formatTimeAgo(now - 3 * 60 * MIN, now)).toBe('3 h ago')
    expect(formatTimeAgo(now - 30 * 60 * MIN, now)).toBe('yesterday')
    expect(formatTimeAgo(now - 4 * 24 * 60 * MIN, now)).toBe('4 days ago')
  })
})
