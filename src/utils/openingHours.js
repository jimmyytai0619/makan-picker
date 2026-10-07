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
    openStatus: getOpenStatus(opening_hours, place.openingHours, malaysiaWallTime(now)),
  }))
}

/** @returns {'open'|'closed'|'unknown'} */
function getOpenStatus(opening_hours, text, now) {
  if (!text || /\b(?:PH|SH|sunrise|sunset|dawn|dusk)\b/.test(text)) return 'unknown' // most OSM places have no hours

  try {
    const hours = new opening_hours(text, null, { mode: 0 })
    if (hours.getUnknown(now)) return 'unknown'
    return hours.getState(now) ? 'open' : 'closed'
  } catch {
    return 'unknown' // the hours text was written wrongly on the map
  }
}

// opening_hours reads local Date fields. Supply Malaysia's wall-clock fields,
// even when the browser itself is configured to another time zone.
export function malaysiaWallTime(now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(part => [part.type, part.value]))
  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second))
}
