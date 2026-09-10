import { useState } from 'react'
import FilterScreen from './screens/FilterScreen'
import SwipeScreen from './screens/SwipeScreen'
import RouletteScreen from './screens/RouletteScreen'
import ResultScreen from './screens/ResultScreen'
import { DEFAULT_FILTERS } from './models'
import { MOCK_RESTAURANTS } from './data/mockRestaurants'

// The 4 screens, as constants so a typo is an error instead of a blank page.
const SCREENS = {
  FILTER: 'filter',
  SWIPE: 'swipe',
  ROULETTE: 'roulette',
  RESULT: 'result',
}

/**
 * Keep only restaurants that match the user's filters.
 * Runs on mock data now; in Phase 2 the API will do most of this for us.
 *
 * @param {import('./models').Restaurant[]} restaurants
 * @param {import('./models').SearchFilters} filters
 */
function applyFilters(restaurants, filters) {
  const keyword = filters.cuisineKeyword.trim().toLowerCase()

  return restaurants.filter(
    (r) =>
      r.distanceInKm <= filters.maxDistanceKm &&
      r.priceLevel >= filters.budgetRange.min &&
      r.priceLevel <= filters.budgetRange.max &&
      (keyword === '' || r.name.toLowerCase().includes(keyword)),
  )
}

export default function App() {
  // --- App-wide state: everything more than one screen needs lives here ---
  const [screen, setScreen] = useState(SCREENS.FILTER)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [likedRestaurants, setLikedRestaurants] = useState([])
  const [chosenRestaurant, setChosenRestaurant] = useState(null)

  // "Derived" data: calculated from state on every render, not stored.
  const matchingRestaurants = applyFilters(MOCK_RESTAURANTS, filters)

  // --- Event handlers the screens call to move the flow forward ---
  function handleSearch(newFilters) {
    setFilters(newFilters)
    setLikedRestaurants([]) // new search = fresh shortlist
    setScreen(SCREENS.SWIPE)
  }

  function handleLike(restaurant) {
    // Never mutate state (no .push). Build a NEW array instead.
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
        return <FilterScreen initialFilters={filters} onSearch={handleSearch} />

      case SCREENS.SWIPE:
        return (
          <SwipeScreen
            restaurants={matchingRestaurants}
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

  return (
    <div className="min-h-dvh bg-orange-50 text-gray-900">
      {/* max-w-md keeps it phone-sized even on your Mac's big screen */}
      <main className="mx-auto flex min-h-dvh max-w-md flex-col p-4">
        <h1 className="mb-4 text-center text-2xl font-bold text-orange-600">
          Makan Apa? 🍜
        </h1>
        {renderScreen()}
      </main>
    </div>
  )
}
