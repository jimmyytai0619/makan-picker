import PlaceRow from '../components/PlaceRow'

/**
 * "Your picks": every place you swiped right on.
 * Tap one to go there, or let the wheel choose between them.
 *
 * @param {{
 *   picks: import('../models').Restaurant[],
 *   remainingCount: number,
 *   onOpen: (place: import('../models').Restaurant) => void,
 *   onRemove: (place: import('../models').Restaurant) => void,
 *   onSpin: () => void,
 *   onKeepSwiping: () => void,
 *   onStartOver: () => void,
 * }} props
 */
export default function PicksScreen({ picks, remainingCount, onOpen, onRemove, onSpin, onKeepSwiping, onStartOver }) {
  const count = picks.length

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-black text-plum">Your picks 💖</h2>
        <p className="text-sm text-plum/60">
          {count === 0
            ? 'Nothing yet. Go swipe some more!'
            : `You liked ${count} place${count === 1 ? '' : 's'}. Tap one to go!`}
        </p>
      </div>

      {count === 0 ? (
        <div className="flex flex-1 items-center justify-center text-7xl" aria-hidden="true">
          🥺
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {picks.map((place) => (
            <PlaceRow key={place.id} place={place} onOpen={onOpen} onRemove={onRemove} />
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-2">
        {count >= 2 && (
          <button
            onClick={onSpin}
            className="rounded-full bg-candy-pink py-4 text-lg font-extrabold text-white shadow-lg shadow-candy-pink/30 transition active:scale-95"
          >
            🎡 Can't choose? Spin my picks
          </button>
        )}
        {remainingCount > 0 && (
          <button
            onClick={onKeepSwiping}
            className="rounded-full bg-white py-3 font-bold text-plum shadow-sm ring-1 ring-candy-pink-soft transition active:scale-95"
          >
            👆 Keep swiping ({remainingCount} left)
          </button>
        )}
        <button onClick={onStartOver} className="py-2 text-sm font-bold text-plum/50">
          ↺ Start over
        </button>
      </div>
    </div>
  )
}
