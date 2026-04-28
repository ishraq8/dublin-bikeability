# Dublin Bikeability Scorer — Design Spec
**Date:** 2026-04-28  
**Status:** Approved

---

## Overview

A two-part system: a one-time Python scoring pipeline that computes bikeability scores for every Dublin City Schools (DCS) neighborhood to each of the three DCS high schools, and a React + Leaflet dashboard that visualizes those scores.

---

## Schools

| School | Address | Lat | Lng | Color |
|---|---|---|---|---|
| Dublin Scioto | 4000 Hard Rd, Dublin OH | 40.0978 | -83.0742 | `#8B1A1A` |
| Dublin Coffman | 6780 Coffman Rd, Dublin OH | 40.0934 | -83.1089 | `#1A5C2A` |
| Dublin Jerome | 8300 Hyland Croy Rd, Dublin OH | 40.1312 | -83.1102 | `#0D3B7A` |

---

## Scoring Model

**Hard cutoff:** Routes > 4 miles → `score: null`, labeled Non-Bikeable.

**Score formula (0–100, within 4 miles):**

| Component | Weight | Description |
|---|---|---|
| Trail coverage | 40% | % of route on dedicated shared-use path / cycleway |
| Distance | 25% | ≤1 mi scores max, tapers linearly to 0 at 4 mi |
| Arterial crossings | 25% | Each crossing of Sawmill Rd, SR-161, Avery Rd, Hyland Croy Rd, or Hard Rd subtracts from score |
| Terrain | 10% | Total elevation gain penalizes score |

**Grade scale:**

| Grade | Score Range | Color |
|---|---|---|
| A | 80–100 | `#16a34a` |
| B | 65–79 | `#65a30d` |
| C | 50–64 | `#ca8a04` |
| D | 35–49 | `#ea580c` |
| F | 1–34 | `#dc2626` |
| ✕ | Non-Bikeable | `#9ca3af` |

---

## Architecture & Data Flow

```
neighborhoods.txt          (one neighborhood name per line — user-supplied)
        │
        ▼
build_graph.py  ──────────►  data/dublin_graph.graphml   (cached osmnx graph, skip if exists)
        │
build_centroids.py ────────►  data/centroids.json        (geocoded via Nominatim)
        │
build_scores.py  ──────────►  data/scores.json           (final scored output)
                                      │
                                      ▼
                              src/data/scores.json        (copied for Vite static asset)
```

---

## Python Pipeline

### Stage 1 — `build_graph.py`
- Downloads osmnx bike-legal graph for bounding box: `40.05–40.20 lat, -83.20 to -83.00 lng`
- Network types: `walk` + `bike`
- Keeps edges tagged as: `path`, `cycleway`, `footway`, `residential`, `unclassified`, `tertiary`
- Saves to `data/dublin_graph.graphml`
- Skips download if file already exists (idempotent)

### Stage 2 — `build_centroids.py`
- Reads `neighborhoods.txt` (one name per line)
- For each name: queries Nominatim with `"{name}, Dublin, OH"`
- Falls back to `"{name}, Ohio"` if no result
- Saves `data/centroids.json`: `[{name, lat, lng, geocode_query, geocode_confidence}]`
- Logs failed lookups to stderr for manual correction

### Stage 3 — `build_scores.py`
- Loads `dublin_graph.graphml` and `centroids.json`
- Edge weights: paved shared-use path = 1.0, cycleway = 0.8, residential = 0.5, arterial = 0.2
- For each neighborhood × school pair:
  - Snaps centroid to nearest graph node
  - Runs Dijkstra shortest path (NetworkX)
  - Extracts: distance in miles, trail%, arterial crossing count (by road name match), elevation delta (SRTM via `elevation` or `rasterio`)
  - Applies score formula; sets `null` if > 4 miles
- Writes `data/scores.json`

### Output schema (`scores.json`)
```json
[
  {
    "id": "brandon",
    "name": "Brandon / Brandonway",
    "region": "Dublin City",
    "current_hs": "coffman",
    "redistricting": false,
    "lat": 40.0921,
    "lng": -83.1048,
    "includes": ["Brandon", "Brandonway"],
    "schools": {
      "scioto":  { "score": 74, "distanceMi": 1.8, "trailPct": 70, "crossings": 1, "elevationGainM": 12, "routeCoords": [[40.09, -83.10, "path"], [40.092, -83.105, "residential"]] },
      "coffman": { "score": 91, "distanceMi": 0.7, "trailPct": 85, "crossings": 0, "elevationGainM": 8,  "routeCoords": [[40.09, -83.10, "path"]] },
      "jerome":  { "score": null, "distanceMi": 6.2, "trailPct": 38, "crossings": 3, "elevationGainM": 31, "routeCoords": null }
    }
  }
]
```

