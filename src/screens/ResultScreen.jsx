import RestaurantCard from '../components/RestaurantCard'
import Confetti from '../components/Confetti'

/**
 * The winner! With directions in Google Maps or Waze.
 *
 * @param {{
 *   restaurant: import('../models').Restaurant | null,
 *   onBack?: () => void,
 *   onStartOver: () => void,
 * }} props
 */
export default function ResultScreen({ restaurant, onBack, onStartOver }) {
  if (!restaurant) return null // safety net; shouldn't happen in normal flow

  const hasCoords = restaurant.lat != null && restaurant.lng != null

  // Plain links, no API needed. With coordinates we point at the exact spot
  // (many places share names); saved cafes only have a name, so we search it.
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}`
  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${restaurant.lat},${restaurant.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(restaurant.name)}`

  return (
    <div className="relative flex flex-1 flex-col gap-5">
      <Confetti />

      {onBack && (
        <button
          onClick={onBack}
          className="self-start rounded-full bg-white px-4 py-2 text-sm font-extrabold text-plum shadow-sm ring-1 ring-candy-pink-soft"
        >
          ← Back
        </button>
      )}

      <p className="animate-pop text-center text-2xl font-black text-plum">Today you're eating at… 🎉</p>

      <RestaurantCard restaurant={restaurant} />

      <div className="mt-auto flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-candy-pink py-4 text-center font-black text-white shadow-lg shadow-candy-pink/30 transition active:scale-95"
          >
            🗺️ Google Maps
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-candy-blue py-4 text-center font-black text-white shadow-lg shadow-candy-blue/30 transition active:scale-95"
          >
            🚗 Waze
          </a>
        </div>
        <button
          onClick={onStartOver}
          className="rounded-full bg-white py-3 font-extrabold text-plum shadow-sm ring-1 ring-candy-pink-soft transition active:scale-95"
        >
          ↺ Start over
        </button>
      </div>
    </div>
  )
}
