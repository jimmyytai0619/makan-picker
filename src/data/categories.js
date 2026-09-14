// One look per kind of place: an emoji, a short label and a pastel gradient.
// Shared by the swipe card, the picks list and the result screen.
// (The `from-…` / `to-…` names are Tailwind colours defined in index.css.)

export const CATEGORY_STYLE = {
  cafe: { emoji: '☕', label: 'Cafe', bg: 'from-candy-peach to-candy-butter' },
  restaurant: { emoji: '🍛', label: 'Restaurant', bg: 'from-candy-pink-soft to-candy-peach' },
  fast_food: { emoji: '🍔', label: 'Fast food', bg: 'from-candy-butter to-candy-peach' },
  food_court: { emoji: '🍜', label: 'Food court', bg: 'from-candy-mint to-candy-sky' },
  ice_cream: { emoji: '🍦', label: 'Ice cream', bg: 'from-candy-sky to-candy-lilac' },
  bakery: { emoji: '🥐', label: 'Bakery', bg: 'from-candy-butter to-candy-pink-soft' },
  pastry: { emoji: '🍰', label: 'Cakes & pastry', bg: 'from-candy-pink-soft to-candy-lilac' },
  beverages: { emoji: '🧋', label: 'Drinks', bg: 'from-candy-lilac to-candy-sky' },
  saved: { emoji: '💖', label: 'Saved cafe', bg: 'from-candy-pink-soft to-candy-lilac' },
}

/** The style for a category, or the restaurant style if it's unknown. */
export function categoryStyle(category) {
  return CATEGORY_STYLE[category] ?? CATEGORY_STYLE.restaurant
}
