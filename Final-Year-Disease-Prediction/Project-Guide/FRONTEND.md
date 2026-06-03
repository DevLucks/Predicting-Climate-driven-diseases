# Frontend Documentation

**Stack:** React 19 · Vite 8 · TypeScript 6 · Framer Motion 11 · Recharts 2 · react-globe.gl 2 · React Router DOM 7

**Entry point:** `frontend/src/main.tsx`  
**App shell:** `frontend/src/App.tsx`  
**Styles:** `frontend/src/index.css` (single global stylesheet, CSS custom properties)

---

## Design System

All design tokens are CSS custom properties defined in `:root` in `index.css`.

| Token | Value | Use |
|---|---|---|
| `--navy` | `#0D2137` | Page background |
| `--navy-mid` | `#112944` | Card background, sidebar |
| `--navy-light` | `#1a3a52` | Input tracks, table rows |
| `--teal` | `#0A7E8C` | Borders, active states, chart lines |
| `--gold` | `#E8A020` | HIGH RISK alert colour, key metrics |
| `--red` | `#E8453C` | Danger, heatmap HIGH cells |
| `--green` | `#3CCB7F` | LOW RISK, success |
| `--font-display` | `'Syne'` | Headings, large numbers |
| `--font-mono` | `'IBM Plex Mono'` | All body text, labels, data |

**Typography:** loaded from Google Fonts in `index.html`. Never use system fonts — the design requires Syne + IBM Plex Mono specifically.

**Spacing scale:** `--s1` (4px) through `--s8` (64px).

**Responsive breakpoints:**
- Mobile `< 768px`: stacks all grids, bottom nav replaces sidebar, 76px bottom padding
- Tablet `768–1024px`: intermediate column widths
- Desktop `> 1024px`: full layout with collapsing sidebar

---

## File Structure

```
frontend/src/
├── main.tsx                   App entry — BrowserRouter, PresentationProvider
├── App.tsx                    Route definitions, AnimatePresence, presentation button
├── index.css                  Complete design system + all component styles
├── declarations.d.ts          react-globe.gl TypeScript module declaration
├── types/
│   └── index.ts               Shared interfaces: WeatherData, PredictionRequest,
│                              PredictionResponse, ModelResult, FeatureImportance,
│                              HistoricalRecord, ApiResult<T>
├── services/
│   └── api.ts                 All API calls, localStorage cache (10min TTL),
│                              fallback data constants for offline mode
├── context/
│   └── PresentationContext.tsx  isPresentation flag, toggle(), 30s page auto-cycle
├── components/
│   ├── Sidebar.tsx            Desktop: animated collapsing nav (68px→220px on hover)
│   │                          Mobile: fixed bottom tab bar (5 tabs)
│   ├── NigeriaGlobe.tsx       react-globe.gl wrapper, ResizeObserver sizing,
│   │                          auto-rotate, pulsing rings on 4 high-burden states
│   ├── RiskGauge.tsx          Custom SVG semicircle gauge, CSS transition on value
│   └── LoadingSkeleton.tsx    Skel, CardSkel, ChartSkel components
└── pages/
    ├── Dashboard.tsx
    ├── ModelResults.tsx
    ├── RiskHeatmap.tsx
    ├── LivePredictor.tsx
    └── Methodology.tsx
```

---

## Page 1 — Dashboard (`/`)

**Purpose:** Hero landing page. Establishes the system's purpose at a glance.

**Layout:**
- Page title + subtitle
- `.hero-grid` (2-col desktop, 1-col mobile):
  - Left: 3D globe card (420px tall, 280px mobile)
  - Right: risk prediction badge + 3 weather cards
- `.grid-4`: 4 summary metric cards

**Components used:**
- `NigeriaGlobe` — lazy-loaded via `React.lazy()`, wrapped in `Suspense` with skeleton fallback. Uses `react-globe.gl` pointing to Nigeria (lat 9.0820, lng 8.6753, altitude 1.7). Pulsing red rings on: Borno (11.8, 13.1), Lagos (6.5, 3.4), Rivers (4.8, 6.9), Adamawa (9.3, 12.5). Auto-rotates at speed 0.5.

**API calls:**
1. `GET /live-weather` → populates temperature, humidity, wind cards
2. `POST /predict` → current month payload with live weather values as all lag features → populates risk badge + confidence %

