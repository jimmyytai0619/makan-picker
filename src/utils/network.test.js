import { afterEach, expect, it, vi } from 'vitest'
import { fetchWithTimeout } from './network'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
it('works without AbortSignal.timeout on older mobile browsers', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetch)
  vi.stubGlobal('AbortSignal', {})
  expect(await fetchWithTimeout('/api/places')).toEqual({ ok: true })
  expect(fetch.mock.calls[0][1].signal).toBeDefined()
})
it('aborts a stuck request and identifies the timeout', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')))
  })))
  const request = fetchWithTimeout('/api/places', {}, 1000)
  const check = expect(request).rejects.toMatchObject({ name: 'TimeoutError' })
  await vi.advanceTimersByTimeAsync(1000)
  await check
})
