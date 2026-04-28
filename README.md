# Dublin Bikeability Scorer

Bikeability scores for Dublin City Schools (DCS) neighborhoods to each of the three DCS high schools.

## Quick Start

### 1. Run the React dashboard (mock data)

```bash
npm install
npm run dev
```

Open http://localhost:5173/dublin-bikeability/

### 2. Run the Python pipeline (real data)

Install Python deps:

```bash
pip install -r data/requirements.txt
```

Add neighborhood names (one per line) to `data/neighborhoods.txt`, then run each stage:

```bash
# Stage 1: download + cache the osmnx graph (~2–5 min, runs once)
python data/build_graph.py

# Stage 2: geocode neighborhood names to lat/lng centroids
python data/build_centroids.py

# Stage 3: compute bikeability scores
python data/build_scores.py
```

The pipeline automatically copies `data/scores.json` → `src/data/scores.json`. Restart `npm run dev` to see real data.

## Scoring Model

| Component | Weight | Description |
|---|---|---|
| Trail coverage | 40% | % of route on shared-use path or cycleway |
| Distance | 25% | ≤1 mi = max; 4 mi = 0; linear taper |
| Arterial crossings | 25% | Each crossing of Sawmill, SR-161, Avery, Hyland Croy, Hard Rd = −25 pts |
| Terrain | 10% | Elevation gain in meters (50 m = 0 pts) |

Routes > 4 miles are Non-Bikeable (null score).

## Schools

| School | Address | Color |
|---|---|---|
| Dublin Scioto | 4000 Hard Rd | `#8B1A1A` |
| Dublin Coffman | 6780 Coffman Rd | `#1A5C2A` |
| Dublin Jerome | 8300 Hyland Croy Rd | `#0D3B7A` |

## Deploy to GitHub Pages

```bash
git push origin main
```

Then go to **Settings → Pages → Source: GitHub Actions**. The app deploys automatically on every push to `main` at:

```
https://<your-github-username>.github.io/dublin-bikeability/
```
