// The shared "removed places" list. When anyone removes a closed restaurant,
// it disappears for EVERYONE. (The file name starts with "_", so Vercel does
// not turn it into its own endpoint — only api/removed.js uses it.)
//
// Where the list lives:
//   - Upstash Redis (free), connected in Vercel → Storage. Connecting it adds the
//     KV_REST_API_URL / KV_REST_API_TOKEN environment variables used below.
//   - On your Mac (npm run dev) with no database: a simple in-memory list.
//   - On Vercel with no database yet: "unavailable" → the app falls back to
//     removing places on that phone only, so nothing breaks.

const KEY = 'makan-picker:removed-places' // one Redis hash: place id -> JSON entry
export const MAX_ENTRIES = 5000 // a safety limit, so nobody can fill the database
const ID_PATTERN = /^osm-(node|way|relation)-\d{1,15}$/

// Read the settings every time (not once at import), so tests can change them.
function redisConfig() {
  return {
    url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN,
  }
}

/** @returns {'redis' | 'memory' | 'unavailable'} */
export function storageMode() {
  const { url, token } = redisConfig()
  if (url && token) return 'redis'
  // process.env.VERCEL is set on Vercel. A memory list there would be lost on
  // every restart and differ between servers, so don't pretend it's shared.
  return process.env.VERCEL ? 'unavailable' : 'memory'
}

const memory = new Map()

/** For tests only: start with an empty in-memory list. */
export function resetMemoryForTests() {
  memory.clear()
}

/**
 * One Redis command through Upstash's REST API: POST ["HSET", key, field, value].
 * No library needed — it's just fetch.
 */
async function redis(command) {
  const { url, token } = redisConfig()
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error(`Redis answered ${response.status}`)
  const data = await response.json()
  if (data.error) throw new Error(`Redis error: ${data.error}`)
  return data.result
}

/**
 * Checks what the browser sent. Anyone on the internet can call the endpoint,
 * so never trust it: only real OSM ids, a short name and a simple category.
 *
 * @returns {{ entry: { id: string, name: string, category: string, removedAt: number } } | { error: string }}
 */
export function parseEntry(input, now = Date.now()) {
  const id = String(input?.id ?? '')
  const name = String(input?.name ?? '').trim().slice(0, 120)
  const category = String(input?.category ?? '')

  if (!ID_PATTERN.test(id)) return { error: 'id must look like osm-node-123' }
  if (!name) return { error: 'name is required' }
  if (!/^[a-z_]{1,20}$/.test(category)) return { error: 'category must be a simple word like cafe' }
  return { entry: { id, name, category, removedAt: now } }
}

export function isValidId(id) {
  return ID_PATTERN.test(String(id ?? ''))
}

/** Every removed place, newest first. */
export async function listRemoved() {
  let entries = []
  if (storageMode() === 'redis') {
    // HGETALL answers a flat list: [id1, json1, id2, json2, …]
    const flat = (await redis(['HGETALL', KEY])) ?? []
    for (let i = 0; i < flat.length; i += 2) {
      try {
        entries.push(JSON.parse(flat[i + 1]))
      } catch {
        // skip a broken entry instead of failing the whole list
      }
    }
  } else {
    entries = [...memory.values()]
  }
  return entries.sort((a, b) => b.removedAt - a.removedAt)
}

export async function addRemoved(entry) {
  if (storageMode() === 'redis') {
    const count = await redis(['HLEN', KEY])
    if (count >= MAX_ENTRIES) throw new Error('The removed list is full')
    await redis(['HSET', KEY, entry.id, JSON.stringify(entry)])
  } else {
    memory.set(entry.id, entry)
  }
}

export async function restoreRemoved(id) {
  if (storageMode() === 'redis') await redis(['HDEL', KEY, id])
  else memory.delete(id)
}
