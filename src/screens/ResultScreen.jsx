import RestaurantCard from '../components/RestaurantCard'

/**
 * @param {{
 *   restaurant: import('../models').Restaurant | null,
 *   onStartOver: () => void,
 * }} props
 */
export default function ResultScreen({ restaurant, onStartOver }) {
  if (!restaurant) return null // safety net; shouldn't happen in normal flow

  // Plain link, no API needed: opens Google Maps searching for the name.
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}`

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-center text-lg font-semibold">Today you're eating at… 🎉</p>

      <RestaurantCard restaurant={restaurant} />

      <div className="mt-auto flex flex-col gap-3">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-orange-500 py-4 text-center text-lg font-semibold text-white"
        >
          Open in Google Maps 🗺️
        </a>
        <button onClick={onStartOver} className="rounded-xl bg-white py-4 text-lg font-semibold shadow">
          Start over
        </button>
      </div>
    </div>
  )
}