**Payload construction (line ~35 in Dashboard.tsx):**
```typescript
{
  temperature_c: weather.temperature_c,
  humidity_pct:  weather.humidity_pct,
  wind_speed:    weather.wind_speed,
  temp_lag1:     weather.temperature_c,   // same as current (no historic data)
  humidity_lag1: weather.humidity_pct,
  wind_lag1:     weather.wind_speed,
  month:         new Date().getMonth() + 1,
  rainy_season:  RAINY.has(month) ? 1 : 0,
  temp_lag2:     weather.temperature_c,
  humidity_lag2: weather.humidity_pct,
}
```

**Offline behaviour:** Falls back to `FALLBACK_WEATHER` + `FALLBACK_PREDICTION` constants from `api.ts`, shows "OFFLINE MODE" badge.

**Hardcoded metric cards:** Best Accuracy 74.74% / Best Recall 100% / 190 Observations / 5 Models

---

## Page 2 — Model Results (`/model-results`)

**Purpose:** Academic results presentation. Shows all 5 models compared.

**Layout:**
- `.grid-2` (stacks on mobile):
  - Left: animated horizontal bar chart + recall explanation card
  - Right: confusion matrix
- Feature importance section (full width)

**Components used:**
- `ResponsiveContainer` + `BarChart` from Recharts (horizontal layout)
- `FeatureBar` sub-component — uses a single `useInView` hook + `motion.div` for the fill animation
- Custom `CustomTooltip` component for Recharts

**API calls:**
1. `GET /model-results` → model comparison data
2. `GET /feature-importance` → 10 features with importance scores

**Tab state:** `accuracy | f1 | recall` — controlled by `useState<Tab>`. Each tab change re-renders the bar chart with new `dataKey`.

**Confusion matrix values (hardcoded, from training):**
- TN: 108, FP: 34, FN: 0, TP: 48 (total = 190)

**Offline:** Falls back to `FALLBACK_MODEL_RESULTS` and `FALLBACK_FEATURES` from `api.ts`.

---

## Page 3 — Risk Heatmap (`/risk-heatmap`)

**Purpose:** Show which months 2010–2025 were classified high-risk, and which Nigerian states carry the highest burden.

**Layout:**
- `HeatGrid` component (12 rows × 16 columns) in a card
- Stats row below grid
- State-level risk breakdown table

**High-risk classification logic:**
```typescript
const HIGH_YEARS = new Set([2010, 2011, 2014, 2019, 2021, 2022, 2023, 2024]);
const RAINY      = new Set([5, 6, 7, 8, 9, 10]);
const isHigh = (year, month) => HIGH_YEARS.has(year) && RAINY.has(month);
```
A cell is red (1) only when BOTH conditions are true: it's a high-severity cholera year AND a rainy season month.

**HeatGrid animation:** Single `IntersectionObserver` on the container div. When it enters the viewport, `setVisible(true)` triggers CSS transitions with computed `delayMs = m * 30 + yi * 15` per cell. No Framer Motion hooks inside cells (192 cells × 1 hook = too expensive).

**CRITICAL: Fragment keying.** The month rows use `<Fragment key={m}>` (not `<>` shorthand). Missing keys on Fragment caused React reconciler crashes and blank page during AnimatePresence page transitions. Never use `<>` inside `.map()` in this codebase.

**State risk table:** Sorted by `Math.max(cholera, lassa)` descending. Inline progress bars show combined risk. No external map library (react-leaflet was removed due to React 19 peer conflict).

**API calls:** None — all data is computed from constants.

---

## Page 4 — Live Predictor (`/live-predictor`)

**Purpose:** Interactive ML inference. User adjusts climate sliders, prediction updates in real time.

**Layout:**
- `.predictor-grid` (340px sidebar | flex-1 output, stacks on mobile):
  - Left: 5 sliders + context badges
  - Right: gauge card + top-3 features card

**Sliders:**
| Slider | Range | Step | Unit | Maps to |
|---|---|---|---|---|
| Temperature | 23–32 | 0.1 | °C | `temperature_c` |
| Humidity | 28–85 | 1 | % | `humidity_pct` |
| Wind Speed | 0–3 | 0.1 | m/s | `wind_speed` |
| Month | 1–12 | 1 | — | `month` |
| Prev. Humidity | 28–85 | 1 | % | `humidity_lag1` |

**Derived features (not exposed as sliders):**
```typescript
temp_lag1     = temperature - 0.5
temp_lag2     = temperature - 1.0
wind_lag1     = wind_speed           // same as current
humidity_lag2 = prevHumidity - 3
rainy_season  = RAINY.has(month) ? 1 : 0
```

