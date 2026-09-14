import { useEffect, useRef, useState } from 'react'
import Confetti from '../components/Confetti'
import { pocketAngle, pocketColor, SPIN_DURATION_MS, targetRotation, truncateLabel } from '../utils/roulette'

// The wheel is drawn in SVG, in a 200 × 200 box with (0, 0) in the middle.
const RIM_RADIUS = 97 // pink outer ring
const POCKET_RADIUS = 86 // pastel pockets
const HUB_RADIUS = 20 // white centre (the smiley sits on top of it)
const LIGHT_COUNT = 16 // little dots around the rim

const POCKET_FILL = {
  pink: '#ffb8cc',
  mint: '#bdeed9',
  lilac: '#dccdff',
  butter: '#ffeb9e',
  peach: '#ffd0b5',
  sky: '#c4e5ff',
}
const LABEL_COLOR = '#4b3350' // plum

// Fast start, long slow finish, like a real wheel losing speed.
const WHEEL_EASING = 'cubic-bezier(0.12, 0.75, 0.15, 1)'

/** A point on a circle. Angle 0 = top (12 o'clock), growing clockwise. */
function pointAt(radius, angleDeg) {
  const a = (angleDeg * Math.PI) / 180
  return [radius * Math.sin(a), -radius * Math.cos(a)]
}

