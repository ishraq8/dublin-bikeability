# Dublin Bikeability Scorer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-phase system: a React + Leaflet dashboard that visualizes DCS neighborhood bikeability scores (Phase 1, on mock data), then a Python pipeline that computes real scores from osmnx routing and writes the JSON the dashboard consumes (Phase 2).

**Architecture:** The Python pipeline runs once, writing `data/scores.json` which is copied to `src/data/scores.json` for Vite to serve as a static asset. The React app reads that file at build time — no backend, no API. The dashboard has two lifted state variables (`activeSchool`, `selectedNeighborhood`) in `App.jsx` that drive all child components.

**Tech Stack:** React 18, Vite, react-leaflet v4, Leaflet, Tailwind CSS v3, Vitest, @testing-library/react (frontend); Python 3.10+, osmnx, networkx, geopandas, geopy, srtm, pytest (pipeline).

---

## File Map

```
dublin-bikeability/
  data/
    neighborhoods.txt          ← one neighborhood name per line (user-fills)
    build_graph.py             ← Stage 1: download + cache osmnx graph
    build_centroids.py         ← Stage 2: geocode → centroids.json
    build_scores.py            ← Stage 3: route + score → scores.json
    requirements.txt           ← Python deps
    tests/
      test_scoring.py
      test_centroids.py
  src/
    main.jsx                   ← React entry, imports Leaflet CSS
    App.jsx                    ← layout shell, lifts state
    data/
      scores.json              ← static asset (copy of data/scores.json)
    components/
      GradeBadge.jsx           ← colored A/B/C/D/F/✕ pill
      SchoolTabs.jsx           ← three school tab buttons
      NeighborhoodList.jsx     ← ranked scrollable list
      BikeMap.jsx              ← Leaflet map + markers + route overlay
      ScoreBreakdown.jsx       ← four component bars + subdivision list
    utils/
      colors.js                ← SCHOOL_COLORS, GRADE_COLORS, ROUTE_COLORS
      scoring.js               ← computeScore, getGrade, computeComponentScores
    test/
      scoring.test.js
      GradeBadge.test.jsx
      SchoolTabs.test.jsx
      NeighborhoodList.test.jsx
  index.html
  vite.config.js
  tailwind.config.js
  postcss.config.js
  src/test-setup.js
  package.json
  .gitignore
  README.md
```

---

## Phase 1: React Dashboard

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/test-setup.js`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "dublin-bikeability",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^15.0.6",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.0.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
});
```

- [ ] **Step 3: Create `tailwind.config.js`**

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 4: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dublin Bikeability</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Create `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  margin: 0;
  overflow: hidden;
}
```

- [ ] **Step 8: Create `src/test-setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules/
dist/
data/dublin_graph.graphml
data/centroids.json
data/scores.json
__pycache__/
*.pyc
.env
```

- [ ] **Step 10: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 11: Commit**

```bash
git init
git add package.json vite.config.js tailwind.config.js postcss.config.js index.html src/main.jsx src/index.css src/test-setup.js .gitignore
git commit -m "feat: scaffold React + Vite project"
```

---

### Task 2: Utility Files + Tests

**Files:**
- Create: `src/utils/colors.js`
- Create: `src/utils/scoring.js`
- Create: `src/test/scoring.test.js`

- [ ] **Step 1: Create `src/utils/colors.js`**

```js
export const SCHOOL_COLORS = {
  scioto:  '#8B1A1A',
  coffman: '#1A5C2A',
  jerome:  '#0D3B7A',
};

export const SCHOOL_NAMES = {
  scioto:  'Dublin Scioto',
  coffman: 'Dublin Coffman',
  jerome:  'Dublin Jerome',
};

export const GRADE_COLORS = {
  A: '#16a34a',
  B: '#65a30d',
  C: '#ca8a04',
  D: '#ea580c',
  F: '#dc2626',
  X: '#9ca3af',
};

export const ROUTE_COLORS = {
  path:        '#16a34a',
  cycleway:    '#16a34a',
  residential: '#ca8a04',
  arterial:    '#ea580c',
};
```

- [ ] **Step 2: Create `src/utils/scoring.js`**

```js
import { GRADE_COLORS } from './colors.js';

export function computeScore(distanceMi, trailPct, crossings, elevationGainM) {
  if (distanceMi > 4) return null;
  const distanceScore = distanceMi <= 1
    ? 100
    : ((4 - distanceMi) / 3) * 100;
  const crossingScore = Math.max(0, 100 - crossings * 25);
  const terrainScore  = Math.max(0, 100 - elevationGainM * 2);
  return Math.round(
    trailPct      * 0.40 +
    distanceScore * 0.25 +
    crossingScore * 0.25 +
    terrainScore  * 0.10
  );
}

export function getGrade(score) {
  if (score === null) return 'X';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export function getGradeColor(score) {
  return GRADE_COLORS[getGrade(score)];
}

export function computeComponentScores(schoolData) {
  if (!schoolData || schoolData.score === null) return null;
  const { distanceMi, trailPct, crossings, elevationGainM } = schoolData;
  const distanceScore = distanceMi <= 1
    ? 100
    : ((4 - distanceMi) / 3) * 100;
  const crossingScore = Math.max(0, 100 - crossings * 25);
  const terrainScore  = Math.max(0, 100 - elevationGainM * 2);
  return {
    trail:     Math.round(trailPct      * 0.40),
    distance:  Math.round(distanceScore * 0.25),
    crossings: Math.round(crossingScore * 0.25),
    terrain:   Math.round(terrainScore  * 0.10),
  };
}
```

- [ ] **Step 3: Write failing tests in `src/test/scoring.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { computeScore, getGrade, computeComponentScores } from '../utils/scoring.js';

describe('computeScore', () => {
  it('returns null for distance > 4 miles', () => {
    expect(computeScore(4.1, 80, 0, 0)).toBeNull();
    expect(computeScore(10, 100, 0, 0)).toBeNull();
  });

  it('gives distance score of 100 when <= 1 mile', () => {
    // 100% trail, 0.5mi, 0 crossings, 0 elevation
    // score = 100*0.4 + 100*0.25 + 100*0.25 + 100*0.10 = 100
    expect(computeScore(0.5, 100, 0, 0)).toBe(100);
  });

  it('tapers distance score linearly from 1mi to 4mi', () => {
    // 0 trail, 2.5mi = (4-2.5)/3*100 = 50, 0 crossings, 0 elevation
    // score = 0*0.4 + 50*0.25 + 100*0.25 + 100*0.10 = 0 + 12.5 + 25 + 10 = 47.5 → 48
    expect(computeScore(2.5, 0, 0, 0)).toBe(48);
  });

  it('penalizes each arterial crossing by 25 points', () => {
    // 100% trail, 0.5mi, 2 crossings (→50), 0 elevation
    // score = 100*0.4 + 100*0.25 + 50*0.25 + 100*0.10 = 40+25+12.5+10 = 87.5 → 88
    expect(computeScore(0.5, 100, 2, 0)).toBe(88);
  });

  it('clamps crossing score to 0 for 4+ crossings', () => {
    expect(computeScore(0.5, 0, 4, 0)).toBe(Math.round(0*0.4 + 100*0.25 + 0*0.25 + 100*0.10));
    // = 0 + 25 + 0 + 10 = 35
    expect(computeScore(0.5, 0, 4, 0)).toBe(35);
  });

  it('penalizes elevation gain', () => {
    // 100% trail, 0.5mi, 0 crossings, 30m elevation → terrain = 100-60 = 40
    // score = 100*0.4 + 100*0.25 + 100*0.25 + 40*0.10 = 40+25+25+4 = 94
    expect(computeScore(0.5, 100, 0, 30)).toBe(94);
  });

  it('clamps terrain score to 0 for elevation >= 50m', () => {
    // terrain = max(0, 100 - 50*2) = 0
    // score = 0*0.4 + 100*0.25 + 100*0.25 + 0*0.10 = 0+25+25+0 = 50
    expect(computeScore(0.5, 0, 0, 50)).toBe(50);
  });
});

describe('getGrade', () => {
  it('returns X for null score', () => expect(getGrade(null)).toBe('X'));
  it('returns A for 80+', () => expect(getGrade(80)).toBe('A'));
  it('returns A for 100', () => expect(getGrade(100)).toBe('A'));
  it('returns B for 65–79', () => expect(getGrade(72)).toBe('B'));
  it('returns C for 50–64', () => expect(getGrade(55)).toBe('C'));
  it('returns D for 35–49', () => expect(getGrade(40)).toBe('D'));
  it('returns F for < 35', () => expect(getGrade(20)).toBe('F'));
});

describe('computeComponentScores', () => {
  it('returns null for non-bikeable', () => {
    expect(computeComponentScores({ score: null, distanceMi: 5, trailPct: 50, crossings: 2, elevationGainM: 10 })).toBeNull();
  });

  it('returns four weighted component scores', () => {
    const result = computeComponentScores({ score: 95, distanceMi: 0.5, trailPct: 100, crossings: 0, elevationGainM: 0 });
    expect(result).toEqual({ trail: 40, distance: 25, crossings: 25, terrain: 10 });
  });
});
```

