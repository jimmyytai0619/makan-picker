import { useState } from 'react'
import LocationPicker from '../components/LocationPicker'

const PLAY_STYLES = [
  { id: 'swipe', emoji: '👆', label: 'Swipe', hint: 'Yum or nope, then see your picks' },
  { id: 'roulette', emoji: '🎡', label: 'Roulette', hint: 'Let the wheel pick from all places' },
]

const inputClass =
  'rounded-2xl border-0 bg-cream px-4 py-3 font-semibold text-plum ring-1 ring-candy-pink-soft ' +
  'placeholder:font-normal placeholder:text-plum/40 focus:outline-none focus:ring-2 focus:ring-candy-pink'

/**
 * The start screen: how to decide (swipe or roulette), where, and any craving.
 *
 * @param {{
 *   initialFilters: import('../models').SearchFilters,
 *   savedCount: number,
 *   hiddenCount: number,
 *   isSearching: boolean,
 *   error: string | null,
 *   onSearch: (f: import('../models').SearchFilters) => void,
 *   onUnhideAll: () => void,
 * }} props
 */
export default function FilterScreen({ initialFilters, savedCount, hiddenCount, isSearching, error, onSearch, onUnhideAll }) {
  const [playStyle, setPlayStyle] = useState(initialFilters.playStyle)
  const [source, setSource] = useState(initialFilters.source)
  const [location, setLocation] = useState(initialFilters.location)
  const [maxDistanceKm, setMaxDistanceKm] = useState(initialFilters.maxDistanceKm)
  const [cuisineKeyword, setCuisineKeyword] = useState(initialFilters.cuisineKeyword)
  const [hideClosed, setHideClosed] = useState(initialFilters.hideClosed)

  const isNearby = source === 'nearby'
  const canSearch = !isSearching && (isNearby ? location !== null : savedCount > 0)

  function handleSubmit(event) {
    event.preventDefault()
    if (!canSearch) return
    onSearch({ playStyle, source, location, maxDistanceKm, cuisineKeyword, hideClosed })
  }

  const submitLabel = isSearching
    ? 'Finding yummy places…'
    : playStyle === 'swipe'
      ? 'Start swiping 💘'
      : 'Spin the wheel 🎡'

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
      {/* 1. How to decide */}
      <section>
        <h2 className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wider text-plum/50">
          How do you want to decide?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {PLAY_STYLES.map((style) => {
            const isSelected = playStyle === style.id
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setPlayStyle(style.id)}
                aria-pressed={isSelected}
                className={`rounded-3xl p-4 text-left transition active:scale-95 ${
                  isSelected
                    ? 'bg-candy-pink text-white shadow-lg shadow-candy-pink/30'
                    : 'bg-white text-plum shadow-sm ring-1 ring-candy-pink-soft'
                }`}
              >
                <span className="block text-3xl">{style.emoji}</span>
                <span className="mt-1 block text-lg font-black">{style.label}</span>
                <span className={`block text-xs font-semibold ${isSelected ? 'text-white/85' : 'text-plum/55'}`}>
                  {style.hint}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 2. Where and what */}
      <div className="flex flex-col gap-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-candy-pink-soft">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-cream p-1 ring-1 ring-candy-pink-soft">
          {[
            { id: 'nearby', label: '📍 Nearby' },
            { id: 'saved', label: `💖 My list (${savedCount})` },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSource(option.id)}
              className={`rounded-full py-2 text-sm font-extrabold transition ${
                source === option.id ? 'bg-white text-candy-pink shadow-sm' : 'text-plum/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isNearby ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="font-extrabold text-plum">Where?</span>
              <LocationPicker value={location} onChange={setLocation} />
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-extrabold text-plum">
                Max distance: <span className="text-candy-pink">{maxDistanceKm} km</span>
              </span>
              {/* Capped at 10 km: bigger circles = thousands of results = slow free server */}
              <input
                type="range"
                min="1"
                max="10"
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="accent-candy-pink"
              />
            </label>
          </>
        ) : (
          <p className="rounded-2xl bg-candy-pink-soft/60 p-3 text-sm font-semibold text-plum/80">
            {savedCount > 0
              ? `We'll use your ${savedCount} saved cafes. Add a craving below to narrow it down.`
              : 'Your list is empty. Add cafes in the "My Cafes" tab first.'}
          </p>
        )}

        <label className="flex flex-col gap-2">
          <span className="font-extrabold text-plum">Craving (optional)</span>
          <input
            type="text"
            placeholder="e.g. mamak, nasi lemak, bubble tea"
            value={cuisineKeyword}
            onChange={(e) => setCuisineKeyword(e.target.value)}
            className={inputClass}
          />
          <span className="px-1 text-xs text-plum/50">Separate with commas. Matches any of them.</span>
        </label>

        {isNearby && (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={hideClosed}
              onChange={(e) => setHideClosed(e.target.checked)}
              className="h-5 w-5 accent-candy-pink"
            />
            <span>
              <span className="font-extrabold text-plum">Hide places closed now</span>
              <span className="block text-xs text-plum/50">Only ~1 in 5 places list their hours. Unknown ones stay.</span>
            </span>
          </label>
        )}
      </div>

      {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={!canSearch}
        className="mt-auto rounded-full bg-candy-pink py-4 text-lg font-black text-white shadow-lg shadow-candy-pink/30 transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
      >
        {submitLabel}
      </button>

      {hiddenCount > 0 && (
        <button type="button" onClick={onUnhideAll} className="-mt-2 text-xs font-bold text-plum/45 hover:text-candy-pink">
          🙈 {hiddenCount} hidden place{hiddenCount === 1 ? '' : 's'} · Show them again
        </button>
      )}
    </form>
  )
}
