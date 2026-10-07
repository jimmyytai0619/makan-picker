import { useEffect, useRef, useState } from 'react'
import FilterScreen from './screens/FilterScreen'
import LoadingScreen from './components/LoadingScreen'
import SwipeScreen from './screens/SwipeScreen'
import PicksScreen from './screens/PicksScreen'
import RouletteScreen from './screens/RouletteScreen'
import ResultScreen from './screens/ResultScreen'
import SavedScreen from './screens/SavedScreen'
import RemovedScreen from './screens/RemovedScreen'
import LibraryScreen from './screens/LibraryScreen'
import { usePlaceLibrary } from './hooks/usePlaceLibrary'
import { cleanFilters, readStored, writeStored, loadPreviousSearch, validPlaces } from './utils/preferences'
import { ALL_PLACE_TYPES } from './data/placeTypes'
import { searchNearbyPlaces } from './services/osm'
import { useSavedCafes } from './hooks/useSavedCafes'
import { useRemovedPlaces } from './hooks/useRemovedPlaces'
import { addOpenStatus } from './utils/openingHours'
import { markSavedPlaces, matchesKeywords, savedCafeToRestaurant, shuffle } from './utils/results'
import { addLike } from './utils/likes'
import { undoLastSwipe } from './utils/swipeHistory'
import { WHEEL_MAX, pickForWheel } from './utils/roulette'

// The screens, as constants so a typo is an error instead of a blank page.
const SCREENS = {
  FILTER: 'filter',
  SAVED: 'saved',
  LIBRARY: 'library',
  SWIPE: 'swipe',
  PICKS: 'picks',
  ROULETTE: 'roulette',
  RESULT: 'result',
  REMOVED: 'removed',
}

// Only a safety limit. (It used to be 25, which hid most places: near Bandar Tun
// Hussein Onn the map has 200+ named food places within 3 km.)
const MAX_PLACES = 300

