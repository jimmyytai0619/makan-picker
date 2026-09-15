import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addRemoved,
  listRemoved,
  parseEntry,
  resetMemoryForTests,
  restoreRemoved,
  storageMode,
} from './_removedStore.js'

const ENV_KEYS = [
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'VERCEL',
]
let savedEnv

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]))
  ENV_KEYS.forEach((k) => delete process.env[k])
  resetMemoryForTests()
})

afterEach(() => {
  ENV_KEYS.forEach((k) => (savedEnv[k] === undefined ? delete process.env[k] : (process.env[k] = savedEnv[k])))
  vi.unstubAllGlobals()
})

/** A fake answer from Supabase, shaped like what fetch() gives back. */
const answer = (body = null, headers = {}) => ({
  ok: true,
  json: async () => body,
  text: async () => JSON.stringify(body),
  headers: { get: (name) => headers[name.toLowerCase()] ?? null },
})

describe('parseEntry (never trust what the browser sends)', () => {
  it('accepts a real OSM place', () => {
    const result = parseEntry({ id: 'osm-node-123', name: '  Tealive  ', category: 'cafe' }, 1000)
    expect(result).toEqual({ entry: { id: 'osm-node-123', name: 'Tealive', category: 'cafe', removedAt: 1000 } })
  })

  it('rejects fake ids, empty names and strange categories', () => {
    expect(parseEntry({ id: 'saved-abc', name: 'x', category: 'cafe' })).toHaveProperty('error')
    expect(parseEntry({ id: 'osm-node-1; DROP', name: 'x', category: 'cafe' })).toHaveProperty('error')
    expect(parseEntry({ id: 'osm-node-1', name: '   ', category: 'cafe' })).toHaveProperty('error')
    expect(parseEntry({ id: 'osm-node-1', name: 'x', category: '<script>' })).toHaveProperty('error')
    expect(parseEntry(null)).toHaveProperty('error')
  })

  it('cuts very long names', () => {
    const { entry } = parseEntry({ id: 'osm-way-9', name: 'a'.repeat(500), category: 'restaurant' })
    expect(entry.name).toHaveLength(120)
  })
})

describe('storageMode', () => {
  it('uses memory on your Mac, and is unavailable on Vercel until Supabase is connected', () => {
    expect(storageMode()).toBe('memory')
    process.env.VERCEL = '1'
    expect(storageMode()).toBe('unavailable')
    process.env.SUPABASE_URL = 'https://abc.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJ.secret.jwt'
    expect(storageMode()).toBe('supabase')
  })
})

describe('memory list (npm run dev)', () => {
  it('adds, lists newest first, and restores', async () => {
    await addRemoved({ id: 'osm-node-1', name: 'Old', category: 'cafe', removedAt: 1 })
    await addRemoved({ id: 'osm-node-2', name: 'New', category: 'cafe', removedAt: 2 })
    expect((await listRemoved()).map((e) => e.name)).toEqual(['New', 'Old'])

    await restoreRemoved('osm-node-1')
    expect((await listRemoved()).map((e) => e.name)).toEqual(['New'])
  })
})

describe('Supabase list (on Vercel)', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://abc.supabase.co/'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJ.secret.jwt'
  })

  it('adds a place: counts first, then inserts, keeping the first removal', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(answer([], { 'content-range': '0-0/3' }))
      .mockResolvedValueOnce(answer())
    vi.stubGlobal('fetch', fetch)

    await addRemoved({ id: 'osm-node-5', name: 'Tealive', category: 'cafe', removedAt: Date.UTC(2026, 8, 15) })

    const [countUrl, countOptions] = fetch.mock.calls[0]
    expect(countUrl).toBe('https://abc.supabase.co/rest/v1/removed_places?select=id&limit=1')
    expect(countOptions.headers.Prefer).toBe('count=exact')

    const [insertUrl, insertOptions] = fetch.mock.calls[1]
    expect(insertUrl).toBe('https://abc.supabase.co/rest/v1/removed_places')
    expect(insertOptions.method).toBe('POST')
    expect(insertOptions.headers).toMatchObject({
      apikey: 'eyJ.secret.jwt',
      Authorization: 'Bearer eyJ.secret.jwt',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    })
    expect(JSON.parse(insertOptions.body)).toEqual({
      id: 'osm-node-5',
      name: 'Tealive',
      category: 'cafe',
      removed_at: '2026-09-15T00:00:00.000Z',
    })
  })

  it('lists places newest first and turns database dates into milliseconds', async () => {
    const rows = [{ id: 'osm-node-5', name: 'Tealive', category: 'cafe', removed_at: '2026-09-15T00:00:00+00:00' }]
    const fetch = vi.fn().mockResolvedValue(answer(rows))
    vi.stubGlobal('fetch', fetch)

    expect(await listRemoved()).toEqual([
      { id: 'osm-node-5', name: 'Tealive', category: 'cafe', removedAt: Date.UTC(2026, 8, 15) },
    ])
    expect(fetch.mock.calls[0][0]).toContain('order=removed_at.desc')
  })

  it('restores a place with DELETE ?id=eq.…', async () => {
    const fetch = vi.fn().mockResolvedValue(answer())
    vi.stubGlobal('fetch', fetch)

    await restoreRemoved('osm-node-5')
    expect(fetch.mock.calls[0][0]).toBe('https://abc.supabase.co/rest/v1/removed_places?id=eq.osm-node-5')
    expect(fetch.mock.calls[0][1].method).toBe('DELETE')
  })

  it('sends new "sb_secret_" keys only as apikey, never as Authorization', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_abc123'
    const fetch = vi.fn().mockResolvedValue(answer([]))
    vi.stubGlobal('fetch', fetch)

    await listRemoved()
    expect(fetch.mock.calls[0][1].headers.apikey).toBe('sb_secret_abc123')
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  it('refuses to add when the list is full', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer([], { 'content-range': '0-0/5000' })))
    await expect(addRemoved({ id: 'osm-node-6', name: 'x', category: 'cafe', removedAt: 6 })).rejects.toThrow('full')
  })
})

describe('error reasons (short safe codes for debugging)', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://abc.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJ.secret.jwt'
  })

  it('turns "table not found" into supabase_404:PGRST205', async () => {
    const notFound = {
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ code: 'PGRST205', message: "Could not find the table 'public.removed_places'" }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notFound))
    await expect(listRemoved()).rejects.toMatchObject({ reason: 'supabase_404:PGRST205' })
  })

  it('keeps only the status number when the answer is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' }))
    await expect(listRemoved()).rejects.toMatchObject({ reason: 'supabase_401' })
  })

  it('says "network" when Supabase cannot be reached at all', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(listRemoved()).rejects.toMatchObject({ reason: 'network' })
  })
})
