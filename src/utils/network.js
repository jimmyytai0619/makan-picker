// AbortSignal.timeout is missing in some older mobile browsers.
export async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (timedOut) { const timeout = new Error('Request timed out'); timeout.name = 'TimeoutError'; throw timeout }
    throw error
  } finally { clearTimeout(timer) }
}
