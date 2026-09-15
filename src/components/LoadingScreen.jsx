import { useEffect, useRef, useState } from 'react'
import { fakeProgress, loadingMessage } from '../utils/loading'

const SNACKS = ['🍗', '🧋', '🥟', '🍩', '🍜', '🍢', '🍤', '🥭', '🍡', '🧁']
const SPAWN_EVERY_MS = 650
const MAX_FALLING = 8 // never too many at once (keeps it easy on old phones)
const BEST_KEY = 'makan-picker:best-catch'

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(score))
  } catch {
    // storage blocked — the best score just isn't remembered
  }
}

/** People who turn on "Reduce motion" get the bowl + messages, without falling snacks. */
function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Shown while the free map server searches (it can take up to ~30 s).
 * Top: a bouncing noodle bowl, funny messages and a progress bar.
 * Bottom: a tiny game — tap the falling snacks to catch them.
 *
 * @param {{ placeLabel?: string, radiusKm?: number, onCancel?: () => void }} props
 */
export default function LoadingScreen({ placeLabel, radiusKm, onCancel }) {
  // --- Time: re-render 4× a second so the message and bar move ---
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(startedAt)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer) // cleanup when the places arrive
  }, [])
  const elapsed = now - startedAt

  // --- The mini game ---
  const [canPlay] = useState(() => !prefersReducedMotion())
  const [snacks, setSnacks] = useState([]) // the snacks falling right now
  const [pops, setPops] = useState([]) // little "+1"s where you caught one
  const [score, setScore] = useState(0)
  const [best] = useState(loadBest) // best score from earlier searches
  const nextId = useRef(0)
  const scoreRef = useRef(0) // the cleanup below needs the latest score

  // Drop a new snack every 0.65 s, each at a random spot and speed.
  useEffect(() => {
    if (!canPlay) return undefined
    const timer = setInterval(() => {
      setSnacks((prev) =>
        prev.length >= MAX_FALLING
          ? prev
          : [
              ...prev,
              {
                id: nextId.current++,
                emoji: SNACKS[Math.floor(Math.random() * SNACKS.length)],
                left: 5 + Math.random() * 80, // % from the left
                duration: 2800 + Math.random() * 1800, // ms to fall
              },
            ],
      )
    }, SPAWN_EVERY_MS)
    return () => clearInterval(timer)
  }, [canPlay])

  // When the places arrive this screen disappears: remember a new best score.
  useEffect(
    () => () => {
      if (scoreRef.current > loadBest()) saveBest(scoreRef.current)
    },
    [],
  )

  function removeSnack(id) {
    setSnacks((prev) => prev.filter((s) => s.id !== id))
  }

  function catchSnack(snack, event) {
    event.preventDefault()
    removeSnack(snack.id)
    scoreRef.current += 1
    setScore(scoreRef.current)

    // Show "+1" exactly where the snack was.
    const snackBox = event.currentTarget.getBoundingClientRect()
    const areaBox = event.currentTarget.parentElement.getBoundingClientRect()
    const pop = { id: snack.id, x: snackBox.left - areaBox.left, y: snackBox.top - areaBox.top }
    setPops((prev) => [...prev, pop])
    setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== pop.id)), 600)
  }

  const progress = fakeProgress(elapsed)
  const isNewBest = score > 0 && score > best

  return (
    <div className="flex flex-1 flex-col items-center gap-4 text-center">
      {/* The bowl, with steam rising */}
      <div className="relative mt-2" aria-hidden="true">
        <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 gap-2 text-2xl font-black text-plum/25">
          {[0, 400, 800].map((delay) => (
            <span key={delay} className="animate-steam motion-reduce:hidden" style={{ animationDelay: `${delay}ms` }}>
              ~
            </span>
          ))}
        </div>
        <span className="block animate-float text-7xl motion-reduce:animate-none">🍜</span>
      </div>

      {/* role="status": screen readers read the new message out loud */}
      <p role="status" aria-live="polite" className="min-h-7 text-lg font-black text-plum">
        {loadingMessage(elapsed)}
      </p>

      {/* Pretend progress bar with chopsticks riding on it */}
      <div className="relative h-4 w-full max-w-xs rounded-full bg-white ring-1 ring-candy-pink-soft" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-candy-pink to-[#ff9ab9] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
        <span className="absolute -top-2 text-xl transition-[left] duration-300" style={{ left: `calc(${progress}% - 12px)` }}>
          🥢
        </span>
      </div>

      {placeLabel && (
        <p className="-mt-1 text-xs font-bold text-plum/45">
          {placeLabel} · within {radiusKm} km
        </p>
      )}

      {canPlay && (
        <div
          className="relative h-72 w-full touch-manipulation select-none overflow-hidden rounded-[2rem] bg-white/70 shadow-sm ring-1 ring-candy-pink-soft"
          aria-hidden="true" // just for fun; nothing important happens here
        >
          <p className="pointer-events-none absolute inset-x-0 top-3 text-sm font-extrabold text-plum/55">
            {score === 0 ? 'While you wait… tap the snacks! 👆' : `Caught ${score} snack${score === 1 ? '' : 's'} 😋`}
          </p>

          {snacks.map((snack) => (
            <span
              key={snack.id}
              onPointerDown={(event) => catchSnack(snack, event)}
              onAnimationEnd={() => removeSnack(snack.id)} // reached the bottom: missed
              className="absolute top-0 cursor-pointer p-2 text-4xl"
              style={{ left: `${snack.left}%`, animation: `fall ${snack.duration}ms linear forwards` }}
            >
              {snack.emoji}
            </span>
          ))}

          {pops.map((pop) => (
            <span
              key={pop.id}
              className="pointer-events-none absolute animate-score-pop text-lg font-black text-candy-pink"
              style={{ left: pop.x + 16, top: pop.y }}
            >
              +1
            </span>
          ))}

          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-xs font-bold text-plum/40">
            {isNewBest ? '🏆 New best!' : best > 0 ? `Best: ${best}` : ''}
          </p>
        </div>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-plum/60 shadow-sm ring-1 ring-candy-pink-soft transition hover:text-candy-pink active:scale-95"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
