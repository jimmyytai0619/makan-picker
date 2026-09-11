import { useState } from 'react'

const PLATFORM_LABELS = {
  instagram: '📸 Instagram',
  xhs: '📕 XHS',
  other: '🔗 Link',
}

/**
 * "My Cafes": paste cafes you saved on Instagram / Xiaohongshu.
 *
 * @param {{
 *   cafes: import('../models').SavedCafe[],
 *   onAdd: (entries: Array<{ name: string, linkText?: string }>) => number,
 *   onRemove: (id: string) => void,
 * }} props
 */
export default function SavedScreen({ cafes, onAdd, onRemove }) {
  const [name, setName] = useState('')
  const [linkText, setLinkText] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState(null)

  // Derived: filter the list as you type. No need to store it.
  const visibleCafes = cafes.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))

  function handleAddOne(event) {
    event.preventDefault()
    const added = onAdd([{ name, linkText }])
    setMessage(added ? `Added "${name.trim()}" ✅` : 'Already in your list (or name is empty).')
    if (added) {
      setName('')
      setLinkText('')
    }
  }

  function handleAddBulk() {
    // One cafe per line. split('\n') breaks the text at every new line.
    const entries = bulkText.split('\n').map((line) => ({ name: line }))
    const added = onAdd(entries)
    setMessage(`Added ${added} cafe${added === 1 ? '' : 's'} ✅`)
    setBulkText('')
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* --- Add one --- */}
      <form onSubmit={handleAddOne} className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow">
        <h2 className="font-bold">Add a cafe</h2>
        <input
          type="text"
          placeholder="Cafe name, e.g. Brew & Boulder"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border border-gray-300 p-3"
        />
        <input
          type="text"
          placeholder="IG / XHS link or share text (optional)"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          className="rounded-xl border border-gray-300 p-3"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-xl bg-orange-500 py-3 font-semibold text-white disabled:opacity-40"
        >
          Save cafe
        </button>

        {/* <details> is a built-in HTML show/hide box — no React state needed */}
        <details className="text-sm">
          <summary className="cursor-pointer text-orange-600">Paste many at once</summary>
          <textarea
            rows={5}
            placeholder={'One cafe per line:\nMixue Taman Connaught\nBrew & Boulder\nKopi Hutan'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 p-3"
          />
          <button
            type="button"
            onClick={handleAddBulk}
            disabled={!bulkText.trim()}
            className="mt-2 w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-40"
          >
            Add all
          </button>
        </details>

        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>

      {/* --- The list --- */}
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow">
        <input
          type="search"
          placeholder={`Search ${cafes.length} saved cafes…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-gray-300 p-3"
        />

        {visibleCafes.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            {cafes.length === 0 ? 'No cafes yet. Add your first one above!' : 'No match.'}
          </p>
        ) : (
          <ul className="divide-y">
            {visibleCafes.map((cafe) => (
              <li key={cafe.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cafe.name}</p>
                  <div className="flex gap-3 text-xs">
                    {cafe.link && (
                      <a href={cafe.link} target="_blank" rel="noreferrer" className="text-orange-600 underline">
                        {PLATFORM_LABELS[cafe.platform]} ↗
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-500 underline"
                    >
                      Map ↗
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(cafe.id)}
                  aria-label={`Remove ${cafe.name}`}
                  className="rounded-full px-3 py-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
