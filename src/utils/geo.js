/**
 * Straight-line ("as the crow flies") distance between two points, in km.
 * This is the Haversine formula — it accounts for the Earth being round.
 * Real driving distance is usually longer; that needs a routing API.
 *
 * @param {import('../models').LatLng} a
 * @param {import('../models').LatLng} b
 */
export function distanceInKm(a, b) {
  const EARTH_RADIUS_KM = 6371
  const toRadians = (degrees) => (degrees * Math.PI) / 180

  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/**
 * Asks the phone/laptop for its GPS position.
 *
 * The browser API uses old-style callbacks, so we wrap it in a Promise.
 * That lets callers write `const pos = await getCurrentPosition()`.
 *
 * @returns {Promise<import('../models').LatLng>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    // Browsers only allow GPS on https:// or localhost.
    // Your phone on http://192.168.x.x is NOT a "secure context".
    if (!window.isSecureContext) {
      reject(new Error('GPS only works on https or localhost. Type your area instead.'))
      return
    }
    if (!navigator.geolocation) {
      reject(new Error('This browser does not support GPS.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? 'Location permission was denied. Allow it in your browser settings, or type your area.'
              : 'Could not get your location. Try typing your area instead.',
          ),
        ),
      { timeout: 10000, maximumAge: 60000 },
    )
  })
}
