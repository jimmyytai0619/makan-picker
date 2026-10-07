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

import { fetchWithTimeout } from '../utils/network'
import { distanceInKm } from '../utils/geo'
import { formatOsmAddress, formatReverseAddress } from '../utils/address'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const PLACES_API_URL = '/api/places' // same website, so no CORS problems

// Bump this whenever api/places.js starts sending new data. It changes the URL,
// so Vercel's CDN can't hand out an old cached answer that's missing it.
const PLACES_API_VERSION = '4'

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

  const response = await politely(() => fetchWithTimeout(`${NOMINATIM_URL}?${params}`))
  if (!response.ok) {
    throw new Error(`Location search failed (error ${response.status}). Try again in a moment.`)
  }

  /** @type {Array<{place_id: number, lat: string, lon: string, display_name: string}>} */
  const results = await response.json()

  return locationCandidates(results)
}

export function locationCandidates(results) {
  if (!Array.isArray(results)) return []
  const seen = new Set()
  return results.flatMap(r => {
    const lat = Number(r.lat), lng = Number(r.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || typeof r.display_name !== 'string') return []
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
    if (seen.has(key)) return []
    seen.add(key)
    return [{ lat, lng, label: r.display_name, locationType: r.type?.replaceAll('_', ' ') ?? 'map location' }]
  })
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

    const request = politely(() => fetchWithTimeout(`${NOMINATIM_REVERSE_URL}?${params}`))
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
  if (!element || typeof element !== 'object') return null
  const { lat, lon: lng } = element
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null

  const tags = element.tags ?? {}
  if (typeof tags.name !== 'string' || !tags.name.trim()) return null

  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    category: tags.amenity ?? tags.shop, // e.g. "cafe", or "bakery" for shops
    // OSM writes "tea;coffee_shop" -> we show "tea, coffee shop"
    cuisine: tags.cuisine ? tags.cuisine.replaceAll(';', ', ').replaceAll('_', ' ') : null,
    lat,
    lng,
    distanceInKm: distanceInKm(center, { lat, lng }),
    address: formatOsmAddress(tags), // only ~1 in 3 places have one
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
    return await fetchWithTimeout(url, {}, PLACES_TIMEOUT_MS)
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
  const cached = cache.get(url)
  if (cached && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
    return mapPlaces(cached.elements, center, radiusKm)
  }

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

  if (!Array.isArray(data?.elements)) throw new Error('The map returned an invalid response. Please retry.')
  cache.set(url, { elements: data.elements, cachedAt: Date.now() })
  return mapPlaces(data.elements, center, radiusKm)
}

function mapPlaces(elements, center, radiusKm) {
  return elements
    .map(element => toRestaurant(element, center))
    .filter(place => place !== null && place.distanceInKm <= radiusKm)
    .sort((a, b) => a.distanceInKm - b.distanceInKm)
}
