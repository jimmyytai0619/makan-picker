import { useState } from 'react'

const PLATFORM_LABELS = {
  instagram: '📸 Instagram',
  xhs: '📕 XHS',
  other: '🔗 Link',
}

const inputClass =
  'rounded-2xl border-0 bg-cream px-4 py-3 font-semibold text-plum ring-1 ring-candy-pink-soft ' +
  'placeholder:font-normal placeholder:text-plum/40 focus:outline-none focus:ring-2 focus:ring-candy-pink'
const pill = 'rounded-full px-2.5 py-1 text-xs font-extrabold transition active:scale-95'

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
    setMessage(added ? `Added "${name.trim()}" 💖` : 'Already in your list (or name is empty).')
    if (added) {
      setName('')
      setLinkText('')
    }
  }

  function handleAddBulk() {
    // One cafe per line. split('\n') breaks the text at every new line.
    const entries = bulkText.split('\n').map((line) => ({ name: line }))
    const added = onAdd(entries)
    setMessage(`Added ${added} cafe${added === 1 ? '' : 's'} 💖`)
    setBulkText('')
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* --- Add one --- */}
      <form
        onSubmit={handleAddOne}
        className="flex flex-col gap-3 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-candy-pink-soft"
      >
        <h2 className="text-lg font-black text-plum">Add a cafe 🍰</h2>
        <input
          type="text"
          placeholder="Cafe name, e.g. Brew & Boulder"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="IG / XHS link or share text (optional)"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-full bg-candy-pink py-3 font-black text-white shadow-lg shadow-candy-pink/30 transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          Save cafe
        </button>

        {/* <details> is a built-in HTML show/hide box — no React state needed */}
        <details className="text-sm">
          <summary className="cursor-pointer font-bold text-candy-pink">Paste many at once</summary>
          <textarea
            rows={5}
            placeholder={'One cafe per line:\nMixue Taman Connaught\nBrew & Boulder\nKopi Hutan'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className={`mt-2 w-full ${inputClass}`}
          />
          <button
            type="button"
            onClick={handleAddBulk}
            disabled={!bulkText.trim()}
            className="mt-2 w-full rounded-full bg-plum py-3 font-black text-white transition active:scale-95 disabled:opacity-40"
          >
            Add all
          </button>
        </details>

        {message && <p className="text-sm font-semibold text-plum/70">{message}</p>}
      </form>

      {/* --- The list --- */}
      <div className="flex flex-col gap-3 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-candy-pink-soft">
        <input
          type="search"
          placeholder={`Search ${cafes.length} saved cafes…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />

        {visibleCafes.length === 0 ? (
          <p className="py-4 text-center text-sm font-semibold text-plum/50">
            {cafes.length === 0 ? 'No cafes yet. Add your first one above! 🥺' : 'No match.'}
          </p>
        ) : (
          <ul className="divide-y divide-candy-pink-soft">
            {visibleCafes.map((cafe) => (
              <li key={cafe.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-plum">{cafe.name}</p>
                  <div className="mt-1 flex gap-2">
                    {cafe.link && (
                      <a href={cafe.link} target="_blank" rel="noreferrer" className={`${pill} bg-candy-lilac text-violet-900`}>
                        {PLATFORM_LABELS[cafe.platform]} ↗
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`${pill} bg-candy-pink-soft text-candy-pink`}
                    >
                      🗺️ Map ↗
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(cafe.id)}
                  aria-label={`Remove ${cafe.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-plum/40 transition hover:bg-candy-pink-soft hover:text-candy-pink"
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
