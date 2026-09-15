# Makan Apa? 🍜 — Development Notes
*90% AI 10%Manual*
My notes on everything built so far, what each step did, and what I learned.

- **Live app:** https://makan-picker.vercel.app
- **GitHub:** https://github.com/jimmyytai0619/makan-picker
- **Stack:** React + Vite + Tailwind CSS · OpenStreetMap data · Vercel hosting

---

## Timeline

| Date | What happened | Where |
|---|---|---|
| 10 Sep 2026 | Phase 1: project setup, 4 screens, mock data | first commit `b47e3bf` |
| 11 Sep 2026 | Learned git + GitHub, first push | — |
| 11 Sep 2026 | Phase 1.5: real map search, My Cafes, quick moods | PR #1 |
| 12 Sep 2026 | Deployed to Vercel (live on the internet) | — |
| 12 Sep 2026 | Found 3 bugs on the live site | — |
| 12 Sep 2026 | **Hotfix:** nearby search was broken on the live site | PR #3 |
| 13 Sep 2026 | Open-now filter + better navigation links | PR #2 |
| 13 Sep 2026 | Fixed duplicate likes + added automatic tests | PR #4 |

---

## 1. Phase 1 — Setup (UI shell)

**Goal:** 4 screens working with fake data, so I can see the layout.

Commands:

```bash
brew install node                                        # install Node.js + npm
npm create vite@latest makan-picker -- --template react  # create a React project
npm install                                              # download libraries into node_modules/
npm install tailwindcss @tailwindcss/vite                # add Tailwind CSS (v4)
npm run dev                                              # start the dev server (localhost:5173)
npm run dev -- --host                                    # also open it on my phone (same Wi-Fi)
```

What was built:

- 4 screens: **Filter → Swipe → Roulette → Result**
- 2 components: `RestaurantCard`, `ActionButtons`
- Data models in `models.js` (JSDoc `@typedef`, so VS Code gives autocomplete)
- 5 mock Cheras restaurants (later deleted)

What I learned:

- **Component** = a function that returns UI. **Props** = data passed down to it.
- **State** (`useState`) = data that changes; changing it re-draws the screen.
- **Lifting state up:** if 2 screens need the same data, keep it in their parent (`App.jsx`).
- **Never mutate state:** use `[...prev, item]`, not `.push()`.
- **Derived data:** if you can calculate it, don't store it in state.
- "Routing" can just be a `switch` on a `screen` state.

---

## 2. Git and GitHub

- **Git** = save points on my Mac. **GitHub** = online backup and sharing.
- A file moves: my folder → `git add` (ready list) → `git commit` (save point) → `git push` (GitHub).

First-time setup:

```bash
git config --global user.name "My Name"
git config --global user.email "me@example.com"
git init
git add .
git commit -m "first commit"
brew install gh
gh auth login
gh repo create makan-picker --private --source=. --push
```

**Branches** (how teams work):

1. Split a branch from `main` → e.g. `feature/open-now`
2. Make the change and test it
3. Open a **Pull Request (PR)** → review the changed lines, and Vercel checks the build
4. **Merge** into `main` → the live site updates automatically
5. Delete the branch

Rules: one branch = one task (it can touch several files). `main` must always work.
If an idea fails, just delete the branch; `main` is never affected.

Names: `feature/...` = new feature · `fix/...` = bug fix · `hotfix/...` = urgent fix for the live site.

---

## 3. Phase 1.5 — Real data (PR #1)

**Goal:** real cafes near a location, plus my saved IG/XHS cafes.

Why **OpenStreetMap**: free, no API key.
Trade-off: no ratings, no photos, no prices, and opening hours are often missing.

- **OpenStreetMap (OSM)** = the free world map database (like Wikipedia for maps)
- **Nominatim** = OSM's address search: "Cheras" → coordinates
- **Overpass** = OSM's search engine: "all cafes within 3 km of this point"
- Try Overpass queries on a map: https://overpass-turbo.eu

What was built:

