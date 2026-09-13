import RestaurantCard from '../components/RestaurantCard'
import ActionButtons from '../components/ActionButtons'

/**
 * Shows one restaurant at a time. Phase 1 uses buttons; real swipe
 * gestures can be added later without changing App.jsx.
 *
 * @param {{
 *   restaurants: import('../models').Restaurant[],
 *   currentIndex: number,
 *   likedCount: number,
 *   onLike: (r: import('../models').Restaurant) => void,
 *   onNext: () => void,
 *   onFinish: () => void,
 *   onBack: () => void,
 * }} props
 */
export default function SwipeScreen({ restaurants, currentIndex, likedCount, onLike, onNext, onFinish, onBack }) {
  // The card position (currentIndex) lives in App, not here. If it lived here,
  // React would forget it when you go to the roulette, and pressing Back would
  // start again at card 1, letting you like the same place twice.
  const current = restaurants[currentIndex] // undefined once we run out
  const isDone = currentIndex >= restaurants.length

  function handleLike() {
    onLike(current) // tell App to save it...
    onNext() // ...then show the next card
  }

  // --- Case 1: filters matched nothing ---
  if (restaurants.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg">No places match your filters 😢</p>
        <button onClick={onBack} className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white">
          Change filters
        </button>
      </div>
    )
  }

  // --- Case 2: user has seen every card ---
  if (isDone) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg">
          You liked <strong>{likedCount}</strong> of {restaurants.length} places.
        </p>
        {likedCount > 0 ? (
          <button onClick={onFinish} className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white">
            Spin the roulette 🎡
          </button>
        ) : (
          <button onClick={onBack} className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white">
            Nothing? Try new filters
          </button>
        )}
      </div>
    )
  }

  // --- Case 3: normal — show the current card ---
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <button onClick={onBack} className="underline">← Filters</button>
        <span>
          {currentIndex + 1} / {restaurants.length} · ♥ {likedCount}
        </span>
      </div>

      {/* key= forces React to treat each restaurant as a brand-new card */}
      <RestaurantCard key={current.id} restaurant={current} />

      <ActionButtons onSkip={onNext} onLike={handleLike} />

      {/* Nobody swipes all 25 cards. After 2 likes, let them stop early. */}
      {likedCount >= 2 && (
        <button onClick={onFinish} className="self-center text-sm font-semibold text-orange-600 underline">
          Enough! Spin with my {likedCount} likes 🎡
        </button>
      )}
    </div>
  )
}
