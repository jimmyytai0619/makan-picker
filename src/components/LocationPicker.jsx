import { useState } from 'react'
import { geocode } from '../services/osm'
import { getCurrentPosition } from '../utils/geo'

/**
 * Lets the user choose WHERE to search: type an area, or use GPS.
 * It owns its own temporary state (what's typed, the result list, loading)
 * and only tells the parent the final answer through onChange().
 *
 * @param {{
 *   value: import('../models').ChosenLocation | null,
 *   onChange: (location: import('../models').ChosenLocation | null) => void,
 * }} props
 */
export default function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // `async` lets us use `await`: "wait for this Promise, then continue".
  async function handleSearch() {
    if (!query.trim() || isLoading) return
    setIsLoading(true) // disables the button = also respects the 1 request/second rule
    setError(null)
    try {
      const found = await geocode(query)
      setResults(found)
      if (found.length === 0) setError('No place found. Try a bigger area name, e.g. "Cheras".')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false) // `finally` runs whether it worked or failed
    }
  }

  async function handleUseGps() {
    setIsLoading(true)
    setError(null)
    try {
      const position = await getCurrentPosition()
      onChange({ ...position, label: 'My current location' })
      setResults([])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handlePick(location) {
    onChange(location)
    setResults([])
    setQuery('')
  }

  // --- A location is already chosen: show it with a "Change" button ---
  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-candy-pink-soft/60 p-3">
        <span className="font-bold text-plum">📍 {value.label}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-candy-pink shadow-sm"
        >
          Change
        </button>
      </div>
    )
  }

  // --- No location yet: search box + GPS button ---
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. Cheras, SS15, Mid Valley"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Enter key searches — but must NOT submit the whole filter form.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch()
            }
          }}
          className="min-w-0 flex-1 rounded-2xl border-0 bg-cream px-4 py-3 font-semibold text-plum ring-1 ring-candy-pink-soft placeholder:font-normal placeholder:text-plum/40 focus:outline-none focus:ring-2 focus:ring-candy-pink"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="rounded-2xl bg-plum px-4 font-extrabold text-white transition active:scale-95 disabled:opacity-40"
        >
          {isLoading ? '…' : 'Search'}
        </button>
      </div>

      <button
        type="button"
        onClick={handleUseGps}
        disabled={isLoading}
        className="self-start rounded-full bg-candy-mint px-3 py-1.5 text-xs font-extrabold text-emerald-800 transition active:scale-95 disabled:opacity-40"
      >
        📍 Use my current location
      </button>

      {error && <p className="text-sm font-semibold text-rose-500">{error}</p>}

      {results.length > 0 && (
        <ul className="divide-y divide-candy-pink-soft overflow-hidden rounded-2xl bg-white ring-1 ring-candy-pink-soft">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="w-full px-4 py-3 text-left font-semibold text-plum hover:bg-candy-pink-soft/60"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
