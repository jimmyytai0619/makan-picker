import { useEffect, useRef, useState } from 'react'
import { pocketAngle, pocketColor, SPIN_DURATION_MS, targetRotation, truncateLabel } from '../utils/roulette'

// The wheel is drawn in SVG, in a 200 × 200 box with (0, 0) in the middle.
const RIM_RADIUS = 97 // wooden outer ring
const POCKET_RADIUS = 86 // red / black pockets
const HUB_RADIUS = 22 // gold centre
const BALL_TRACK_RADIUS = 91 // where the ball rolls while spinning
const BALL_POCKET_RADIUS = 76 // where the ball sits after dropping into a pocket

const GOLD = '#d4a017'
const POCKET_FILL = { red: '#b91c1c', black: '#111827', green: '#15803d' }

// Fast start, long slow finish, like a real wheel losing speed.
const WHEEL_EASING = 'cubic-bezier(0.12, 0.75, 0.15, 1)'
const BALL_EASING = 'cubic-bezier(0.2, 0.7, 0.25, 1)'

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

/** CSS `top` for something at `radius` from the centre (the box is 200 units wide). */
function topPercent(radius) {
  return `${(100 - radius) / 2}%`
}

/** People who turn on "Reduce motion" on their phone get a short spin. */
function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Casino-style roulette wheel. Each liked place is a pocket. The wheel spins
 * one way, the ball rolls the other way, and it drops into the winner.
 *
 * @param {{
 *   candidates: import('../models').Restaurant[],
 *   onPicked: (r: import('../models').Restaurant) => void,
 *   onBack: () => void,
 * }} props
 */
