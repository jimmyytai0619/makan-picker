# How Makan Apa? Works — The Complete Guide 🍜

Everything about the app in one place: the big picture, every file, one search followed
step by step, what was built most recently (with the code explained), the key concepts,
the tests, the known problems, and what comes next.

> Tip: in VS Code press `Cmd+Shift+V` to read this file formatted.

- **Live app:** https://makan-picker.vercel.app
- **Code:** https://github.com/jimmyytai0619/makan-picker
- **State of `main` when this was written:** `73889ec` · 31 code files · **33 tests passing** · 7 merged Pull Requests

---

## Contents

1. [The big picture](#1-the-big-picture)
2. [Every file and its job](#2-every-file-and-its-job)
3. [Follow one search, step by step](#3-follow-one-search-step-by-step)
4. [What I just did (14–15 Sep)](#4-what-i-just-did-1415-sep)
5. [Key concepts cheat sheet](#5-key-concepts-cheat-sheet)
6. [What the 33 tests protect](#6-what-the-33-tests-protect)
7. [Known problems and limits](#7-known-problems-and-limits)
8. [What's next](#8-whats-next)
9. [Everyday commands](#9-everyday-commands)

---

## 1. The big picture

### What the app does

```
 Filter  ──►  Swipe  ──►  Roulette  ──►  Result
 where?       like ♥ /     spin the       Google / Waze /
 mood?        skip ✕       casino wheel   Apple directions
                ▲
 My Cafes ──────┘  (your saved IG / XHS cafes can be swiped too)
```

### Who talks to whom

```
┌──────────────── Your phone / Mac (browser) ─────────────────┐
│  React app (the code in src/)                               │
│    │                    │                     │             │
│    │ place search       │ "Cheras" → coords   │ links only  │
│    ▼                    ▼                     ▼             │
└────┼────────────────────┼─────────────────────┼─────────────┘
     │                    │                     │
     ▼                    ▼                     ▼
┌─────────────┐   ┌────────────────┐   ┌──────────────────────┐
│ Vercel      │   │ Nominatim      │   │ Google Maps / Waze / │
│ /api/places │   │ (OSM address   │   │ Apple Maps           │
│ (our server)│   │  search, free) │   │ (opened in new tab)  │
└─────┬───────┘   └────────────────┘   └──────────────────────┘
      │ asks
      ▼
┌──────────────────────────────┐
│ Overpass (OSM place search)  │  main: overpass-api.de
│ free, shared by the world    │  backup: maps.mail.ru
└──────────────────────────────┘
```

- **OpenStreetMap (OSM)** — the free world map database ("Wikipedia for maps"). All our place data comes from it.
- **Overpass** — OSM's search engine: *"all cafes within 3 km of this point"*.
- **Nominatim** — OSM's address search: *"Cheras" → coordinates*, and back: *coordinates → "Jalan Suarasa 8/5"*.
- **Vercel** — hosts the website **and** runs our small server code in `api/`.

### How code reaches the live site

```
feature branch ──► Pull Request ──► Vercel check ✓ ──► merge into main ──► Vercel builds ──► live site
```

The live site is **always built from `main`**. A change on a branch is invisible on the
live site until its Pull Request is merged. (That's why, before merging PR #5 and #6,
refreshing the browser showed nothing new.)

---

## 2. Every file and its job

The code is organised in **layers**. Each layer only uses the layers below it:

```
 screens/  components/        ← what you SEE (React)
      │
 hooks/                        ← reusable React logic (state + effects)
      │
 services/osm.js               ← talks to the internet (fetch)
      │
 utils/  data/                 ← pure functions and fixed data (no React, no internet)
```

**Why layers?** Each file has one job. The pure functions at the bottom are the easiest
to test. And if we ever switch from OpenStreetMap to Google, only `services/osm.js` changes.

### Entry point

| File | Lines | Job |
|---|---|---|
| `index.html` | 14 | The one HTML page. Has an empty `<div id="root">` |
| `src/main.jsx` | 10 | Finds `#root` and tells React to draw `<App />` inside it |
| `src/index.css` | 1 | `@import "tailwindcss";` — turns on Tailwind |

### The brain

| File | Lines | Job |
|---|---|---|
| `src/App.jsx` | 197 | Holds app-wide **state** (which screen, filters, results, likes, card position, chosen place). Runs the search. Decides which screen to show |
| `src/models.js` | 94 | Describes the **shape of the data** (`Restaurant`, `SearchFilters`, `SavedCafe`) with JSDoc, so VS Code can autocomplete |

### Screens (one per step)

| File | Lines | Job |
|---|---|---|
| `screens/FilterScreen.jsx` | 141 | Nearby / My list switch, location, mood, distance, craving, "hide closed" |
| `screens/SavedScreen.jsx` | 147 | My Cafes: add one, paste many, search, delete |
| `screens/SwipeScreen.jsx` | 85 | One card at a time, ✕ / ♥, "Enough! Spin" |
| `screens/RouletteScreen.jsx` | 252 | 🎰 The casino wheel (new) |
| `screens/ResultScreen.jsx` | 65 | The winner + Google / Waze / Apple buttons |

### Components (reusable pieces)

| File | Lines | Job |
|---|---|---|
| `components/RestaurantCard.jsx` | 136 | Draws one place: emoji, name, **address**, badges, hours, **links** |
| `components/LocationPicker.jsx` | 121 | Type an area or use GPS |
| `components/ActionButtons.jsx` | 34 | The ✕ and ♥ buttons |

### Hooks (reusable React logic)

| File | Lines | Job |
|---|---|---|
| `hooks/useSavedCafes.js` | 89 | My Cafes list, saved in the browser's `localStorage` |
| `hooks/usePlaceAddress.js` | 46 | The address line for a card (new) |

### Service (the only place that talks to OSM)

| File | Lines | Job |
|---|---|---|
| `services/osm.js` | 250 | `geocode()`, `reverseGeocode()`, `searchNearbyPlaces()` + the polite queue + the retry |

### Utils (pure functions: same input → same output)

| File | Lines | Job |
|---|---|---|
| `utils/geo.js` | 57 | Distance between two points; GPS position |
| `utils/results.js` | 114 | Keyword matching, "in your list" matching, shuffle |
| `utils/likes.js` | 13 | `addLike()` — never the same place twice |
| `utils/openingHours.js` | 28 | Open / closed / unknown (loads its library lazily) |
| `utils/roulette.js` | 57 | The wheel's maths (new) |
| `utils/address.js` | 84 | Address text, Google link, safe website / phone links (new) |

### Data

| File | Lines | Job |
|---|---|---|
| `data/moods.js` | 47 | The quick moods: which place types + keywords each one uses |

### Server + settings

| File | Lines | Job |
|---|---|---|
| `api/places.js` | 167 | Our **serverless function** at `/api/places`: checks input, asks Overpass, falls back to a mirror, trims, caches |
| `vercel.json` | 8 | Gives that function up to 30 seconds |
| `vite.config.js` | 24 | Vite + React + Tailwind, and runs `api/places.js` during `npm run dev` too |

### Tests (`*.test.js`, run with `npm test`)

`services/osm.test.js` · `utils/address.test.js` · `utils/likes.test.js` · `utils/results.test.js` · `utils/roulette.test.js` — see [section 6](#6-what-the-33-tests-protect).

---

## 3. Follow one search, step by step

Let's follow what happens when you search near **Bandar Tun Hussein Onn**.

### Step 1 — You type the area

`LocationPicker` calls `geocode("Bandar Tun Hussein Onn")` in `services/osm.js`:

```js
const response = await politely(() => fetch(`${NOMINATIM_URL}?${params}`))
```

- `fetch` sends the request to Nominatim.
- `await` means *"wait here until the answer arrives"*.
- `politely(...)` puts the request in a queue so Nominatim requests are always **at least
  1.1 seconds apart** (Nominatim's rule: max 1 per second). More in [section 4.2](#42-address--google-photos-link-pr-6).

You pick one of the results → it's saved as `location` (`{ lat, lng, label }`).

### Step 2 — You press "Find food"

`FilterScreen` calls `onSearch(...)`, which is `handleSearch` in `App.jsx`:

```js
async function handleSearch(newFilters) {
  setFilters(newFilters)
  setSearchError(null)
  setLikedRestaurants([])
  setSwipeIndex(0) // new search = start from the first card
  ...
  setIsSearching(true)                         // 1. LOADING  → button says "Searching the map…"
  try {
    const rawPlaces = await searchNearbyPlaces({ center, radiusKm, placeTypes })
    const places = await addOpenStatus(rawPlaces)
    ...
    setResults(ordered.slice(0, MAX_CARDS))    // 2. SUCCESS  → go to the swipe screen
    setScreen(SCREENS.SWIPE)
  } catch (err) {
    setSearchError(err.message)                // 3. ERROR    → show the message
  } finally {
    setIsSearching(false)                      // runs either way
  }
}
```

Every internet request has **3 states: loading, success, error**. Always handle all three.

### Step 3 — The browser asks OUR server

`searchNearbyPlaces()` builds a URL like:

```
/api/places?lat=3.046&lng=101.759&radiusKm=3&types=restaurant,cafe,fast_food,food_court&v=2
```

- `lat` / `lng` are **rounded to ~100 m** so nearby searches share one cached answer.
- `v=2` is a **version number** (explained in 4.2).
- Why not ask Overpass directly? Because **Overpass rejects browser requests from our
  vercel.app site** (error 406). Server requests are accepted. (That was the hotfix, PR #3.)

If the server answers "busy" (502/503/504), the app **waits 1.5 s and tries once more** (PR #7, section 4.4).

### Step 4 — Our server (`api/places.js`) does its job

**a) Checks the input — anyone on the internet can call this URL, not just our app:**

```js
if (!(lat >= -90 && lat <= 90)) return { error: 'lat must be a number between -90 and 90' }
if (!(radiusKm > 0 && radiusKm <= MAX_RADIUS_KM)) return { error: `radiusKm must be between 0 and ${MAX_RADIUS_KM}` }
if (types.length === 0 || !types.every((t) => ALLOWED_PLACE_TYPES.includes(t))) { ... }
```

Bad input gets **400**. Only words from `ALLOWED_PLACE_TYPES` can ever go into the
Overpass query, so nobody can **inject** extra query code.

**b) Builds the Overpass query:**

```
[out:json][timeout:25];
nwr["amenity"~"^(restaurant|cafe)$"]["name"](around:3000,3.04600,101.75900);
out center tags;
```

*"Every named restaurant or cafe within 3000 m of this point. Answer in JSON."*

**c) Tries the main server, then the backup (fallback):**

```js
for (const serverUrl of OVERPASS_SERVERS) {
  try {
    const response = await fetch(serverUrl, { ..., signal: AbortSignal.timeout(TIMEOUT_PER_SERVER_MS) })
    if (!response.ok) { failures.push(...); continue }   // try the next server
    return { elements: data.elements, server: host }     // success → stop
  } catch (err) { failures.push(...) }
}
throw new Error(`All Overpass servers failed -> ...`)
```

**d) Keeps only the tags the app needs** (`KEPT_TAGS`: name, type, cuisine, hours,
address, phone, website) → smaller download on mobile data.

**e) Lets Vercel's CDN cache the answer:**

```js
'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
```

- `s-maxage=86400` → Vercel keeps this answer for **1 day**. The same search from anyone is instant.
- A failure is sent with `no-store` → an error is **never** cached.

### Step 5 — Back in the browser: turn raw data into cards

```
Overpass elements
   │  toRestaurant()        OSM format → our Restaurant shape (+ distance, address, phone…)
   │  addOpenStatus()       "Mo-Su 10:00-22:00" → open / closed / unknown
   │  markSavedPlaces()     is it in My Cafes? (only the NEAREST branch of a chain)
   │  matchesKeywords()     craving filter ("mamak, roti")
   │  hideClosed filter     only if you ticked "Hide places closed now"
   │  sort                  saved cafes first, then nearest
   ▼
25 cards
```

`addOpenStatus()` uses a **big** library, so it's loaded only now, with `import('opening_hours')`
(**lazy loading**) — the app's first load stays small.

### Step 6 — A card appears

`RestaurantCard` calls `usePlaceAddress(restaurant)`:
- OSM has the address → shows it right away.
- Only coordinates → after 0.5 s, looks up the nearest road → *"Near Jalan Suarasa 8/5, Cheras"*.

### Step 7 — You like places

```js
setLikedRestaurants((prev) => addLike(prev, restaurant))
```

`addLike` never adds the same place twice. The card position (`swipeIndex`) lives in
`App`, so going **Back** from the roulette continues where you stopped (PR #4).

### Step 8 — You spin the wheel

The code **first picks the winner**, then calculates exactly how far to turn the wheel so
that winner stops under the pointer (section 4.1).

### Step 9 — The result

Google Maps (directions), Waze and Apple Maps links. On a phone they open the apps.

---

## 4. What I just did (14–15 Sep)

| PR | What | Why |
|---|---|---|
| #5 | 🎰 Casino roulette wheel | You asked for a real casino-style spin |
| #6 | 📍 Address + 📷 Google photos link + 📞 / 🌐 | No photos → you couldn't tell where a place is |
| #7 | 🔁 Retry when the map server is busy | Live searches failed about half the time |

For each one I followed the same process:

```
branch (in a separate folder) → code → tests → build → browser test → PR → Vercel check → merge → check the LIVE site
```

### 4.1 Casino roulette wheel (PR #5)

**Files:** `utils/roulette.js` (maths), `screens/RouletteScreen.jsx` (drawing), `utils/roulette.test.js` (tests).

#### The most important idea: the wheel must be honest

A classic roulette bug: the **wheel shows one place, but the app picks another**.
To make that impossible, the code works backwards:

1. Pick the winner with `Math.random()`.
2. Calculate the rotation that puts that pocket under the pointer.
3. Animate the wheel to that rotation.

#### The maths (`utils/roulette.js`)

Pockets are numbered **clockwise from the top**. The pointer is fixed at the **top**.

```js
export function targetRotation(currentRotation, winnerIndex, count, jitter = 0, fullTurns = 5) {
  const landingAngle = (winnerIndex + 0.5 + jitter) * pocketAngle(count) // spot on the wheel
  const wanted = mod360(-landingAngle) // rotation that brings that spot to the top
  const extra = mod360(wanted - mod360(currentRotation)) // how much more to turn from here
  return currentRotation + fullTurns * 360 + extra
}
```

Example with **4 places** (90° each) and winner **#2**, jitter 0:

| Step | Value | Meaning |
|---|---|---|
| `landingAngle` | (2 + 0.5) × 90 = **225°** | The middle of pocket #2 on the wheel |
| `wanted` | −225 → **135°** | Turning the wheel 135° clockwise brings that spot to the top |
| `extra` (from 0) | **135°** | How much more to turn |
| result | 5 × 360 + 135 = **1935°** | 5 full turns for drama, then stop on #2 |

- `jitter` (random −0.35 … +0.35) → stop somewhere *inside* the pocket, not always the exact middle.
- The number keeps growing on every spin → the wheel always turns **forward**.
- `mod360()` exists because JavaScript's `%` can give negative numbers (`-45 % 360` is `-45`).

The reverse function checks which pocket is under the pointer:

```js
export function pocketAtRotation(rotation, count) {
  return Math.floor(mod360(-rotation) / pocketAngle(count)) % count
}
```

**The test** checks `pocketAtRotation(targetRotation(...)) === winner` for **every wheel
size from 1 to 25, every pocket, 3 stopping spots and 3 starting angles** — 2,925 combinations.
That's how we *know* the wheel is honest.

#### Drawing the wheel (`RouletteScreen.jsx`)

The wheel is an **SVG** (a drawing made of shapes), 200 × 200 units with (0, 0) in the middle.
Each pocket is a pie slice:

```js
function pocketPath(index, count) {
  const angle = pocketAngle(count)
  const [x1, y1] = pointAt(POCKET_RADIUS, index * angle)
  const [x2, y2] = pointAt(POCKET_RADIUS, (index + 1) * angle)
  const largeArc = angle > 180 ? 1 : 0
  return `M 0 0 L ${x1} ${y1} A ${POCKET_RADIUS} ${POCKET_RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`
}
```

`M 0 0` = start at the centre · `L` = line to the edge · `A` = arc along the edge · `Z` = close.

Colours: red and black take turns; with an **odd** number of pockets the last one is
**green** (like the casino's 0), so two reds never touch.

#### Making it spin

```js
<svg style={{ transform: `rotate(${rotation}deg)`, transition: `transform ${duration}ms ${WHEEL_EASING}` }}>
```

We only **change the number** (`rotation`). The browser's **CSS transition** animates
from the old angle to the new one over 5 seconds. The easing
`cubic-bezier(0.12, 0.75, 0.15, 1)` = **fast start, long slow finish**, like a real wheel.

The **ball** is a separate layer that rotates the **other way** and always finishes at
the top (a multiple of 360°), so it ends up in the winning pocket right under the pointer.
When the wheel stops, the ball moves inward (`top` changes) — it "drops into the pocket".

#### The spin function

```js
function spin() {
  if (isSpinning || count === 0) return
  const pick = Math.floor(Math.random() * count)        // 1. choose the winner
  const jitter = (Math.random() - 0.5) * 0.7

  setWinnerIndex(null)
  setIsSpinning(true)
  setRotation((r) => targetRotation(r, pick, count, jitter))       // 2. wheel angle
  setBallRotation((b) => b - (((b % 360) + 360) % 360) - 360 * 4)  //    ball angle

  timerRef.current = setTimeout(() => {                 // 3. when the animation ends
    setIsSpinning(false)
    setWinnerIndex(pick)
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(60)
  }, duration)
}
```

Other details worth knowing:

- **`useRef` for the timer** + `useEffect(() => () => clearTimeout(timerRef.current), [])`
  → if you leave the screen mid-spin, the timer is cancelled (no memory leak).
- **"Reduce motion"**: if the phone has this accessibility setting on, the spin takes 1.5 s instead of 5 s.
- **Vibration**: browsers only allow it after a real tap, so we check
  `navigator.userActivation.hasBeenActive` first (this removed a console error found while testing).
- **`aria-live`** on the result text → screen readers announce the winner.
- **Long names** are shortened (`truncateLabel`) so they never run under the gold hub
  (a bug found in the first screenshot).

### 4.2 Address + Google photos link (PR #6)

**Files:** `utils/address.js`, `hooks/usePlaceAddress.js`, `services/osm.js`,
`components/RestaurantCard.jsx`, `api/places.js`, `models.js`, `utils/results.js`, `utils/address.test.js`.

#### First, I measured what data exists (210 places near Bandar Tun Hussein Onn)

| Data | How many places have it |
|---|---|
| Street address in OSM | 67 (~1 in 3) |
| Phone | 37 |
| Website | 16 |
| Photos | 0 — OSM doesn't store photos |

So: use the OSM address when it exists, and **look up the nearest road** for the rest.
For photos, link to Google Maps, which has them.

#### `formatOsmAddress(tags)` — address from OSM tags

```js
{ 'addr:housenumber': '21', 'addr:street': 'Jalan 33/154', 'addr:postcode': '56000', 'addr:city': 'Kuala Lumpur' }
  → "21 Jalan 33/154, 56000 Kuala Lumpur"
```

#### `reverseGeocode(lat, lng)` — nearest road for everything else

```js
export function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
  if (!reverseCache.has(key)) {
    const request = politely(() => fetch(`${NOMINATIM_REVERSE_URL}?${params}`))
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => formatReverseAddress(data?.address))
      .catch(() => null)                     // never throws
      .then((text) => {
        if (text === null) reverseCache.delete(key) // allow a retry later
        return text
      })
    reverseCache.set(key, request)
  }
  return reverseCache.get(key)
}
```

- The cache stores the **Promise** (the "IOU" for the answer), not the answer. If two
  cards ask at the same moment, they share **one** request.
- It **never throws** — a failed lookup just means no address line, not a broken card.

#### `politely(task)` — the polite queue (max 1 request per second)

```js
function politely(task) {
  const result = nominatimQueue.then(task)
  nominatimQueue = result
    .catch(() => {})
    .then(() => new Promise((resolve) => setTimeout(resolve, NOMINATIM_GAP_MS)))
  return result
}
```

Think of a queue at a counter: each request waits for the one before it **plus 1.1
seconds**. `.catch(() => {})` makes sure one failed request can't block the queue forever.

#### `usePlaceAddress(place)` — the custom hook the card uses

```js
useEffect(() => {
  if (!needsLookup) return undefined
  let cancelled = false
  const timer = setTimeout(async () => {
    const text = await reverseGeocode(lat, lng)
    if (!cancelled) setLookup({ key, text })
  }, LOOKUP_DELAY_MS)           // 500 ms

  return () => {                // cleanup: the card changed or closed
    cancelled = true
    clearTimeout(timer)
  }
}, [needsLookup, key, lat, lng])
```

Two important tricks:

1. **Wait 500 ms before looking up.** If you swipe past a card quickly, its timer is
   cancelled and **no request is sent**. Tested: skipping 4 cards in < 1 s sent only **1**
   lookup, for the card I stopped on.
2. **Remember which place the answer belongs to** (`key`). A slow answer for the
   previous card can never appear on the current one.

It returns one of 3 states — `ready` (show text), `loading` ("Finding address…"), `none` (show nothing).

#### `googleMapsPlaceUrl(place)` — photos and reviews for free

```js
`https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},17z`
```

It searches the **name around the exact spot**, so Google shows the real listing (photos,
reviews, hours) of the branch there. `encodeURIComponent` turns `Brew & Boulder` into
`Brew%20%26%20Boulder` so the `&` doesn't break the link.

#### Safety: never trust data from the internet

Anyone can edit OpenStreetMap. A "website" could be `javascript:alert(1)`, which would run
code in our app if we used it as a link. So:

```js
export function safeWebsiteUrl(website) {
  if (!website) return null
  const url = website.trim()
  if (/^https?:\/\//i.test(url)) return url                                          // http(s) → OK
  if (!url.includes(':') && /^[\w-]+(\.[\w-]+)+/.test(url)) return `https://${url}`   // "www.kopi.my" → add https://
  return null                                                                         // anything else → blocked
}
```

`phoneLink()` keeps only digits and `+` from the first number: `"+60 3-9101 2345; …"` → `tel:+60391012345`.

#### The server change and the cache trap

`api/places.js` now also sends `addr:*`, `phone`, `website`. **But** Vercel's CDN had
already cached old answers **without** those tags, for up to 8 days. So the app adds
`v=2` to the URL:

```js
const PLACES_API_VERSION = '2'   // bump this whenever api/places.js sends new data
```

A different URL = a different cache entry, so old answers can't be served.
**Lesson:** whenever you change what a cached API returns, change its URL too.

### 4.3 Why the browser "didn't change"

PR #5 and #6 were tested but **not merged**, and both the live site and your folder use
`main`. Refreshing can't show code that isn't in `main`. After merging, Vercel rebuilt the
site in about 1 minute, and then a refresh showed the new version.

### 4.4 Merging safely, then the "busy" problem (PR #7)

#### Merging two branches safely

PR #5 and #6 were each tested **alone**. Before merging, I combined them in a temporary
copy and ran **all tests (30/30) + a build**. Only then did I merge. After the deploy I
checked that the live site's JavaScript file name was **exactly** the one from my tested
build (`index-qpvtIZ06.js`) — proof that the live site runs the tested code.

#### Then the live search failed sometimes

I measured instead of guessing:

| Test | Result |
|---|---|
| 4 new live searches | 2 OK in ~1.5 s, **2 failed (502) after 18–20 s** |
| Main Overpass server, asked directly | 1 of 3 OK · 2 × **504** (overloaded) |
| Backup mirror | 0 of 3 · one 504, two gave **no answer in 35 s** |
| Same search, 5 s after a failure | **OK in 2.6 s** |

Conclusion: the **free public server is overloaded** — not a bug in our code. But since
a second try often works, the app should **retry once** before showing an error.

#### Test first, then the fix

I wrote `services/osm.test.js` **before** changing the code. It uses a **fake `fetch`** so
the test never touches the internet:

```js
const fetch = vi
  .fn()
  .mockResolvedValueOnce(answer(502, { error: 'busy' }))   // 1st call: busy
  .mockResolvedValueOnce(answer(200, ONE_PLACE))           // 2nd call: OK
vi.stubGlobal('fetch', fetch)                               // replace the real fetch
```

On the old code, 2 tests **failed** ("called 1 time, expected 2") — proof the test detects
the missing retry. `vi.useFakeTimers()` + `vi.runAllTimersAsync()` skip the 1.5 s wait so
the test runs instantly.

#### The fix (`services/osm.js`)

```js
const BUSY_STATUSES = [502, 503, 504]
const RETRY_DELAY_MS = 1500

let response = await fetchPlaces(url)
if (BUSY_STATUSES.includes(response.status)) {
  // Busy: wait a moment and try ONE more time (never an endless loop).
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
  response = await fetchPlaces(url)
}
```

- Only "busy" answers are retried. A real mistake (400 = bad input) is **not** — retrying
  wouldn't help. The third test checks exactly that.
- **One** retry only. Endless retries would hammer an already-overloaded free server.
- `new Promise((resolve) => setTimeout(resolve, 1500))` = the standard way to "sleep" in JavaScript.

After the fix: all 3 new tests pass, 33/33 total. Merged, deployed, and a real search for
**Mid Valley** on the live site returned 25 places.

### 4.5 Clean-up

- Temporary working folders (**git worktrees**) removed.
- Merged branches deleted on your Mac and on GitHub.
- `git pull` updated your folder to `73889ec`. Your unsaved README edit and `docs/` notes were kept.

---

## 5. Key concepts cheat sheet

### React

| Concept | Meaning | Where in our code |
|---|---|---|
| Component | A function that returns UI | Every `.jsx` file |
| Props | Data passed **down** into a component | `<RestaurantCard restaurant={place} />` |
| State (`useState`) | Data that changes; changing it redraws the screen | `swipeIndex`, `rotation` |
| Lifting state up | Data used by 2 screens lives in their parent | likes + card position in `App.jsx` |
| Derived data | If you can calculate it, don't store it | `hasLanded`, `isDone` |
| Never mutate state | Make a new array/object instead | `addLike` returns `[...liked, place]` |
| `useEffect` + cleanup | Run code after drawing; undo it when leaving | `usePlaceAddress`, roulette timer |
| `useRef` | Remembers a value without redrawing | the roulette timer ID |
| Custom hook | Reusable state + logic, name starts with `use` | `useSavedCafes`, `usePlaceAddress` |
| `key` | Tells React "this is a different item" | `<RestaurantCard key={current.id} …/>` |

### JavaScript

| Concept | Meaning |
|---|---|
| `async` / `await` | Wait for something slow (like the internet) without freezing the app |
| Promise | An "IOU" for a value that arrives later |
| `try` / `catch` / `finally` | Handle errors; `finally` always runs |
| `a?.b` | "b of a — but if a is missing, give `undefined` instead of crashing" |
| `a ?? b` | "a, but if a is null/undefined, use b" |
| `[...list, item]` | A new array with one more item |
| Regular expression `/^https?:\/\//` | A text pattern — "starts with http:// or https://" |

### Web

| Concept | Meaning |
|---|---|
| CORS | Browser rule: a site may only read another site's answer if that site allows it |
| CDN cache | Copies of answers stored near users → repeat requests are instant |
| Serverless function | Server code that runs only when called (`api/places.js`) |
| Lazy loading | Download code only when needed (`import('opening_hours')`) |
| `localStorage` | Small storage inside the browser (My Cafes) — per device |
| HTTPS / secure context | Needed for GPS and for installing as an app |

### HTTP status codes we met

| Code | Meaning | Where we saw it |
|---|---|---|
| 200 | OK | Normal answers |
| 400 | Bad request (your input is wrong) | `api/places.js` rejects bad input |
| 405 | Method not allowed | `api/places.js` only accepts GET |
| 406 | Not acceptable | Overpass rejecting our live site's browser requests (the hotfix) |
| 429 | Too many requests | Free servers asking you to slow down |
| 502 | Bad gateway | Our server couldn't get an answer from Overpass |
| 504 | Gateway timeout | Overpass too busy to answer in time |

Important: **`fetch` only throws when no answer arrives at all.** A 404 or 502 does not
throw — you must check `response.ok` yourself.

### Engineering habits

| Habit | Why |
|---|---|
| One task = one branch = one PR | `main` always works; a failed idea is just a deleted branch |
| Measure before fixing | The 406 and the 502 were both found by measuring |
| Test first, see it fail | Proves the test really catches the bug |
| Pure functions for logic | Easy to test (`roulette.js`, `address.js`) |
| Never trust input | Validate on the server; only allow safe links |
| Be polite to free servers | Queue, delay, cache, retry only once |
| Verify on the **live** site | "Merged" doesn't mean "working" |

---

## 6. What the 33 tests protect

Run them with `npm test` (about 1 second).

| Test file | Tests | Protects |
|---|---|---|
| `utils/roulette.test.js` | 7 | The wheel always stops on the chosen place (sizes 1–25, every pocket); spins forward; colours; name shortening |
| `utils/address.test.js` | 13 | Address formatting; Google links; **dangerous website links are blocked**; phone links |
| `utils/results.test.js` | 7 | Only the nearest branch of a chain is "in your list"; keywords; shuffle |
| `utils/likes.test.js` | 3 | No duplicate likes (the Back-button bug) |
| `services/osm.test.js` | 3 | Retry once when busy; stop after one retry; never retry bad input |

---

## 7. Known problems and limits

| Problem | Effect | What helps |
|---|---|---|
| **Free Overpass server overloaded** (measured 15 Sep) | New areas can take ~20 s or show "busy" | Automatic retry; 1-day cache; **own database (next step)** |
| Backup mirror (maps.mail.ru) slow / not answering | Fallback rarely helps right now | Own database |
| OSM has no photos or ratings | Cards show an emoji | Google "Photos & reviews" link |
| Only ~1 in 3 places have an address | Others show "Near …" (nearest road) | Good enough to know the area |
| Only ~1 in 5 places have opening hours | Unknown places stay in the list | Users could report hours later |
| Google link may list 2 branches of a chain | Pick the one with the matching street | — |
| My Cafes is saved per device | Phone and Mac have different lists | Accounts + database later |
| Distance is a straight line | Real driving distance is longer | A routing service later |
| **`leaflet` and `react-leaflet` are installed but not used** | No effect on the app (not imported), but clutter | Use them for a mini map, or `npm uninstall leaflet react-leaflet` |
| `opening_hours` library is LGPL-3.0 | Fine for a personal/free app | Check the licence if it ever becomes a paid product |
| Vercel Hobby plan | Free for personal, non-commercial use | Paid plan if it becomes a business |
| Preview links need your Vercel login | Friends can't open previews | Share the live link instead |

---

## 8. What's next

### The big one: our own place database

Today every search asks the free public Overpass server. Real apps keep their **own copy**
of the data:

```
Weekly job:  download Malaysia OSM data (free) ──► keep only food places ──► our database
Every search:  app ──► /api/places ──► OUR database  (< 1 s, no dependency on busy servers)
                                  └──► Overpass only as a backup
```

Roughly:
1. Download the Malaysia extract of OpenStreetMap (free, updated daily by Geofabrik).
2. Filter it down to restaurants / cafes / fast food (~tens of thousands of places).
3. Store them in a database that can search by distance (e.g. Supabase = Postgres + PostGIS, free tier).
4. Change `api/places.js` to query that database.
5. A scheduled job (e.g. GitHub Actions) refreshes it every week.

Bonus: once we have our own database, we can add **our own data** — ratings from users,
reported opening hours, photos — which fixes OSM's biggest gaps over time.

### Smaller ideas

- **Installable app (PWA)** — home-screen icon, full screen.
- **Mini map on each card** — the `leaflet` library is already installed.
- **Run `npm test` automatically on every PR** (GitHub Actions).
- **Error monitoring** (e.g. Sentry) — get told when real users hit errors.
- **Accounts** — My Cafes synced between phone and Mac.

---

## 9. Everyday commands

```bash
npm run dev                  # run the app on my Mac (http://localhost:5173)
npm run dev -- --host        # also open it on my phone (same Wi-Fi)
npm test                     # run the 33 tests
npm run build                # build like Vercel does (catches errors)

git status                   # what changed? (always safe)
git diff                     # see changed lines (press q to exit)
git pull                     # get the latest main from GitHub
git switch -c feature/xyz    # new branch for a new task
git add <files>              # put changes on the "ready" list
git commit -m "message"      # save point
git push -u origin feature/xyz
gh pr create --fill          # open a Pull Request
gh pr merge <number> --merge # merge it (the live site updates in ~1 minute)
```

VS Code: the current branch is shown in the **bottom-left corner** — check it before you start.
