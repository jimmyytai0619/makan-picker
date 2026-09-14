import { describe, it, expect } from 'vitest'
import {
  POCKET_COLORS,
  WHEEL_MAX,
  pickForWheel,
  pocketAtRotation,
  pocketColor,
  targetRotation,
  truncateLabel,
} from './roulette'

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
  it('cycles through the pastel colours', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => pocketColor(i, 6))).toEqual(POCKET_COLORS)
  })

  it('never gives two neighbouring pockets the same colour, including last and first (sizes 2–25)', () => {
    for (let count = 2; count <= 25; count++) {
      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count // the last pocket's neighbour is the first
        expect(pocketColor(i, count), `size ${count}, pocket ${i}`).not.toBe(pocketColor(next, count))
      }
    }
  })

  it('gives a single pocket a colour', () => {
    expect(pocketColor(0, 1)).toBe('pink')
  })
})

describe('pickForWheel', () => {
  const places = Array.from({ length: 30 }, (_, i) => ({ id: i }))

  it(`picks at most ${WHEEL_MAX} places, all different, all from the list`, () => {
    const picked = pickForWheel(places)
    expect(picked).toHaveLength(WHEEL_MAX)
    expect(new Set(picked.map((p) => p.id)).size).toBe(WHEEL_MAX)
    picked.forEach((p) => expect(places).toContain(p))
  })

  it('keeps everything when there are fewer places than the limit', () => {
    expect(pickForWheel(places.slice(0, 5))).toHaveLength(5)
  })

  it('does not change the original list', () => {
    const copy = [...places]
    pickForWheel(places)
    expect(places).toEqual(copy)
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
