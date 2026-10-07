import { DEFAULT_FILTERS } from '../models'

export function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(`makan-picker:${key}`)) ?? fallback } catch { return fallback }
}
export function writeStored(key, value) {
  try { localStorage.setItem(`makan-picker:${key}`, JSON.stringify(value)) } catch { /* Session still works. */ }
}
export function validPlaces(value) {
  return Array.isArray(value) ? value.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string') : []
}
export function cleanFilters(value) {
  const f = value && typeof value === 'object' ? value : {}
  const location = f.location
  return {
    ...DEFAULT_FILTERS,
    playStyle: f.playStyle === 'roulette' ? 'roulette' : 'swipe',
    source: f.source === 'saved' ? 'saved' : 'nearby',
    location: location && Number.isFinite(location.lat) && Math.abs(location.lat) <= 90 && Number.isFinite(location.lng) && Math.abs(location.lng) <= 180 && typeof location.label === 'string' ? { lat: location.lat, lng: location.lng, label: location.label, ...(typeof location.locationType === 'string' ? { locationType: location.locationType } : {}) } : null,
    maxDistanceKm: Number.isInteger(f.maxDistanceKm) && f.maxDistanceKm >= 1 && f.maxDistanceKm <= 10 ? f.maxDistanceKm : 3,
    cuisineKeyword: typeof f.cuisineKeyword === 'string' ? f.cuisineKeyword : '',
    hideClosed: f.hideClosed === true,
    avoidRecent: f.avoidRecent === true,
  }
}
export function rememberWinner(history, place, now = Date.now()) {
  return [{ ...place, wonAt: now }, ...history.filter(p => p.id !== place.id)].slice(0, 20)
}
export function loadPreviousSearch() {
  const value = readStored('previous-search', null)
  if (!value || !Number.isFinite(value.updatedAt) || value.filters?.source !== 'nearby') return null
  const filters = cleanFilters(value.filters)
  const places = validPlaces(value.places).slice(0, 300)
  return filters.location && places.length > 0 ? { filters, places, updatedAt: value.updatedAt } : null
}
