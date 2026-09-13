# Makan Apa? 🍜

10/9/2026

A food decision app: filter → swipe → roulette → result.
Built with React, Vite and Tailwind CSS.

## Features

- **Nearby search**: type an area or use GPS, pick a mood, and find cafes and restaurants from OpenStreetMap
- **My Cafes**: paste cafes you saved on Instagram / Xiaohongshu (with the post link), search them, and shuffle them
- **Swipe → roulette → result**, with Google Maps and Waze links

## Run locally

```bash
npm install
npm run dev
```

To test on your phone (same Wi-Fi): `npm run dev -- --host`, then open the Network URL.
(GPS won't work over plain http on the phone. Type the area instead.)

## Structure

```
src/
  App.jsx            state + screen switching + search flow
  models.js          Restaurant / SearchFilters / SavedCafe (JSDoc types)
  services/osm.js    ALL OpenStreetMap calls (Nominatim + Overpass)
  hooks/             useSavedCafes (localStorage)
  utils/             distance, GPS, filtering helpers
  data/moods.js      quick mood presets
  screens/           Filter, Saved, Swipe, Roulette, Result
  components/        RestaurantCard, ActionButtons, LocationPicker
```

## Decisions

- **OpenStreetMap instead of Google Places**: it's free and needs no API key.
  Trade-off: no ratings, photos, prices, and opening hours are often missing.
  All map code is in `services/osm.js`, so switching later only touches one file.
- **Saved list in localStorage**: no backend needed. Trade-off: each browser has its own list (no sync).

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
