import { useEffect, useState } from 'react'
import { addOpenStatus } from '../utils/openingHours'

// Recalculate from the schedule, rather than trusting a saved card's old badge.
export function useOpeningStatus(place) {
  const [status, setStatus] = useState(null)
  const hours = place.openingHours
  useEffect(() => {
    let cancelled = false
    async function refresh() {
      try {
        const [updated] = await addOpenStatus([{ openingHours: hours }])
        if (!cancelled) setStatus({ hours, value: updated.openStatus })
      } catch { if (!cancelled) setStatus({ hours, value: 'unknown' }) }
    }
    refresh()
    const timer = setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [hours])
  return status && status.hours === hours ? status.value : 'unknown'
}
