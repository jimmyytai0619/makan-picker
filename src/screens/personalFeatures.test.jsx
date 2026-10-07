import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import FilterScreen from './FilterScreen'
import ResultScreen from './ResultScreen'
import RemovedScreen from './RemovedScreen'
import LibraryScreen from './LibraryScreen'
import { DEFAULT_FILTERS } from '../models'

const cafe = { id: 'osm-node-1', name: 'Test Cafe', category: 'cafe', lat: 3, lng: 101, openStatus: 'unknown' }
const noop = () => {}
it('renders remembered area, search recovery and avoid-recent option', () => {
  const filters = { ...DEFAULT_FILTERS, location: { lat: 3, lng: 101, label: 'Cheras' }, maxDistanceKm: 5 }
  const html = renderToStaticMarkup(<FilterScreen initialFilters={filters} savedCount={0} removedCount={0} error="Server busy" onSearch={noop} onRetry={noop} previousSearch={{ filters, updatedAt: 123 }} onUsePrevious={noop} />)
  expect(html).toContain('Cheras'); expect(html).toContain('5 km')
  expect(html).toContain('Retry search'); expect(html).toContain('Saved ')
  expect(html).toContain('Avoid my recent winners')
})
it('offers favourites and personal hiding on result cards', () => {
  const html = renderToStaticMarkup(<ResultScreen restaurant={cafe} isFavourite={true} onFavourite={noop} onRemove={noop} onStartOver={noop} />)
  expect(html).toContain('Saved to favourites'); expect(html).toContain('Hide on this device')
  expect(html).not.toContain('Remove for everyone')
})
it('explains personal hiding and exposes restoration', () => {
  const html = renderToStaticMarkup(<RemovedScreen removed={[{ ...cafe, removedAt: Date.now() }]} onRestore={noop} onBack={noop} />)
  expect(html).toContain('Hidden only on this device'); expect(html).toContain('Restore')
})
it('lets users revisit favourites and identifies hidden favourites', () => {
  const html = renderToStaticMarkup(<LibraryScreen favourites={[cafe]} recent={[]} removedIds={new Set([cafe.id])} onOpen={noop} onFavourite={noop} onClearRecent={noop} />)
  expect(html).toContain('Test Cafe'); expect(html).toContain('Hidden on this device')
  expect(html).toContain('Recent winners')
})
