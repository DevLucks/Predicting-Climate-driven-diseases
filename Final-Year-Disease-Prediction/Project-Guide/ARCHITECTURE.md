# System Architecture

---

## Full System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              React + Vite + TypeScript Frontend                  │   │
│  │                  http://localhost:5173  (dev)                    │   │
│  │           https://outbreak-watch-frontend.onrender.com (prod)   │   │
│  │                                                                  │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐  │   │
│  │  │Dashboard │  │Model Results │  │Risk Heat-│  │   Live    │  │   │
│  │  │  /       │  │/model-results│  │map       │  │ Predictor │  │   │
│  │  └──────────┘  └──────────────┘  └──────────┘  └───────────┘  │   │
│  │       │               │                              │           │   │
│  │       └───────────────┴──────────────────────────────┘           │   │
│  │                        │  src/services/api.ts                    │   │
│  │              VITE_API_URL ?? http://localhost:8000               │   │
│  └──────────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │  HTTP (JSON)
                              │  CORS: localhost:5173 allowed
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python 3.12)                        │
│                    http://localhost:8000  (dev)                         │
│              https://outbreak-watch-api.onrender.com (prod)            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  backend/main.py                                                  │  │
│  │                                                                   │  │
│  │  POST /predict           GET /live-weather                        │  │
│  │  GET /historical-data    GET /model-results                       │  │
│  │  GET /feature-importance GET /health                              │  │
│  └────────────┬────────────────────────────┬──────────────────────── ┘  │
│               │                            │                            │
│  ┌────────────▼────────────┐  ┌────────────▼──────────────────────┐   │
│  │   ML Model Layer        │  │   Live Data Layer                  │   │
│  │                         │  │                                    │   │
│  │  joblib.load(           │  │  httpx.AsyncClient.get(           │   │
│  │   outputs/              │  │   api.open-meteo.com/v1/forecast  │   │
│  │   cholera_ensemble_     │  │   ?latitude=9.0820                │   │
│  │   model.pkl)            │  │   &longitude=8.6753               │   │
│  │                         │  │   &current=temperature_2m,        │   │
│  │  joblib.load(           │  │     relative_humidity_2m,         │   │
│  │   outputs/              │  │     wind_speed_10m               │   │
│  │   cholera_scaler.pkl)   │  │   &timezone=Africa/Lagos)        │   │
│  │                         │  │                                    │   │
│  │  StandardScaler         │  │  → { temperature_c,               │   │
│  │  .transform(features)   │  │      humidity_pct, wind_speed,    │   │
│  │  → model.predict()      │  │      timestamp }                  │   │
│  └─────────────────────────┘  └────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Static Data Layer                                                 │  │
│  │  pd.read_csv(data/processed/era5_nigeria_v2_monthly.csv)          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (training time only, not runtime)
┌─────────────────────────────────────────────────────────────────────────┐
│                     Offline Data Pipeline                               │
│                                                                         │
│  CDS API ──► era5_nigeria_v2.nc (NetCDF)                               │
│                     │                                                   │
│                     ▼                                                   │
│  xarray / cfgrib ──► era5_nigeria_v2_monthly.csv (220 rows)            │
│                     │                                                   │
│  NCDC Nigeria ──► nigeria_cholera.csv (2010-2025)                      │
│  Lassa Fever Map ──► clean_lassa_fever_map_data.csv (2020-2025)        │
│                     │                                                   │
│                     ▼                                                   │
│  notebooks/02_preprocessing.ipynb ──► final_training_data.csv (70 rows)│
│  notebooks/03_model_nigeria_disease_outbreak.ipynb ──► .pkl files      │
│  notebooks/04_model_nigeria_cholera.ipynb ──► cholera_*.pkl files      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend → Backend Data Flow

### Dashboard page load
```
1. Component mounts
2. fetchLiveWeather() → GET /live-weather
   - Backend calls Open-Meteo API with Nigeria coordinates
   - Returns { temperature_c, humidity_pct, wind_speed, timestamp }
3. fetchPrediction(payload) → POST /predict
   - payload built from live weather + current month + computed lags
   - Returns { risk: "HIGH"|"LOW", confidence: 0.xx, probabilities: {...} }
4. Both results stored in component state
5. Offline fallback: localStorage cache checked if backend unreachable
```

### Live Predictor slider change
```
1. User moves a slider
2. 350ms debounce fires
3. POST /predict with all 10 features
   - lag features derived: temp_lag1 = temperature - 0.5,
     temp_lag2 = temperature - 1, wind_lag1 = wind,
     humidity_lag1 = prevHumidity, humidity_lag2 = prevHumidity - 3
   - rainy_season = 1 if month in [5,6,7,8,9,10] else 0
4. Response updates gauge + risk badge + confidence display
```