- [ ] **Step 4: Run tests — expect them to fail**

```bash
npm test
```

Expected: FAIL — `computeScore` not defined yet (the file exists but may have import issues). Actually since we already wrote scoring.js, tests should PASS here. If any fail, check the math in the assertions.

- [ ] **Step 5: Verify all tests pass**

Expected output:
```
✓ src/test/scoring.test.js (12)
Test Files  1 passed (1)
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/colors.js src/utils/scoring.js src/test/scoring.test.js
git commit -m "feat: add scoring utilities and tests"
```

---

### Task 3: Mock Scores Data

**Files:**
- Create: `src/data/scores.json`

- [ ] **Step 1: Create `src/data/scores.json`**

Three neighborhoods covering all grade tiers. Scores computed using the formula from `scoring.js`.

```json
[
  {
    "id": "muirfield",
    "name": "Muirfield Village",
    "region": "Dublin City",
    "current_hs": "coffman",
    "redistricting": false,
    "lat": 40.0900,
    "lng": -83.1100,
    "includes": ["Muirfield Village"],
    "schools": {
      "scioto": {
        "score": 67,
        "distanceMi": 2.3,
        "trailPct": 65,
        "crossings": 1,
        "elevationGainM": 12,
        "routeCoords": [
          [40.0900, -83.1100, "path"],
          [40.0920, -83.1060, "path"],
          [40.0945, -83.0980, "residential"],
          [40.0965, -83.0870, "arterial"],
          [40.0978, -83.0742, "arterial"]
        ]
      },
      "coffman": {
        "score": 95,
        "distanceMi": 0.4,
        "trailPct": 90,
        "crossings": 0,
        "elevationGainM": 4,
        "routeCoords": [
          [40.0900, -83.1100, "path"],
          [40.0915, -83.1095, "path"],
          [40.0934, -83.1089, "path"]
        ]
      },
      "jerome": {
        "score": null,
        "distanceMi": 5.8,
        "trailPct": 42,
        "crossings": 3,
        "elevationGainM": 28,
        "routeCoords": null
      }
    }
  },
  {
    "id": "ballantrae",
    "name": "Ballantrae",
    "region": "Dublin City",
    "current_hs": "jerome",
    "redistricting": true,
    "lat": 40.1180,
    "lng": -83.1350,
    "includes": ["Ballantrae", "Ballantrae Falls"],
    "schools": {
      "scioto": {
        "score": 30,
        "distanceMi": 3.6,
        "trailPct": 38,
        "crossings": 3,
        "elevationGainM": 22,
        "routeCoords": [
          [40.1180, -83.1350, "residential"],
          [40.1100, -83.1200, "arterial"],
          [40.1050, -83.1050, "arterial"],
          [40.0978, -83.0742, "arterial"]
        ]
      },
      "coffman": {
        "score": 57,
        "distanceMi": 2.1,
        "trailPct": 55,
        "crossings": 2,
        "elevationGainM": 18,
        "routeCoords": [
          [40.1180, -83.1350, "path"],
          [40.1100, -83.1300, "path"],
          [40.1020, -83.1200, "residential"],
          [40.0934, -83.1089, "residential"]
        ]
      },
      "jerome": {
        "score": 78,
        "distanceMi": 1.5,
        "trailPct": 75,
        "crossings": 1,
        "elevationGainM": 10,
        "routeCoords": [
          [40.1180, -83.1350, "path"],
          [40.1230, -83.1280, "path"],
          [40.1280, -83.1180, "residential"],
          [40.1312, -83.1102, "residential"]
        ]
      }
    }
  },
  {
    "id": "tartan",
    "name": "Tartan Fields",
    "region": "Union County",
    "current_hs": "jerome",
    "redistricting": false,
    "lat": 40.1650,
    "lng": -83.1500,
    "includes": ["Tartan Fields"],
    "schools": {
      "scioto": {
        "score": null,
        "distanceMi": 7.2,
        "trailPct": 15,
        "crossings": 4,
        "elevationGainM": 45,
        "routeCoords": null
      },
      "coffman": {
        "score": null,
        "distanceMi": 5.9,
        "trailPct": 22,
        "crossings": 3,
        "elevationGainM": 38,
        "routeCoords": null
      },
      "jerome": {
        "score": null,
        "distanceMi": 4.3,
        "trailPct": 35,
        "crossings": 2,
        "elevationGainM": 31,
        "routeCoords": null
      }
    }
  }
]
```

- [ ] **Step 2: Verify mock scores against formula manually**

Muirfield–Coffman: trailPct=90, distanceMi=0.4 (≤1→100), crossings=0 (→100), elevation=4 (→92)
= 90×0.4 + 100×0.25 + 100×0.25 + 92×0.10 = 36+25+25+9.2 = 95.2 → **95** ✓

Ballantrae–Coffman: trailPct=55, distanceMi=2.1 (→63.3), crossings=2 (→50), elevation=18 (→64)
= 55×0.4 + 63.3×0.25 + 50×0.25 + 64×0.10 = 22+15.8+12.5+6.4 = 56.7 → **57** ✓

- [ ] **Step 3: Commit**

```bash
git add src/data/scores.json
git commit -m "feat: add mock scores data for three neighborhoods"
```

---

### Task 4: GradeBadge Component + Test

**Files:**
- Create: `src/components/GradeBadge.jsx`
- Create: `src/test/GradeBadge.test.jsx`

