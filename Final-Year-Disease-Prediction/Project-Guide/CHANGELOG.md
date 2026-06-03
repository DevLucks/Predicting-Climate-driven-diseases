# Changelog

All notable changes to this project are documented here.  
Format: `## [version] — YYYY-MM-DD`

---

## [1.0.0] — 2026-06-03

### Initial release — full-stack disease outbreak prediction system

#### Machine Learning (pre-existing, trained prior to web app build)
- Trained 5 ML models on Nigeria cholera data (2010–2025, 190 observations): Logistic Regression, Multi-Input Neural Network (PyTorch), XGBoost, Random Forest, Ensemble (LR+RF+XGB soft-voting)
- Best model: Logistic Regression — 74.74% accuracy, 100% recall (zero missed outbreaks)
- Serialised primary model: `outputs/cholera_ensemble_model.pkl` + `outputs/cholera_scaler.pkl`
- Secondary model trained on combined Lassa+Cholera (2020–2025, 70 obs): `ensemble_model_v2.pkl` — 91.43% accuracy
- 10-feature schema with ERA5 climate variables + temporal lag features + rainy season binary flag

#### Backend (`backend/main.py`)
- FastAPI application with 6 endpoints: `POST /predict`, `GET /live-weather`, `GET /historical-data`, `GET /model-results`, `GET /feature-importance`, `GET /health`
- Loads `cholera_ensemble_model.pkl` + `cholera_scaler.pkl` at startup via joblib
- Live weather fetched from Open-Meteo API (latitude 9.0820, longitude 8.6753, no API key)
- Historical data served from `data/processed/era5_nigeria_v2_monthly.csv`
- CORS configured for `http://localhost:5173`

#### Frontend (`frontend/`)
- React 19 + Vite 8 + TypeScript 6 single-page application
- Design system: Syne (display) + IBM Plex Mono (data), navy `#0D2137` background, teal `#0A7E8C` accents, gold `#E8A020` alerts
- 5 pages with Framer Motion `AnimatePresence` page transitions:
  1. **Dashboard** — 3D globe (react-globe.gl) with pulsing rings on high-burden states, live weather cards, current-month risk badge, 4 metric cards
  2. **Model Results** — animated horizontal bar chart (Accuracy/F1/Recall tabs), confusion matrix, animated feature importance bars
  3. **Risk Heatmap** — 12×16 month/year grid (2010–2025), state-level risk breakdown table
  4. **Live Predictor** — 5 sliders (temp/humidity/wind/month/prev-humidity), SVG semicircle gauge, top-3 influencing features display
  5. **Methodology** — pipeline diagram, multi-input NN architecture diagram, ERA5 weather trends chart, data sources table, CV explanation
- Collapsing sidebar navigation (desktop) + bottom tab bar (mobile, < 768px)
- Presentation mode: hides nav, enlarges fonts 20%, shows watermark, auto-cycles pages every 30 seconds
- Offline mode: localStorage cache (10-min TTL) + hardcoded fallback constants
- Loading skeletons for all async data

#### Deployment
- `render.yaml` Render Blueprint defining backend (Python web service) + frontend (static site)
- `VITE_API_URL` environment variable for runtime API base URL configuration
- `--legacy-peer-deps` npm flag for React 19 compatibility

#### Bug fixes applied during build
- Fixed Vite 8 / Rolldown resolution of `react-globe.gl` via `resolve.alias` in `vite.config.ts`
- Removed `react-leaflet` (React 19 peer conflict) — replaced map with HTML table
- Fixed React reconciler crash on Risk Heatmap page caused by un-keyed `<Fragment>` inside `.map()`
- Fixed 4 TypeScript strict-mode errors caught by `tsc -b` on Render CI:
  - Unused `pageIdx` variable in `PresentationContext.tsx`
  - Duplicate `className` prop on Dashboard globe card
  - Unused `Legend` import in `ModelResults.tsx`
  - Type narrowing error on `reduce()` in `RiskHeatmap.tsx`
- Added mobile responsive layout across all 5 pages

---

## Unreleased

- [ ] State-level choropleth map (blocked by react-leaflet / React 19 incompatibility)
- [ ] WHO GHO API integration for live disease case counts
- [ ] SHAP value explainability endpoint for per-prediction feature contributions
- [ ] Multi-disease selector (cholera vs Lassa vs combined)
- [ ] Export prediction report as PDF
- [ ] PWA support for offline-first use in low-connectivity regions
