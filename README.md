# Makan Apa? 🍜

**Can't decide what to eat? Swipe or spin nearby food spots in Malaysia.**

[![Tests](https://github.com/jimmyytai0619/makan-picker/actions/workflows/ci.yml/badge.svg)](https://github.com/jimmyytai0619/makan-picker/actions/workflows/ci.yml)
[![Live app](https://img.shields.io/badge/live-makan--picker.vercel.app-ff6f9c)](https://makan-picker.vercel.app)

👉 **Try it:** https://makan-picker.vercel.app (made for phones, works on laptops too)

<table>
  <tr>
    <td><img src="docs/screenshots/1-start.jpg" width="200" alt="Start screen: choose Swipe or Roulette and an area"></td>
    <td><img src="docs/screenshots/2-loading.jpg" width="200" alt="Loading screen with a catch-the-snacks mini game"></td>
    <td><img src="docs/screenshots/3-swipe.jpg" width="200" alt="Swipe cards for nearby restaurants"></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/4-spin-button.jpg" width="200" alt="After 2 likes, a Spin my picks button appears with confetti"></td>
    <td><img src="docs/screenshots/5-roulette.jpg" width="200" alt="Pastel roulette wheel choosing between your picks"></td>
    <td><img src="docs/screenshots/6-result.jpg" width="200" alt="The winner, with Google Maps and Waze buttons"></td>
  </tr>
</table>

## Features

- **Two ways to decide:** 👆 **Swipe** (Tinder style: right = yum, left = nope) or 🎡 **Roulette** over every place nearby
- **Spin your picks:** after 2 likes, a *Spin my picks* button appears (with confetti) so the wheel chooses between them
- **Real places near you:** type an area or use GPS; cafes, restaurants, fast food, bakeries and bubble tea from OpenStreetMap
- **Useful cards:** distance, address (or nearest road), cuisine, scheduled open / closed (Malaysia time), an exact coordinate pin plus a separate review search in Google Maps
- **Go there:** one tap opens directions in Google Maps or Waze
- **My Cafes:** paste cafes you saved on Instagram / Xiaohongshu and swipe or spin them too
- **Personal hiding:** hide a place on this device, with a *Hidden places* page to restore it
- **Remembered settings:** your last area, distance, craving and play style are ready next time; GPS is requested only when you tap it
- **Search recovery:** retry failed searches or reopen the last successful nearby results, labelled with their save time
- **Favourites and recent winners:** swipe right or save a favourite to keep places in the Library, revisit your last 20 different wheel winners, or exclude them from a new search
- **Fun while you wait:** a noodle-bowl loading screen with a catch-the-snacks mini game (and your best score)
- **Pastel candy design**, with "Reduce motion" respected for people who turn it on

## How it works

```mermaid
flowchart LR
  A[React app<br/>in the browser] -->|"Cheras" → coordinates| N[Nominatim<br/>OSM address search]
  A -->|/api/places| P[Vercel function<br/>api/places.js]
  P -->|query| O[Overpass<br/>OSM place search]
  P -.->|if busy| M[Backup mirror]
  A --> L[(Browser storage<br/>settings, previous results,<br/>hidden places and Library)]
```

- **Why a server in the middle?** Overpass rejects browser requests from the live site, but accepts server ones. The
  function also checks every input, tries a backup mirror when the main server is busy, and lets Vercel's CDN
  cache answers for a day, so repeat searches are instant.
- **Personal lists** live in browser storage on this device. Hiding and restoring places never changes anyone else's results. Storage failures do not stop the current session. The old shared-removals server endpoint remains as legacy code.
- **The roulette is honest:** the winner is picked first, then the exact rotation is calculated so the wheel stops on it.
  Tests check every wheel size from 1 to 25 and every pocket.

## Decisions (and trade-offs)

| Decision | Why | Trade-off |
|---|---|---|
| OpenStreetMap, not Google Places | Free, no API key or credit card | No ratings or photos; the map rarely knows when a place closes (hence the shared removed list) |
| Own `/api/places` server function | Overpass blocks the live site's browser requests | A little more code, but also caching and a fallback |
| Personal hidden places in `localStorage` | One user cannot hide places for everyone | Each device has its own list |
| My Cafes in `localStorage` | No accounts needed | Each device has its own list |

## Tech

React 19 · Vite · Tailwind CSS v4 · Vercel (hosting + serverless functions) · Supabase (Postgres) ·
OpenStreetMap (Nominatim + Overpass) · Vitest · GitHub Actions

## Engineering highlights

- **Automated tests** (Vitest), run by GitHub Actions on every pull request; Vercel builds a preview for each PR
- Every change goes through a branch, a pull request, the checks, a merge, and then a check of the **live** site
- Server input validation, safe links only (no `javascript:` URLs from map data), and no secrets in the browser
- Polite use of free services: a queue for Nominatim (max 1 request per second), caching, and only one retry when busy
- Swipe gestures with Pointer Events (touch, mouse and ← → keys), plus `aria-live` for screen readers

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173 (add -- --host to open it on your phone)
npm test         # run the tests
npm run build    # build like Vercel does
npm run test:e2e # mobile-layout browser regression tests (install Chromium first)
```

Personal preferences, hidden places, favourites and recent winners work without database setup. The legacy `/api/removed` endpoint can still be configured using [`docs/supabase.sql`](docs/supabase.sql); the current app does not call it.

## Project structure

```
api/            places.js (map search proxy) · removed.js + _removedStore.js (shared removed list)
src/
  App.jsx       app state, search flow, which screen to show
  screens/      Filter · Swipe · Picks · Roulette · Result · Saved (My Cafes) · Removed · Library
  components/   RestaurantCard · SwipeableCard · LoadingScreen · Confetti · …
  hooks/        useSavedCafes · useRemovedPlaces · usePlaceLibrary · usePlaceAddress
  services/     osm.js (all map calls) · removed.js
  utils/        pure, tested helpers (roulette maths, swipe, address, likes, …)
docs/           notes on how it was built
```

## Behind the scenes

- [`docs/PROGRESS.md`](docs/PROGRESS.md): my development notes, step by step
- [`docs/HOW-IT-WORKS.md`](docs/HOW-IT-WORKS.md): the full guide (one search followed through every file)
- [`docs/NOTES.md`](docs/NOTES.md): my first notes from Phase 1

Started on 10 Sep 2026 by [@jimmyytai0619](https://github.com/jimmyytai0619).

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
