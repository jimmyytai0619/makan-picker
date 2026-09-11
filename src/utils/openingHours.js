/**
 * Adds `openStatus` ('open' | 'closed' | 'unknown') to every place,
 * by reading OSM opening_hours text like "Mo-Su 10:00-22:00".
 *
 * The library is BIG, so import() downloads it only when a search needs it.
 * This is called "lazy loading" or "code splitting".
 */
export async function addOpenStatus(places, now = new Date()) {
  const { default: opening_hours } = await import('opening_hours')

  return places.map((place) => ({
    ...place,
    openStatus: getOpenStatus(opening_hours, place.openingHours, now),
  }))
}

/** @returns {'open'|'closed'|'unknown'} */
function getOpenStatus(opening_hours, text, now) {
  if (!text) return 'unknown' // most OSM places have no hours

  try {
    const hours = new opening_hours(text, null, { mode: 0 })
    if (hours.getUnknown(now)) return 'unknown'
    return hours.getState(now) ? 'open' : 'closed'
  } catch {
    return 'unknown' // the hours text was written wrongly on the map
  }
}