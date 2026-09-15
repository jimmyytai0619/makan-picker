import { useEffect, useState } from 'react'
import { fetchRemoved, reportRemoved, restoreRemovedPlace } from '../services/removed'
import { mergeRemoved, withEntry, withoutId } from '../utils/removedList'

// Places removed because they closed down (the free map rarely knows).
//   - Shared mode: the list lives on our server, so a removal is for EVERYONE.
//   - Phone-only mode: if the shared list isn't set up (or can't be reached),
//     the list is kept on this phone in localStorage, so the app still works.
//
// The phone's list is also an "outbox": a removal stays in it until the server
// has confirmed it. So removals made before the shared list existed, or while
// offline, are sent up the next time the app opens — instead of coming back.
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

/** Sends one removal to the server; once it's saved there, it leaves the phone's outbox. */
function upload(entry) {
  reportRemoved(entry)
    .then(() => saveLocal(withoutId(loadLocal(), entry.id)))
    .catch(() => {}) // still in the outbox -> tried again next time the app opens
}

export function useRemovedPlaces() {
  const [removed, setRemoved] = useState(loadLocal)
  const [isShared, setIsShared] = useState(false)

  // Once, when the app opens: load the shared list. If it fails, stay phone-only.
  useEffect(() => {
    let cancelled = false
    fetchRemoved()
      .then((shared) => {
        if (cancelled) return
        const onThisPhone = loadLocal()
        setRemoved(mergeRemoved(shared, onThisPhone))
        setIsShared(true)

        // Removals the server doesn't have yet: send them up now.
        const sharedIds = new Set(shared.map((e) => e.id))
        onThisPhone.filter((e) => !sharedIds.has(e.id)).forEach(upload)
        // The rest are already saved for everyone, so they can leave the outbox.
        saveLocal(onThisPhone.filter((e) => !sharedIds.has(e.id)))
      })
      .catch(() => {}) // not set up / offline -> keep the phone-only list
    return () => {
      cancelled = true
    }
  }, [])

  /** Remove a closed place (for everyone in shared mode). */
  function removePlace(place) {
    const entry = { id: place.id, name: place.name, category: place.category, removedAt: Date.now() }
    // "Optimistic update": hide it on screen straight away, then tell the server.
    setRemoved((prev) => withEntry(prev, entry))
    saveLocal(withEntry(loadLocal(), entry)) // kept on the phone until the server confirms
    if (isShared) upload(entry)
  }

  /** Bring a place back (e.g. someone removed it by mistake). */
  function restorePlace(id) {
    setRemoved((prev) => withoutId(prev, id))
    saveLocal(withoutId(loadLocal(), id))
    if (isShared) restoreRemovedPlace(id).catch(() => {})
  }

  return { removed, isShared, removePlace, restorePlace }
}
