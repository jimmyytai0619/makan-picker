// Everything that talks to map data lives in this ONE file.
// Screens never call fetch() directly — they call these functions.
// If we ever switch to Google Places, only this file changes.
//
// Two sources:
//   1. Nominatim — turns text ("Cheras") into coordinates ("geocoding"), and
//      coordinates into the nearest road ("reverse geocoding").
//      The browser calls it directly.
//   2. Our own /api/places endpoint (api/places.js) — finds cafes and
//      restaurants near coordinates. It asks the Overpass servers for us,
//      because Overpass rejects browser requests from our live site.
//
// OSM's rules (free = be polite):
//   - Nominatim: max 1 request per second, NO search-as-you-type.
//     https://operations.osmfoundation.org/policies/nominatim/
//   - You MUST show "© OpenStreetMap contributors" in the app.

import { distanceInKm } from '../utils/geo'
import { formatOsmAddress, formatReverseAddress } from '../utils/address'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const PLACES_API_URL = '/api/places' // same website, so no CORS problems

// Bump this whenever api/places.js starts sending new data. It changes the URL,
// so Vercel's CDN can't hand out an old cached answer that's missing it.
const PLACES_API_VERSION = '2'

// Our server tries 2 Overpass servers (12 s each), so wait a little longer than that.
const PLACES_TIMEOUT_MS = 30000

// ---------------------------------------------------------------------------
// 0. A polite queue for Nominatim (max 1 request per second)
// ---------------------------------------------------------------------------

const NOMINATIM_GAP_MS = 1100
let nominatimQueue = Promise.resolve()

/**
 * Runs `task` after every earlier Nominatim task has finished, plus a 1.1 s gap.
 * So even if 5 cards ask for an address at once, the requests go out one by one.
 *
 * @template T
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
function politely(task) {
  const result = nominatimQueue.then(task)
  // The NEXT task waits for this one + the gap. `.catch` so one failed
  // request can't block the queue forever.
  nominatimQueue = result
    .catch(() => {})
    .then(() => new Promise((resolve) => setTimeout(resolve, NOMINATIM_GAP_MS)))
  return result
}

// ---------------------------------------------------------------------------
// 1. Geocoding: text -> coordinates
// ---------------------------------------------------------------------------

/**
 * Search for a place name in Malaysia. Returns up to 5 candidates so the
 * user can pick the right one (there are many "Taman Connaught"-like names).
 *
 * @param {string} text  e.g. "Bandar Tun Hussein Onn"
 * @returns {Promise<import('../models').ChosenLocation[]>}
 */
export async function geocode(text) {
  // URLSearchParams builds "?q=...&format=..." and escapes spaces/symbols for us.
  const params = new URLSearchParams({
    q: text,
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'my', // Malaysia only
    'accept-language': 'en',
  })

  const response = await politely(() => fetch(`${NOMINATIM_URL}?${params}`))
  if (!response.ok) {
    throw new Error(`Location search failed (error ${response.status}). Try again in a moment.`)
  }

  /** @type {Array<{place_id: number, lat: string, lon: string, display_name: string}>} */
  const results = await response.json()

  const locations = results.map((r) => ({
    lat: Number(r.lat), // Nominatim sends numbers as strings: "3.0486592"
    lng: Number(r.lon), // ...and calls it "lon", we call it "lng"
    label: shortenLabel(r.display_name),
  }))

  // OSM often has several objects with the same name (e.g. a train station
  // AND its stop). Showing identical rows confuses users, so keep the first.
  const seenLabels = new Set()
  return locations.filter((loc) => {
    if (seenLabels.has(loc.label)) return false
    seenLabels.add(loc.label)
    return true
  })
}

/** "Bandar Tun Hussein Onn, Cheras–Kajang Expressway, Cheras, Kajang, ..." -> first 3 parts */
function shortenLabel(displayName) {
  return displayName.split(', ').slice(0, 3).join(', ')
}

// ---------------------------------------------------------------------------
// 2. Reverse geocoding: coordinates -> nearest road ("Near Jalan Suarasa 8/5, Cheras")
// ---------------------------------------------------------------------------

// Answers are remembered as Promises, so two cards asking at once share one request.
const reverseCache = new Map()

