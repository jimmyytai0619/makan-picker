import { useState } from 'react'
import FilterScreen from './screens/FilterScreen'
import SwipeScreen from './screens/SwipeScreen'
import PicksScreen from './screens/PicksScreen'
import RouletteScreen from './screens/RouletteScreen'
import ResultScreen from './screens/ResultScreen'
import SavedScreen from './screens/SavedScreen'
import { DEFAULT_FILTERS } from './models'
import { findMood } from './data/moods'
import { searchNearbyPlaces } from './services/osm'
import { useSavedCafes } from './hooks/useSavedCafes'
import { addOpenStatus } from './utils/openingHours'
import { markSavedPlaces, matchesKeywords, savedCafeToRestaurant, shuffle } from './utils/results'
import { addLike } from './utils/likes'
import { WHEEL_MAX, pickForWheel } from './utils/roulette'

// The screens, as constants so a typo is an error instead of a blank page.
const SCREENS = {
  FILTER: 'filter',
  SAVED: 'saved',
  SWIPE: 'swipe',
  PICKS: 'picks',
  ROULETTE: 'roulette',
  RESULT: 'result',
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
  // The wheel: which list it draws from ('all' = every place found, 'picks' = your likes)
  // and the (up to 12) places currently on it.
  const [wheel, setWheel] = useState({ source: 'all', places: [] })
  const [chosenRestaurant, setChosenRestaurant] = useState(null)
  const [resultBackTo, setResultBackTo] = useState(SCREENS.FILTER)

  // Network requests take time and can fail, so they need these two extra states.
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  // Our custom hook: the saved list + functions to change it (auto-saved to localStorage).
  const { cafes: savedCafes, addCafes, removeCafe } = useSavedCafes()

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
      placeTypes: findMood(newFilters.moodId).placeTypes,
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

    setIsSearching(true)
    try {
      const found = (await findPlaces(newFilters)).slice(0, MAX_PLACES)
      setResults(found)
      if (newFilters.playStyle === 'roulette') openWheel('all', found)
      else setScreen(SCREENS.SWIPE)
    } catch (err) {
      // Network down, server busy, etc. Stay on the Filter screen and show why.
      setSearchError(err.message)
    } finally {
      setIsSearching(false)
    }
  }

  function handleLike(restaurant) {
    // addLike ignores places that are already liked (safety net against duplicates).
    setLikedRestaurants((prev) => addLike(prev, restaurant))
  }

  function handleRemovePick(restaurant) {
    setLikedRestaurants((prev) => prev.filter((r) => r.id !== restaurant.id))
  }

  /** Put up to 12 random places from `places` on the wheel and show it. */
  function openWheel(source, places) {
    setWheel({ source, places: pickForWheel(places) })
    setScreen(SCREENS.ROULETTE)
  }

  const wheelPool = wheel.source === 'picks' ? likedRestaurants : results

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
    setScreen(SCREENS.FILTER)
  }

  // --- "Router": pick which screen to show based on state ---
  function renderScreen() {
    switch (screen) {
      case SCREENS.FILTER:
        return (
          <FilterScreen
            initialFilters={filters}
            savedCount={savedCafes.length}
            isSearching={isSearching}
            error={searchError}
            onSearch={handleSearch}
          />
        )

      case SCREENS.SAVED:
        return <SavedScreen cafes={savedCafes} onAdd={addCafes} onRemove={removeCafe} />

      case SCREENS.SWIPE:
        return (
          <SwipeScreen
            restaurants={results}
            currentIndex={swipeIndex}
            likedCount={likedRestaurants.length}
            onLike={handleLike}
            onNext={() => setSwipeIndex((i) => i + 1)}
            onShowPicks={() => setScreen(SCREENS.PICKS)}
            onBack={() => setScreen(SCREENS.FILTER)}
          />
        )

      case SCREENS.PICKS:
        return (
          <PicksScreen
            picks={likedRestaurants}
            remainingCount={Math.max(results.length - swipeIndex, 0)}
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
            onBack={() => setScreen(resultBackTo)}
            onStartOver={handleStartOver}
          />
        )

      default:
        return null
    }
  }

  // Tabs only on the two "home" screens, so you can't jump away mid-swipe.
  const showTabs = screen === SCREENS.FILTER || screen === SCREENS.SAVED

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
