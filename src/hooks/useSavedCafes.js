import { useEffect, useState } from 'react'

// A "custom hook" is just a function whose name starts with `use` and that
// uses other hooks inside. It packages state + logic so components stay simple:
//   const { cafes, addCafes, removeCafe } = useSavedCafes()

const STORAGE_KEY = 'makan-picker:saved-cafes'

/**
 * localStorage only stores STRINGS, so we JSON.parse on the way out.
 * try/catch because storage can be blocked (private mode) or hold broken data.
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Pulls the first URL out of pasted text. XHS "share" copies text like:
 *   "Best cafe in Cheras! http://xhslink.com/a/AbC123 复制本条信息..."
 * so the user can paste the whole thing and we keep just the link.
 */
export function extractLink(text) {
  const match = text.match(/https?:\/\/\S+/)
  return match ? match[0] : null
}

/** @returns {import('../models').Platform | null} */
export function detectPlatform(link) {
  if (!link) return null
  if (/instagram\.com/i.test(link)) return 'instagram'
  if (/xhslink\.com|xiaohongshu\.com/i.test(link)) return 'xhs'
  return 'other'
}

// crypto.randomUUID() would be nicer, but browsers only allow it on https or
// localhost — it would crash when you test on your phone over http.
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function useSavedCafes() {
  // Passing a FUNCTION (not loadFromStorage()) = only read storage on first render.
  const [cafes, setCafes] = useState(loadFromStorage)

  // Runs after every change to `cafes`: write the whole list back to storage.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cafes))
    } catch {
      // Storage full or blocked — the list still works until the page closes.
    }
  }, [cafes])

  /**
   * Add one or many cafes. Skips blanks and names already in the list.
   * @param {Array<{ name: string, linkText?: string }>} entries
   * @returns {number} how many were actually added
   */
  function addCafes(entries) {
    const existing = new Set(cafes.map((c) => c.name.toLowerCase()))
    const newCafes = []

    for (const entry of entries) {
      const name = entry.name.trim()
      const key = name.toLowerCase()
      if (!name || existing.has(key)) continue

      const link = extractLink(entry.linkText ?? '')
      newCafes.push({ id: makeId(), name, link, platform: detectPlatform(link), addedAt: Date.now() })
      existing.add(key) // also catches duplicates inside one bulk paste
    }

    if (newCafes.length > 0) {
      setCafes((prev) => [...newCafes, ...prev]) // newest on top
    }
    return newCafes.length
  }

  function removeCafe(id) {
    setCafes((prev) => prev.filter((c) => c.id !== id))
  }

  return { cafes, addCafes, removeCafe }
}
