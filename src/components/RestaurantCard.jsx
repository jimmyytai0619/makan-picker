import { formatPriceLevel } from '../models'

/**
 * Pure "display" component: gets a restaurant, draws it. No state, no logic.
 *
 * @param {{ restaurant: import('../models').Restaurant }} props
 */
export default function RestaurantCard({ restaurant }) {
  const { name, photoUrl, rating, distanceInKm, priceLevel } = restaurant

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-lg">
      <img
        src={photoUrl}
        alt={name}
        className="aspect-video w-full bg-gray-200 object-cover"
      />

      <div className="space-y-2 p-5">
        <h2 className="text-xl font-bold leading-tight">{name}</h2>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800">
            ⭐ {rating.toFixed(1)}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
            📍 {distanceInKm.toFixed(1)} km
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
            {formatPriceLevel(priceLevel)}
          </span>
        </div>
      </div>
    </article>
  )
}
