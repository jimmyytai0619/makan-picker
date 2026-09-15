// The shared "removed places" list. When anyone removes a closed restaurant,
// it disappears for EVERYONE. (The file name starts with "_", so Vercel does
// not turn it into its own endpoint — only api/removed.js uses it.)
//
// Where the list lives:
//   - Supabase (a free PostgreSQL database), connected in Vercel → Storage.
//     Connecting it adds SUPABASE_URL and the secret key used below.
//     The table is created once with docs/supabase.sql.
//   - On your Mac (npm run dev) without those settings: an in-memory list.
//   - On Vercel without those settings: "unavailable" → the app falls back to
//     removing places on that phone only, so nothing breaks.

const TABLE = 'removed_places'
export const MAX_ENTRIES = 5000 // a safety limit, so nobody can fill the database
const ID_PATTERN = /^osm-(node|way|relation)-\d{1,15}$/

// Read the settings every time (not once at import), so tests can change them.
function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    // The SECRET key. It skips the table's security rules, so it must only ever
    // be used here on the server — never sent to the browser.
    key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  }
}

/** @returns {'supabase' | 'memory' | 'unavailable'} */
export function storageMode() {
  const { url, key } = supabaseConfig()
  if (url && key) return 'supabase'
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
 * One request to Supabase's automatic REST API for our table.
 * Supabase turns every table into URLs like /rest/v1/removed_places?id=eq.123,
 * so no database library is needed — it's just fetch.
 */
async function supabase(path, { method = 'GET', body, prefer } = {}) {
  const { url, key } = supabaseConfig()
  const headers = { apikey: key, 'Content-Type': 'application/json' }
  // Older keys are JWTs and also go in the Authorization header.
  // Newer "sb_secret_…" keys must only be sent as `apikey`.
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`
  if (prefer) headers.Prefer = prefer

  let response
  try {
    response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    // No answer at all: wrong address, no network, or too slow.
    throw storeError(`Could not reach Supabase: ${err.message}`, err.name === 'TimeoutError' ? 'timeout' : 'network')
  }

  if (!response.ok) {
    const text = await response.text()
    // Supabase explains errors with a short code, e.g. PGRST205 = "table not found".
    // Only that code goes back to the browser — never keys or the full message.
    let code = ''
    try {
      code = String(JSON.parse(text).code ?? '').replace(/[^\w]/g, '').slice(0, 12)
    } catch {
      // not JSON — keep just the status number
    }
    throw storeError(`Supabase answered ${response.status}: ${text.slice(0, 200)}`, `supabase_${response.status}${code ? `:${code}` : ''}`)
  }
  return response
}

/** An Error with a short, safe `reason` code that the API may show, to help debugging. */
function storeError(message, reason) {
  const error = new Error(message)
  error.reason = reason
  return error
}

/**
 * Checks what the browser sent. Anyone on the internet can call the endpoint,
 * so never trust it: only real OSM ids, a short name and a simple category.
 * (The database table checks the same rules again, as a second safety net.)
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
  if (storageMode() === 'supabase') {
    const response = await supabase(`${TABLE}?select=id,name,category,removed_at&order=removed_at.desc&limit=${MAX_ENTRIES}`)
    const rows = await response.json()
    // The database says "removed_at" (a date); the app uses "removedAt" (milliseconds).
    return rows.map((row) => ({ id: row.id, name: row.name, category: row.category, removedAt: Date.parse(row.removed_at) }))
  }
  return [...memory.values()].sort((a, b) => b.removedAt - a.removedAt)
}

export async function addRemoved(entry) {
  if (storageMode() === 'supabase') {
    // How many rows are there? "count=exact" puts it in the Content-Range header: "0-0/123".
    const countResponse = await supabase(`${TABLE}?select=id&limit=1`, { prefer: 'count=exact' })
    const total = Number(countResponse.headers.get('content-range')?.split('/')[1] ?? 0)
    if (total >= MAX_ENTRIES) throw new Error('The removed list is full')

    await supabase(TABLE, {
      method: 'POST',
      body: { id: entry.id, name: entry.name, category: entry.category, removed_at: new Date(entry.removedAt).toISOString() },
      // Already removed by someone else? Keep the first one, no error.
      prefer: 'resolution=ignore-duplicates,return=minimal',
    })
  } else {
    memory.set(entry.id, entry)
  }
}

export async function restoreRemoved(id) {
  if (storageMode() === 'supabase') {
    await supabase(`${TABLE}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' })
  } else {
    memory.delete(id)
  }
}
