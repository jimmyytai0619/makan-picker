import { useState } from 'react'

const BUDGET_OPTIONS = [
  { max: 1, label: 'RM — cheap eats' },
  { max: 2, label: 'RM RM — normal' },
  { max: 3, label: 'RM RM RM — treat myself' },
  { max: 4, label: 'RM RM RM RM — anything' },
]

/**
 * A "controlled form": every input's value lives in React state,
 * and every keystroke updates that state.
 *
 * @param {{
 *   initialFilters: import('../models').SearchFilters,
 *   onSearch: (f: import('../models').SearchFilters) => void,
 * }} props
 */
export default function FilterScreen({ initialFilters, onSearch }) {
  const [maxDistanceKm, setMaxDistanceKm] = useState(initialFilters.maxDistanceKm)
  const [budgetMax, setBudgetMax] = useState(initialFilters.budgetRange.max)
  const [cuisineKeyword, setCuisineKeyword] = useState(initialFilters.cuisineKeyword)

  function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    onSearch({
      userLocation: initialFilters.userLocation, // fixed to Cheras in Phase 1
      maxDistanceKm,
      budgetRange: { min: 1, max: budgetMax },
      cuisineKeyword,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 rounded-3xl bg-white p-6 shadow">
      <p className="text-sm text-gray-500">📍 Using: Cheras (mock location)</p>

      <label className="flex flex-col gap-2">
        <span className="font-semibold">Max distance: {maxDistanceKm} km</span>
        <input
          type="range"
          min="1"
          max="20"
          value={maxDistanceKm}
          onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
          className="accent-orange-500"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-semibold">Budget</span>
        <select
          value={budgetMax}
          onChange={(e) => setBudgetMax(Number(e.target.value))}
          className="rounded-xl border border-gray-300 p-3"
        >
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt.max} value={opt.max}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-semibold">Craving (optional)</span>
        <input
          type="text"
          placeholder="e.g. mamak, cafe, mixue"
          value={cuisineKeyword}
          onChange={(e) => setCuisineKeyword(e.target.value)}
          className="rounded-xl border border-gray-300 p-3"
        />
      </label>

      <button type="submit" className="mt-auto rounded-xl bg-orange-500 py-4 text-lg font-semibold text-white">
        Find food 🔍
      </button>
    </form>
  )
}
