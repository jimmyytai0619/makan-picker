// Quick moods = one tap fills in the filters for you.
//
// `placeTypes` are OpenStreetMap `amenity` values (what KIND of place).
// `keyword` goes into the Craving box, where the user can still edit it.
// A place matches if its name OR cuisine contains ANY of the keywords.

export const MOODS = [
  {
    id: 'anything',
    emoji: '🍜',
    label: 'Anything',
    placeTypes: ['restaurant', 'cafe', 'fast_food', 'food_court'],
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
    label: 'Dessert',
    placeTypes: ['cafe', 'ice_cream'],
    keyword: 'dessert, ice cream, cake, bingsu, waffle, bubble tea, mixue, pastry',
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