- **Location:** type an area, or use GPS ("Use my current location")
- **Quick moods:** Anything / Work cafe / Dessert / Mamak / Fast food (`data/moods.js`)
- **My Cafes tab:** paste a cafe name + IG/XHS link, or paste many at once; search and delete
  - Stored in `localStorage` (the browser's storage), so each device has its own list
  - IG and XHS don't allow other apps to read saved posts, so pasting is the only safe way
- Saved cafes that match nearby results show first, with "❤️ In your list"
- **Result screen:** Google Maps + Waze buttons
- "Map data © OpenStreetMap contributors" in the footer (required by OSM's licence)

Bugs found and fixed while testing:

- A chain (Tealive) with 3 branches → all 3 were marked as saved → now only the **nearest** one
- Duplicate location results → removed
- "0.0 km" → now shows "40 m"
- Added an "Enough! Spin" shortcut after 2 likes

What I learned:

- **Service layer:** all map code lives in ONE file (`services/osm.js`)
- `async` / `await`, `try` / `catch` / `finally`
- Every network call needs **loading**, **error** and **empty** states
- **Never put user-typed text inside a query language** (injection)
- **Custom hook** (`useSavedCafes`) = reusable state + logic
- Be polite to free servers: cache results, don't search while typing

---

## 4. Deploy to Vercel

- vercel.com → Sign up with GitHub → Import `makan-picker` → Deploy
- Live at **https://makan-picker.vercel.app**
- **HTTPS** → GPS now works on my phone
- Every merge to `main` = automatic update of the live site (**continuous deployment**)
- Every PR gets a **preview link** (it needs my Vercel login)

---

## 5. Hotfix — Nearby search broken on the live site (PR #3)

**Problem:** on the live site, every search showed "Failed to fetch".

**Cause (found by testing each header one by one):**

| Request comes from… | Overpass answers |
|---|---|
| `localhost` (my Mac) | ✅ 200 |
| `makan-picker.vercel.app` (live site) | ❌ 406 (rejected) |
| a server | ✅ 200 |

It worked on my Mac, so we never noticed. **Lesson: always test on the real live site.**

**Fix:** the browser now asks **my own server**, and my server asks Overpass.

```
BEFORE:  Phone ──────────────► Overpass   ❌ 406
AFTER:   Phone ──► /api/places (my Vercel server) ──► Overpass  ✅
                                  └──► backup mirror (mail.ru) if the main one fails
```

Files:

- `api/places.js` — my first **serverless function** (every file in `/api` becomes a server endpoint on Vercel)
  - Checks all input (anyone on the internet can call it) → bad input = error 400
  - Tries the main Overpass server, then a **backup mirror** (fallback)
  - Sends a `User-Agent` so OSM knows which app is calling
  - **CDN cache:** the same search is answered from Vercel's cache (1.9 s → 0.33 s)
- `src/services/osm.js` — calls `/api/places`, with friendly error messages instead of "Failed to fetch"
- `vite.config.js` — runs the same server code in `npm run dev` (dev = production)
- `vercel.json` — gives the function 30 seconds (enough time to try the backup)

What I learned:

- `fetch` only **throws** when no answer arrives at all. A 404/500 does NOT throw, so check `response.ok`
- **Worktree** = a second folder for the same repo, so urgent work doesn't mix with unfinished work
- Real process: branch → fix → test → PR → check → merge → **verify live** → clean up

---

## 6. Open now + navigation (PR #2)

- `opening_hours` library reads OSM text like `Mo-Su 10:00-22:00` → open / closed / unknown
- Only **~18%** of places near me list their hours, so the filter is
  **"Hide places closed now"** (unknown places stay in the list)
- Badges: 🟢 Open now / 🔴 Closed now
- **Lazy loading:** the library is big (it would make the app 4× bigger), so it only downloads when I search
  (`import('opening_hours')`)
- Google Maps now opens **directions**, plus a new **Apple Maps** button
- On a phone, these links open the Waze / Google Maps / Apple Maps app directly

---

## 7. Bug fix — duplicate likes + automatic tests (PR #4)

**Bug:** like 2 → roulette → Back → the swipe screen restarted at card 1 →
I could like the same cafe again → it appeared twice in the roulette (double the chance).

**Cause:** the card position lived **inside** `SwipeScreen`. Leaving the screen made React forget it,
but `App` still remembered the likes.

**Fix:**

- Card position (`swipeIndex`) moved to `App.jsx` → Back continues where I stopped
- `addLike()` (`utils/likes.js`) ignores places already liked (safety net)

**Automatic tests (Vitest):**

```bash
npm test     # runs 10 tests in about 1 second
```

- `likes.test.js` — no duplicate likes
- `results.test.js` — protects older fixes (chain stores, keywords, shuffle)
- Proof the test works: I put the bug back on purpose → the test failed → restored the fix

---

## Current project structure

```
makan-picker/
├── api/places.js            ← my server function (/api/places)
├── vercel.json              ← server function settings
├── vite.config.js           ← Vite + Tailwind + dev server for /api
├── docs/PROGRESS.md         ← these notes
└── src/
    ├── App.jsx              ← app state + which screen to show + search flow
    ├── models.js            ← data shapes (Restaurant, SearchFilters, SavedCafe)
    ├── services/osm.js      ← ALL map data calls
    ├── hooks/useSavedCafes.js
    ├── data/moods.js        ← quick mood presets
    ├── utils/               ← geo, results, likes, openingHours (+ tests)
    ├── screens/             ← Filter, Saved, Swipe, Roulette, Result
    └── components/          ← RestaurantCard, ActionButtons, LocationPicker
```

---

## Command cheat sheet

```bash
npm run dev                  # run the app on my Mac
npm run dev -- --host        # also open it on my phone (same Wi-Fi)
npm run build                # check the app builds (like Vercel does)
npm test                     # run the automatic tests

git status                   # what changed? (always safe)
git diff                     # see changed lines (press q to exit)
git switch -c fix/something  # new branch for a new task
git add .                    # put all changes on the ready list
git commit -m "message"      # save point
git push -u origin fix/something   # upload the branch (first time)
gh pr create --fill          # open a Pull Request
git switch main              # go back to main
git pull                     # get the latest main from GitHub
```

VS Code tip: the current branch name is shown in the **bottom-left corner**.

---

## Decisions (and why)

| Decision | Why | Trade-off |
|---|---|---|
| OpenStreetMap, not Google Places | Free, no API key | No ratings / photos / prices |
| My own `/api/places` server | Overpass blocks my live site's browser requests | A bit more code |
| Backup mirror (mail.ru, run by VK) | Keeps search working if the main server fails | Another free public server |
| localStorage for My Cafes | No backend needed | Each device has its own list |
| Lazy-load `opening_hours` | Keeps the app small | Tiny delay on the first search |

---

## Known limits

- No ratings or photos (OSM doesn't have them)
- Only ~18% of places have opening hours
- My Cafes list doesn't sync between phone and Mac
- Distance is a straight line, not driving distance
- Free public servers can be slow or busy
- Saved names shorter than 4 letters never match (this affects some Chinese names from XHS)

---

## Next steps (ideas)

1. Make it an **installable PWA** (home screen icon, full screen)
2. Let 3 friends try it; write down what confuses them
3. **GitHub Actions:** run `npm test` automatically on every PR
4. **Error monitoring** (Sentry) to know when real users hit errors
5. **Accounts + database** (Supabase) → My Cafes synced across devices
6. Own place database from OSM data + user ratings

---

## My own notes

<!-- Write your notes here -->
