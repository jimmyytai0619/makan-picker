import { useEffect, useRef, useState } from 'react'

/**
 * Placeholder roulette: flashes through the liked places and lands on a
 * random one. A spinning-wheel graphic can replace this later.
 *
 * @param {{
 *   candidates: import('../models').Restaurant[],
 *   onPicked: (r: import('../models').Restaurant) => void,
 *   onBack: () => void,
 * }} props
 */
export default function RouletteScreen({ candidates, onPicked, onBack }) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState(null)

  // useRef holds a value that survives re-renders WITHOUT causing one.
  // Perfect for a timer ID.
  const intervalRef = useRef(null)

  // Cleanup: if the user leaves mid-spin, stop the timer.
  useEffect(() => () => clearInterval(intervalRef.current), [])

  function spin() {
    if (isSpinning) return
    setIsSpinning(true)
    setWinner(null)

    const winnerIndex = Math.floor(Math.random() * candidates.length)
    // Loop through the list 3 times, then stop exactly on the winner.
    const totalTicks = candidates.length * 3 + winnerIndex
    let tick = 0

    intervalRef.current = setInterval(() => {
      tick += 1
      setHighlightedIndex(tick % candidates.length)

      if (tick >= totalTicks) {
        clearInterval(intervalRef.current)
        setIsSpinning(false)
        setWinner(candidates[winnerIndex])
      }
    }, 120)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <button onClick={onBack} disabled={isSpinning} className="self-start text-sm text-gray-500 underline">
        ← Back
      </button>

      <ul className="space-y-2">
        {candidates.map((r, i) => (
          <li
            key={r.id}
            className={`rounded-xl p-4 font-medium transition ${
              i === highlightedIndex ? 'scale-105 bg-orange-500 text-white' : 'bg-white'
            }`}
          >
            {r.name}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={spin}
          disabled={isSpinning}
          className="rounded-xl bg-gray-900 py-4 text-lg font-semibold text-white disabled:opacity-50"
        >
          {isSpinning ? 'Spinning…' : winner ? 'Spin again 🎡' : 'Spin 🎡'}
        </button>
        {winner && (
          <button onClick={() => onPicked(winner)} className="rounded-xl bg-orange-500 py-4 text-lg font-semibold text-white">
            Go with {winner.name} →
          </button>
        )}
      </div>
    </div>
  )
}
