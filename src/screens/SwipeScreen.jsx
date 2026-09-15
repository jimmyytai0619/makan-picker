import { useEffect, useRef, useState } from 'react'
import RestaurantCard from '../components/RestaurantCard'
import SwipeableCard from '../components/SwipeableCard'
import ActionButtons from '../components/ActionButtons'
import Confetti from '../components/Confetti'

/**
 * Tinder-style: swipe right (or ♥) for yum, left (or ✕) for nope.
 * ↩️ (or Backspace) brings back the last card, e.g. after an accidental swipe.
 * On a laptop, the ← and → arrow keys work too.
 * From the 2nd yum on, a "Spin my picks" button appears under ✕ / ♥ (with confetti),
 * so you can keep swiping or let the wheel choose whenever you like.
 *
 * @param {{
 *   restaurants: import('../models').Restaurant[],
 *   currentIndex: number,
 *   likedCount: number,
 *   isShared: boolean,
 *   canUndo: boolean,
 *   onSwipe: (r: import('../models').Restaurant, liked: boolean) => void,
 *   onUndo: () => void,
 *   onRemove: (r: import('../models').Restaurant) => void,
 *   onShowPicks: () => void,
 *   onSpinPicks: () => void,
 *   onBack: () => void,
 * }} props
 */
export default function SwipeScreen({
  restaurants,
  currentIndex,
  likedCount,
  isShared,
  canUndo,
  onSwipe,
  onUndo,
  onRemove,
  onShowPicks,
  onSpinPicks,
  onBack,
}) {
  // The card position (currentIndex) lives in App, not here, so it survives
  // leaving this screen (e.g. peeking at your picks and coming back).
  const current = restaurants[currentIndex] // undefined once we run out
  const next = restaurants[currentIndex + 1]
  const isDone = currentIndex >= restaurants.length

  // Set when ✕ / ♥ / an arrow key is pressed: the card then flies away by itself.
  const [exit, setExit] = useState(null)
  // Confetti every time the likes go from 1 to 2 (the spin button appears) — also again
  // after an undo took you back to 1. The number is used as a key, so each burst is new.
  // (useRef remembers the previous count between renders without re-rendering.)
  const [celebrations, setCelebrations] = useState(0)
  const previousLikes = useRef(likedCount)
  useEffect(() => {
    if (previousLikes.current < 2 && likedCount >= 2) setCelebrations((n) => n + 1)
    previousLikes.current = likedCount
  }, [likedCount])

  // True right after an undo, so the returning card pops back in instead of just appearing.
  const [cameBack, setCameBack] = useState(false)

  function handleSwiped(direction) {
    setExit(null)
    setCameBack(false)
    onSwipe(current, direction === 'right')
  }

  function handleUndo() {
    setCameBack(true)
    onUndo()
  }

  // Keyboard: ← nope, → yum, Backspace = undo
  useEffect(() => {
    function handleKey(event) {
      if (exit) return
      if (event.key === 'Backspace' && canUndo) {
        event.preventDefault()
        setCameBack(true)
        onUndo()
        return
      }
      if (isDone) return
      if (event.key === 'ArrowRight') setExit('right')
      if (event.key === 'ArrowLeft') setExit('left')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey) // cleanup when leaving
    // onUndo is in the list so the key always calls the LATEST version (with the latest swipes).
  }, [isDone, exit, canUndo, onUndo])

  // --- Case 1: filters matched nothing ---
  if (restaurants.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-7xl" aria-hidden="true">
          🥺
        </p>
        <p className="text-lg font-extrabold text-plum">No places match your filters</p>
        <button onClick={onBack} className="rounded-full bg-candy-pink px-6 py-3 font-black text-white shadow-lg shadow-candy-pink/30">
          Change filters
        </button>
      </div>
    )
  }

  // --- Case 2: you've seen every card ---
  if (isDone) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="animate-pop text-7xl" aria-hidden="true">
          {likedCount > 0 ? '🎉' : '🙈'}
        </p>
        <p className="text-xl font-black text-plum">That's everyone!</p>
        <p className="text-plum/60">
          You liked <strong className="text-candy-pink">{likedCount}</strong> of {restaurants.length} places.
        </p>
        {likedCount >= 2 && (
          <button onClick={onSpinPicks} className="rounded-full bg-candy-pink px-6 py-3 font-black text-white shadow-lg shadow-candy-pink/30">
            🎡 Spin to choose
          </button>
        )}
        {likedCount > 0 ? (
          <button onClick={onShowPicks} className="rounded-full bg-candy-pink-soft px-6 py-3 font-black text-candy-pink">
            📋 See my list
          </button>
        ) : (
          <button onClick={onBack} className="rounded-full bg-candy-pink px-6 py-3 font-black text-white shadow-lg shadow-candy-pink/30">
            Try new filters
          </button>
        )}
        {canUndo && (
          <button onClick={handleUndo} className="px-3 py-1 text-sm font-extrabold text-plum/50 hover:text-candy-pink">
            ↩️ Undo last swipe
          </button>
        )}
      </div>
    )
  }

  // --- Case 3: the card stack ---
  return (
    <div className="relative flex flex-1 flex-col gap-4">
      {celebrations > 0 && <Confetti key={celebrations} />}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-plum shadow-sm ring-1 ring-candy-pink-soft">
          ← Filters
        </button>
        <span className="text-sm font-bold text-plum/50">
          {currentIndex + 1} / {restaurants.length}
        </span>
        <button
          onClick={onShowPicks}
          className="rounded-full bg-candy-pink-soft px-4 py-2 text-sm font-black text-candy-pink"
          aria-label={`See my picks (${likedCount})`}
        >
          💖 {likedCount}
        </button>
      </div>

      <div className="relative">
        {/* The next card peeks out behind, like a real stack */}
        {next && (
          <div className="pointer-events-none absolute inset-x-0 top-0 translate-y-5 scale-95 opacity-70" aria-hidden="true">
            <RestaurantCard restaurant={next} />
          </div>
        )}
        {/* key= gives every place a brand-new draggable card (and replays the pop after an undo) */}
        <div key={current.id} className={cameBack ? 'animate-pop' : undefined}>
          <SwipeableCard onSwipe={handleSwiped} exit={exit}>
            <RestaurantCard restaurant={current} />
          </SwipeableCard>
        </div>
      </div>

      <p className="text-center text-xs font-bold text-plum/40">Swipe right if it looks yummy 😋 · left to skip</p>

      <ActionButtons
        onSkip={() => setExit('left')}
        onLike={() => setExit('right')}
        onUndo={handleUndo}
        canUndo={canUndo}
        disabled={exit !== null}
      />

      {/* From 2 picks on: let the wheel choose, any time (no pop-up interrupting the swiping) */}
      {likedCount >= 2 && (
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onSpinPicks}
            disabled={exit !== null}
            className="w-full animate-pop rounded-full bg-gradient-to-r from-candy-pink to-[#ff9ab9] py-4 text-lg font-black text-white shadow-lg shadow-candy-pink/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            🎡 Spin my {likedCount} picks!
          </button>
          <button onClick={onShowPicks} className="px-3 py-1 text-sm font-extrabold text-candy-pink/80 hover:text-candy-pink">
            or see my list 📋
          </button>
        </div>
      )}

      {/* The free map often doesn't know a place closed down, so let people remove it.
          (Not for My Cafes — those are the user's own list.) */}
      {current.category !== 'saved' && (
        <button
          onClick={() => onRemove(current)}
          disabled={exit !== null}
          className="self-center rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-plum/50 ring-1 ring-candy-pink-soft transition hover:text-candy-pink active:scale-95 disabled:opacity-40"
        >
          🚫 Closed down? {isShared ? 'Remove for everyone' : 'Remove it'}
        </button>
      )}
    </div>
  )
}
