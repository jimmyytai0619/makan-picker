// Talks to our /api/removed endpoint: reports of places that have closed down.
//
// Hiding a place happens on the phone (see hooks/useRemovedPlaces.js). These
// reports only tell the owner of the app which places people say are closed —
// they never change what anyone else sees.

const REMOVED_API_URL = '/api/removed' // same website, so no CORS problems

/** Report that a place has closed. Sends the place only — nothing about the person. */
export async function reportClosed({ id, name, category }) {
  const response = await fetch(REMOVED_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, category }),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Could not report (${response.status})`)
}

/** Take back a report (the place was restored on this phone). */
export async function withdrawReport(id) {
  const response = await fetch(`${REMOVED_API_URL}?${new URLSearchParams({ id })}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Could not withdraw the report (${response.status})`)
}
