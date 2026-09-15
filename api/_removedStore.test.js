import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addRemoved,
  listRemoved,
  parseEntry,
  resetMemoryForTests,
  restoreRemoved,
  storageMode,
} from './_removedStore.js'

const ENV_KEYS = ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'VERCEL']
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
  it('uses memory on your Mac, and is unavailable on Vercel until a database is connected', () => {
    expect(storageMode()).toBe('memory')
    process.env.VERCEL = '1'
    expect(storageMode()).toBe('unavailable')
    process.env.KV_REST_API_URL = 'https://example.upstash.io'
    process.env.KV_REST_API_TOKEN = 'secret'
    expect(storageMode()).toBe('redis')
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

describe('Upstash Redis list (on Vercel)', () => {
  it('sends the right Redis commands with the secret token', async () => {
    process.env.KV_REST_API_URL = 'https://example.upstash.io'
    process.env.KV_REST_API_TOKEN = 'secret'
    const entry = { id: 'osm-node-5', name: 'Tealive', category: 'cafe', removedAt: 5 }
    const answers = [{ result: 3 }, { result: 1 }, { result: ['osm-node-5', JSON.stringify(entry)] }, { result: 1 }]
    const fetch = vi.fn().mockImplementation(async () => ({ ok: true, json: async () => answers.shift() }))
    vi.stubGlobal('fetch', fetch)

    await addRemoved(entry)
    const list = await listRemoved()
    await restoreRemoved('osm-node-5')

    const commands = fetch.mock.calls.map(([, options]) => JSON.parse(options.body))
    expect(commands).toEqual([
      ['HLEN', 'makan-picker:removed-places'],
      ['HSET', 'makan-picker:removed-places', 'osm-node-5', JSON.stringify(entry)],
      ['HGETALL', 'makan-picker:removed-places'],
      ['HDEL', 'makan-picker:removed-places', 'osm-node-5'],
    ])
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer secret')
    expect(list).toEqual([entry])
  })

  it('refuses to add when the list is full', async () => {
    process.env.KV_REST_API_URL = 'https://example.upstash.io'
    process.env.KV_REST_API_TOKEN = 'secret'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 5000 }) }))
    await expect(addRemoved({ id: 'osm-node-6', name: 'x', category: 'cafe', removedAt: 6 })).rejects.toThrow('full')
  })
})
