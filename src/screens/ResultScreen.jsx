import RestaurantCard from '../components/RestaurantCard'

/**
 * @param {{
 *   restaurant: import('../models').Restaurant | null,
 *   onStartOver: () => void,
 * }} props
 */
export default function ResultScreen({ restaurant, onStartOver }) {
  if (!restaurant) return null // safety net; shouldn't happen in normal flow

  const hasCoords = restaurant.lat != null && restaurant.lng != null

  // Plain links, no API needed. With coordinates we point at the exact spot
  // (many places share names); saved cafes only have a name, so we search it.
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}`
  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${restaurant.lat},${restaurant.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(restaurant.name)}`

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-center text-lg font-semibold">Today you're eating at… 🎉</p>

      <RestaurantCard restaurant={restaurant} />

      <div className="mt-auto flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-orange-500 py-4 text-center font-semibold text-white"
          >
            Google Maps 🗺️
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-sky-500 py-4 text-center font-semibold text-white"
          >
            Waze 🚗
          </a>
        </div>
        <button onClick={onStartOver} className="rounded-xl bg-white py-4 text-lg font-semibold shadow">
          Start over
        </button>
      </div>
    </div>
  )
}
