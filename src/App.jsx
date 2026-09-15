import { useRef, useState } from 'react'
import FilterScreen from './screens/FilterScreen'
import LoadingScreen from './components/LoadingScreen'
import SwipeScreen from './screens/SwipeScreen'
import PicksScreen from './screens/PicksScreen'
import RouletteScreen from './screens/RouletteScreen'
import ResultScreen from './screens/ResultScreen'
import SavedScreen from './screens/SavedScreen'
import RemovedScreen from './screens/RemovedScreen'
import { DEFAULT_FILTERS } from './models'
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
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [results, setResults] = useState([])
  const [likedRestaurants, setLikedRestaurants] = useState([])
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

  // Custom hooks: My Cafes (this phone) and the places removed because they closed
  // down (shared by everyone once the database is connected — see useRemovedPlaces).
  const { cafes: savedCafes, addCafes, removeCafe } = useSavedCafes()
  const { removed, isShared, removePlace, restorePlace } = useRemovedPlaces()

  // Derived: the results without removed places. Removing the current card takes it
  // out of this list, so the next card slides into the same position.
  const removedIds = new Set(removed.map((entry) => entry.id))
  const visibleResults = results.filter((place) => !removedIds.has(place.id))

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
    const places = await addOpenStatus(rawPlaces)

    const matching = markSavedPlaces(places, savedCafes)
      .filter((place) => matchesKeywords(place, newFilters.cuisineKeyword))
      .filter((place) => !newFilters.hideClosed || place.openStatus !== 'closed')
    // Saved cafes first, then nearest. places is already sorted by distance,
    // and sort() keeps that order for ties, so this is all we need.
    return [...matching].sort((a, b) => Number(b.isSaved) - Number(a.isSaved))
  }

  // `async` because it waits for the network.
  async function handleSearch(newFilters) {
    setFilters(newFilters)
    setSearchError(null)
    setLikedRestaurants([])
    setSwipeIndex(0) // new search = start from the first card
    setSwipeHistory([])

    const searchId = ++searchIdRef.current
    setIsSearching(true)
    try {
      const found = (await findPlaces(newFilters)).slice(0, MAX_PLACES)
      if (searchId !== searchIdRef.current) return // cancelled while waiting
      setResults(found)
      if (newFilters.playStyle === 'roulette') {
        openWheel('all', found.filter((place) => !removedIds.has(place.id)))
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

  function handleCancelSearch() {
    searchIdRef.current += 1 // the running search is now "old" and will be ignored
    setIsSearching(false)
  }

  function handleLike(restaurant) {
    // addLike ignores places that are already liked (safety net against duplicates).
    setLikedRestaurants((prev) => addLike(prev, restaurant))
  }

  /** A card was swiped: remember it (for undo) and show the next one. */
  function handleSwipe(restaurant, liked) {
    if (liked) handleLike(restaurant)
    setSwipeHistory((prev) => [...prev, { id: restaurant.id, liked }])
    setSwipeIndex((i) => i + 1)
  }

  /** ↩️: bring back the last swiped card, and take it out of your picks if you liked it. */
  function handleUndoSwipe() {
    const undo = undoLastSwipe(swipeHistory, visibleResults)
    if (!undo) return
    setSwipeHistory(undo.history)
    setSwipeIndex(undo.index)
    if (undo.entry.liked) setLikedRestaurants((prev) => prev.filter((r) => r.id !== undo.entry.id))
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
            onShowRemoved={() => setScreen(SCREENS.REMOVED)}
          />
        )

      case SCREENS.SAVED:
        return <SavedScreen cafes={savedCafes} onAdd={addCafes} onRemove={removeCafe} />

      case SCREENS.SWIPE:
        return (
          <SwipeScreen
            restaurants={visibleResults}
            currentIndex={swipeIndex}
            likedCount={likedRestaurants.length}
            isShared={isShared}
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
            onPicked={(restaurant) => openResult(restaurant, SCREENS.ROULETTE)}
            onBack={() => setScreen(wheel.source === 'picks' ? SCREENS.PICKS : SCREENS.FILTER)}
          />
        )

      case SCREENS.RESULT:
        return (
          <ResultScreen
            restaurant={chosenRestaurant}
            isShared={isShared}
            onBack={() => setScreen(resultBackTo)}
            onRemove={handleRemoveChosen}
            onStartOver={handleStartOver}
          />
        )

      case SCREENS.REMOVED:
        return (
          <RemovedScreen
            removed={removed}
            isShared={isShared}
            onRestore={restorePlace}
            onBack={() => setScreen(SCREENS.FILTER)}
          />
        )

      default:
        return null
    }
  }

  // Tabs only on the two "home" screens, so you can't jump away mid-swipe.
  const showTabs = !isSearching && (screen === SCREENS.FILTER || screen === SCREENS.SAVED)

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
          <nav className="grid grid-cols-2 gap-1 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-candy-pink-soft">
            {[
              { id: SCREENS.FILTER, label: '🍜 Decide' },
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
