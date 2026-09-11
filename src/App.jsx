import { useState } from 'react'
import FilterScreen from './screens/FilterScreen'
import SwipeScreen from './screens/SwipeScreen'
import RouletteScreen from './screens/RouletteScreen'
import ResultScreen from './screens/ResultScreen'
import SavedScreen from './screens/SavedScreen'
import { DEFAULT_FILTERS } from './models'
import { findMood } from './data/moods'
import { searchNearbyPlaces } from './services/osm'
import { useSavedCafes } from './hooks/useSavedCafes'
import { markSavedPlaces, matchesKeywords, savedCafeToRestaurant, shuffle } from './utils/results'

// The screens, as constants so a typo is an error instead of a blank page.
const SCREENS = {
  FILTER: 'filter',
  SAVED: 'saved',
  SWIPE: 'swipe',
  ROULETTE: 'roulette',
  RESULT: 'result',
}

// Nobody wants to swipe 300 cards. Keep the nearest ones.
const MAX_CARDS = 25

export default function App() {
  // --- App-wide state ---
  const [screen, setScreen] = useState(SCREENS.FILTER)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [results, setResults] = useState([])
  const [likedRestaurants, setLikedRestaurants] = useState([])
  const [chosenRestaurant, setChosenRestaurant] = useState(null)

  // Network requests take time and can fail, so they need these two extra states.
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  // Our custom hook: the saved list + functions to change it (auto-saved to localStorage).
  const { cafes: savedCafes, addCafes, removeCafe } = useSavedCafes()

  // --- Event handlers ---

  // `async` because it waits for the network.
  async function handleSearch(newFilters) {
    setFilters(newFilters)
    setSearchError(null)
    setLikedRestaurants([])

    // Mode 1: shuffle My Cafes. No network needed.
    if (newFilters.source === 'saved') {
      const places = savedCafes
        .map(savedCafeToRestaurant)
        .filter((place) => matchesKeywords(place, newFilters.cuisineKeyword))
      setResults(shuffle(places).slice(0, MAX_CARDS))
      setScreen(SCREENS.SWIPE)
      return
    }

    // Mode 2: search OpenStreetMap around the chosen location.
    setIsSearching(true)
    try {
      const places = await searchNearbyPlaces({
        center: newFilters.location,
        radiusKm: newFilters.maxDistanceKm,
        placeTypes: findMood(newFilters.moodId).placeTypes,
      })

      const matching = markSavedPlaces(places, savedCafes).filter((place) =>
        matchesKeywords(place, newFilters.cuisineKeyword),
      )
      // Saved cafes first, then nearest. places is already sorted by distance,
      // and sort() keeps that order for ties, so this is all we need.
      const ordered = [...matching].sort((a, b) => Number(b.isSaved) - Number(a.isSaved))

      // Results come from the network, so they must be STORED in state.
      // (Phase 1 recalculated from mock data on every render — can't do that
      // with a slow network call, and the shuffle must not change every render.)
      setResults(ordered.slice(0, MAX_CARDS))
      setScreen(SCREENS.SWIPE)
    } catch (err) {
      // Network down, server busy, etc. Stay on the Filter screen and show why.
      setSearchError(err.message)
    } finally {
      setIsSearching(false)
    }
  }

  function handleLike(restaurant) {
    setLikedRestaurants((prev) => [...prev, restaurant])
  }

  function handlePicked(restaurant) {
    setChosenRestaurant(restaurant)
    setScreen(SCREENS.RESULT)
  }

  function handleStartOver() {
    setLikedRestaurants([])
    setChosenRestaurant(null)
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
            likedCount={likedRestaurants.length}
            onLike={handleLike}
            onFinish={() => setScreen(SCREENS.ROULETTE)}
            onBack={() => setScreen(SCREENS.FILTER)}
          />
        )

      case SCREENS.ROULETTE:
        return (
          <RouletteScreen
            candidates={likedRestaurants}
            onPicked={handlePicked}
            onBack={() => setScreen(SCREENS.SWIPE)}
          />
        )

      case SCREENS.RESULT:
        return <ResultScreen restaurant={chosenRestaurant} onStartOver={handleStartOver} />

      default:
        return null
    }
  }

  // Tabs only on the two "home" screens, so you can't jump away mid-swipe.
  const showTabs = screen === SCREENS.FILTER || screen === SCREENS.SAVED

  return (
    <div className="min-h-dvh bg-orange-50 text-gray-900">
      {/* max-w-md keeps it phone-sized even on your Mac's big screen */}
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4">
        <h1 className="text-center text-2xl font-bold text-orange-600">Makan Apa? 🍜</h1>

        {showTabs && (
          <nav className="grid grid-cols-2 gap-2">
            {[
              { id: SCREENS.FILTER, label: '🍜 Decide' },
              { id: SCREENS.SAVED, label: `❤️ My Cafes (${savedCafes.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id)}
                className={`rounded-xl py-2 font-semibold ${
                  screen === tab.id ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {renderScreen()}

        {/* Required by OpenStreetMap's licence (ODbL) */}
        <footer className="text-center text-xs text-gray-400">
          Map data ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
            OpenStreetMap contributors
          </a>
        </footer>
      </main>
    </div>
  )
}
