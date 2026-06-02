from pathlib import Path

import httpx
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent.parent
OUTPUTS_DIR = BASE_DIR / "outputs"
DATA_DIR = BASE_DIR / "data" / "processed"

# ---------------------------------------------------------------------------
# Model + scaler — loaded once at startup
# ---------------------------------------------------------------------------
try:
    model = joblib.load(OUTPUTS_DIR / "cholera_ensemble_model.pkl")
    scaler = joblib.load(OUTPUTS_DIR / "cholera_scaler.pkl")
except FileNotFoundError as e:
    raise RuntimeError(f"Could not load model files from {OUTPUTS_DIR}: {e}")

FEATURES = [
    "temperature_c", "humidity_pct", "wind_speed",
    "temp_lag1", "humidity_lag1", "wind_lag1",
    "month", "rainy_season", "temp_lag2", "humidity_lag2",
]

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Nigeria Disease Outbreak Prediction API",
    description="Climate-driven disease outbreak early warning system for Nigeria.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    temperature_c: float
    humidity_pct: float
    wind_speed: float
    temp_lag1: float
    humidity_lag1: float
    wind_lag1: float
    month: int
    rainy_season: int   # 1 if month in [5,6,7,8,9,10], else 0
    temp_lag2: float
    humidity_lag2: float

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/predict")
def predict(data: PredictRequest):
    """Accept all 10 features, return risk level and per-class probabilities."""
    sample = pd.DataFrame(
        [[
            data.temperature_c, data.humidity_pct, data.wind_speed,
            data.temp_lag1, data.humidity_lag1, data.wind_lag1,
            data.month, data.rainy_season, data.temp_lag2, data.humidity_lag2,
        ]],
        columns=FEATURES,
    )
    X_scaled = scaler.transform(sample)
    prediction = int(model.predict(X_scaled)[0])
    proba = model.predict_proba(X_scaled)[0]

    return {
        "risk": "HIGH" if prediction == 1 else "LOW",
        "confidence": round(float(proba.max()), 4),
        "probabilities": {
            "low_risk": round(float(proba[0]), 4),
            "high_risk": round(float(proba[1]), 4),
        },
    }


@app.get("/live-weather")
async def live_weather():
    """Fetch current Nigeria weather from Open-Meteo (no API key required)."""
    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=9.0820&longitude=8.6753"
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
        "&timezone=Africa%2FLagos"
    )
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo request failed: {e}")

    current = data["current"]
    return {
        "temperature_c": current["temperature_2m"],
        "humidity_pct": current["relative_humidity_2m"],
        "wind_speed": current["wind_speed_10m"],
        "timestamp": current["time"],
        "source": "Open-Meteo (ERA5)",
    }


@app.get("/historical-data")
def historical_data():
    """Return all rows from era5_nigeria_v2_monthly.csv as JSON."""
    csv_path = DATA_DIR / "era5_nigeria_v2_monthly.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"CSV not found at {csv_path}")
    df = pd.read_csv(csv_path)
    return {"count": len(df), "records": df.to_dict(orient="records")}


@app.get("/model-results")
def model_results():
    """Return the 5-model comparison results (cholera dataset, from training)."""
    return {
        "dataset": "Nigeria Cholera 2010–2025 (190 monthly observations)",
        "evaluation": "5-fold stratified cross-validation",
        "primary_metric": "Recall (no missed outbreaks)",
        "models": [
            {
                "name": "Logistic Regression",
                "accuracy": 74.74,
                "f1": 67.17,
                "recall": 100.0,
            },
            {
                "name": "Neural Network (Multi-Input)",
                "accuracy": 71.58,
                "f1": 56.91,
                "recall": 79.11,
            },
            {
                "name": "XGBoost",
                "accuracy": 72.63,
                "f1": 45.39,
                "recall": 43.33,
            },
            {
                "name": "Random Forest",
                "accuracy": 70.53,
                "f1": 54.73,
                "recall": 73.33,
            },
            {
                "name": "Ensemble (LR+RF+XGB)",
                "accuracy": 71.05,
                "f1": 54.47,
                "recall": 68.89,
            },
        ],
    }


@app.get("/feature-importance")
def feature_importance():
    """Return Random Forest feature importance scores from training."""
    return {
        "model": "Random Forest (cholera dataset)",
        "note": "Higher score = stronger predictor of outbreak risk",
        "features": [
            {"feature": "humidity_pct",   "label": "Humidity (%)",            "importance": 0.2656},
            {"feature": "rainy_season",   "label": "Rainy Season (May–Oct)",  "importance": 0.2144},
            {"feature": "humidity_lag1",  "label": "Humidity lag 1 month",    "importance": 0.1171},
            {"feature": "month",          "label": "Calendar Month",          "importance": 0.1098},
            {"feature": "temp_lag2",      "label": "Temperature lag 2 months","importance": 0.0666},
            {"feature": "temp_lag1",      "label": "Temperature lag 1 month", "importance": 0.0481},
            {"feature": "humidity_lag2",  "label": "Humidity lag 2 months",   "importance": 0.0474},
            {"feature": "wind_speed",     "label": "Wind Speed (m/s)",        "importance": 0.0454},
            {"feature": "temperature_c",  "label": "Temperature (°C)",        "importance": 0.0444},
            {"feature": "wind_lag1",      "label": "Wind lag 1 month",        "importance": 0.0410},
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": "cholera_ensemble_model_v2"}
