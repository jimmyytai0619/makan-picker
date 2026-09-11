// Everything that talks to OpenStreetMap lives in this ONE file.
// Screens never call fetch() directly — they call these functions.
// If we ever switch to Google Places, only this file changes.
//
// Two free OSM servers:
//   1. Nominatim — turns text ("Cheras") into coordinates ("geocoding")
//   2. Overpass  — finds map features (cafes, restaurants) near coordinates
//
// Their rules (free = be polite):
//   - Nominatim: max 1 request per second, NO search-as-you-type.
//     https://operations.osmfoundation.org/policies/nominatim/
//   - Overpass: shared public server, keep queries small, cache results.
//   - Both: you MUST show "© OpenStreetMap contributors" in the app.

import { distanceInKm } from '../utils/geo'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Only these values can ever go into an Overpass query (see buildOverpassQuery).
const ALLOWED_PLACE_TYPES = ['cafe', 'restaurant', 'fast_food', 'ice_cream', 'food_court']

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

  const response = await fetch(`${NOMINATIM_URL}?${params}`)
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
// 2. Overpass: coordinates -> nearby places
// ---------------------------------------------------------------------------

/**
 * Builds a query in Overpass QL (Overpass's own query language). Read it as:
 *   [out:json]                          answer in JSON
 *   nwr                                 look at nodes, ways and relations (all OSM shapes)
 *   ["amenity"~"^(cafe|restaurant)$"]   whose amenity tag is one of these
 *   ["name"]                            and that have a name
 *   (around:3000,3.04,101.75)           within 3000 m of this point
 *   out center tags;                    return tags + a center point for buildings
 */
function buildOverpassQuery(center, radiusKm, placeTypes) {
  // SAFETY: never put user-typed text inside a query language. We only allow
  // our own fixed words, so nobody can inject extra query code.
  const safeTypes = placeTypes.filter((t) => ALLOWED_PLACE_TYPES.includes(t))
  const radiusMeters = Math.round(radiusKm * 1000)
  const lat = center.lat.toFixed(5)
  const lng = center.lng.toFixed(5)

  return `[out:json][timeout:25];
nwr["amenity"~"^(${safeTypes.join('|')})$"]["name"](around:${radiusMeters},${lat},${lng});
out center tags;`
}

/**
 * Converts one raw Overpass "element" into our Restaurant model.
 * This "mapping" step means the rest of the app never sees OSM's format.
 *
 * @returns {import('../models').Restaurant | null}
 */
function toRestaurant(element, center) {
  // Small shops are "nodes" with lat/lon. Buildings are "ways" and only have a
  // `center` (because we asked for `out center`). `??` = "if left is missing, use right".
  const lat = element.lat ?? element.center?.lat
  const lng = element.lon ?? element.center?.lon
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
    rating: null,
    priceLevel: null,
    openingHours: tags.opening_hours ?? null,
    photoUrl: null,
    isSaved: false,
    sourceUrl: null,
    savedFrom: null,
  }
}

// Remembers answers while the app is open, so pressing "Find food" twice
// with the same filters doesn't hit the free server twice.
const cache = new Map()

/**
 * @param {{ center: import('../models').LatLng, radiusKm: number, placeTypes: string[] }} options
 * @returns {Promise<import('../models').Restaurant[]>} sorted nearest first
 */
export async function searchNearbyPlaces({ center, radiusKm, placeTypes }) {
  const query = buildOverpassQuery(center, radiusKm, placeTypes)
  if (cache.has(query)) return cache.get(query)

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  })

  // 429 = "too many requests", 504 = "server too busy". Common on a free server.
  if (response.status === 429 || response.status === 504) {
    throw new Error('The free map server is busy right now. Wait 10 seconds and try again.')
  }
  if (!response.ok) {
    throw new Error(`Map search failed (error ${response.status}).`)
  }

  const data = await response.json()

  const places = data.elements
    .map((element) => toRestaurant(element, center))
    .filter((place) => place !== null)
    .sort((a, b) => a.distanceInKm - b.distanceInKm)

  cache.set(query, places)
  return places
}