- [ ] **Step 1: Write failing test in `src/test/GradeBadge.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GradeBadge from '../components/GradeBadge.jsx';

describe('GradeBadge', () => {
  it('shows A for score 85', () => {
    render(<GradeBadge score={85} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows ✕ for null score', () => {
    render(<GradeBadge score={null} />);
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('shows F for score 20', () => {
    render(<GradeBadge score={20} />);
    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('applies green background for A grade', () => {
    const { container } = render(<GradeBadge score={90} />);
    const badge = container.firstChild;
    expect(badge.style.backgroundColor).toBe('rgb(22, 163, 74)'); // #16a34a
  });

  it('applies grey background for non-bikeable', () => {
    const { container } = render(<GradeBadge score={null} />);
    const badge = container.firstChild;
    expect(badge.style.backgroundColor).toBe('rgb(156, 163, 175)'); // #9ca3af
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- GradeBadge
```

Expected: FAIL with `Cannot find module '../components/GradeBadge.jsx'`

- [ ] **Step 3: Create `src/components/GradeBadge.jsx`**

```jsx
import { getGrade, getGradeColor } from '../utils/scoring.js';

export default function GradeBadge({ score }) {
  const grade = getGrade(score);
  const color = getGradeColor(score);
  return (
    <span
      style={{ backgroundColor: color }}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold flex-shrink-0"
    >
      {grade === 'X' ? '✕' : grade}
    </span>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- GradeBadge
```

Expected: `✓ src/test/GradeBadge.test.jsx (5)`

- [ ] **Step 5: Commit**

```bash
git add src/components/GradeBadge.jsx src/test/GradeBadge.test.jsx
git commit -m "feat: add GradeBadge component"
```

---

### Task 5: SchoolTabs Component + Test

**Files:**
- Create: `src/components/SchoolTabs.jsx`
- Create: `src/test/SchoolTabs.test.jsx`

- [ ] **Step 1: Write failing test in `src/test/SchoolTabs.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SchoolTabs from '../components/SchoolTabs.jsx';

const schools = ['scioto', 'coffman', 'jerome'];

describe('SchoolTabs', () => {
  it('renders three tab buttons', () => {
    render(<SchoolTabs active="scioto" onChange={() => {}} />);
    expect(screen.getByText('Dublin Scioto')).toBeInTheDocument();
    expect(screen.getByText('Dublin Coffman')).toBeInTheDocument();
    expect(screen.getByText('Dublin Jerome')).toBeInTheDocument();
  });

  it('calls onChange with school key when tab clicked', () => {
    const onChange = vi.fn();
    render(<SchoolTabs active="scioto" onChange={onChange} />);
    fireEvent.click(screen.getByText('Dublin Coffman'));
    expect(onChange).toHaveBeenCalledWith('coffman');
  });

  it('applies school color background to active tab', () => {
    const { rerender } = render(<SchoolTabs active="scioto" onChange={() => {}} />);
    const sciotoBtn = screen.getByText('Dublin Scioto').closest('button');
    expect(sciotoBtn.style.backgroundColor).toBe('rgb(139, 26, 26)'); // #8B1A1A

    rerender(<SchoolTabs active="coffman" onChange={() => {}} />);
    const coffmanBtn = screen.getByText('Dublin Coffman').closest('button');
    expect(coffmanBtn.style.backgroundColor).toBe('rgb(26, 92, 42)'); // #1A5C2A
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- SchoolTabs
```

Expected: FAIL with `Cannot find module '../components/SchoolTabs.jsx'`

- [ ] **Step 3: Create `src/components/SchoolTabs.jsx`**

```jsx
import { SCHOOL_COLORS, SCHOOL_NAMES } from '../utils/colors.js';

const SCHOOLS = ['scioto', 'coffman', 'jerome'];

export default function SchoolTabs({ active, onChange }) {
  return (
    <div className="flex gap-1">
      {SCHOOLS.map((school) => {
        const isActive = school === active;
        return (
          <button
            key={school}
            onClick={() => onChange(school)}
            style={{
              backgroundColor: isActive ? SCHOOL_COLORS[school] : 'transparent',
              borderColor: SCHOOL_COLORS[school],
              color: isActive ? 'white' : SCHOOL_COLORS[school],
            }}
            className="px-4 py-1.5 rounded border-2 text-sm font-semibold transition-colors"
          >
            {SCHOOL_NAMES[school]}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- SchoolTabs
```

Expected: `✓ src/test/SchoolTabs.test.jsx (3)`

- [ ] **Step 5: Commit**

```bash
git add src/components/SchoolTabs.jsx src/test/SchoolTabs.test.jsx
git commit -m "feat: add SchoolTabs component"
```

---

### Task 6: App.jsx Layout Shell

**Files:**
- Create: `src/App.jsx`

- [ ] **Step 1: Create `src/App.jsx`**

```jsx
import { useState } from 'react';
import scores from './data/scores.json';
import SchoolTabs from './components/SchoolTabs.jsx';
import NeighborhoodList from './components/NeighborhoodList.jsx';
import BikeMap from './components/BikeMap.jsx';
import ScoreBreakdown from './components/ScoreBreakdown.jsx';

export default function App() {
  const [activeSchool, setActiveSchool] = useState('coffman');
  const [selectedId, setSelectedId] = useState(null);

  const selected = scores.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 bg-white border-b border-gray-200 flex-shrink-0" style={{ height: 60 }}>
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
          Dublin Bikeability
        </h1>
        <SchoolTabs active={activeSchool} onChange={setActiveSchool} />
      </header>

      {/* Main: list + map */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white" style={{ width: 380 }}>
          <NeighborhoodList
            neighborhoods={scores}
            activeSchool={activeSchool}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>
        <main className="flex-1">
          <BikeMap
            neighborhoods={scores}
            activeSchool={activeSchool}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </main>
      </div>

      {/* Score breakdown bar */}
      {selected && (
        <footer className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
          <ScoreBreakdown neighborhood={selected} activeSchool={activeSchool} />
        </footer>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add App layout shell with lifted state"
```

---

### Task 7: NeighborhoodList Component + Test

**Files:**
- Create: `src/components/NeighborhoodList.jsx`
- Create: `src/test/NeighborhoodList.test.jsx`

- [ ] **Step 1: Write failing test in `src/test/NeighborhoodList.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NeighborhoodList from '../components/NeighborhoodList.jsx';

const mockNeighborhoods = [
  {
    id: 'alpha', name: 'Alpha', region: 'Dublin City',
    redistricting: false, lat: 40.09, lng: -83.11,
    includes: ['Alpha'],
    schools: {
      coffman: { score: 85, distanceMi: 0.8, trailPct: 80, crossings: 0, elevationGainM: 5, routeCoords: [] },
      scioto:  { score: 55, distanceMi: 2.0, trailPct: 50, crossings: 1, elevationGainM: 10, routeCoords: [] },
      jerome:  { score: null, distanceMi: 5.0, trailPct: 20, crossings: 3, elevationGainM: 30, routeCoords: null },
    },
  },
  {
    id: 'beta', name: 'Beta', region: 'Dublin City',
    redistricting: true, lat: 40.10, lng: -83.12,
    includes: ['Beta'],
    schools: {
      coffman: { score: null, distanceMi: 4.5, trailPct: 30, crossings: 3, elevationGainM: 25, routeCoords: null },
      scioto:  { score: null, distanceMi: 5.5, trailPct: 10, crossings: 4, elevationGainM: 40, routeCoords: null },
      jerome:  { score: 72, distanceMi: 1.2, trailPct: 70, crossings: 1, elevationGainM: 8, routeCoords: [] },
    },
  },
];

describe('NeighborhoodList', () => {
  it('renders all neighborhoods', () => {
    render(<NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows non-bikeable neighborhoods below scored ones', () => {
    const { container } = render(
      <NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={() => {}} />
    );
    const rows = container.querySelectorAll('[data-testid="neighborhood-row"]');
    expect(rows[0].textContent).toContain('Alpha');
    expect(rows[1].textContent).toContain('Beta');
  });

  it('calls onSelect with neighborhood id when row clicked', () => {
    const onSelect = vi.fn();
    render(<NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onSelect).toHaveBeenCalledWith('alpha');
  });

  it('shows REDIST. badge for redistricting neighborhoods', () => {
    render(<NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('REDIST.')).toBeInTheDocument();
  });

  it('shows distance and trail% in each row', () => {
    render(<NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText(/0\.8 mi/)).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- NeighborhoodList
```

