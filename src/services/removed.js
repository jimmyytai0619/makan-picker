// Talks to our /api/removed endpoint: the list of places removed for everyone.

const REMOVED_API_URL = '/api/removed' // same website, so no CORS problems

/** @returns {Promise<Array<{ id: string, name: string, category: string, removedAt: number }>>} */
export async function fetchRemoved() {
  const response = await fetch(REMOVED_API_URL, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error(`Removed list unavailable (${response.status})`)
  return (await response.json()).removed
}

/** Remove a place for everyone. */
export async function reportRemoved({ id, name, category }) {
  const response = await fetch(REMOVED_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, category }),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Could not remove (${response.status})`)
}

/** Bring a place back for everyone. */
export async function restoreRemovedPlace(id) {
  const response = await fetch(`${REMOVED_API_URL}?${new URLSearchParams({ id })}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Could not restore (${response.status})`)
}
