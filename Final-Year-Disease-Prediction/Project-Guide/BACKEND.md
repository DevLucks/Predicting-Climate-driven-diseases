# Backend Documentation

**File:** `backend/main.py`  
**Framework:** FastAPI  
**Server:** Uvicorn  
**Python:** 3.14 (local) / 3.12 (Render)

---

## Startup Behaviour

When the module is imported (i.e., when uvicorn starts), two things happen immediately at module level:

```python
model  = joblib.load(OUTPUTS_DIR / "cholera_ensemble_model.pkl")
scaler = joblib.load(OUTPUTS_DIR / "cholera_scaler.pkl")
```

`OUTPUTS_DIR` is resolved as `Path(__file__).parent.parent / "outputs"` — two directories up from `backend/main.py`, pointing to `Final-Year-Disease-Prediction/outputs/`.

**If the `.pkl` files are missing**, the app raises `RuntimeError` at startup and will not serve any requests. This is intentional — the app is useless without its model.

---

## Path Resolution

```python
BASE_DIR    = Path(__file__).parent.parent   # → Final-Year-Disease-Prediction/
OUTPUTS_DIR = BASE_DIR / "outputs"           # → Final-Year-Disease-Prediction/outputs/
DATA_DIR    = BASE_DIR / "data" / "processed" # → Final-Year-Disease-Prediction/data/processed/
```

**The server must be started from within `Final-Year-Disease-Prediction/`** or using the module path `uvicorn backend.main:app`. Running `python backend/main.py` directly will not work.

---

## Feature Order Constraint

The scaler and model were trained with features in this exact column order. Changing the order produces wrong predictions silently.

```python
FEATURES = [
    "temperature_c",   # 0 — Monthly mean 2m temperature (°C)
    "humidity_pct",    # 1 — Relative humidity (%) — TOP PREDICTOR
    "wind_speed",      # 2 — 10m wind speed (m/s)
    "temp_lag1",       # 3 — temperature_c from 1 month prior
    "humidity_lag1",   # 4 — humidity_pct from 1 month prior
    "wind_lag1",       # 5 — wind_speed from 1 month prior
    "month",           # 6 — Calendar month (1–12)
    "rainy_season",    # 7 — 1 if month in [5,6,7,8,9,10] else 0
    "temp_lag2",       # 8 — temperature_c from 2 months prior
    "humidity_lag2",   # 9 — humidity_pct from 2 months prior
]
```

---

## Endpoint Reference

### POST /predict

**Schema (Pydantic `PredictRequest`):**
```python
class PredictRequest(BaseModel):
    temperature_c:  float
    humidity_pct:   float
    wind_speed:     float
    temp_lag1:      float
    humidity_lag1:  float
    wind_lag1:      float
    month:          int
    rainy_season:   int    # must be 0 or 1
    temp_lag2:      float
    humidity_lag2:  float
```

**Processing pipeline:**
```python
sample   = pd.DataFrame([[...10 values in order...]], columns=FEATURES)
X_scaled = scaler.transform(sample)          # StandardScaler z-score
pred     = model.predict(X_scaled)[0]        # 0 or 1
proba    = model.predict_proba(X_scaled)[0]  # [p_low, p_high]
```

**Response:**
```json
{
  "risk": "HIGH",
  "confidence": 0.8312,
  "probabilities": { "low_risk": 0.1688, "high_risk": 0.8312 }
}
```

**Errors:**
- `422 Unprocessable Entity` — missing field or wrong type (automatic Pydantic validation)

---

### GET /live-weather

**Processing:**
```python
url = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=9.0820&longitude=8.6753"
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
    "&timezone=Africa%2FLagos"
)
async with httpx.AsyncClient(timeout=10) as client:
    resp = await client.get(url)
```

**Field mapping from Open-Meteo response:**
```
data["current"]["temperature_2m"]        → temperature_c
data["current"]["relative_humidity_2m"]  → humidity_pct
data["current"]["wind_speed_10m"]        → wind_speed
data["current"]["time"]                  → timestamp
```

**Errors:**
- `502 Bad Gateway` — Open-Meteo unreachable or returned non-2xx
- Timeout is 10 seconds

---

### GET /historical-data

```python
df = pd.read_csv(DATA_DIR / "era5_nigeria_v2_monthly.csv")
return {"count": len(df), "records": df.to_dict(orient="records")}
```

**Errors:**
- `404 Not Found` — CSV file missing from `data/processed/`

---

### GET /model-results

Returns hardcoded dict matching the training notebook results. If models are retrained, update the values in `main.py` manually. Fields: `name`, `accuracy`, `f1`, `recall` for 5 models.

---

### GET /feature-importance

Returns hardcoded dict from Random Forest feature importance computed during training. Fields: `feature`, `label`, `importance` (sum = 1.0).

---

### GET /health

Returns `{"status": "ok", "model": "cholera_ensemble_model_v2"}`. Used by Render health check polling.

---

## CORS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**To allow the production frontend**, add its URL to `allow_origins`. The production frontend URL follows the pattern `https://outbreak-watch-frontend.onrender.com`.

---

## Requirements (`backend/requirements.txt`)

```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
httpx>=0.27.0
joblib>=1.4.0
pandas>=2.2.0
numpy>=1.26.0
scikit-learn>=1.4.0
xgboost>=2.0.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```

**Note:** PyTorch is NOT in requirements.txt — it's only needed for training the Neural Network in notebooks. The deployed `cholera_ensemble_model.pkl` is a scikit-learn voting classifier (LR + RF + XGBoost) and does not depend on PyTorch at inference time.

---

## Running Locally

```bash
# From Final-Year-Disease-Prediction/ directory
source venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Interactive API docs: `http://localhost:8000/docs`  
Alternative docs: `http://localhost:8000/redoc`

---

## Adding a New Endpoint

1. Add a Pydantic model if the endpoint has a request body
2. Define the function with `@app.get("/new-endpoint")` or `@app.post(...)`
3. For async endpoints (any external HTTP call), use `async def` + `async with httpx.AsyncClient`
4. For sync endpoints (model inference, CSV reading), use plain `def`
5. Update the frontend `src/services/api.ts` with a matching `apiFetch` call
6. Add the response type to `src/types/index.ts`

---

## Loading a Different Model

To switch from the cholera ensemble to the combined Lassa+Cholera model:

```python
# In backend/main.py, change:
model  = joblib.load(OUTPUTS_DIR / "ensemble_model_v2.pkl")
scaler = joblib.load(OUTPUTS_DIR / "scaler_v2.pkl")
```

The feature schema is identical — both models use the same 10 features in the same order. The combined model has higher accuracy (91.43%) but was trained on only 70 observations (2020–2025) vs 190 for the cholera-only model.
