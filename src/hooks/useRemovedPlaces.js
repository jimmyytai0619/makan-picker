import { useEffect, useState } from 'react'
import { withEntry, withoutId } from '../utils/removedList'
import { readStored, writeStored, validPlaces } from '../utils/preferences'

// Preserve this device's old removals, without fetching or changing shared data.
export function useRemovedPlaces() {
  const [removed, setRemoved] = useState(() => validPlaces(readStored('removed-places', [])))
  useEffect(() => writeStored('removed-places', removed), [removed])
  function removePlace(place) {
    const entry = { id: place.id, name: place.name, category: place.category, removedAt: Date.now() }
    setRemoved(prev => withEntry(prev, entry))
  }
  function restorePlace(id) { setRemoved(prev => withoutId(prev, id)) }
  return { removed, removePlace, restorePlace }
}
