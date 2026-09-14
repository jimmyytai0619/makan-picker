import { useEffect, useState } from 'react'
import { reverseGeocode } from '../services/osm'

// Wait this long before looking up an address, so swiping quickly past cards
// doesn't send a request for every card. (The free server allows ~1 per second.)
const LOOKUP_DELAY_MS = 500

/**
 * The address line for a place card.
 *   - OpenStreetMap has the address -> show it straight away (no request)
 *   - only a map point             -> look up the nearest road ("Near …")
 *   - no map point (saved cafes)   -> nothing to show
 *
 * @param {import('../models').Restaurant} place
 * @returns {{ status: 'ready', text: string, isApproximate: boolean } | { status: 'loading' } | { status: 'none' }}
 */
export function usePlaceAddress(place) {
  const { address, lat, lng } = place
  const key = lat != null && lng != null ? `${lat},${lng}` : null
  const needsLookup = !address && key !== null

  // Remember WHICH place the answer belongs to, so a slow answer for the
  // previous card can never show up on the current one.
  const [lookup, setLookup] = useState({ key: null, text: null })

  useEffect(() => {
    if (!needsLookup) return undefined

    let cancelled = false
    const timer = setTimeout(async () => {
      const text = await reverseGeocode(lat, lng) // never throws; null if it fails
      if (!cancelled) setLookup({ key, text })
    }, LOOKUP_DELAY_MS)

    // Cleanup: the card changed or closed before we got an answer -> ignore it.
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [needsLookup, key, lat, lng])

  if (address) return { status: 'ready', text: address, isApproximate: false }
  if (!needsLookup) return { status: 'none' }
  if (lookup.key !== key) return { status: 'loading' }
  return lookup.text ? { status: 'ready', text: lookup.text, isApproximate: true } : { status: 'none' }
}
