# Nigeria Disease Outbreak Prediction System
### Climate-Driven Disease Outbreak Early Warning System

---

## What It Does

This system predicts the monthly risk of cholera and Lassa fever outbreaks in Nigeria using historical ERA5 climate reanalysis data and trained ensemble machine learning models. It provides:

- A **risk classification** (HIGH or LOW) for any given month, based on temperature, humidity, wind speed, and seasonal lag features
- **Live weather data** fetched from the Open-Meteo API (no API key required) to auto-populate the current month's prediction
- An **interactive predictor** where users can adjust climate sliders and see predictions update in real time
- A **historical heatmap** showing which months from 2010–2025 were classified as high-risk
- **Model performance comparisons** across 5 algorithms with feature importance rankings

---

## Why It Was Built

Built as a final-year undergraduate research project by **Odu Lucky Chibuike** (2025). The associated paper:

> *"Predicting Climate-Driven Disease Outbreak Risk in Nigeria Using a Multi-Input Neural Network and Ensemble Machine Learning Framework"*

Target journals: PLOS ONE / Frontiers in Public Health / One Health (Elsevier)

Nigeria experiences recurring cholera and Lassa fever outbreaks strongly correlated with rainy seasons and humidity levels. Existing surveillance systems are reactive. This project demonstrates that a climate-based ML model can classify outbreak risk months in advance, enabling proactive public health response.

---

## System Overview

```
ERA5 Climate Data (2010–2025)
        +
Nigeria Disease Records (NCDC/WHO)
        │
        ▼
  Preprocessing & Feature Engineering
  (pandas, xarray, lag features, rainy season flag)
        │
        ▼
  5 ML Models trained & evaluated
  (Logistic Regression, Neural Network, XGBoost, Random Forest, Ensemble)
        │
        ▼
  Best model serialised → cholera_ensemble_model.pkl + cholera_scaler.pkl
        │
        ▼
  FastAPI Backend (Python)              Open-Meteo Live API
  /predict  /live-weather               (no key, free, global)
  /historical-data  /model-results ◄────────────────────────
  /feature-importance
        │
        ▼
  React + Vite + TypeScript Frontend
  5 pages: Dashboard · Model Results · Risk Heatmap · Live Predictor · Methodology
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19.x |
| Build tool | Vite | 8.x |
| Language | TypeScript | 6.x |
| Animations | Framer Motion | 11.x |
| Charts | Recharts | 2.x |
| 3D Globe | react-globe.gl + three.js | 2.x / 0.176 |
| Routing | React Router DOM | 7.x |
| Backend framework | FastAPI | 0.111+ |
| ASGI server | Uvicorn | 0.29+ |
| HTTP client | httpx | 0.27+ |
| ML serialisation | joblib | 1.4+ |
| Data processing | pandas, numpy | 2.x / 1.26+ |
| ML library | scikit-learn | 1.4+ |
| Gradient boosting | XGBoost | 2.x |
| Deep learning | PyTorch | 2.12 (training only) |
| Climate data | xarray, cfgrib, netCDF4 | — |
| Hosting | Render (Blueprint) | — |

---

## Repository Structure

```
Final-Year-Disease-Prediction/
├── backend/
│   ├── main.py                  FastAPI app — all endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               5 page components
│   │   ├── components/          Sidebar, Globe, Gauge, Skeletons
│   │   ├── services/api.ts      All API calls + offline cache
│   │   ├── context/             PresentationContext
│   │   └── types/index.ts       Shared TypeScript interfaces
│   ├── vite.config.ts           react-globe.gl alias fix
│   └── package.json
├── data/
│   ├── raw/                     Original CSVs and NetCDF (not in git)
│   └── processed/               Cleaned monthly CSVs (in git)
├── notebooks/                   Jupyter training notebooks
├── outputs/                     Trained .pkl model files (not in git)
├── Project-Guide/               This documentation
├── render.yaml                  Render deployment Blueprint
└── .gitignore
```

---

## Quick Start (Local)

```bash
# 1. Backend
cd Final-Year-Disease-Prediction
source venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# 2. Frontend (separate terminal)
cd Final-Year-Disease-Prediction/frontend
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173
```

See `DEPLOYMENT.md` for full instructions including Render deployment.
