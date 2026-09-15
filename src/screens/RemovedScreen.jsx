import { categoryStyle } from '../data/categories'
import { formatTimeAgo } from '../utils/format'

/**
 * Every place someone removed because it closed down. Restore one if it was a mistake.
 *
 * @param {{
 *   removed: Array<{ id: string, name: string, category: string, removedAt: number }>,
 *   isShared: boolean,
 *   onRestore: (id: string) => void,
 *   onBack: () => void,
 * }} props
 */
export default function RemovedScreen({ removed, isShared, onRestore, onBack }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <button
        onClick={onBack}
        className="self-start rounded-full bg-white px-4 py-2 text-sm font-extrabold text-plum shadow-sm ring-1 ring-candy-pink-soft"
      >
        ← Back
      </button>

      <div className="text-center">
        <h2 className="text-2xl font-black text-plum">Removed places 🗑️</h2>
        <p className="text-sm text-plum/60">
          {isShared
            ? 'Removed for everyone because they closed down. Removed by mistake? Restore it.'
            : 'Removed on this phone only (the shared list is not set up yet).'}
        </p>
      </div>

      {removed.length === 0 ? (
        <p className="py-10 text-center font-semibold text-plum/50">Nothing removed yet ✨</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {removed.map((entry) => {
            const style = categoryStyle(entry.category)
            return (
              <li key={entry.id} className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-candy-pink-soft">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl opacity-60 ${style.bg}`}>
                  {style.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold text-plum/70 line-through decoration-candy-pink/50">
                    {entry.name}
                  </span>
                  <span className="block text-xs text-plum/45">Removed {formatTimeAgo(entry.removedAt)}</span>
                </span>
                <button
                  onClick={() => onRestore(entry.id)}
                  className="shrink-0 rounded-full bg-candy-mint px-3 py-1.5 text-xs font-extrabold text-emerald-800 transition active:scale-95"
                >
                  ↩️ Restore
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