export default function RouletteScreen({ candidates, onPicked, onBack }) {
  const [rotation, setRotation] = useState(0) // wheel angle in degrees (keeps growing)
  const [ballRotation, setBallRotation] = useState(180) // ball starts at the bottom
  const [isSpinning, setIsSpinning] = useState(false)
  const [winnerIndex, setWinnerIndex] = useState(null)

  // useRef keeps the timer ID without causing re-renders.
  const timerRef = useRef(null)
  // Cleanup: if the user leaves mid-spin, stop the timer.
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const count = candidates.length
  const winner = winnerIndex === null ? null : candidates[winnerIndex]
  const hasLanded = winner !== null && !isSpinning
  const duration = prefersReducedMotion() ? 1500 : SPIN_DURATION_MS

  // Many pockets = thinner pockets = smaller text, and names must not reach the hub.
  const angle = pocketAngle(count)
  const fontSize = Math.min(7, Math.max(4, ((2 * Math.PI * 55) / count) * 0.5))
  const labelSpace = POCKET_RADIUS - 5 - (HUB_RADIUS + 8)
  const maxChars = Math.floor(labelSpace / (fontSize * 0.65)) // ~0.65 × font size per bold letter

  function spin() {
    if (isSpinning || count === 0) return

    const pick = Math.floor(Math.random() * count)
    const jitter = (Math.random() - 0.5) * 0.7 // stop somewhere inside the pocket, not always the middle

    setWinnerIndex(null)
    setIsSpinning(true)
    setRotation((r) => targetRotation(r, pick, count, jitter))
    // The ball rolls the other way (4 turns) and finishes at the top, under the pointer.
    setBallRotation((b) => b - (((b % 360) + 360) % 360) - 360 * 4)

    timerRef.current = setTimeout(() => {
      setIsSpinning(false)
      setWinnerIndex(pick)
      navigator.vibrate?.(60) // small buzz on Android phones (iPhones ignore it)
    }, duration)
  }

  if (count === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg">No liked places yet.</p>
        <button onClick={onBack} className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white">
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <button
        onClick={onBack}
        disabled={isSpinning}
        className="self-start text-sm text-gray-500 underline disabled:opacity-40"
      >
        ← Back
      </button>

      {/* The casino table: green felt */}
      <div className="rounded-3xl bg-gradient-to-b from-emerald-800 to-emerald-950 p-5 shadow-inner">
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          {/* ---- The wheel (this whole SVG spins) ---- */}
          <svg
            viewBox="-100 -100 200 200"
            className="absolute inset-0 h-full w-full drop-shadow-2xl"
            style={{ transform: `rotate(${rotation}deg)`, transition: `transform ${duration}ms ${WHEEL_EASING}` }}
            role="img"
            aria-label={`Roulette wheel with ${count} places`}
          >
            <defs>
              <radialGradient id="roulette-wood" r="50%">
                <stop offset="80%" stopColor="#7c2d12" />
                <stop offset="100%" stopColor="#431407" />
              </radialGradient>
              <radialGradient id="roulette-gold" cx="35%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="55%" stopColor={GOLD} />
                <stop offset="100%" stopColor="#92400e" />
              </radialGradient>
            </defs>

            {/* Rim: gold edge, wood, then a gold ring around the pockets */}
            <circle r={RIM_RADIUS + 2} fill={GOLD} />
            <circle r={RIM_RADIUS} fill="url(#roulette-wood)" />
            <circle r={POCKET_RADIUS + 1.5} fill={GOLD} />

            {/* Pockets */}
            {count === 1 ? (
              <circle r={POCKET_RADIUS} fill={POCKET_FILL.red} />
            ) : (
              candidates.map((place, i) => (
                <path
                  key={place.id}
                  d={pocketPath(i, count)}
                  fill={POCKET_FILL[pocketColor(i, count)]}
                  stroke={GOLD}
                  strokeWidth="0.8"
                />
              ))
            )}

            {/* Glow on the winning pocket after the ball lands */}
            {hasLanded &&
              (count === 1 ? (
                <circle r={POCKET_RADIUS} fill="white" opacity="0.2" />
              ) : (
                <path d={pocketPath(winnerIndex, count)} fill="white" opacity="0.25" stroke="#fde68a" strokeWidth="2" />
              ))}

            {/* Names: each one runs from the centre towards the rim */}
            {candidates.map((place, i) => (
              <g key={`label-${place.id}`} transform={`rotate(${(i + 0.5) * angle})`}>
                <text
                  x={POCKET_RADIUS - 5}
                  y={0}
                  transform="rotate(-90)"
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={fontSize}
                  fontWeight="600"
                >
                  {truncateLabel(place.name, maxChars)}
                </text>
              </g>
            ))}

            {/* Centre: dark cone, gold hub and the 4-arm "turret" handle */}
            <circle r={HUB_RADIUS + 6} fill="#1f2937" stroke={GOLD} strokeWidth="1" />
            <circle r={HUB_RADIUS} fill="url(#roulette-gold)" />
            {[0, 90, 180, 270].map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <rect x={-1.5} y={-HUB_RADIUS + 3} width={3} height={HUB_RADIUS - 6} rx={1.5} fill="#fef3c7" />
                <circle cy={-HUB_RADIUS + 4} r={3} fill="#fde68a" stroke="#92400e" strokeWidth="0.6" />
              </g>
            ))}
            <circle r={5} fill="#fef3c7" stroke="#92400e" strokeWidth="1" />
          </svg>

          {/* ---- The ball: rolls the other way, then drops into the winning pocket ---- */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ transform: `rotate(${ballRotation}deg)`, transition: `transform ${duration}ms ${BALL_EASING}` }}
          >
            <div
              className="absolute left-1/2 h-[5%] w-[5%] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md"
              style={{
                top: topPercent(hasLanded ? BALL_POCKET_RADIUS : BALL_TRACK_RADIUS),
                transition: 'top 450ms ease-in',
                background: 'radial-gradient(circle at 35% 35%, #ffffff, #d1d5db 60%, #9ca3af)',
              }}
            />
          </div>

          {/* ---- The pointer (fixed at the top) ---- */}
          <svg
            viewBox="0 0 20 16"
            className="absolute left-1/2 top-0 z-10 h-[8%] w-[9%] -translate-x-1/2 -translate-y-1/3 drop-shadow"
            aria-hidden="true"
          >
            <path d="M0 0 H20 L10 16 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1.2" />
          </svg>
        </div>

        {/* aria-live: screen readers announce the winner */}
        <p aria-live="polite" className="mt-4 min-h-8 text-center text-xl font-bold text-amber-300">
          {isSpinning
            ? 'No more bets… 🎲'
            : winner
              ? `🎉 ${winner.name}`
              : `${count} place${count === 1 ? '' : 's'} on the wheel`}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={spin}
          disabled={isSpinning}
          className="rounded-xl bg-gray-900 py-4 text-lg font-semibold text-amber-300 disabled:opacity-50"
        >
          {isSpinning ? 'Spinning…' : winner ? 'Spin again 🎰' : 'Spin 🎰'}
        </button>
        {hasLanded && (
          <button
            onClick={() => onPicked(winner)}
            className="rounded-xl bg-orange-500 py-4 text-lg font-semibold text-white"
          >
            Go with {winner.name} →
          </button>
        )}
      </div>
    </div>
  )
}
