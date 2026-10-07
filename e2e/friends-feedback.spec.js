import { test, expect } from '@playwright/test'

const elements = [
  { type: 'node', id: 1, lat: 3.1016, lon: 101.6852, tags: { name: 'Faber Cafe', amenity: 'cafe', 'addr:street': 'Jalan Desa Bahagia' } },
  { type: 'node', id: 2, lat: 3.102, lon: 101.686, tags: { name: 'Desa Kopi', amenity: 'cafe', 'addr:street': 'Jalan Desa Bahagia' } },
  { type: 'node', id: 3, lat: 3.15, lon: 101.61, tags: { name: 'Damansara Cafe', amenity: 'cafe' } },
]
async function mockMap(page) {
  await page.route('**/nominatim.openstreetmap.org/search?**', route => route.fulfill({ json: [{ lat: '3.1015294', lon: '101.6851476', type: 'bus_stop', display_name: 'Faber Towers (Opp), Jalan Desa Bahagia, Taman Danau Desa, Taman Desa, Kuala Lumpur, Malaysia' }] }))
  await page.route('**/api/places?**', route => route.fulfill({ json: { elements } }))
}
async function selectLocation(page) {
  await page.getByPlaceholder('e.g. Cheras, SS15, Mid Valley').fill('Faber Tower')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.getByRole('button', { name: /Faber Towers \(Opp\).*nearby stop/ }).click()
  await page.getByRole('slider').fill('1')
}

test('start swipe, enforce 1 km, save and revisit the same map pin after reload', async ({ page }) => {
  await mockMap(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Start swiping 💘' })).toBeDisabled()
  await expect(page.getByText(/tap a location result to enable/)).toBeVisible()
  await selectLocation(page)
  await expect(page.getByRole('button', { name: 'Start swiping 💘' })).toBeEnabled()
  await page.getByRole('button', { name: 'Start swiping 💘' }).click()
  await expect(page.getByText('1 / 2')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Faber Cafe' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Damansara Cafe' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Like', exact: true }).click()
  await expect(page.getByText('2 / 2')).toBeVisible()
  await page.getByRole('button', { name: '← Filters' }).click()
  await page.getByRole('button', { name: '⭐ Library', exact: true }).click()
  await expect(page.getByRole('button', { name: /Faber Cafe.*View place/ })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: '⭐ Library', exact: true }).click()
  await page.getByRole('button', { name: /Faber Cafe.*View place/ }).click()
  await expect(page.getByRole('link', { name: '📍 Exact map pin' })).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=3.1016%2C101.6852')
  await expect(page.getByRole('link', { name: '🗺️ Google Maps' })).toHaveAttribute('href', /destination=3.1016,101.6852/)
})

test('dragging advances the stack, and undo restores the place', async ({ page }) => {
  await mockMap(page)
  await page.goto('/')
  await selectLocation(page)
  await page.getByRole('button', { name: 'Start swiping 💘' }).click()
  const card = page.locator('.cursor-grab')
  await card.dispatchEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 300 })
  await card.dispatchEvent('pointermove', { pointerId: 1, clientX: 240, clientY: 300 })
  await card.dispatchEvent('pointerup', { pointerId: 1, clientX: 240, clientY: 300 })
  await expect(page.getByText('2 / 2')).toBeVisible()
  await page.getByRole('button', { name: /Undo/ }).click()
  await expect(page.getByText('1 / 2')).toBeVisible()
})

test('busy search shows retry, and a one-result search explains the limitation', async ({ page }) => {
  await mockMap(page)
  let busy = true
  await page.route('**/api/places?**', route => busy
    ? route.fulfill({ status: 503, json: { error: 'The map servers are busy. Please retry.' } })
    : route.fulfill({ json: { elements: [elements[0], elements[2]] } }))
  await page.goto('/')
  await selectLocation(page)
  await page.getByRole('button', { name: 'Start swiping 💘' }).click()
  await expect(page.getByText('The map servers are busy. Please retry.', { exact: false })).toBeVisible()
  busy = false
  await page.getByRole('button', { name: 'Retry search' }).click()
  await expect(page.getByText('1 / 1')).toBeVisible()
  await expect(page.getByText(/Only one matches; try clearing/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Damansara Cafe' })).toHaveCount(0)
})
