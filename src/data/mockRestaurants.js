// FAKE data for Phase 1 UI testing only.
// Ratings, distances and prices are made up. In Phase 2 this whole file
// gets replaced by a call to the Google Places API.

/** Builds a placeholder image with the restaurant name written on it. */
function placeholderPhoto(label, bgHex) {
  return `https://placehold.co/600x400/${bgHex}/ffffff?text=${encodeURIComponent(label)}`
}

/** @type {import('../models').Restaurant[]} */
export const MOCK_RESTAURANTS = [
  {
    id: 'mock-1',
    name: "McDonald's Bandar Tun Hussein Onn DT",
    photoUrl: placeholderPhoto("McDonald's", 'dc2626'),
    rating: 4.1,
    distanceInKm: 1.2,
    priceLevel: 1,
  },
  {
    id: 'mock-2',
    name: 'Mixue Taman Connaught',
    photoUrl: placeholderPhoto('Mixue', 'e11d48'),
    rating: 4.3,
    distanceInKm: 2.5,
    priceLevel: 1,
  },
  {
    id: 'mock-3',
    name: 'Restoran Mamak Bestari 24 Jam',
    photoUrl: placeholderPhoto('Mamak', '16a34a'),
    rating: 4.6,
    distanceInKm: 0.8,
    priceLevel: 1,
  },
  {
    id: 'mock-4',
    name: 'Brew & Boulder Café (near Batuu Climbing)',
    photoUrl: placeholderPhoto('Cafe', '92400e'),
    rating: 4.5,
    distanceInKm: 4.2,
    priceLevel: 2,
  },
  {
    id: 'mock-5',
    // Deliberately far + pricey so you can see the filters remove it.
    name: 'Sushi Bar @ EkoCheras Mall',
    photoUrl: placeholderPhoto('Sushi', '1d4ed8'),
    rating: 4.2,
    distanceInKm: 5.5,
    priceLevel: 3,
  },
]
