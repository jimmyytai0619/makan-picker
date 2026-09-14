import { describe, it, expect } from 'vitest'
import { pocketAtRotation, pocketColor, targetRotation, truncateLabel } from './roulette'

describe('targetRotation', () => {
  it('always stops on the pocket the code picked (every wheel size, every pocket)', () => {
    for (let count = 1; count <= 25; count++) {
      for (let winner = 0; winner < count; winner++) {
        for (const jitter of [-0.35, 0, 0.35]) {
          for (const start of [0, 1234.5, 3600]) {
            const end = targetRotation(start, winner, count, jitter)
            expect(pocketAtRotation(end, count)).toBe(winner)
          }
        }
      }
    }
  })

  it('always spins forward, between 5 and 6 full turns', () => {
    const start = 100
    const end = targetRotation(start, 2, 6)
    expect(end - start).toBeGreaterThanOrEqual(5 * 360)
    expect(end - start).toBeLessThan(6 * 360)
  })
})

describe('pocketColor', () => {
  it('alternates red and black', () => {
    expect([0, 1, 2, 3].map((i) => pocketColor(i, 4))).toEqual(['red', 'black', 'red', 'black'])
  })

  it('makes the last pocket green when the count is odd, so two reds never touch', () => {
    expect([0, 1, 2].map((i) => pocketColor(i, 3))).toEqual(['red', 'black', 'green'])
  })

  it('uses red for a single pocket', () => {
    expect(pocketColor(0, 1)).toBe('red')
  })
})

describe('truncateLabel', () => {
  it('keeps short names', () => {
    expect(truncateLabel('Mixue', 10)).toBe('Mixue')
  })

  it('shortens long names with …', () => {
    expect(truncateLabel('Brew & Boulder Cafe', 10)).toBe('Brew & Bo…')
  })
})
