// When does dragging a card count as a swipe? Kept apart from the drag code
// so it can be tested without a touch screen.

export const SWIPE_DISTANCE_PX = 100 // dragged far enough…
export const FLICK_DISTANCE_PX = 40 // …or a shorter drag…
export const FLICK_SPEED = 0.5 // …that is fast (pixels per millisecond), like a flick

/**
 * @param {number} dx  how far the card moved sideways, in pixels (+ = right)
 * @param {number} ms  how long the drag took, in milliseconds
 * @returns {'right' | 'left' | null}  right = like, left = nope, null = spring back
 */
export function swipeDecision(dx, ms) {
  const distance = Math.abs(dx)
  const speed = ms > 0 ? distance / ms : 0
  const isFarEnough = distance >= SWIPE_DISTANCE_PX
  const isFlick = distance >= FLICK_DISTANCE_PX && speed >= FLICK_SPEED

  if (!isFarEnough && !isFlick) return null
  return dx > 0 ? 'right' : 'left'
}
