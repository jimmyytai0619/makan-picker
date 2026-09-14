// Serverless function: GET /api/places?lat=3.046&lng=101.759&radiusKm=3&types=cafe,restaurant
//
// WHY THIS EXISTS
// overpass-api.de rejects requests sent by browsers from our live vercel.app
// site (HTTP 406), but accepts requests sent by a server. So the app now asks
// THIS function, and this function asks Overpass. Bonus:
//   - we identify our app politely with a User-Agent (OSM asks for this)
//   - if the main server fails, we automatically try a backup mirror
//   - Vercel's CDN caches answers, so repeat searches are instant and we
//     send fewer requests to the free servers
//
// Vercel turns every file in the root /api folder into a server endpoint.
// This file only uses plain Node.js `req`/`res`, so the SAME code also runs in
// `npm run dev` (see the devApi plugin in vite.config.js).

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter', // main server
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter', // backup mirror (run by VK)
]

const USER_AGENT = 'MakanPicker/0.1 (+https://makan-picker.vercel.app)'
const TIMEOUT_PER_SERVER_MS = 12000

// Only these words can ever go into an Overpass query.
const ALLOWED_PLACE_TYPES = ['cafe', 'restaurant', 'fast_food', 'ice_cream', 'food_court']
const MAX_RADIUS_KM = 10

// Only these tags are sent back to the app (smaller download on mobile data).
const KEPT_TAGS = [
  'name',
  'amenity',
  'cuisine',
  'opening_hours',
  // Where the place is + how to contact it (each is only on some places)
  'addr:housenumber',
  'addr:street',
  'addr:postcode',
  'addr:city',
  'phone',
  'website',
]

/**
 * Checks the URL parameters. Anyone on the internet can call this endpoint,
 * not just our app, so NEVER trust the input.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ lat: number, lng: number, radiusKm: number, types: string[] } | { error: string }}
 */
function parseParams(searchParams) {
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  const radiusKm = Number(searchParams.get('radiusKm'))
  const types = (searchParams.get('types') ?? '').split(',').filter(Boolean)

  // Number("abc") is NaN, and NaN fails every comparison, so these also catch junk.
  if (!(lat >= -90 && lat <= 90)) return { error: 'lat must be a number between -90 and 90' }
  if (!(lng >= -180 && lng <= 180)) return { error: 'lng must be a number between -180 and 180' }
  if (!(radiusKm > 0 && radiusKm <= MAX_RADIUS_KM)) return { error: `radiusKm must be between 0 and ${MAX_RADIUS_KM}` }
  if (types.length === 0 || !types.every((t) => ALLOWED_PLACE_TYPES.includes(t))) {
    return { error: `types must be a comma list of: ${ALLOWED_PLACE_TYPES.join(', ')}` }
  }
  return { lat, lng, radiusKm, types }
}

/** Overpass QL: "every named place of these types within X metres of this point". */
function buildQuery({ lat, lng, radiusKm, types }) {
  const radiusMeters = Math.round(radiusKm * 1000)
  return `[out:json][timeout:25];
nwr["amenity"~"^(${types.join('|')})$"]["name"](around:${radiusMeters},${lat.toFixed(5)},${lng.toFixed(5)});
out center tags;`
}

/**
 * Tries each Overpass server in order until one answers.
 * @returns {Promise<{ elements: any[], server: string }>}
 */
async function fetchFromOverpass(query) {
  const failures = []

  for (const serverUrl of OVERPASS_SERVERS) {
    const host = new URL(serverUrl).hostname
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        // Give up on a slow server so we still have time to try the next one.
        signal: AbortSignal.timeout(TIMEOUT_PER_SERVER_MS),
      })
      if (!response.ok) {
        failures.push(`${host}: HTTP ${response.status}`)
        continue // try the next server
      }
      const data = await response.json()
      return { elements: data.elements, server: host }
    } catch (err) {
      failures.push(`${host}: ${err.name}`) // e.g. TimeoutError, TypeError
    }
  }

  throw new Error(`All Overpass servers failed -> ${failures.join(' | ')}`)
}

/** Turns an Overpass element into a small object with just what the app needs. */
function trimElement(element) {
  const tags = {}
  for (const key of KEPT_TAGS) {
    if (element.tags?.[key]) tags[key] = element.tags[key]
  }
  return {
    type: element.type,
    id: element.id,
    // Shops are points (lat/lon). Buildings only have a `center`.
    lat: element.lat ?? element.center?.lat,
    lon: element.lon ?? element.center?.lon,
    tags,
  }
}

function sendJson(res, statusCode, body, headers = {}) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value)
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Only GET is allowed' })
  }

  // req.url is only the path + query ("/api/places?lat=..."), so give URL a dummy base.
  const { searchParams } = new URL(req.url, 'http://localhost')
  const params = parseParams(searchParams)
  if ('error' in params) {
    return sendJson(res, 400, { error: params.error }, { 'Cache-Control': 'no-store' })
  }

  try {
    const { elements, server } = await fetchFromOverpass(buildQuery(params))
    return sendJson(
      res,
      200,
      { elements: elements.map(trimElement) },
      {
        // s-maxage: Vercel's CDN keeps this answer for 1 day, so the same
        // search from anyone is instant and doesn't hit Overpass again.
        // stale-while-revalidate: after that, serve the old answer while
        // fetching a fresh one in the background (for up to 7 more days).
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'X-Data-Source': server, // handy for debugging: which server answered
      },
    )
  } catch (err) {
    console.error(err.message) // appears in Vercel's Logs tab
    return sendJson(
      res,
      502,
      { error: 'The free map servers are busy right now. Please try again in a minute.' },
      { 'Cache-Control': 'no-store' }, // never cache a failure
    )
  }
}
