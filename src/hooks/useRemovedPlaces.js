import { useEffect, useState } from 'react'
import { fetchRemoved, reportRemoved, restoreRemovedPlace } from '../services/removed'

// Places removed because they closed down (the free map rarely knows).
//   - Shared mode: the list lives on our server, so a removal is for EVERYONE.
//   - Phone-only mode: if the shared list isn't set up (or can't be reached),
//     the list is kept on this phone in localStorage, so the app still works.
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
  const [isShared, setIsShared] = useState(false)

  // Once, when the app opens: load the shared list. If it fails, stay phone-only.
  useEffect(() => {
    let cancelled = false
    fetchRemoved()
      .then((list) => {
        if (cancelled) return
        setRemoved(list)
        setIsShared(true)
      })
      .catch(() => {}) // not set up / offline -> keep the phone-only list
    return () => {
      cancelled = true
    }
  }, [])

  // Phone-only mode: remember the list on this phone.
  useEffect(() => {
    if (!isShared) saveLocal(removed)
  }, [removed, isShared])

  /** Remove a closed place (for everyone in shared mode). */
  function removePlace(place) {
    const entry = { id: place.id, name: place.name, category: place.category, removedAt: Date.now() }
    // "Optimistic update": hide it on screen straight away, then tell the server.
    setRemoved((prev) => (prev.some((e) => e.id === entry.id) ? prev : [entry, ...prev]))
    if (isShared) reportRemoved(entry).catch(() => {}) // still hidden here if the server fails
  }

  /** Bring a place back (e.g. someone removed it by mistake). */
  function restorePlace(id) {
    setRemoved((prev) => prev.filter((e) => e.id !== id))
    if (isShared) restoreRemovedPlace(id).catch(() => {})
  }

  return { removed, isShared, removePlace, restorePlace }
}