**Debounce:** 350ms `setTimeout` on every slider change. Prevents flooding the backend.

**RiskGauge component** (`components/RiskGauge.tsx`):
- Pure SVG, no canvas
- Semicircle path: `M 22 110 A 78 78 0 0 1 178 110` (center 100,110 radius 78)
- Arc length = π × 78 ≈ 245 px
- `stroke-dasharray: ${pct * 245} 245` animated via CSS transition
- Needle: `x2 = 100 + 60*cos(angleDeg)`, `y2 = 110 - 60*sin(angleDeg)` where `angleDeg = (1-pct)*180`
- Color transitions: green below 50%, red above 50%

**Top 3 influencing features:** Shows static top-3 from feature importance (humidity_pct, rainy_season, humidity_lag1) with the user's current slider value alongside the importance score.

---

## Page 5 — Methodology (`/methodology`)

**Purpose:** Academic context, data pipeline, model architecture explanation.

**Layout:**
- Pipeline diagram (horizontal scroll)
- NN architecture diagram
- Weather trends chart (full width)
- `.grid-2`: Cross-validation explanation | Data sources table

**Pipeline steps (rendered as `<div className="pipeline-step">` with CSS arrows):**
ERA5 Data → Preprocessing → Feature Engineering → Train/Test Split → 5 Models → Ensemble → Prediction

**Neural Network diagram:** Pure HTML/CSS, no SVG. Two input branches (weather / seasonal), concatenated, passed through Dense layers, single sigmoid output. Branch 1 in teal, Branch 2 in gold, output in red.

**Weather trends chart:**
- Fetches `GET /historical-data`
- Dual-axis `LineChart` from Recharts: temperature (gold, left axis) + humidity (teal, right axis)
- `isAnimationActive={inView}` — chart animates when it scrolls into view
- If backend is unreachable: shows a "Start backend to load historical weather data" placeholder

**API calls:**
1. `GET /historical-data` → ERA5 CSV records for line chart

---

## Presentation Mode

Toggled by the button in the top-right corner (`⊡ PRESENT`). Controlled by `PresentationContext`.

**Effects when active:**
- `document.documentElement.setAttribute('data-presentation', 'true')` → CSS `:root` overrides scale all font sizes up ~20%
- Sidebar hidden (`return null` in `Sidebar.tsx`)
- Watermark "Odu Lucky Chibuike — Final Year Defence 2025" shown bottom-right
- `setInterval` auto-navigates to next page every 30 seconds cycling through all 5 pages
- Presentation button hidden on mobile (media query)

---

## Offline Caching

`src/services/api.ts` wraps every `fetch()` in a try/catch:
1. On success → writes `localStorage.setItem('ow_${path}', JSON.stringify({ data, ts }))` with 10-minute TTL
2. On network failure → reads from localStorage; if found and not expired, returns `{ data, offline: true }`
3. If nothing cached → throws, and component catches by setting hardcoded fallback constants

The `offline: boolean` flag in `ApiResult<T>` lets any component show the "OFFLINE MODE" badge.

---

## Vite Configuration Quirks

**`vite.config.ts` must include:**
```typescript
resolve: {
  alias: {
    'react-globe.gl': path.resolve(__dirname, 'node_modules/react-globe.gl/dist/react-globe.gl.js'),
  },
},
optimizeDeps: {
  include: ['react-globe.gl', 'three', 'react-router-dom'],
},
```

**Why:** Vite 8 uses Rolldown as bundler. `react-globe.gl` package.json lists `dist/react-globe.gl.mjs` in its `exports` field but the actual file is `dist/react-globe.gl.js`. Rolldown fails with "No such file or directory". The alias bypasses Rolldown's resolver and points directly to the real file.

**`react-leaflet` is intentionally absent from `package.json`.** It was removed because it declares `react@^18` as a peer dependency, causing `npm ERESOLVE` on Render's CI with React 19. The Risk Heatmap uses a plain HTML table instead.

---

## Adding a New Page

1. Create `src/pages/MyPage.tsx` — export a `default` function, add `className="page"` to the root `motion.div`, use the standard page transition props:
   ```tsx
   <motion.div className="page" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }}>
   ```
2. Add a route in `App.tsx`: `<Route path="/my-page" element={<MyPage />} />`
3. Add a nav entry in `Sidebar.tsx` `NAV` array with `to`, `label`, `short`, and `icon`
4. Add the route to the `PAGES` array in `PresentationContext.tsx`