export default function App() {
  // --- App-wide state ---
  const [screen, setScreen] = useState(SCREENS.FILTER)
  const [filters, setFilters] = useState(() => cleanFilters(readStored('filters', null)))
  const [results, setResults] = useState([])
  const [previousSearch, setPreviousSearch] = useState(loadPreviousSearch)
  const [resultsUpdatedAt, setResultsUpdatedAt] = useState(null)
  const [usingPrevious, setUsingPrevious] = useState(false)
  useEffect(() => writeStored('filters', filters), [filters])
  const { favourites, recent, toggleFavourite, saveFavourite, removeFavourite, recordWinner, clearRecent } = usePlaceLibrary()
  const [likedRestaurants, setLikedRestaurants] = useState(() => validPlaces(readStored('current-picks', [])))
  useEffect(() => writeStored('current-picks', likedRestaurants), [likedRestaurants])
  // Which card the swipe screen is on. Kept HERE (not in SwipeScreen) so it
  // survives visiting your picks and coming back.
  const [swipeIndex, setSwipeIndex] = useState(0)
  // Every swipe so far ({ id, liked }, oldest first), so ↩️ can undo them one by one.
  const [swipeHistory, setSwipeHistory] = useState([])
  // The wheel: which list it draws from ('all' = every place found, 'picks' = your likes)
  // and the (up to 12) places currently on it.
  const [wheel, setWheel] = useState({ source: 'all', places: [] })
  const [chosenRestaurant, setChosenRestaurant] = useState(null)
  const [resultBackTo, setResultBackTo] = useState(SCREENS.FILTER)

  // Network requests take time and can fail, so they need these two extra states.
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  // Every search gets a number. If you press Cancel (or search again), the old
  // search's answer is ignored when it finally arrives.
  const searchIdRef = useRef(0)

  // Personal lists stay on this device.
  const { cafes: savedCafes, addCafes, removeCafe } = useSavedCafes()
  const { removed, removePlace, restorePlace } = useRemovedPlaces()

  const [excludedRecentIds, setExcludedRecentIds] = useState([])
  const recentIds = new Set(excludedRecentIds)

  // Derived: the results without removed places. Removing the current card takes it
  // out of this list, so the next card slides into the same position.
  const removedIds = new Set(removed.map((entry) => entry.id))
  const visibleResults = results.filter((place) => !removedIds.has(place.id) && (!filters.avoidRecent || !recentIds.has(place.id)))

  // --- Event handlers ---

  /** Every place that matches the filters: My Cafes (shuffled) or the map (nearest first). */
  async function findPlaces(newFilters) {
    if (newFilters.source === 'saved') {
      const places = savedCafes
        .map(savedCafeToRestaurant)
        .filter((place) => matchesKeywords(place, newFilters.cuisineKeyword))
      return shuffle(places)
    }

    const rawPlaces = await searchNearbyPlaces({
      center: newFilters.location,
      radiusKm: newFilters.maxDistanceKm,
      placeTypes: ALL_PLACE_TYPES,
    })
    let places
    try { places = await addOpenStatus(rawPlaces) } catch { places = rawPlaces.map(p => ({ ...p, openStatus: 'unknown' })) }

    const matching = markSavedPlaces(places, savedCafes)
      .filter((place) => matchesKeywords(place, newFilters.cuisineKeyword))
    // Saved cafes first, then nearest. places is already sorted by distance,
    // and sort() keeps that order for ties, so this is all we need.
    return [...matching].sort((a, b) => Number(b.isSaved) - Number(a.isSaved))
  }

  // `async` because it waits for the network.
  async function handleSearch(newFilters) {
    setFilters(newFilters)
    const excludedIds = newFilters.avoidRecent ? recent.map(p => p.id) : []
    setExcludedRecentIds(excludedIds)
    setSearchError(null)
    setLikedRestaurants([])
    setSwipeIndex(0) // new search = start from the first card
    setSwipeHistory([])

    const searchId = ++searchIdRef.current
    setIsSearching(true)
    try {
      const found = (await findPlaces(newFilters)).slice(0, MAX_PLACES)
      if (searchId !== searchIdRef.current) return // cancelled while waiting
      const eligible = found.filter(p => !newFilters.hideClosed || p.openStatus !== 'closed')
      setResults(eligible)
      setUsingPrevious(false)
      const updatedAt = Date.now()
      setResultsUpdatedAt(updatedAt)
      if (newFilters.source === 'nearby' && found.length > 0) {
        const snapshot = { filters: newFilters, places: found, updatedAt }
        setPreviousSearch(snapshot)
        writeStored('previous-search', snapshot)
      }
      if (newFilters.playStyle === 'roulette') {
        openWheel('all', eligible.filter(place => !removedIds.has(place.id) && !excludedIds.includes(place.id)))
      } else {
        setScreen(SCREENS.SWIPE)
      }
    } catch (err) {
      // Network down, server busy, etc. Stay on the Filter screen and show why.
      if (searchId === searchIdRef.current) setSearchError(err.message)
    } finally {
      if (searchId === searchIdRef.current) setIsSearching(false)
    }
  }

  async function handleUsePrevious() {
    if (!previousSearch) return
    handleCancelSearch()
    setSearchError(null)
    setFilters(previousSearch.filters)
    const excludedIds = previousSearch.filters.avoidRecent ? recent.map(p => p.id) : []
    setExcludedRecentIds(excludedIds)
    setLikedRestaurants([])
    setSwipeIndex(0)
    setSwipeHistory([])
    setResultsUpdatedAt(previousSearch.updatedAt)
    setUsingPrevious(true)
    const requestId = searchIdRef.current
    let places
    try { places = await addOpenStatus(previousSearch.places) } catch {
      places = previousSearch.places.map(p => ({ ...p, openStatus: 'unknown' }))
    }
    if (requestId !== searchIdRef.current) return
    const eligible = places.filter(p => !previousSearch.filters.hideClosed || p.openStatus !== 'closed')
    setResults(eligible)
    if (previousSearch.filters.playStyle === 'roulette') {
      openWheel('all', eligible.filter(p => !removedIds.has(p.id) && !excludedIds.includes(p.id)))
    } else setScreen(SCREENS.SWIPE)
  }

  function handleCancelSearch() {
    searchIdRef.current += 1 // the running search is now "old" and will be ignored
    setIsSearching(false)
  }

  function handleLike(restaurant) {
    // addLike ignores places that are already liked (safety net against duplicates).
    setLikedRestaurants((prev) => addLike(prev, restaurant))
    saveFavourite(restaurant)
  }

  /** A card was swiped: remember it (for undo) and show the next one. */
  function handleSwipe(restaurant, liked) {
    if (liked) handleLike(restaurant)
    setSwipeHistory((prev) => [...prev, { id: restaurant.id, liked, wasFavourite: favourites.some(p => p.id === restaurant.id) }])
    setSwipeIndex((i) => i + 1)
  }

  /** ↩️: bring back the last swiped card, and take it out of your picks if you liked it. */
  function handleUndoSwipe() {
    const undo = undoLastSwipe(swipeHistory, visibleResults)
    if (!undo) return
    setSwipeHistory(undo.history)
    setSwipeIndex(undo.index)
    if (undo.entry.liked) {
      setLikedRestaurants((prev) => prev.filter((r) => r.id !== undo.entry.id))
      if (undo.entry.wasFavourite === false) removeFavourite(undo.entry.id)
    }
  }

  function handleRemovePick(restaurant) {
    setLikedRestaurants((prev) => prev.filter((r) => r.id !== restaurant.id))
  }

  function handleRemovePlace(restaurant) {
    removePlace(restaurant)
    handleRemovePick(restaurant) // a closed place can't be one of your picks either
    // ...or on the wheel
    setWheel((prev) => ({ ...prev, places: prev.places.filter((r) => r.id !== restaurant.id) }))
  }

  /** "Closed down?" on the result screen: remove it and go back to choose again. */
  function handleRemoveChosen() {
    handleRemovePlace(chosenRestaurant)
    setChosenRestaurant(null)
    setScreen(resultBackTo)
  }

  /** Put up to 12 random places from `places` on the wheel and show it. */
  function openWheel(source, places) {
    setWheel({ source, places: pickForWheel(places) })
    setScreen(SCREENS.ROULETTE)
  }

  const wheelPool = wheel.source === 'picks' ? likedRestaurants : visibleResults

  function handleShuffleWheel() {
    setWheel((prev) => ({ ...prev, places: pickForWheel(wheelPool) }))
  }

  function openResult(restaurant, cameFrom) {
    setChosenRestaurant(restaurant)
    setResultBackTo(cameFrom)
    setScreen(SCREENS.RESULT)
  }

  function handleStartOver() {
    setLikedRestaurants([])
    setChosenRestaurant(null)
    setSwipeIndex(0)
    setSwipeHistory([])
    setScreen(SCREENS.FILTER)
  }

  // --- "Router": pick which screen to show based on state ---
  function renderScreen() {
    switch (screen) {
      case SCREENS.FILTER:
        // The free map can take ~30 s, so show something fun meanwhile.
        // (My Cafes searches are instant, so they skip this.)
        if (isSearching && filters.source === 'nearby') {
          return (
            <LoadingScreen
              placeLabel={filters.location?.label}
              radiusKm={filters.maxDistanceKm}
              onCancel={handleCancelSearch}
              onUsePrevious={previousSearch ? handleUsePrevious : undefined}
              previousLabel={previousSearch?.filters.location?.label}
            />
          )
        }
        return (
          <FilterScreen
            initialFilters={filters}
            savedCount={savedCafes.length}
            removedCount={removed.length}
            isSearching={isSearching}
            error={searchError}
            onSearch={handleSearch}
            onFiltersChange={setFilters}
            onRetry={() => handleSearch(filters)}
            previousSearch={previousSearch}
            onUsePrevious={handleUsePrevious}
            onShowRemoved={() => setScreen(SCREENS.REMOVED)}
          />
        )

      case SCREENS.LIBRARY:
        return <LibraryScreen picks={likedRestaurants} favourites={favourites} recent={recent} removedIds={removedIds} onOpen={place => { setUsingPrevious(false); openResult({ ...place, openStatus: 'unknown', distanceInKm: null }, SCREENS.LIBRARY) }} onFavourite={toggleFavourite} onClearRecent={clearRecent} />

      case SCREENS.SAVED:
        return <SavedScreen cafes={savedCafes} onAdd={addCafes} onRemove={removeCafe} />

      case SCREENS.SWIPE:
        return (
          <SwipeScreen
            restaurants={visibleResults}
            locationLabel={filters.location?.label}
            radiusKm={filters.maxDistanceKm}
            isNearby={filters.source === 'nearby'}
            currentIndex={swipeIndex}
            likedCount={likedRestaurants.length}
            isFavourite={favourites.some(p => p.id === visibleResults[swipeIndex]?.id)}
            onFavourite={() => toggleFavourite(visibleResults[swipeIndex])}
            canUndo={swipeHistory.length > 0}
            onSwipe={handleSwipe}
            onUndo={handleUndoSwipe}
            onRemove={handleRemovePlace}
            onShowPicks={() => setScreen(SCREENS.PICKS)}
            onSpinPicks={() => openWheel('picks', likedRestaurants)}
            onBack={() => setScreen(SCREENS.FILTER)}
          />
        )

      case SCREENS.PICKS:
        return (
          <PicksScreen
            picks={likedRestaurants}
            remainingCount={Math.max(visibleResults.length - swipeIndex, 0)}
            onOpen={(restaurant) => openResult(restaurant, SCREENS.PICKS)}
            onRemove={handleRemovePick}
            onSpin={() => openWheel('picks', likedRestaurants)}
            onKeepSwiping={() => setScreen(SCREENS.SWIPE)}
            onStartOver={handleStartOver}
          />
        )

      case SCREENS.ROULETTE:
        return (
          <RouletteScreen
            candidates={wheel.places}
            totalCount={wheelPool.length}
            onShuffle={wheelPool.length > WHEEL_MAX ? handleShuffleWheel : undefined}
            onLanded={recordWinner}
            onPicked={(restaurant) => openResult(restaurant, SCREENS.ROULETTE)}
            onBack={() => setScreen(wheel.source === 'picks' ? SCREENS.PICKS : SCREENS.FILTER)}
          />
        )

      case SCREENS.RESULT:
        return (
          <ResultScreen
            restaurant={chosenRestaurant}
            isFavourite={favourites.some(p => p.id === chosenRestaurant?.id)}
            onFavourite={() => toggleFavourite(chosenRestaurant)}
            onBack={() => setScreen(resultBackTo)}
            onRemove={handleRemoveChosen}
            onStartOver={handleStartOver}
            onShowLibrary={() => setScreen(SCREENS.LIBRARY)}
          />
        )

      case SCREENS.REMOVED:
        return (
          <RemovedScreen
            removed={removed}
            onRestore={restorePlace}
            onBack={() => setScreen(SCREENS.FILTER)}
          />
        )

      default:
        return null
    }
  }

  // Tabs stay on the home screens, so you cannot jump away mid-swipe.
  const showTabs = !isSearching && (screen === SCREENS.FILTER || screen === SCREENS.SAVED || screen === SCREENS.LIBRARY)

  return (
    <div className="min-h-dvh bg-gradient-to-b from-candy-pink-soft via-cream to-candy-mint/50 font-sans text-plum">
      {/* max-w-md keeps it phone-sized even on your Mac's big screen */}
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pb-6 pt-5">
        <header className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-candy-pink">
            Makan Apa?{' '}
            <span className="inline-block animate-float motion-reduce:animate-none" aria-hidden="true">
              🍜
            </span>
          </h1>
          <p className="text-sm font-bold text-plum/45">Can't decide what to eat? We got you 💕</p>
        </header>

        {showTabs && (
          <nav className="grid grid-cols-3 gap-1 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-candy-pink-soft">
            {[
              { id: SCREENS.FILTER, label: '🍜 Decide' },
              { id: SCREENS.LIBRARY, label: '⭐ Library' },
              { id: SCREENS.SAVED, label: `💖 My Cafes (${savedCafes.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id)}
                className={`rounded-full py-2 font-extrabold transition ${
                  screen === tab.id ? 'bg-candy-pink text-white shadow-sm' : 'text-plum/55'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {usingPrevious && [SCREENS.SWIPE, SCREENS.ROULETTE, SCREENS.PICKS, SCREENS.RESULT].includes(screen) && <p role="status" className="rounded-2xl bg-white p-3 text-xs font-semibold text-plum/70">Previous results · saved {new Date(resultsUpdatedAt).toLocaleString()} · map data may be older; places may have changed.</p>}
        {screen === SCREENS.FILTER && likedRestaurants.length > 0 && <button onClick={() => setScreen(SCREENS.PICKS)} className="rounded-full bg-white px-4 py-3 font-bold text-candy-pink">💖 Reopen my {likedRestaurants.length} picks</button>}
        {renderScreen()}

        {/* Required by OpenStreetMap's licence (ODbL) */}
        <footer className="text-center text-xs font-semibold text-plum/35">
          Map data ©{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-plum/50 hover:text-candy-pink"
          >
            OpenStreetMap contributors
          </a>
        </footer>
      </main>
    </div>
  )
}
