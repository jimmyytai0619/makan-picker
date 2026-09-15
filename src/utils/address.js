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

/**
 * A Google Maps link that opens the real listing: photos, reviews, hours.
 *
 * With coordinates, it searches the name AROUND that exact spot, so the right
 * branch of a chain shows up. (Google's official "?api=1" link format can't
 * combine a name with a location, so this uses the normal /search/.../@ form.)
 * Saved cafes have no coordinates, so they just search the name.
 *
 * @param {{ name: string, lat: number | null, lng: number | null }} place
 */
export function googleMapsPlaceUrl({ name, lat, lng }) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},17z`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
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
