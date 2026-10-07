import { expect, it } from 'vitest'
import { addOpenStatus, malaysiaWallTime } from './openingHours'

it('evaluates schedules in Malaysia time regardless of browser time zone', async () => {
  // Wednesday 02:30 UTC is 10:30 in Malaysia.
  const now = new Date('2026-10-07T02:30:00Z')
  const local = malaysiaWallTime(now)
  expect(local.getHours()).toBe(10)
  expect(local.getDay()).toBe(3)
  const [place] = await addOpenStatus([{ openingHours: 'We 10:00-11:00' }], now)
  expect(place.openStatus).toBe('open')
})
it('handles the Malaysia date rollover', async () => {
  const [place] = await addOpenStatus([{ openingHours: 'Th 00:00-02:00' }], new Date('2026-10-07T17:00:00Z'))
  expect(place.openStatus).toBe('open')
})
it('keeps missing, invalid and unsupported holiday schedules unknown', async () => {
  const places = await addOpenStatus([{ openingHours: null }, { openingHours: 'garbage' }, { openingHours: 'Mo-Su 10:00-22:00; PH off' }])
  expect(places.map(p => p.openStatus)).toEqual(['unknown', 'unknown', 'unknown'])
})
