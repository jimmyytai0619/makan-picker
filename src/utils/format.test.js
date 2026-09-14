import { describe, it, expect } from 'vitest'
import { formatDistance } from './format'

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
