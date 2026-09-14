import { usePlaceAddress } from '../hooks/usePlaceAddress'
import { categoryStyle } from '../data/categories'
import { formatDistance } from '../utils/format'

/**
 * One place in the "Your picks" list. Tap it to go there; ✕ removes it.
 *
 * @param {{
 *   place: import('../models').Restaurant,
 *   onOpen: (place: import('../models').Restaurant) => void,
 *   onRemove: (place: import('../models').Restaurant) => void,
 * }} props
 */
export default function PlaceRow({ place, onOpen, onRemove }) {
  const style = categoryStyle(place.category)
  const address = usePlaceAddress(place)

  const subtitle =
    address.status === 'ready' ? `${address.isApproximate ? 'Near ' : ''}${address.text}` : style.label

  return (
    <li className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-candy-pink-soft">
      <button type="button" onClick={() => onOpen(place)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl ${style.bg}`}
        >
          {style.emoji}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-extrabold text-plum">{place.name}</span>
          <span className="block truncate text-xs text-plum/60">{subtitle}</span>
          {place.distanceInKm != null && (
            <span className="mt-1 inline-block rounded-full bg-candy-sky px-2 py-0.5 text-xs font-bold text-plum/80">
              🧭 {formatDistance(place.distanceInKm)}
            </span>
          )}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onRemove(place)}
        aria-label={`Remove ${place.name}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-plum/40 transition hover:bg-candy-pink-soft hover:text-candy-pink"
      >
        ✕
      </button>
    </li>
  )
}
