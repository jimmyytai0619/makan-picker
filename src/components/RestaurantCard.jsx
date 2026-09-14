import { formatPriceLevel } from '../models'
import { usePlaceAddress } from '../hooks/usePlaceAddress'
import { googleMapsPlaceUrl, phoneLink, safeWebsiteUrl } from '../utils/address'
import { categoryStyle } from '../data/categories'
import { formatDistance } from '../utils/format'

const PLATFORM_LABELS = { instagram: 'Instagram', xhs: 'XHS', other: 'saved' }

const chip = 'rounded-full px-3 py-1 text-xs font-extrabold'
const linkPill = 'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold transition active:scale-95'

/**
 * Shows one place: a big emoji on a pastel background, the name, where it is,
 * little info chips and link pills. Every field except name can be missing.
 *
 * @param {{ restaurant: import('../models').Restaurant }} props
 */
export default function RestaurantCard({ restaurant }) {
  const {
    name,
    category,
    cuisine,
    photoUrl,
    rating,
    distanceInKm,
    priceLevel,
    openingHours,
    openStatus,
    isSaved,
    sourceUrl,
    savedFrom,
    phone,
    website,
  } = restaurant
  const style = categoryStyle(category)

  // Real address from OSM, or the nearest road looked up from the map point.
  const placeAddress = usePlaceAddress(restaurant)
  const callLink = phoneLink(phone)
  const websiteLink = safeWebsiteUrl(website)

  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-candy-pink/15 ring-1 ring-candy-pink-soft">
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="aspect-video w-full bg-gray-200 object-cover" />
      ) : (
        <div className={`relative flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br ${style.bg}`}>
          <span className="animate-float text-8xl drop-shadow-sm motion-reduce:animate-none" aria-hidden="true">
            {style.emoji}
          </span>
          <span className={`absolute bottom-3 left-3 ${chip} bg-white/80 text-plum/70`}>{style.label}</span>
          {isSaved && <span className={`absolute bottom-3 right-3 ${chip} bg-white/90 text-candy-pink`}>💖 In your list</span>}
        </div>
      )}

      <div className="space-y-3 p-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-black leading-tight text-plum">{name}</h2>
          {placeAddress.status === 'ready' && (
            <p className="text-sm font-semibold text-plum/60">
              📍 {placeAddress.isApproximate ? 'Near ' : ''}
              {placeAddress.text}
            </p>
          )}
          {placeAddress.status === 'loading' && <p className="text-sm font-semibold text-plum/35">📍 Finding address…</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {openStatus === 'open' && <span className={`${chip} bg-candy-mint text-emerald-800`}>🟢 Open now</span>}
          {openStatus === 'closed' && <span className={`${chip} bg-slate-100 text-slate-500`}>🌙 Closed now</span>}
          {/* `!= null` catches both null and undefined, but NOT 0 */}
          {distanceInKm != null && (
            <span className={`${chip} bg-candy-sky text-sky-900`}>🧭 {formatDistance(distanceInKm)}</span>
          )}
          {cuisine && <span className={`${chip} bg-candy-lilac text-violet-900`}>🍽️ {cuisine}</span>}
          {rating != null && <span className={`${chip} bg-candy-butter text-amber-900`}>⭐ {rating.toFixed(1)}</span>}
          {priceLevel != null && (
            <span className={`${chip} bg-candy-mint text-emerald-800`}>{formatPriceLevel(priceLevel)}</span>
          )}
        </div>

        {openingHours && <p className="text-xs font-semibold text-plum/45">🕒 {openingHours}</p>}

        {/* Link pills: Google has the photos and reviews that OpenStreetMap doesn't */}
        <div className="flex flex-wrap gap-2">
          <a
            href={googleMapsPlaceUrl(restaurant)}
            target="_blank"
            rel="noreferrer"
            className={`${linkPill} bg-candy-pink-soft text-candy-pink`}
          >
            📷 Photos & reviews
          </a>
          {callLink && (
            <a href={callLink} className={`${linkPill} bg-candy-mint text-emerald-800`}>
              📞 Call
            </a>
          )}
          {websiteLink && (
            <a href={websiteLink} target="_blank" rel="noreferrer" className={`${linkPill} bg-candy-sky text-sky-900`}>
              🌐 Website
            </a>
          )}
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noreferrer" className={`${linkPill} bg-candy-lilac text-violet-900`}>
              📌 My {PLATFORM_LABELS[savedFrom] ?? 'saved'} post
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
