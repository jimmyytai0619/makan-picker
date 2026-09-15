# My early notes 📝

*Moved here from the old README (written on 10 Sep 2026, during Phase 1), so the README can show the finished app.*

## tree

```
makan-picker/
├── .gitignore          ← tells git what NOT to upload
├── README.md           ← the front page people see on GitHub
├── index.html          ← the one HTML page; React fills it in
├── package.json        ← project name, scripts, and library list
├── vite.config.js
└── src/
    ├── main.jsx        ← starting point: mounts <App /> into index.html
    ├── index.css
    ├── App.jsx
    ├── models.js
    ├── data/mockRestaurants.js
    ├── screens/  (Filter, Swipe, Roulette, Result)
    └── components/  (RestaurantCard, ActionButtons)
```

## OpenStreetMap(OSM) and Overpass

OpenStreetMap (OSM) is the actual database/map that holds all the information (the streets, the buildings, the cafes).

Overpass is just the search engine for that map.