/**
 * The nearest road and area for a map point, e.g. "Jalan Suarasa 8/5, Town Park, Cheras".
 * Never throws: it returns null if the lookup fails, so a card just shows no address.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string | null>}
 */
export function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`

  if (!reverseCache.has(key)) {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      zoom: '17', // street level
      'accept-language': 'en',
    })

    const request = politely(() => fetch(`${NOMINATIM_REVERSE_URL}?${params}`))
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => formatReverseAddress(data?.address))
      .catch(() => null)
      .then((text) => {
        if (text === null) reverseCache.delete(key) // allow a retry later
        return text
      })

    reverseCache.set(key, request)
  }

  return reverseCache.get(key)
}

// ---------------------------------------------------------------------------
// 3. Nearby places (through our own /api/places server endpoint)
// ---------------------------------------------------------------------------

/**
 * Converts one element from /api/places into our Restaurant model.
 * This "mapping" step means the rest of the app never sees OSM's format.
 *
 * @returns {import('../models').Restaurant | null}
 */
function toRestaurant(element, center) {
  const { lat, lon: lng } = element
  if (lat == null || lng == null) return null

  const tags = element.tags ?? {}

  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    category: tags.amenity,
    // OSM writes "tea;coffee_shop" -> we show "tea, coffee shop"
    cuisine: tags.cuisine ? tags.cuisine.replaceAll(';', ', ').replaceAll('_', ' ') : null,
    lat,
    lng,
    distanceInKm: distanceInKm(center, { lat, lng }),
    address: formatOsmAddress(tags), // only ~1 in 3 places have one
    phone: tags.phone ?? null,
    website: tags.website ?? null,
    rating: null,
    priceLevel: null,
    openingHours: tags.opening_hours ?? null,
    openStatus: 'unknown', // filled in by addOpenStatus()
    photoUrl: null,
    isSaved: false,
    sourceUrl: null,
    savedFrom: null,
  }
}

// Remembers answers while the app is open, so pressing "Find food" twice
// with the same filters doesn't ask the server twice.
const cache = new Map()

// The free map servers are sometimes slow for a few seconds. Our server then
// answers "busy" (502/503/504), and a second try a moment later usually works.
const BUSY_STATUSES = [502, 503, 504]
const RETRY_DELAY_MS = 1500

/** One request to /api/places, with friendly errors when no answer arrives at all. */
async function fetchPlaces(url) {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(PLACES_TIMEOUT_MS) })
  } catch (err) {
    // fetch() only THROWS when no answer arrived at all: no internet, or our timeout.
    // Without this, users would see the browser's raw "Failed to fetch".
    throw new Error(
      err.name === 'TimeoutError'
        ? 'The search took too long. Please try again.'
        : "Couldn't reach the server. Check your internet connection and try again.",
    )
  }
}

/**
 * @param {{ center: import('../models').LatLng, radiusKm: number, placeTypes: string[] }} options
 * @returns {Promise<import('../models').Restaurant[]>} sorted nearest first
 */
export async function searchNearbyPlaces({ center, radiusKm, placeTypes }) {
  const params = new URLSearchParams({
    // Rounded to ~100 m, so people searching from almost the same spot share
    // one cached answer on Vercel's CDN. Distances still use the exact center.
    lat: center.lat.toFixed(3),
    lng: center.lng.toFixed(3),
    radiusKm: String(radiusKm),
    types: placeTypes.join(','),
    v: PLACES_API_VERSION,
  })
  const url = `${PLACES_API_URL}?${params}`
  if (cache.has(url)) return cache.get(url)

  let response = await fetchPlaces(url)
  if (BUSY_STATUSES.includes(response.status)) {
    // Busy: wait a moment and try ONE more time (never an endless loop).
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    response = await fetchPlaces(url)
  }

  // Our server sends { error: "..." } with a friendly message when something fails.
  // .catch(() => null): if the body isn't JSON (e.g. an HTML error page), don't crash.
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? `Map search failed (error ${response.status}). Please try again.`)
  }

  const places = data.elements
    .map((element) => toRestaurant(element, center))
    .filter((place) => place !== null)
    .sort((a, b) => a.distanceInKm - b.distanceInKm)

  cache.set(url, places)
  return places
}
