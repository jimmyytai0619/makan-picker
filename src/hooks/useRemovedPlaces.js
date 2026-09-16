import { useState } from 'react'
import { reportClosed, withdrawReport } from '../services/removed'
import { withEntry, withoutId } from '../utils/removedList'

// Places removed because they closed down (the free map rarely knows).
//
// The list is PER PHONE: removing a place hides it on this phone only. It used to
// hide the place for everyone, but then one person could wipe out places for all
// users on purpose. Your own list is kept in localStorage, so it survives closing
// the app.
//
// A removal is also REPORTED to our server (only the place's id, name and type —
// nothing about you). Nobody else's app is changed by it; the reports just show
// which places people say have closed.
const LOCAL_KEY = 'makan-picker:removed-places'

function loadLocal() {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function saveLocal(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  } catch {
    // storage blocked — the list still works until the page closes
  }
}

export function useRemovedPlaces() {
  const [removed, setRemoved] = useState(loadLocal)

  /** Hide a closed place on this phone. */
  function removePlace(place) {
    const entry = { id: place.id, name: place.name, category: place.category, removedAt: Date.now() }
    setRemoved((prev) => withEntry(prev, entry))
    saveLocal(withEntry(loadLocal(), entry))
    // Fire and forget: if the report fails, your own list still hides the place.
    reportClosed(entry).catch(() => {})
  }

  /** Bring a place back (e.g. you removed it by mistake). */
  function restorePlace(id) {
    setRemoved((prev) => withoutId(prev, id))
    saveLocal(withoutId(loadLocal(), id))
    withdrawReport(id).catch(() => {})
  }

  return { removed, removePlace, restorePlace }
}
