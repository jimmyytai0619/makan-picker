// Small pure helpers for showing WHERE a place is.

/**
 * A readable address from OpenStreetMap tags, e.g.
 *   { 'addr:housenumber': '21', 'addr:street': 'Jalan 33/154',
 *     'addr:postcode': '56000', 'addr:city': 'Kuala Lumpur' }
 *   -> "21 Jalan 33/154, 56000 Kuala Lumpur"
 * Only ~1 in 3 places near Cheras have these tags. Returns null without a street.
 *
 * @param {Record<string, string>} tags
 * @returns {string | null}
 */
export function formatOsmAddress(tags = {}) {
  const street = tags['addr:street']
  if (!street) return null
  const line1 = [tags['addr:housenumber'], street].filter(Boolean).join(' ')
  const line2 = [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ')
  return [line1, line2].filter(Boolean).join(', ')
}

/**
 * A short area line from a Nominatim "reverse" lookup, e.g.
 *   { road: 'Jalan Suarasa 8/5', residential: 'Town Park', suburb: 'Cheras' }
 *   -> "Jalan Suarasa 8/5, Town Park, Cheras"
 * It's the nearest road to the map point, not the shop's official address.
 *
 * @param {Record<string, string>} address  Nominatim's `address` object
 * @returns {string | null}
 */
export function formatReverseAddress(address = {}) {
  const parts = [
    address.road,
    address.neighbourhood ?? address.residential ?? address.quarter,
    address.suburb ?? address.town ?? address.city,
  ].filter(Boolean)
  const unique = [...new Set(parts)] // "Cheras, Cheras" -> "Cheras"
  return unique.length > 0 ? unique.join(', ') : null
}

/** Open the selected map coordinates, so a chain name cannot switch branches. */
export function googleMapsPlaceUrl({ name, lat, lng }) {
  const query = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** A listing search is separate from the exact map pin and can return other branches. */
export function googleMapsReviewsUrl({ name, address }) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address, 'Malaysia'].filter(Boolean).join(', '))}`
}

/**
 * A safe link for a website from OpenStreetMap. Anyone can edit OSM, so only
 * http(s) links are allowed. A "javascript:" link could run code in our app.
 *   "www.kopi.my" -> "https://www.kopi.my"
 *
 * @param {string | null | undefined} website
 * @returns {string | null}
 */
export function safeWebsiteUrl(website) {
  if (!website) return null
  const url = website.trim()
  if (/^https?:\/\//i.test(url)) return url
  if (!url.includes(':') && /^[\w-]+(\.[\w-]+)+/.test(url)) return `https://${url}`
  return null
}
