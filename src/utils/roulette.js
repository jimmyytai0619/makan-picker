// The maths behind the casino wheel. It's kept apart from the drawing code
// so it can be tested: the wheel must stop on the SAME place the code picked.
//
// Pockets are numbered clockwise, starting at the top (12 o'clock).
// The pointer is fixed at the top. The wheel spins clockwise.

export const SPIN_DURATION_MS = 5000

/** Degrees per pocket, e.g. 4 places -> 90° each. */
export function pocketAngle(count) {
  return 360 / count
}

/** Always 0 to 359.99… (JavaScript's % can give negative numbers). */
function mod360(degrees) {
  return ((degrees % 360) + 360) % 360
}

/**
 * The rotation (in degrees) that makes pocket `winnerIndex` stop under the pointer.
 * The number keeps growing on every spin, so the wheel always turns forward.
 *
 * @param {number} currentRotation  where the wheel is now
 * @param {number} winnerIndex      0 … count-1
 * @param {number} count            number of pockets
 * @param {number} [jitter]         -0.5 … 0.5: where inside the pocket to stop (0 = middle)
 * @param {number} [fullTurns]      extra full turns, for drama
 */
export function targetRotation(currentRotation, winnerIndex, count, jitter = 0, fullTurns = 5) {
  const landingAngle = (winnerIndex + 0.5 + jitter) * pocketAngle(count) // spot on the wheel
  const wanted = mod360(-landingAngle) // rotation that brings that spot to the top
  const extra = mod360(wanted - mod360(currentRotation)) // how much more to turn from here
  return currentRotation + fullTurns * 360 + extra
}

/** Which pocket is under the pointer when the wheel is at `rotation` degrees. */
export function pocketAtRotation(rotation, count) {
  // A spot at wheel angle `a` shows at screen angle `a + rotation`.
  // The pointer is at screen angle 0, so the spot under it is at `-rotation`.
  return Math.floor(mod360(-rotation) / pocketAngle(count)) % count
}

/**
 * Casino colours: red and black take turns. With an odd number of pockets the
 * last one would put two reds side by side, so it's green (like the casino 0).
 *
 * @returns {'red'|'black'|'green'}
 */
export function pocketColor(index, count) {
  if (count > 1 && count % 2 === 1 && index === count - 1) return 'green'
  return index % 2 === 0 ? 'red' : 'black'
}

/** "Brew & Boulder Café (near Batuu)" -> "Brew & Boulder…" so it fits in a pocket. */
export function truncateLabel(text, maxChars) {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1).trimEnd()}…`
}