/** SVG path for one pie slice (pocket). */
function pocketPath(index, count) {
  const angle = pocketAngle(count)
  const [x1, y1] = pointAt(POCKET_RADIUS, index * angle)
  const [x2, y2] = pointAt(POCKET_RADIUS, (index + 1) * angle)
  const largeArc = angle > 180 ? 1 : 0
  return `M 0 0 L ${x1} ${y1} A ${POCKET_RADIUS} ${POCKET_RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

/** People who turn on "Reduce motion" on their phone get a short spin. */
function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * A cute pastel roulette. The code picks the winner FIRST, then turns the wheel
 * so exactly that pocket stops under the pin (see utils/roulette.js).
 *
 * @param {{
 *   candidates: import('../models').Restaurant[],
 *   totalCount?: number,               // how many places the wheel's set was drawn from
 *   onShuffle?: () => void,            // draw a new set of places (only when there are more)
 *   onPicked: (r: import('../models').Restaurant) => void,
 *   onBack: () => void,
 * }} props
 */
export default function RouletteScreen({ candidates, totalCount, onShuffle, onPicked, onBack }) {
  const [rotation, setRotation] = useState(0) // wheel angle in degrees (keeps growing)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winnerIndex, setWinnerIndex] = useState(null)
  const [spinCount, setSpinCount] = useState(0) // new confetti for every win

  // useRef keeps the timer ID without causing re-renders.
  const timerRef = useRef(null)
  // Cleanup: if the user leaves mid-spin, stop the timer.
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const count = candidates.length
  const winner = winnerIndex === null ? null : candidates[winnerIndex]
  const hasLanded = winner != null && !isSpinning
  const duration = prefersReducedMotion() ? 1500 : SPIN_DURATION_MS

  // Many pockets = thinner pockets = smaller text, and names must not reach the hub.
  const angle = count > 0 ? pocketAngle(count) : 360
  const fontSize = Math.min(7.5, Math.max(4, ((2 * Math.PI * 55) / Math.max(count, 1)) * 0.5))
  const labelSpace = POCKET_RADIUS - 6 - (HUB_RADIUS + 6)
  const maxChars = Math.floor(labelSpace / (fontSize * 0.65)) // ~0.65 × font size per bold letter

  function spin() {
    if (isSpinning || count === 0) return

    const pick = Math.floor(Math.random() * count)
    const jitter = (Math.random() - 0.5) * 0.7 // stop somewhere inside the pocket, not always the middle

    setWinnerIndex(null)
    setIsSpinning(true)
    setRotation((r) => targetRotation(r, pick, count, jitter))

    timerRef.current = setTimeout(() => {
      setIsSpinning(false)
      setWinnerIndex(pick)
      setSpinCount((n) => n + 1)
      // Small buzz on Android phones (iPhones ignore it). Browsers only allow it
      // after a real tap on the page, so check first to avoid a console error.
      if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(60)
    }, duration)
  }

  function handleShuffle() {
    setWinnerIndex(null)
    onShuffle()
  }

  if (count === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-7xl" aria-hidden="true">
          🥺
        </p>
        <p className="text-lg font-extrabold text-plum">No places for the wheel</p>
        <button onClick={onBack} className="rounded-full bg-candy-pink px-6 py-3 font-black text-white shadow-lg shadow-candy-pink/30">
          ← Back
        </button>
      </div>
    )
  }

  const subtitle =
    totalCount && totalCount > count
      ? `${count} of ${totalCount} places on the wheel`
      : `${count} place${count === 1 ? '' : 's'} on the wheel`

  return (
    <div className="relative flex flex-1 flex-col gap-4">
      {hasLanded && <Confetti key={spinCount} />}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isSpinning}
          className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-plum shadow-sm ring-1 ring-candy-pink-soft disabled:opacity-40"
        >
          ← Back
        </button>
        <span className="text-sm font-bold text-plum/50">{subtitle}</span>
      </div>

      <div className="rounded-[2rem] bg-white/80 p-5 shadow-xl shadow-candy-pink/15 ring-1 ring-candy-pink-soft">
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          {/* ---- The wheel (this whole SVG spins) ---- */}
          <svg
            viewBox="-100 -100 200 200"
            className="absolute inset-0 h-full w-full drop-shadow-xl"
            style={{ transform: `rotate(${rotation}deg)`, transition: `transform ${duration}ms ${WHEEL_EASING}` }}
            role="img"
            aria-label={`Roulette wheel with ${count} places`}
          >
            {/* Pink rim with little lights */}
            <circle r={RIM_RADIUS + 2} fill="#ff8fb1" />
            <circle r={RIM_RADIUS - 1} fill="#ffe0ea" />
            {Array.from({ length: LIGHT_COUNT }, (_, i) => {
              const [x, y] = pointAt((RIM_RADIUS + POCKET_RADIUS) / 2, (i * 360) / LIGHT_COUNT)
              return <circle key={i} cx={x} cy={y} r="2.3" fill={i % 2 === 0 ? '#ff6f9c' : '#ffd66b'} />
            })}

            {/* Pockets */}
            {count === 1 ? (
              <circle r={POCKET_RADIUS} fill={POCKET_FILL.pink} stroke="white" strokeWidth="1.5" />
            ) : (
              candidates.map((place, i) => (
                <path
                  key={place.id}
                  d={pocketPath(i, count)}
                  fill={POCKET_FILL[pocketColor(i, count)]}
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))
            )}

            {/* Glow on the winning pocket */}
            {hasLanded &&
              (count === 1 ? (
                <circle r={POCKET_RADIUS} fill="white" opacity="0.4" />
              ) : (
                <path d={pocketPath(winnerIndex, count)} fill="white" opacity="0.45" stroke="#ff6f9c" strokeWidth="2.5" />
              ))}

            {/* Names: each one runs from the centre towards the rim */}
            {candidates.map((place, i) => (
              <g key={`label-${place.id}`} transform={`rotate(${(i + 0.5) * angle})`}>
                <text
                  x={POCKET_RADIUS - 6}
                  y={0}
                  transform="rotate(-90)"
                  textAnchor="end"
                  dominantBaseline="central"
                  fill={LABEL_COLOR}
                  fontSize={fontSize}
                  fontWeight="800"
                >
                  {truncateLabel(place.name, maxChars)}
                </text>
              </g>
            ))}

            <circle r={HUB_RADIUS + 3} fill="white" stroke="#ffb8cc" strokeWidth="3" />
          </svg>

          {/* ---- The smiley in the middle (does NOT spin, so it stays upright) ---- */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className={`text-[2.6rem] leading-none ${hasLanded ? 'animate-pop' : ''}`}>
              {isSpinning ? '🤤' : hasLanded ? '😍' : '😋'}
            </span>
          </div>

          {/* ---- The pin (fixed at the top) ---- */}
          <svg
            viewBox="0 0 24 30"
            className={`absolute left-1/2 top-0 z-10 h-[11%] w-[9%] -translate-x-1/2 -translate-y-1/3 drop-shadow ${
              hasLanded ? 'animate-pop' : ''
            }`}
            aria-hidden="true"
          >
            <path d="M12 29 L4.5 15 A9 9 0 1 1 19.5 15 Z" fill="#ff6f9c" stroke="white" strokeWidth="2" />
            <circle cx="12" cy="10" r="3.5" fill="white" />
          </svg>
        </div>

        {/* aria-live: screen readers announce the winner */}
        <p aria-live="polite" className="mt-4 min-h-8 text-center text-xl font-black text-plum">
          {isSpinning ? (
            'Round and round… 🎶'
          ) : winner ? (
            <span className="inline-block animate-pop">🎉 {winner.name}!</span>
          ) : (
            'Ready? Give it a spin!'
          )}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={spin}
          disabled={isSpinning}
          className="rounded-full bg-candy-pink py-4 text-lg font-black text-white shadow-lg shadow-candy-pink/30 transition active:scale-95 disabled:opacity-50"
        >
          {isSpinning ? 'Spinning…' : winner ? 'Spin again 🎡' : 'Spin! 🎡'}
        </button>
        {hasLanded && (
          <button
            onClick={() => onPicked(winner)}
            className="animate-pop rounded-full bg-plum py-4 text-lg font-black text-white shadow-lg transition active:scale-95"
          >
            Go with {winner.name} →
          </button>
        )}
        {onShuffle && !isSpinning && (
          <button
            onClick={handleShuffle}
            className="rounded-full bg-white py-3 font-extrabold text-plum shadow-sm ring-1 ring-candy-pink-soft transition active:scale-95"
          >
            🔀 Shuffle places
          </button>
        )}
      </div>
    </div>
  )
}
