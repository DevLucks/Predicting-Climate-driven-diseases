# Backend — FastAPI Python Service

Python 3.14 + FastAPI backend that serves ML predictions and live weather data.

## What goes here

- `main.py` — FastAPI app entry point, CORS config, route registration
- `model_service.py` — Loads `outputs/ensemble_model_v2.pkl` and `cholera_ensemble_model.pkl` via joblib; exposes a predict function
- `weather_service.py` — Fetches live temperature, humidity, and wind data from Open-Meteo (no API key needed)
- `disease_service.py` — Fetches cholera case data from the WHO GHO API
- `requirements.txt` — fastapi, uvicorn, httpx, joblib, pandas, numpy, scikit-learn, xgboost, python-dotenv
- `models/` — Symlinks or copies of the `.pkl` files from `../outputs/`

## Run

```bash
source ../venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be available at http://localhost:8000  
Interactive docs at http://localhost:8000/docs
