// Quick moods = one tap fills in the filters for you.
//
// `placeTypes` are the kinds of place to search (see PLACE_TYPES in api/places.js).
// `keyword` goes into the Craving box, where the user can still edit it.
// A place matches if its name, cuisine OR kind contains ANY of the keywords.

const ALL_FOOD = ['restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream', 'bakery', 'pastry', 'beverages']

export const MOODS = [
  {
    id: 'anything',
    emoji: '🍜',
    label: 'Anything',
    placeTypes: ALL_FOOD,
    keyword: '',
  },
  {
    id: 'work-cafe',
    emoji: '☕',
    label: 'Work cafe',
    placeTypes: ['cafe'],
    keyword: '',
  },
  {
    id: 'dessert',
    emoji: '🍰',
    label: 'Dessert & drinks',
    placeTypes: ['cafe', 'ice_cream', 'bakery', 'pastry', 'beverages'],
    keyword: 'dessert, ice cream, cake, bingsu, waffle, bubble tea, mixue, bakery, pastry, beverages',
  },
  {
    id: 'mamak',
    emoji: '🌙',
    label: 'Mamak / supper',
    placeTypes: ['restaurant', 'fast_food', 'cafe'],
    keyword: 'mamak, nasi kandar, roti, indian, pelita',
  },
  {
    id: 'fast-food',
    emoji: '🍔',
    label: 'Fast food',
    placeTypes: ['fast_food'],
    keyword: '',
  },
]

export function findMood(id) {
  return MOODS.find((m) => m.id === id) ?? MOODS[0]
}
