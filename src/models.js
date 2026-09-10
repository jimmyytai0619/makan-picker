// Data models for the app.
//
// This is a JavaScript project, so we can't write TypeScript `interface`s.
// Instead we use JSDoc `@typedef` comments. They don't run at all — but
// VS Code reads them and gives you autocomplete + warnings, just like TS.

/**
 * A single place to eat.
 *
 * @typedef {Object} Restaurant
 * @property {string} id            Unique ID (later: Google Places `place_id`)
 * @property {string} name          Display name
 * @property {string} photoUrl      Image URL for the card
 * @property {number} rating        0.0 – 5.0
 * @property {number} distanceInKm  Distance from the user
 * @property {1|2|3|4} priceLevel   1 = cheap … 4 = expensive (same scale Google uses)
 */

/**
 * @typedef {Object} LatLng
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {Object} BudgetRange
 * @property {1|2|3|4} min
 * @property {1|2|3|4} max
 */

/**
 * What the user picked on the Filter screen.
 *
 * @typedef {Object} SearchFilters
 * @property {LatLng} userLocation
 * @property {number} maxDistanceKm
 * @property {BudgetRange} budgetRange
 * @property {string} cuisineKeyword  e.g. "nasi lemak", "sushi" — empty = anything
 */

/** @type {SearchFilters} */
export const DEFAULT_FILTERS = {
  // Hard-coded to roughly Cheras for Phase 1. Later: navigator.geolocation.
  userLocation: { lat: 3.047, lng: 101.756 },
  maxDistanceKm: 5,
  budgetRange: { min: 1, max: 2 },
  cuisineKeyword: '',
}

/** Turns a priceLevel number into "RM", "RM RM", ... for display. */
export function formatPriceLevel(priceLevel) {
  return Array(priceLevel).fill('RM').join(' ')
}