### Methodology page load
```
1. fetchHistoricalData() → GET /historical-data
2. Backend reads era5_nigeria_v2_monthly.csv with pandas
3. Returns { count: 220, records: [...] }
4. Frontend plots temperature + humidity as dual-axis line chart
```

---

## API Endpoints Reference

### POST /predict

**Request body:**
```json
{
  "temperature_c":  27.5,
  "humidity_pct":   75.0,
  "wind_speed":     1.2,
  "temp_lag1":      26.8,
  "humidity_lag1":  72.0,
  "wind_lag1":      1.1,
  "month":          7,
  "rainy_season":   1,
  "temp_lag2":      25.5,
  "humidity_lag2":  68.0
}
```

**Response:**
```json
{
  "risk": "HIGH",
  "confidence": 0.8312,
  "probabilities": {
    "low_risk": 0.1688,
    "high_risk": 0.8312
  }
}
```

**Notes:**
- Feature order is fixed — backend DataFrame column order matches exactly
- `rainy_season` must be computed by caller: `1 if month in [5,6,7,8,9,10] else 0`
- Scaler is applied server-side before prediction
- Returns HTTP 422 if any field is missing or wrong type

---

### GET /live-weather

**Response:**
```json
{
  "temperature_c": 28.4,
  "humidity_pct":  68,
  "wind_speed":    1.4,
  "timestamp":     "2025-07-15T12:00",
  "source":        "Open-Meteo (ERA5)"
}
```

**Notes:**
- Fetches Nigeria center coordinates: lat=9.0820, lng=8.6753
- 5-second timeout; returns HTTP 502 if Open-Meteo is unreachable
- Frontend caches this response in localStorage (10 min TTL)

---

### GET /historical-data

**Response:**
```json
{
  "count": 220,
  "records": [
    { "year": 2010, "month": 1, "temperature_c": 25.3, "humidity_pct": 42.1, "wind_speed": 1.8, ... },
    ...
  ]
}
```

**Notes:**
- Reads `data/processed/era5_nigeria_v2_monthly.csv` on every call (no caching)
- Returns all columns present in the CSV as-is
- Returns HTTP 404 if CSV file not found

---

### GET /model-results

**Response:**
```json
{
  "dataset": "Nigeria Cholera 2010–2025 (190 monthly observations)",
  "evaluation": "5-fold stratified cross-validation",
  "primary_metric": "Recall (no missed outbreaks)",
  "models": [
    { "name": "Logistic Regression",       "accuracy": 74.74, "f1": 67.17, "recall": 100.0 },
    { "name": "Neural Network (Multi-Input)", "accuracy": 71.58, "f1": 56.91, "recall": 79.11 },
    { "name": "XGBoost",                   "accuracy": 72.63, "f1": 45.39, "recall": 43.33 },
    { "name": "Random Forest",             "accuracy": 70.53, "f1": 54.73, "recall": 73.33 },
    { "name": "Ensemble (LR+RF+XGB)",      "accuracy": 71.05, "f1": 54.47, "recall": 68.89 }
  ]
}
```

**Notes:** Hardcoded from training results. Update this endpoint if models are retrained.

---

### GET /feature-importance

**Response:**
```json
{
  "model": "Random Forest (cholera dataset)",
  "note": "Higher score = stronger predictor of outbreak risk",
  "features": [
    { "feature": "humidity_pct",  "label": "Humidity (%)",           "importance": 0.2656 },
    { "feature": "rainy_season",  "label": "Rainy Season (May–Oct)", "importance": 0.2144 },
    ...
  ]
}
```

---

### GET /health

**Response:** `{ "status": "ok", "model": "cholera_ensemble_model_v2" }`

Used by Render health checks to confirm the service is alive.

---

## CORS Configuration

The backend allows requests only from:
- `http://localhost:5173` (Vite dev server)

To add the production frontend URL, add it to `allow_origins` in `backend/main.py`:
```python
allow_origins=["http://localhost:5173", "https://your-frontend.onrender.com"]
```

---

## Environment Variables

| Variable | Service | Purpose | Default |
|---|---|---|---|
| `PORT` | Backend | Port Render assigns | 8000 (local) |
| `VITE_API_URL` | Frontend (build time) | Backend base URL | `http://localhost:8000` |
| `PYTHON_VERSION` | Backend | Python version on Render | 3.12.0 |