Expected: FAIL — component not defined.

- [ ] **Step 3: Create `src/components/NeighborhoodList.jsx`**

```jsx
import GradeBadge from './GradeBadge.jsx';

export default function NeighborhoodList({ neighborhoods, activeSchool, selectedId, onSelect }) {
  const scored = neighborhoods
    .filter((n) => n.schools[activeSchool].score !== null)
    .sort((a, b) => b.schools[activeSchool].score - a.schools[activeSchool].score);
  const nonBikeable = neighborhoods.filter((n) => n.schools[activeSchool].score === null);
  const sorted = [...scored, ...nonBikeable];

  return (
    <div>
      {sorted.map((n) => {
        const s = n.schools[activeSchool];
        const isNonBikeable = s.score === null;
        const isSelected = n.id === selectedId;

        return (
          <div
            key={n.id}
            data-testid="neighborhood-row"
            onClick={() => onSelect(n.id)}
            className={[
              'flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-gray-100 hover:bg-gray-50',
              isSelected ? 'bg-blue-50' : '',
              isNonBikeable ? 'opacity-50' : '',
            ].join(' ')}
          >
            <GradeBadge score={s.score} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-800 truncate">{n.name}</span>
                {n.redistricting && (
                  <span className="text-[10px] font-bold text-orange-600 border border-orange-400 rounded px-1">
                    REDIST.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-gray-500">
                  {s.distanceMi.toFixed(1)} mi · {s.trailPct}% trail
                </span>
              </div>
              {!isNonBikeable && (
                <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.trailPct}%`, backgroundColor: '#16a34a' }}
                  />
                </div>
              )}
            </div>

            {s.score !== null && (
              <span className="text-sm font-bold text-gray-700 flex-shrink-0">{s.score}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- NeighborhoodList
```

Expected: `✓ src/test/NeighborhoodList.test.jsx (5)`

- [ ] **Step 5: Commit**

```bash
git add src/components/NeighborhoodList.jsx src/test/NeighborhoodList.test.jsx
git commit -m "feat: add NeighborhoodList component"
```

---

### Task 8: BikeMap — Base Map + Markers

**Files:**
- Create: `src/components/BikeMap.jsx`

No automated test for Leaflet (jsdom does not support canvas/WebGL). Test manually in browser.

- [ ] **Step 1: Create `src/components/BikeMap.jsx`**

```jsx
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getGrade, getGradeColor } from '../utils/scoring.js';
import { SCHOOL_COLORS, SCHOOL_NAMES, ROUTE_COLORS } from '../utils/colors.js';

const SCHOOLS = [
  { key: 'scioto',  lat: 40.0978, lng: -83.0742 },
  { key: 'coffman', lat: 40.0934, lng: -83.1089 },
  { key: 'jerome',  lat: 40.1312, lng: -83.1102 },
];

function FlyToHandler({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1 });
  }, [center, map]);
  return null;
}

function SchoolMarker({ school }) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      background:${SCHOOL_COLORS[school.key]};
      color:white;
      border-radius:50%;
      width:28px;height:28px;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4)">🏫</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  // Use L.marker directly inside useEffect to avoid react-leaflet DivIcon issues
  return null; // rendered via SchoolLayer below
}

function SchoolLayer() {
  const map = useMap();
  useEffect(() => {
    const markers = SCHOOLS.map((school) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${SCHOOL_COLORS[school.key]};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)">🏫</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      return L.marker([school.lat, school.lng], { icon })
        .bindTooltip(SCHOOL_NAMES[school.key], { permanent: false })
        .addTo(map);
    });
    return () => markers.forEach((m) => m.remove());
  }, [map]);
  return null;
}

function RouteLayer({ routeCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!routeCoords || routeCoords.length < 2) return;
    const layers = buildRouteSegments(routeCoords).map(({ positions, color }) =>
      L.polyline(positions, { color, weight: 4, opacity: 0.85 }).addTo(map)
    );
    return () => layers.forEach((l) => l.remove());
  }, [map, routeCoords]);
  return null;
}

function buildRouteSegments(routeCoords) {
  const segments = [];
  let i = 0;
  while (i < routeCoords.length - 1) {
    const type = routeCoords[i][2];
    const pts = [[routeCoords[i][0], routeCoords[i][1]]];
    while (i + 1 < routeCoords.length && routeCoords[i + 1][2] === type) {
      i++;
      pts.push([routeCoords[i][0], routeCoords[i][1]]);
    }
    // include first point of next segment for visual continuity
    if (i + 1 < routeCoords.length) {
      pts.push([routeCoords[i + 1][0], routeCoords[i + 1][1]]);
    }
    segments.push({ positions: pts, color: ROUTE_COLORS[type] ?? ROUTE_COLORS.residential });
    i++;
  }
  return segments;
}

