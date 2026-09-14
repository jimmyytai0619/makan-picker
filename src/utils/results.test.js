import { describe, it, expect } from 'vitest'
import { markSavedPlaces, matchesKeywords, shuffle } from './results'

const place = (name, distanceInKm, cuisine = null) => ({
  name,
  distanceInKm,
  cuisine,
  isSaved: false,
  sourceUrl: null,
  savedFrom: null,
})
const saved = (id, name, link = null, platform = null) => ({ id, name, link, platform, addedAt: 0 })

describe('markSavedPlaces', () => {
  it('marks only the NEAREST branch of a chain (bug: every Tealive was marked)', () => {
    const places = [place('Tealive', 0.1), place('Tealive', 1.0), place('Tealive', 1.3)]
    const result = markSavedPlaces(places, [saved('1', 'tealive')])
    expect(result.map((p) => p.isSaved)).toEqual([true, false, false])
  })

  it('matches when one name contains the other, and copies the post link', () => {
    const [p] = markSavedPlaces(
      [place('Mixue Taman Connaught', 2)],
      [saved('1', 'Mixue', 'https://xhslink.com/a/x', 'xhs')],
    )
    expect(p).toMatchObject({ isSaved: true, sourceUrl: 'https://xhslink.com/a/x', savedFrom: 'xhs' })
  })

  it('ignores very short names, so they do not match everything', () => {
    const [p] = markSavedPlaces([place('Cafe', 1)], [saved('1', 'Caf')])
    expect(p.isSaved).toBe(false)
  })
})

describe('matchesKeywords', () => {
  const nasiKandar = place('Nasi Kandar Pelita', 1, 'indian')

  it('matches everything when the keyword is empty', () => {
    expect(matchesKeywords(nasiKandar, '')).toBe(true)
  })

  it('matches ANY comma-separated keyword, in the name or cuisine, ignoring case', () => {
    expect(matchesKeywords(nasiKandar, 'sushi, nasi kandar')).toBe(true)
    expect(matchesKeywords(nasiKandar, 'INDIAN')).toBe(true)
  })

  it('does not match when no keyword fits', () => {
    expect(matchesKeywords(nasiKandar, 'sushi, pizza')).toBe(false)
  })

  it('matches the kind of place too, so "ice cream" finds an ice_cream shop with any name', () => {
    const iceCreamShop = { ...place('Sweet Scoops', 1), category: 'ice_cream' }
    const bakery = { ...place('Lavender', 1), category: 'bakery' }
    expect(matchesKeywords(iceCreamShop, 'ice cream')).toBe(true)
    expect(matchesKeywords(bakery, 'dessert, bakery')).toBe(true)
    expect(matchesKeywords(bakery, 'ice cream')).toBe(false)
  })
})

describe('shuffle', () => {
  it('keeps the same items and does not change the input', () => {
    const input = [1, 2, 3, 4, 5]
    const output = shuffle(input)
    expect([...output].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})
