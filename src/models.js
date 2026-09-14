// Data models for the app.
//
// This is a JavaScript project, so we can't write TypeScript `interface`s.
// Instead we use JSDoc `@typedef` comments. They don't run at all — but
// VS Code reads them and gives you autocomplete + warnings, just like TS.
//
// Phase 1.5 change: data now comes from OpenStreetMap, which has NO ratings,
// photos or prices. Those fields are now `null` when unknown, and every
// component must handle that.

/**
 * @typedef {Object} LatLng
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {'cafe'|'restaurant'|'fast_food'|'ice_cream'|'food_court'|'bakery'|'pastry'|'beverages'|'saved'} PlaceCategory
 * The OSM `amenity` or `shop` tag, or 'saved' for cafes from the user's own list.
 */

/**
 * @typedef {'instagram'|'xhs'|'other'} Platform
 */

/**
 * A single place to eat.
 *
 * @typedef {Object} Restaurant
 * @property {string} id                 e.g. "osm-node-123" or "saved-abc"
 * @property {string} name
 * @property {PlaceCategory} category
 * @property {string|null} cuisine       e.g. "burger, pizza" (OSM, often missing)
 * @property {number|null} lat
 * @property {number|null} lng
 * @property {number|null} distanceInKm  straight-line distance from the search point
 * @property {string|null} address       e.g. "21 Jalan 33/154, 56000 Kuala Lumpur" (OSM, ~1 in 3 places)
 * @property {string|null} phone         raw OSM text, e.g. "+60 3-9101 2345"
 * @property {string|null} website       raw OSM text; only shown if it's a safe http(s) link
 * @property {number|null} rating        always null with OSM — kept for a future data source
 * @property {1|2|3|4|null} priceLevel   always null with OSM — kept for a future data source
 * @property {string|null} openingHours  raw OSM text, e.g. "Mo-Su 08:00-22:00"
 * @property {'open'|'closed'|'unknown'} openStatus  worked out from openingHours at search time
 * @property {string|null} photoUrl      always null with OSM; card shows an emoji instead
 * @property {boolean} isSaved           true if it's in the user's My Cafes list
 * @property {string|null} sourceUrl     IG / XHS post link, if saved with one
 * @property {Platform|null} savedFrom
 */

/**
 * A cafe the user saved (e.g. copied from Instagram or Xiaohongshu).
 * Stored in the browser's localStorage.
 *
 * @typedef {Object} SavedCafe
 * @property {string} id
 * @property {string} name
 * @property {string|null} link
 * @property {Platform|null} platform
 * @property {number} addedAt   timestamp (ms)
 */

/**
 * @typedef {Object} ChosenLocation
 * @property {number} lat
 * @property {number} lng
 * @property {string} label   what we show the user, e.g. "Cheras, Kuala Lumpur"
 */

/**
 * What the user picked on the Filter screen.
 *
 * @typedef {Object} SearchFilters
 * @property {'swipe'|'roulette'} playStyle  swipe like Tinder, or spin a wheel of all places
 * @property {'nearby'|'saved'} source    search the map, or shuffle My Cafes
 * @property {ChosenLocation|null} location
 * @property {number} maxDistanceKm
 * @property {string} moodId              see data/moods.js
 * @property {string} cuisineKeyword      comma-separated, e.g. "mamak, roti" — empty = anything
 * @property {boolean} hideClosed         hide places we KNOW are closed right now
 */

/** @type {SearchFilters} */
export const DEFAULT_FILTERS = {
  playStyle: 'swipe',
  source: 'nearby',
  location: null, // user must choose — no more fake Cheras default
  maxDistanceKm: 3,
  moodId: 'anything',
  cuisineKeyword: '',
  hideClosed: false,
}

/** Turns a priceLevel number into "RM", "RM RM", ... for display. */
export function formatPriceLevel(priceLevel) {
  return Array(priceLevel).fill('RM').join(' ')
}
