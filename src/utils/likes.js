/**
 * Adds a restaurant to the liked list, unless it's already there.
 *
 * Returns a NEW array (React state must never be changed in place).
 * If the place is already liked, returns the SAME array, so nothing changes.
 *
 * @param {import('../models').Restaurant[]} liked
 * @param {import('../models').Restaurant} restaurant
 */
export function addLike(liked, restaurant) {
  if (liked.some((r) => r.id === restaurant.id)) return liked
  return [...liked, restaurant]
}
