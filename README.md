# Makan Apa? 🍜

A food decision app: filter → swipe → roulette → result.
Phase 1 MVP — UI shell with mock data (Cheras area). Built with React, Vite and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

To test on your phone (same Wi-Fi): `npm run dev -- --host`, then open the Network URL.

## Structure

```
src/
  App.jsx            state + screen switching
  models.js          Restaurant / SearchFilters (JSDoc types)
  data/              mock restaurants (replaced by Google Places in Phase 2)
  screens/           Filter, Swipe, Roulette, Result
  components/        RestaurantCard, ActionButtons
```