---

## React Dashboard

### Tech Stack
- React 18 + Vite
- react-leaflet v4 + leaflet (OpenStreetMap tiles — no API key)
- Tailwind CSS for layout
- Inline styles for dynamic school colors
- `scores.json` loaded as static Vite asset

### Layout
```
┌─────────────────────────────────────────────────────┐
│  HEADER (60px): Title │ [Scioto] [Coffman] [Jerome] │
├──────────────┬──────────────────────────────────────┤
│  LIST (380px)│  LEAFLET MAP (flex)                  │
│  scrollable  │                                      │
│              │                                      │
├──────────────┴──────────────────────────────────────┤
│  SCORE BREAKDOWN BAR (collapsed when none selected) │
└─────────────────────────────────────────────────────┘
```

### State
- `activeSchool`: `"scioto" | "coffman" | "jerome"` — lifted to `App.jsx`
- `selectedNeighborhood`: id string or `null` — lifted to `App.jsx`

### Components

**`SchoolTabs.jsx`**  
Three tab buttons. Active tab background = school color, white text. Clicking switches `activeSchool`.

**`NeighborhoodList.jsx`**  
Sorted by score descending for active school. Non-Bikeable entries pinned to bottom, greyed out. Each row:
- `GradeBadge` colored pill (A/B/C/D/F/✕)
- Neighborhood name
- Score number
- Distance + trail% in small monospace text
- Thin trail-coverage progress bar
- `REDIST.` badge if `redistricting: true`

Click → sets `selectedNeighborhood`, map flies to centroid.

**`BikeMap.jsx`**  
- OSM tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Center: `[40.113, -83.113]`, zoom 12
- Circle markers at each centroid: color by grade, radius proportional to score; selected neighborhood gets larger ring
- School pins: custom icon in school color, always visible
- On selection: polyline of `routeCoords` for active school, segments colored by edge type (green = path, yellow = residential, orange = arterial)
- Popup card on selected neighborhood: name, score, distance, trail%, crossings

**`ScoreBreakdown.jsx`**  
Four mini bars showing component contribution (Trail / Distance / Crossings / Terrain). Subdivision list from `includes[]`. Collapsed/hidden when no neighborhood selected.

**`GradeBadge.jsx`**  
Colored pill: A/B/C/D/F/✕. Colors from grade scale above.

### Mock Data
Three hardcoded neighborhoods covering all tiers:
- One A-grade (close, high trail coverage)
- One C-grade (moderate distance, some crossings)
- One Non-Bikeable (> 4 miles to all schools)

---

## File Structure

```
dublin-bikeability/
  data/
    neighborhoods.txt          ← user-supplied neighborhood names
    build_graph.py             ← Stage 1: download + cache osmnx graph
    build_centroids.py         ← Stage 2: geocode names → centroids.json
    build_scores.py            ← Stage 3: routing + scoring → scores.json
    dublin_graph.graphml       ← generated (gitignored, large)
    centroids.json             ← generated
    scores.json                ← generated, copied to src/data/
  src/
    App.jsx
    components/
      SchoolTabs.jsx
      NeighborhoodList.jsx
      BikeMap.jsx
      ScoreBreakdown.jsx
      GradeBadge.jsx
    utils/
      scoring.js               ← mirrors Python scoring formula
      colors.js                ← grade colors, school colors
    data/
      scores.json              ← static asset (copy of data/scores.json)
  index.html
  vite.config.js
  package.json
  README.md
```

---

## Dependencies

### Python
- `osmnx` — road graph download
- `networkx` — Dijkstra routing
- `geopandas` — spatial operations
- `geopy` — Nominatim geocoding
- `elevation` or `rasterio` + SRTM tiles — terrain data
- `requests` — HTTP fallback

### JavaScript
- `react`, `react-dom`
- `react-leaflet`, `leaflet`
- `vite`
- `tailwindcss`

---

## What Is NOT in Scope
- Live/on-demand recomputation (pipeline is one-time)
- User-uploaded CSV (names are hardcoded in `neighborhoods.txt`)
- Authentication or backend API
- Mobile-specific layout
