import { formatPriceLevel } from '../models'

// OSM has no photos, so each category gets an emoji + colour instead.
const CATEGORY_STYLE = {
  cafe: { emoji: '☕', bg: 'from-amber-200 to-orange-300' },
  restaurant: { emoji: '🍛', bg: 'from-orange-200 to-red-300' },
  fast_food: { emoji: '🍔', bg: 'from-yellow-200 to-red-300' },
  ice_cream: { emoji: '🍦', bg: 'from-pink-200 to-rose-300' },
  food_court: { emoji: '🍜', bg: 'from-lime-200 to-green-300' },
  saved: { emoji: '❤️', bg: 'from-rose-200 to-pink-300' },
}

const PLATFORM_LABELS = { instagram: 'Instagram', xhs: 'XHS', other: 'link' }

/** 0.04 -> "40 m", 1.26 -> "1.3 km" */
function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

/**
 * Pure "display" component: gets a restaurant, draws it.
 * Every field except name can be null now, so each pill checks first.
 *
 * @param {{ restaurant: import('../models').Restaurant }} props
 */
export default function RestaurantCard({ restaurant }) {
  const { name, category, cuisine, photoUrl, rating, distanceInKm, priceLevel, openingHours, isSaved, sourceUrl, savedFrom } =
    restaurant
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.restaurant

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-lg">
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="aspect-video w-full bg-gray-200 object-cover" />
      ) : (
        <div className={`flex aspect-video w-full items-center justify-center bg-gradient-to-br text-7xl ${style.bg}`}>
          {style.emoji}
        </div>
      )}

      <div className="space-y-3 p-5">
        <h2 className="text-xl font-bold leading-tight">{name}</h2>

        <div className="flex flex-wrap gap-2 text-sm">
          {isSaved && (
            <span className="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-800">❤️ In your list</span>
          )}
          {/* `!= null` catches both null and undefined, but NOT 0 */}
          {distanceInKm != null && (
            <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
              📍 {formatDistance(distanceInKm)}
            </span>
          )}
          {cuisine && (
            <span className="rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-800">🍽️ {cuisine}</span>
          )}
          {rating != null && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800">
              ⭐ {rating.toFixed(1)}
            </span>
          )}
          {priceLevel != null && (
            <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
              {formatPriceLevel(priceLevel)}
            </span>
          )}
        </div>

        {openingHours && <p className="text-sm text-gray-500">🕒 {openingHours}</p>}

        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-block text-sm text-orange-600 underline">
            View your saved {PLATFORM_LABELS[savedFrom] ?? 'link'} post ↗
          </a>
        )}
      </div>
    </article>
  )
}
