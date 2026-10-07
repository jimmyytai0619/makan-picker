import { useEffect, useState } from 'react'
import { readStored, writeStored, validPlaces, rememberWinner } from '../utils/preferences'

export function usePlaceLibrary() {
  const [favourites, setFavourites] = useState(() => validPlaces(readStored('favourites', [])))
  const [recent, setRecent] = useState(() => validPlaces(readStored('recent-winners', [])).slice(0, 20))
  useEffect(() => writeStored('favourites', favourites), [favourites])
  useEffect(() => writeStored('recent-winners', recent), [recent])
  function toggleFavourite(place) {
    setFavourites(prev => prev.some(p => p.id === place.id) ? prev.filter(p => p.id !== place.id) : [place, ...prev])
  }
  function saveFavourite(place) { setFavourites(prev => prev.some(p => p.id === place.id) ? prev : [place, ...prev]) }
  function removeFavourite(id) { setFavourites(prev => prev.filter(p => p.id !== id)) }
  function recordWinner(place) { setRecent(prev => rememberWinner(prev, place)) }
  return { favourites, recent, toggleFavourite, saveFavourite, removeFavourite, recordWinner, clearRecent: () => setRecent([]) }
}
