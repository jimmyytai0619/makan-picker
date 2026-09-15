// Undo for the swipe screen. Pure function: easy to test, no React needed.
//
// Every swipe is remembered as { id, liked }, oldest first. We store the place's
// id (not its position) because the list can change while you swipe: removing a
// closed place takes it out and moves the later cards up by one.

/**
 * Which card to bring back.
 *
 * @param {Array<{ id: string, liked: boolean }>} history  every swipe so far, oldest first
 * @param {import('../models').Restaurant[]} places         the cards currently in the stack
 * @returns {{ history: Array<{ id: string, liked: boolean }>, index: number, entry: { id: string, liked: boolean } } | null}
 *   the history without that swipe, the card position to go back to, and the swipe that was undone
 *   (null = nothing to undo)
 */
export function undoLastSwipe(history, places) {
  // Walk back from the newest swipe. A place that has since been removed
  // (closed down) can't come back, so skip it and undo the one before.
  for (let i = history.length - 1; i >= 0; i--) {
    const index = places.findIndex((place) => place.id === history[i].id)
    if (index !== -1) return { history: history.slice(0, i), index, entry: history[i] }
  }
  return null
}
