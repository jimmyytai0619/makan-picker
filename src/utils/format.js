/** 0.04 -> "40 m", 1.26 -> "1.3 km" */
export function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}
