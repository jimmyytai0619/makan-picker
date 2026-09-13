import { useState } from 'react'
import LocationPicker from '../components/LocationPicker'
import { MOODS } from '../data/moods'

/**
 * @param {{
 *   initialFilters: import('../models').SearchFilters,
 *   savedCount: number,
 *   isSearching: boolean,
 *   error: string | null,
 *   onSearch: (f: import('../models').SearchFilters) => void,
 * }} props
 */
export default function FilterScreen({ initialFilters, savedCount, isSearching, error, onSearch }) {
  const [source, setSource] = useState(initialFilters.source)
  const [location, setLocation] = useState(initialFilters.location)
  const [maxDistanceKm, setMaxDistanceKm] = useState(initialFilters.maxDistanceKm)
  const [moodId, setMoodId] = useState(initialFilters.moodId)
  const [cuisineKeyword, setCuisineKeyword] = useState(initialFilters.cuisineKeyword)
  const [hideClosed, setHideClosed] = useState(initialFilters.hideClosed)

  const isNearby = source === 'nearby'
  const canSearch = !isSearching && (isNearby ? location !== null : savedCount > 0)

  function handlePickMood(mood) {
    setMoodId(mood.id)
    setCuisineKeyword(mood.keyword) // fills the box; user can still edit it
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!canSearch) return
    onSearch({ source, location, maxDistanceKm, moodId, cuisineKeyword, hideClosed })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 rounded-3xl bg-white p-6 shadow">
      {/* Source switch: two buttons that act like tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
        {[
          { id: 'nearby', label: '📍 Nearby' },
          { id: 'saved', label: `❤️ My list (${savedCount})` },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSource(option.id)}
            className={`rounded-lg py-2 font-semibold ${
              source === option.id ? 'bg-white shadow' : 'text-gray-500'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isNearby ? (
        <>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Where?</span>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-semibold">Mood</span>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handlePickMood(mood)}
                  className={`rounded-full px-3 py-2 text-sm font-medium ${
                    moodId === mood.id ? 'bg-orange-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  {mood.emoji} {mood.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-semibold">Max distance: {maxDistanceKm} km</span>
            {/* Capped at 10 km: bigger circles = thousands of results = slow free server */}
            <input
              type="range"
              min="1"
              max="10"
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
              className="accent-orange-500"
            />
          </label>
        </>
      ) : (
        <p className="rounded-xl bg-orange-50 p-3 text-sm">
          {savedCount > 0
            ? `We'll shuffle your ${savedCount} saved cafes. Add a craving below to narrow it down.`
            : 'Your list is empty. Add cafes in the "My Cafes" tab first.'}
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="font-semibold">Craving (optional)</span>
        <input
          type="text"
          placeholder="e.g. mamak, nasi lemak, coffee"
          value={cuisineKeyword}
          onChange={(e) => setCuisineKeyword(e.target.value)}
          className="rounded-xl border border-gray-300 p-3"
        />
        <span className="text-xs text-gray-500">Separate with commas — matches any of them.</span>
      </label>

      {isNearby && (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={hideClosed}
            onChange={(e) => setHideClosed(e.target.checked)}
            className="h-5 w-5 accent-orange-500"
          />
          <span>
            <span className="font-semibold">Hide places closed now</span>
            <span className="block text-xs text-gray-500">Only ~1 in 5 places list their hours. Unknown ones stay.</span>
          </span>
        </label>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={!canSearch}
        className="mt-auto rounded-xl bg-orange-500 py-4 text-lg font-semibold text-white disabled:opacity-40"
      >
        {isSearching ? 'Searching the map…' : 'Find food 🔍'}
      </button>
    </form>
  )
}
