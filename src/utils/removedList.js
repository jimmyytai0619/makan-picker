// Small pure helpers for the list of removed (closed-down) places.
// Each entry looks like { id, name, category, removedAt }.

/** Adds an entry at the top, unless that place is already in the list. */
export function withEntry(list, entry) {
  return list.some((e) => e.id === entry.id) ? list : [entry, ...list]
}

/** The list without the place with this id. */
export function withoutId(list, id) {
  return list.filter((e) => e.id !== id)
}

/**
 * The shared list (from the server) plus removals that only this phone knows
 * about yet — e.g. ones made before the shared list was set up, or while offline.
 * Without this, those removals would silently come back.
 */
export function mergeRemoved(shared, onThisPhone) {
  const sharedIds = new Set(shared.map((e) => e.id))
  return [...onThisPhone.filter((e) => !sharedIds.has(e.id)), ...shared]
}
