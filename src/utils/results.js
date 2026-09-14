// Small "pure" helper functions: same input -> same output, no fetch, no state.
// Pure functions are the easiest code to understand and to test.

/**
 * "mamak, Roti " -> ["mamak", "roti"]
 */
function parseKeywords(text) {
  return text
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean) // removes empty strings
}

/**
 * True if the place's name, cuisine or kind ("ice cream", "bakery"…) contains ANY keyword.
 * Filtering happens here in the browser, NOT in the Overpass query,
 * so user-typed text never goes into a query language.
 *
 * @param {import('../models').Restaurant} place
 * @param {string} keywordText
 */
export function matchesKeywords(place, keywordText) {
  const keywords = parseKeywords(keywordText)
  if (keywords.length === 0) return true

  const kind = place.category?.replaceAll('_', ' ') ?? '' // "ice_cream" -> "ice cream"
  const searchable = `${place.name} ${place.cuisine ?? ''} ${kind}`.toLowerCase()
  return keywords.some((k) => searchable.includes(k))
}

/**
 * "Brew & Boulder Café!" -> "brewbouldercafé"
 * \p{L} = any letter in ANY language (so Chinese names from XHS survive),
 * \p{N} = any number. Everything else (spaces, &, !) is removed.
 */
function normalizeName(name) {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

/**
 * Marks map results that are also in My Cafes, and copies over the
 * IG/XHS link. It's a simple fuzzy match: one name contains the other.
 * Example: saved "Mixue" matches map "Mixue Taman Connaught".
 *
 * Chains (Tealive, Mixue...) have many branches with the same name, so each
 * saved cafe only marks its NEAREST branch. `places` must be sorted nearest first.
 *
 * @param {import('../models').Restaurant[]} places
 * @param {import('../models').SavedCafe[]} savedCafes
 */
export function markSavedPlaces(places, savedCafes) {
  const saved = savedCafes.map((cafe) => ({ cafe, key: normalizeName(cafe.name) }))
  const alreadyMatched = new Set() // saved cafe ids that found their branch

  return places.map((place) => {
    const placeKey = normalizeName(place.name)
    const match = saved.find(
      ({ cafe, key }) =>
        !alreadyMatched.has(cafe.id) &&
        Math.min(key.length, placeKey.length) >= 4 && // too-short names match everything
        (placeKey.includes(key) || key.includes(placeKey)),
    )
    if (!match) return place
    alreadyMatched.add(match.cafe.id)

    // Spread copies the object and overrides a few fields. Never edit the original.
    return {
      ...place,
      isSaved: true,
      sourceUrl: match.cafe.link,
      savedFrom: match.cafe.platform,
    }
  })
}

/**
 * Turns a saved cafe into a Restaurant so the swipe card can show it.
 *
 * @param {import('../models').SavedCafe} cafe
 * @returns {import('../models').Restaurant}
 */
export function savedCafeToRestaurant(cafe) {
  return {
    id: `saved-${cafe.id}`,
    name: cafe.name,
    category: 'saved',
    cuisine: null,
    lat: null,
    lng: null,
    distanceInKm: null,
    address: null, // saved cafes only have a name; the Google link searches it
    phone: null,
    website: null,
    rating: null,
    priceLevel: null,
    openingHours: null,
    openStatus: 'unknown',
    photoUrl: null,
    isSaved: true,
    sourceUrl: cafe.link,
    savedFrom: cafe.platform,
  }
}

/**
 * Returns a NEW shuffled array (Fisher–Yates shuffle). Doesn't touch the input.
 */
export function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]] // swap
  }
  return copy
}
