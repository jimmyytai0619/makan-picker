import { useEffect, useState } from 'react'

// Places the user doesn't want to see again — usually because they closed down.
// OpenStreetMap (our free data) almost never knows when a restaurant closes:
// near Bandar Tun Hussein Onn only 1 of 217 places had been re-checked. So the
// user can fix it for themselves. Saved per device in localStorage, like My Cafes.
const STORAGE_KEY = 'makan-picker:hidden-places'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const ids = raw ? JSON.parse(raw) : []
    return Array.isArray(ids) ? ids : []
  } catch {
    return [] // storage blocked (private mode) or broken data
  }
}

export function useHiddenPlaces() {
  // Passing a FUNCTION (not loadFromStorage()) = only read storage on first render.
  const [hiddenIds, setHiddenIds] = useState(loadFromStorage)

  // Runs after every change: write the list back to storage.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenIds))
    } catch {
      // Storage full or blocked — hiding still works until the page closes.
    }
  }, [hiddenIds])

  /** Never show this place again (on this device). */
  function hidePlace(id) {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  /** Oops — bring every hidden place back. */
  function unhideAll() {
    setHiddenIds([])
  }

  return { hiddenIds, hidePlace, unhideAll }
}