export default function BikeMap({ neighborhoods, activeSchool, selectedId, onSelect }) {
  const selected = neighborhoods.find((n) => n.id === selectedId) ?? null;
  const flyCenter = selected ? [selected.lat, selected.lng] : null;
  const routeCoords = selected?.schools[activeSchool]?.routeCoords ?? null;

  return (
    <MapContainer
      center={[40.113, -83.113]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <SchoolLayer />
      <FlyToHandler center={flyCenter} />
      <RouteLayer key={`${selectedId}-${activeSchool}`} routeCoords={routeCoords} />

      {neighborhoods.map((n) => {
        const s = n.schools[activeSchool];
        const color = getGradeColor(s.score);
        const isSelected = n.id === selectedId;
        const radius = s.score !== null ? 6 + Math.round(s.score / 20) : 5;

        return (
          <CircleMarker
            key={n.id}
            center={[n.lat, n.lng]}
            radius={isSelected ? radius + 4 : radius}
            pathOptions={{
              fillColor: color,
              color: isSelected ? '#1e40af' : 'white',
              weight: isSelected ? 2.5 : 1.5,
              fillOpacity: 0.85,
            }}
            eventHandlers={{ click: () => onSelect(n.id) }}
          >
            <Tooltip>
              <div className="text-sm">
                <strong>{n.name}</strong><br />
                {s.score !== null
                  ? `Score ${s.score} · ${s.distanceMi.toFixed(1)} mi · ${s.trailPct}% trail · ${s.crossings} crossings`
                  : `Non-Bikeable · ${s.distanceMi.toFixed(1)} mi`}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BikeMap.jsx
git commit -m "feat: add BikeMap with markers, school pins, and route overlay"
```

---

### Task 9: ScoreBreakdown Component

**Files:**
- Create: `src/components/ScoreBreakdown.jsx`

- [ ] **Step 1: Create `src/components/ScoreBreakdown.jsx`**

```jsx
import { computeComponentScores } from '../utils/scoring.js';
import { SCHOOL_COLORS, SCHOOL_NAMES } from '../utils/colors.js';

const COMPONENTS = [
  { key: 'trail',     label: 'Trail',     max: 40, color: '#16a34a' },
  { key: 'distance',  label: 'Distance',  max: 25, color: '#2563eb' },
  { key: 'crossings', label: 'Crossings', max: 25, color: '#ea580c' },
  { key: 'terrain',   label: 'Terrain',   max: 10, color: '#7c3aed' },
];

export default function ScoreBreakdown({ neighborhood, activeSchool }) {
  const schoolData = neighborhood?.schools[activeSchool];
  const components = computeComponentScores(schoolData);

  return (
    <div className="flex items-start gap-8">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">{neighborhood.name}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: SCHOOL_COLORS[activeSchool] }}
          >
            {SCHOOL_NAMES[activeSchool]}
          </span>
          {neighborhood.redistricting && (
            <span className="text-[10px] font-bold text-orange-600 border border-orange-400 rounded px-1">
              REDIST.
            </span>
          )}
        </div>
        {components ? (
          <div className="flex gap-4">
            {COMPONENTS.map(({ key, label, max, color }) => (
              <div key={key} className="flex flex-col gap-1 min-w-[80px]">
                <span className="text-xs text-gray-500">{label}</span>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(components[key] / max) * 100}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-700">{components[key]}/{max}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Non-Bikeable to {SCHOOL_NAMES[activeSchool]}</p>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <div className="font-medium text-gray-600 mb-1">Includes</div>
        {neighborhood.includes.map((sub) => (
          <div key={sub} className="text-xs">{sub}</div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScoreBreakdown.jsx
git commit -m "feat: add ScoreBreakdown component with four component bars"
```

---

### Task 10: Manual Smoke Test + Wire Check

**Files:** None new — verify the running app.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser.

- [ ] **Step 2: Verify these states manually**

- [ ] Header shows "Dublin Bikeability" and three colored tab buttons
- [ ] Active tab (default Coffman) has green background `#1A5C2A`
- [ ] Left panel shows Muirfield Village (A-grade, 95) at top, Tartan Fields (✕) at bottom
- [ ] Map renders with OSM tiles, three circle markers, three school pins
- [ ] Clicking "Dublin Scioto" tab re-sorts the list (Muirfield drops to B, Ballantrae to F)
- [ ] Clicking Muirfield Village in list: map flies to it, route polyline appears (green path segments, then orange arterial)
- [ ] Score breakdown bar appears at bottom showing four mini bars
- [ ] Clicking Tartan Fields: breakdown shows "Non-Bikeable" message
- [ ] REDIST. badge shows on Ballantrae row

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass (scoring.test.js, GradeBadge.test.jsx, SchoolTabs.test.jsx, NeighborhoodList.test.jsx)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: complete React dashboard on mock data"
```

---

### Task 11: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# Dublin Bikeability Scorer

Bikeability scores for Dublin City Schools (DCS) neighborhoods to each of the three DCS high schools.

## Quick Start

### 1. Run the React dashboard (mock data)

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 2. Run the Python pipeline (real data)

Install Python deps:

```bash
pip install -r data/requirements.txt
```

Add neighborhood names (one per line) to `data/neighborhoods.txt`, then run each stage in order:

```bash
# Stage 1: download + cache the osmnx graph (~2–5 min, runs once)
python data/build_graph.py

# Stage 2: geocode neighborhood names to lat/lng centroids
python data/build_centroids.py

# Stage 3: compute bikeability scores for every neighborhood × school pair
python data/build_scores.py
```

Copy the output to the React app:

```bash
cp data/scores.json src/data/scores.json
```

Then restart `npm run dev` to see real data.

## Scoring Model

| Component | Weight | Description |
|---|---|---|
| Trail coverage | 40% | % of route on shared-use path or cycleway |
| Distance | 25% | ≤1 mi = max; 4 mi = 0; linear interpolation |
| Arterial crossings | 25% | Each crossing of Sawmill, SR-161, Avery, Hyland Croy, Hard Rd subtracts 25 pts |
| Terrain | 10% | Elevation gain in meters (50 m = 0 pts) |

Routes > 4 miles are Non-Bikeable (null score).

## Schools

| School | Address | Color |
|---|---|---|
| Dublin Scioto | 4000 Hard Rd | `#8B1A1A` |
| Dublin Coffman | 6780 Coffman Rd | `#1A5C2A` |
| Dublin Jerome | 8300 Hyland Croy Rd | `#0D3B7A` |
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with pipeline and scoring instructions"
```

---

## Phase 2: Python Pipeline

---

### Task 12: Python Environment Setup

**Files:**
- Create: `data/requirements.txt`
- Create: `data/neighborhoods.txt`
- Create: `data/tests/__init__.py`

- [ ] **Step 1: Create `data/requirements.txt`**

```
osmnx==1.9.3
networkx==3.3
geopandas==0.14.4
geopy==2.4.1
srtm.py==0.3.6
pytest==8.2.0
requests==2.32.2
shapely==2.0.4
```

- [ ] **Step 2: Create `data/neighborhoods.txt`**

```
# Add one neighborhood name per line. The pipeline geocodes each name
# using Nominatim with "Dublin, OH" as location bias.
# Example:
# Muirfield Village
# Ballantrae
# Tartan Fields
```

- [ ] **Step 3: Create `data/tests/__init__.py`**

```python
```

- [ ] **Step 4: Install Python deps**

```bash
pip install -r data/requirements.txt
```

Expected: all packages install without error.

- [ ] **Step 5: Commit**

```bash
git add data/requirements.txt data/neighborhoods.txt data/tests/__init__.py
git commit -m "feat: add Python pipeline requirements and neighborhood input file"
```

---

### Task 13: build_graph.py

**Files:**
- Create: `data/build_graph.py`

- [ ] **Step 1: Create `data/build_graph.py`**

```python
"""Stage 1: download the bike-legal osmnx graph and cache to dublin_graph.graphml."""
import os
import osmnx as ox

GRAPH_PATH = os.path.join(os.path.dirname(__file__), "dublin_graph.graphml")

BBOX = (40.20, 40.05, -83.00, -83.20)  # north, south, east, west

USEFUL_HIGHWAY_TAGS = {
    "path", "cycleway", "footway", "pedestrian",
    "residential", "unclassified", "tertiary", "living_street",
    "primary", "secondary", "trunk",  # included so we can detect arterial crossings
}


def download_graph() -> None:
    print("Downloading osmnx graph for Dublin OH bounding box...")
    cf = (
        '["highway"~"path|cycleway|footway|pedestrian|residential|'
        'unclassified|tertiary|living_street|primary|secondary|trunk"]'
    )
    G = ox.graph_from_bbox(
        *BBOX,
        network_type="all",
        custom_filter=cf,
        retain_all=False,
    )
    ox.save_graphml(G, GRAPH_PATH)
    nodes, edges = ox.graph_to_gdfs(G)
    print(f"Graph saved: {len(G.nodes)} nodes, {len(G.edges)} edges → {GRAPH_PATH}")


if __name__ == "__main__":
    if os.path.exists(GRAPH_PATH):
        print(f"Graph already cached at {GRAPH_PATH}. Delete it to re-download.")
    else:
        download_graph()
```

- [ ] **Step 2: Run it (requires internet, takes 2–5 min)**

```bash
python data/build_graph.py
```

Expected output (approximate):
```
Downloading osmnx graph for Dublin OH bounding box...
Graph saved: 12345 nodes, 34567 edges → data/dublin_graph.graphml
```

Run a second time — should print the "already cached" message and exit immediately.

- [ ] **Step 3: Commit**

```bash
git add data/build_graph.py
git commit -m "feat: add build_graph.py — Stage 1 osmnx graph download"
```

---

### Task 14: build_centroids.py + Tests

**Files:**
- Create: `data/build_centroids.py`
- Create: `data/tests/test_centroids.py`

- [ ] **Step 1: Write failing tests in `data/tests/test_centroids.py`**

```python
import pytest
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from build_centroids import parse_names, build_query, parse_location


def test_parse_names_strips_blanks_and_comments():
    lines = ["Muirfield Village\n", "\n", "# a comment\n", "  Ballantrae  \n"]
    result = parse_names(lines)
    assert result == ["Muirfield Village", "Ballantrae"]


def test_build_query_primary():
    assert build_query("Muirfield Village", primary=True) == "Muirfield Village, Dublin, OH"


def test_build_query_fallback():
    assert build_query("Muirfield Village", primary=False) == "Muirfield Village, Ohio"


def test_parse_location_returns_lat_lng():
    mock_loc = MagicMock()
    mock_loc.latitude = 40.09
    mock_loc.longitude = -83.11
    lat, lng = parse_location(mock_loc)
    assert lat == pytest.approx(40.09)
    assert lng == pytest.approx(-83.11)


def test_parse_location_returns_none_for_none():
    assert parse_location(None) == (None, None)
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pytest data/tests/test_centroids.py -v
```

Expected: FAIL — `build_centroids` not importable.

- [ ] **Step 3: Create `data/build_centroids.py`**

```python
"""Stage 2: geocode neighborhood names → centroids.json using Nominatim."""
import json
import os
import sys
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

NAMES_PATH = os.path.join(os.path.dirname(__file__), "neighborhoods.txt")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "centroids.json")

geocoder = Nominatim(user_agent="dublin-bikeability-scorer/1.0")


def parse_names(lines: list[str]) -> list[str]:
    result = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            result.append(stripped)
    return result


def build_query(name: str, primary: bool) -> str:
    return f"{name}, Dublin, OH" if primary else f"{name}, Ohio"


def parse_location(location) -> tuple:
    if location is None:
        return (None, None)
    return (location.latitude, location.longitude)


def geocode_name(name: str) -> dict:
    for primary in (True, False):
        query = build_query(name, primary)
        try:
            loc = geocoder.geocode(query, exactly_one=True, timeout=10)
        except GeocoderTimedOut:
            loc = None
        lat, lng = parse_location(loc)
        if lat is not None:
            return {"name": name, "lat": lat, "lng": lng, "geocode_query": query, "geocode_confidence": "primary" if primary else "fallback"}
        time.sleep(1)  # Nominatim rate limit: 1 req/s

    print(f"  WARN: could not geocode '{name}' — skipping", file=sys.stderr)
    return {"name": name, "lat": None, "lng": None, "geocode_query": None, "geocode_confidence": "failed"}


def main() -> None:
    with open(NAMES_PATH) as f:
        names = parse_names(f.readlines())

    if not names:
        print("No neighborhood names found in neighborhoods.txt")
        return

    print(f"Geocoding {len(names)} neighborhoods...")
    results = []
    for i, name in enumerate(names, 1):
        print(f"  [{i}/{len(names)}] {name}")
        results.append(geocode_name(name))
        time.sleep(1)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)

    failed = [r for r in results if r["lat"] is None]
    print(f"\nDone. {len(results) - len(failed)}/{len(results)} geocoded → {OUTPUT_PATH}")
    if failed:
        print("Failed lookups (fix manually in centroids.json):")
        for r in failed:
            print(f"  {r['name']}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pytest data/tests/test_centroids.py -v
```

Expected:
```
PASSED test_parse_names_strips_blanks_and_comments
PASSED test_build_query_primary
PASSED test_build_query_fallback
PASSED test_parse_location_returns_lat_lng
PASSED test_parse_location_returns_none_for_none
5 passed
```

- [ ] **Step 5: Commit**

```bash
git add data/build_centroids.py data/tests/test_centroids.py
git commit -m "feat: add build_centroids.py — Stage 2 geocoding with tests"
```

---

### Task 15: build_scores.py + Tests

**Files:**
- Create: `data/build_scores.py`
- Create: `data/tests/test_scoring.py`

- [ ] **Step 1: Write failing tests in `data/tests/test_scoring.py`**

```python
import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from build_scores import (
    compute_score,
    get_edge_weight,
    classify_edge_type,
    count_arterial_crossings,
    compute_elevation_gain,
)

# --- compute_score ---

def test_score_returns_none_above_4_miles():
    assert compute_score(distance_mi=4.1, trail_pct=80, crossings=0, elevation_gain_m=0) is None
    assert compute_score(distance_mi=10,  trail_pct=100, crossings=0, elevation_gain_m=0) is None


def test_score_max_for_ideal_route():
    # 0.5mi, 100% trail, 0 crossings, 0 elevation
    assert compute_score(0.5, 100, 0, 0) == 100


def test_score_distance_tapers_linearly():
    # 0% trail, 2.5mi → dist_score=(4-2.5)/3*100=50, no crossings, no elevation
    # 0*0.4 + 50*0.25 + 100*0.25 + 100*0.10 = 0+12.5+25+10 = 47.5 → 48
    assert compute_score(2.5, 0, 0, 0) == 48


def test_score_crossing_penalty():
    # 100% trail, 0.5mi, 2 crossings → crossing_score=50
    # 100*0.4 + 100*0.25 + 50*0.25 + 100*0.10 = 40+25+12.5+10 = 87.5 → 88
    assert compute_score(0.5, 100, 2, 0) == 88


def test_score_crossing_clamped_at_zero():
    # 0% trail, 0.5mi, 4 crossings → crossing_score=0
    # 0+25+0+10 = 35
    assert compute_score(0.5, 0, 4, 0) == 35


def test_score_elevation_penalty():
    # 100% trail, 0.5mi, 0 crossings, 30m elevation → terrain=40
    # 40+25+25+4 = 94
    assert compute_score(0.5, 100, 0, 30) == 94


def test_score_terrain_clamped_at_zero():
    # 0% trail, 0.5mi, 0 crossings, 50m elevation → terrain=0
    # 0+25+25+0 = 50
    assert compute_score(0.5, 0, 0, 50) == 50


# --- get_edge_weight ---

def test_edge_weight_path():
    assert get_edge_weight({"highway": "path"}) == 1.0
    assert get_edge_weight({"highway": "cycleway"}) == 0.8
    assert get_edge_weight({"highway": "footway"}) == 1.0


def test_edge_weight_residential():
    assert get_edge_weight({"highway": "residential"}) == 0.5
    assert get_edge_weight({"highway": "unclassified"}) == 0.5


def test_edge_weight_arterial():
    assert get_edge_weight({"highway": "primary"}) == 0.2
    assert get_edge_weight({"highway": "secondary"}) == 0.2


# --- classify_edge_type ---

def test_classify_path_edges():
    assert classify_edge_type({"highway": "path"})     == "path"
    assert classify_edge_type({"highway": "cycleway"}) == "path"
    assert classify_edge_type({"highway": "footway"})  == "path"


def test_classify_residential_edges():
    assert classify_edge_type({"highway": "residential"})  == "residential"
    assert classify_edge_type({"highway": "unclassified"}) == "residential"
    assert classify_edge_type({"highway": "tertiary"})     == "residential"


def test_classify_arterial_edges():
    assert classify_edge_type({"highway": "primary"})   == "arterial"
    assert classify_edge_type({"highway": "secondary"}) == "arterial"
    assert classify_edge_type({"highway": "trunk"})     == "arterial"


def test_classify_arterial_by_name():
    assert classify_edge_type({"highway": "residential", "name": "Sawmill Road"}) == "arterial"
    assert classify_edge_type({"highway": "residential", "name": "Avery Road"})   == "arterial"


# --- count_arterial_crossings ---

def test_count_crossings_zero():
    edges = [{"highway": "path"}, {"highway": "residential"}]
    assert count_arterial_crossings(edges) == 0


def test_count_crossings_distinct_roads():
    edges = [
        {"highway": "primary", "name": "Sawmill Road"},
        {"highway": "primary", "name": "Sawmill Road"},  # same road, counts once
        {"highway": "primary", "name": "Avery Road"},
    ]
    assert count_arterial_crossings(edges) == 2


def test_count_crossings_max_five():
    edges = [
        {"highway": "primary", "name": "Sawmill Road"},
        {"highway": "primary", "name": "SR-161"},
        {"highway": "primary", "name": "Avery Road"},
        {"highway": "primary", "name": "Hyland Croy Road"},
        {"highway": "primary", "name": "Hard Road"},
    ]
    assert count_arterial_crossings(edges) == 5


# --- compute_elevation_gain ---

def test_elevation_gain_flat():
    elevations = [100.0, 100.5, 100.2, 100.8]
    assert compute_elevation_gain(elevations) == pytest.approx(1.1, abs=0.5)


def test_elevation_gain_ignores_descents():
    # up 10, down 5 → gain = 10
    elevations = [0.0, 10.0, 5.0]
    assert compute_elevation_gain(elevations) == pytest.approx(10.0, abs=0.1)


def test_elevation_gain_single_point():
    assert compute_elevation_gain([100.0]) == 0.0
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pytest data/tests/test_scoring.py -v
```

Expected: FAIL — `build_scores` not importable.

- [ ] **Step 3: Create `data/build_scores.py`**

```python
"""Stage 3: compute bikeability scores for every neighborhood × school pair."""
import json
import math
import os
import shutil
import sys

import networkx as nx
import osmnx as ox
import srtm

GRAPH_PATH    = os.path.join(os.path.dirname(__file__), "dublin_graph.graphml")
CENTROIDS_PATH = os.path.join(os.path.dirname(__file__), "centroids.json")
OUTPUT_PATH   = os.path.join(os.path.dirname(__file__), "scores.json")
REACT_OUTPUT  = os.path.join(os.path.dirname(__file__), "..", "src", "data", "scores.json")

SCHOOLS = {
    "scioto":  {"lat": 40.0978, "lng": -83.0742},
    "coffman": {"lat": 40.0934, "lng": -83.1089},
    "jerome":  {"lat": 40.1312, "lng": -83.1102},
}

ARTERIAL_NAMES = {"sawmill", "sr-161", "state route 161", "avery", "hyland croy", "hard"}

PATH_TAGS        = {"path", "footway", "pedestrian"}
CYCLEWAY_TAGS    = {"cycleway"}
RESIDENTIAL_TAGS = {"residential", "unclassified", "tertiary", "living_street"}
ARTERIAL_TAGS    = {"primary", "secondary", "trunk", "motorway"}

METERS_PER_MILE = 1609.344


# --- Pure scoring logic (tested independently) ---

def compute_score(distance_mi: float, trail_pct: float, crossings: int, elevation_gain_m: float) -> int | None:
    if distance_mi > 4:
        return None
    distance_score = 100.0 if distance_mi <= 1 else ((4 - distance_mi) / 3) * 100
    crossing_score = max(0.0, 100 - crossings * 25)
    terrain_score  = max(0.0, 100 - elevation_gain_m * 2)
    raw = (trail_pct * 0.40 + distance_score * 0.25 + crossing_score * 0.25 + terrain_score * 0.10)
    return round(raw)


def get_edge_weight(data: dict) -> float:
    hw = data.get("highway", "")
    if isinstance(hw, list):
        hw = hw[0]
    if hw in PATH_TAGS:
        return 1.0
    if hw in CYCLEWAY_TAGS:
        return 0.8
    if hw in RESIDENTIAL_TAGS:
        return 0.5
    return 0.2  # arterials and unknowns


def classify_edge_type(data: dict) -> str:
    hw = data.get("highway", "")
    if isinstance(hw, list):
        hw = hw[0]
    name = str(data.get("name", "")).lower()
    if any(arterial in name for arterial in ARTERIAL_NAMES):
        return "arterial"
    if hw in PATH_TAGS | CYCLEWAY_TAGS:
        return "path"
    if hw in ARTERIAL_TAGS:
        return "arterial"
    return "residential"


def count_arterial_crossings(edges: list[dict]) -> int:
    crossed = set()
    for data in edges:
        name = str(data.get("name", "")).lower()
        for arterial in ARTERIAL_NAMES:
            if arterial in name:
                crossed.add(arterial)
    return len(crossed)


def compute_elevation_gain(elevations: list[float]) -> float:
    gain = 0.0
    for i in range(1, len(elevations)):
        delta = elevations[i] - elevations[i - 1]
        if delta > 0:
            gain += delta
    return gain


# --- Graph helpers ---

def add_edge_weights(G) -> None:
    for u, v, k, data in G.edges(keys=True, data=True):
        data["weight"] = 1 / get_edge_weight(data)  # lower = preferred for Dijkstra


def get_route_edges(G, path_nodes: list) -> list[dict]:
    edges = []
    for u, v in zip(path_nodes[:-1], path_nodes[1:]):
        data = min(G[u][v].values(), key=lambda d: d.get("weight", 1))
        edges.append(data)
    return edges


def compute_trail_pct(edges: list[dict]) -> float:
    if not edges:
        return 0.0
    trail_count = sum(1 for e in edges if classify_edge_type(e) in ("path",))
    return round(trail_count / len(edges) * 100)


def get_route_length_miles(G, path_nodes: list) -> float:
    total_m = sum(
        min(G[u][v][k].get("length", 0) for k in G[u][v])
        for u, v in zip(path_nodes[:-1], path_nodes[1:])
    )
    return total_m / METERS_PER_MILE


def get_route_coords(G, path_nodes: list, edges: list[dict]) -> list:
    coords = []
    for node, edge_data in zip(path_nodes, edges + [{}]):
        node_data = G.nodes[node]
        lat, lng = node_data["y"], node_data["x"]
        edge_type = classify_edge_type(edge_data) if edge_data else "residential"
        coords.append([lat, lng, edge_type])
    return coords


def get_node_elevations(G, path_nodes: list, elevation_data) -> list[float]:
    elevs = []
    for node in path_nodes:
        nd = G.nodes[node]
        e = elevation_data.get_elevation(nd["y"], nd["x"])
        elevs.append(e if e is not None else 0.0)
    return elevs


# --- Main pipeline ---

def score_pair(G, elevation_data, centroid: dict, school_key: str, school: dict) -> dict:
    try:
        orig = ox.distance.nearest_nodes(G, centroid["lng"], centroid["lat"])
        dest = ox.distance.nearest_nodes(G, school["lng"], school["lat"])
        path = nx.shortest_path(G, orig, dest, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return {"score": None, "distanceMi": None, "trailPct": None,
                "crossings": None, "elevationGainM": None, "routeCoords": None}

    edges = get_route_edges(G, path)
    distance_mi    = get_route_length_miles(G, path)
    trail_pct      = compute_trail_pct(edges)
    crossings      = count_arterial_crossings(edges)
    elevations     = get_node_elevations(G, path, elevation_data)
    elevation_gain = round(compute_elevation_gain(elevations))
    score          = compute_score(distance_mi, trail_pct, crossings, elevation_gain)
    route_coords   = get_route_coords(G, path, edges) if score is not None else None

    return {
        "score":          score,
        "distanceMi":     round(distance_mi, 2),
        "trailPct":       trail_pct,
        "crossings":      crossings,
        "elevationGainM": elevation_gain,
        "routeCoords":    route_coords,
    }


def main() -> None:
    print("Loading graph...")
    G = ox.load_graphml(GRAPH_PATH)
    add_edge_weights(G)

    print("Loading centroids...")
    with open(CENTROIDS_PATH) as f:
        centroids = json.load(f)

    valid = [c for c in centroids if c["lat"] is not None]
    print(f"{len(valid)}/{len(centroids)} centroids valid")

    print("Loading SRTM elevation data...")
    elevation_data = srtm.get_data()

    results = []
    for i, centroid in enumerate(valid, 1):
        name = centroid["name"]
        slug = name.lower().replace(" ", "-").replace("/", "-")
        print(f"  [{i}/{len(valid)}] {name}")
        schools_out = {}
        for school_key, school in SCHOOLS.items():
            schools_out[school_key] = score_pair(G, elevation_data, centroid, school_key, school)
        results.append({
            "id":            slug,
            "name":          name,
            "region":        "Dublin City",
            "current_hs":    None,
            "redistricting": False,
            "lat":           centroid["lat"],
            "lng":           centroid["lng"],
            "includes":      [name],
            "schools":       schools_out,
        })

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nScores written → {OUTPUT_PATH}")

    os.makedirs(os.path.dirname(REACT_OUTPUT), exist_ok=True)
    shutil.copy(OUTPUT_PATH, REACT_OUTPUT)
    print(f"Copied → {REACT_OUTPUT}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pytest data/tests/test_scoring.py -v
```

Expected (all 20 tests):
```
PASSED test_score_returns_none_above_4_miles
PASSED test_score_max_for_ideal_route
PASSED test_score_distance_tapers_linearly
PASSED test_score_crossing_penalty
PASSED test_score_crossing_clamped_at_zero
PASSED test_score_elevation_penalty
PASSED test_score_terrain_clamped_at_zero
PASSED test_edge_weight_path
PASSED test_edge_weight_residential
PASSED test_edge_weight_arterial
PASSED test_classify_path_edges
PASSED test_classify_residential_edges
PASSED test_classify_arterial_edges
PASSED test_classify_arterial_by_name
PASSED test_count_crossings_zero
PASSED test_count_crossings_distinct_roads
PASSED test_count_crossings_max_five
PASSED test_elevation_gain_flat
PASSED test_elevation_gain_ignores_descents
PASSED test_elevation_gain_single_point
20 passed
```

- [ ] **Step 5: Commit**

```bash
git add data/build_scores.py data/tests/test_scoring.py
git commit -m "feat: add build_scores.py — Stage 3 routing and scoring with tests"
```

---

### Task 16: End-to-End Pipeline Smoke Test

**Files:** None new — verify the full pipeline on real data.

- [ ] **Step 1: Add 3 real neighborhoods to `data/neighborhoods.txt`**

```
Muirfield Village
Ballantrae
Tartan Fields
```

- [ ] **Step 2: Run Stage 1 (if not already done)**

```bash
python data/build_graph.py
```

Expected: graphml file created or "already cached" message.

- [ ] **Step 3: Run Stage 2**

```bash
python data/build_centroids.py
```

Expected output:
```
Geocoding 3 neighborhoods...
  [1/3] Muirfield Village
  [2/3] Ballantrae
  [3/3] Tartan Fields
Done. 3/3 geocoded → data/centroids.json
```

Inspect `data/centroids.json` — verify all three have non-null lat/lng near Dublin OH (40.0x lat, -83.1x lng).

- [ ] **Step 4: Run Stage 3**

```bash
python data/build_scores.py
```

Expected: scores.json written to `data/` and copied to `src/data/`.

- [ ] **Step 5: Inspect `data/scores.json`**

Verify:
- Each neighborhood has scores for all three schools
- At least one `score: null` for a distant school
- `routeCoords` has `[lat, lng, "path"|"residential"|"arterial"]` triples
- `distanceMi` values are plausible (< 10 miles)

- [ ] **Step 6: Restart React dev server and verify real data renders**

```bash
npm run dev
```

Open `http://localhost:5173` — map markers should appear at real Dublin OH coordinates.

- [ ] **Step 7: Run all tests one final time**

```bash
npm test
pytest data/tests/ -v
```

Expected: all JS and Python tests pass.

- [ ] **Step 8: Final commit**

```bash
git add data/neighborhoods.txt
git commit -m "feat: complete pipeline smoke test with real Dublin OH data"
```

---

---

## Phase 3: GitHub Pages Deployment

---

### Task 17: GitHub Pages Deployment

**Files:**
- Modify: `vite.config.js` — add `base` path for GitHub Pages
- Create: `.github/workflows/deploy.yml` — Actions workflow

GitHub Pages serves the app from `https://<username>.github.io/dublin-bikeability/`.
Vite must know this base path at build time so asset URLs resolve correctly.
The Actions workflow builds the Vite app and deploys the `dist/` folder to GitHub Pages on every push to `main`.

- [ ] **Step 1: Update `vite.config.js` to add `base`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/dublin-bikeability/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
});
```

> If you rename the GitHub repo, update `base` to match the new repo name.
> If you later use a custom domain, set `base: '/'`.

- [ ] **Step 2: Verify local build still works**

```bash
npm run build
npm run preview
```

Open `http://localhost:4173/dublin-bikeability/` — app should load correctly with the base path applied.

- [ ] **Step 3: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 4: Push to GitHub and enable Pages**

```bash
git add vite.config.js .github/workflows/deploy.yml
git commit -m "feat: add GitHub Pages deployment workflow"
git push origin main
```

Then in your GitHub repo:
1. Go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

- [ ] **Step 5: Verify deployment**

Go to **Actions** tab in your GitHub repo — the `Deploy to GitHub Pages` workflow should run automatically. Once it completes (≈1 min), the app is live at:

```
https://<your-github-username>.github.io/dublin-bikeability/
```

- [ ] **Step 6: Smoke test the live URL**

- [ ] Map renders with OSM tiles
- [ ] School tabs switch correctly
- [ ] Neighborhood list sorts by score
- [ ] Clicking a neighborhood draws the route polyline

---

## Self-Review Notes

- `buildRouteSegments` in `BikeMap.jsx` uses `routeCoords[i][2]` (third element = edge_type) consistently with the JSON schema.
- `computeComponentScores` in `scoring.js` and `compute_score` in `build_scores.py` use identical formulas — verified by matching test assertions.
- `classify_edge_type` uses `ARTERIAL_NAMES` set which matches the five roads listed in the spec (Sawmill, SR-161, Avery, Hyland Croy, Hard Rd).
- `count_arterial_crossings` counts distinct roads crossed (max 5), not total arterial edges.
- Leaflet CSS is imported in `main.jsx` before any component mounts — avoids broken map tile rendering.
- `FlyToHandler` uses `useMap()` inside `MapContainer`, which is required by react-leaflet.
- `SchoolLayer` uses a `useEffect` imperative approach instead of `<Marker>` to avoid Leaflet default icon resolution issues with Vite bundling.
