# CLAUDE.md — Nigeria Disease Outbreak Prediction System
# Full Context for Claude Code Agents
# Last Updated: June 2026 | Author: Odu Lucky Chibuike

---

## 🎯 PROJECT MISSION
Build a full-stack web application that visualises a trained machine learning model
predicting climate-driven disease outbreak risk in Nigeria. The app will be used for
a final year academic defence presentation and must be visually impressive,
scientifically accurate, and run reliably on a local laptop with optional live data.

---

## 📁 PROJECT STRUCTURE

```
finalyearproject/
└── Final-Year-Disease-Prediction/
    ├── data/
    │   ├── raw/
    │   │   ├── era5_nigeria_v2.nc              # ERA5 NetCDF 2008-2026 (3.16MB)
    │   │   ├── clean_lassa_fever_map_data.csv  # Lassa fever by state 2020-2025
    │   │   ├── nigeria_cholera.csv             # Cholera 2010-2025
    │   │   └── 92024a5d...grib                 # Original ERA5 GRIB file
    │   └── processed/
    │       ├── era5_nigeria_monthly.csv         # Cleaned weather v1 (88 months)
    │       ├── era5_nigeria_v2_monthly.csv      # Cleaned weather v2 (220 months) ← USE THIS
    │       └── final_training_data.csv          # Merged training data (70 rows)
    ├── notebooks/
    │   ├── 02_preprocessing.ipynb
    │   ├── 03_model_nigeria_disease_outbreak.ipynb  # Main model notebook
    │   └── [cholera-specific notebook]
    ├── outputs/
    │   ├── ensemble_model_v2.pkl               # Ensemble (LR+RF+XGB) — Lassa+Cholera
    │   ├── cholera_ensemble_model.pkl          # Ensemble — Cholera only
    │   ├── scaler_v2.pkl                       # StandardScaler for all features
    │   ├── cholera_scaler.pkl                  # Scaler for cholera model
    │   ├── disease_outbreak_model.pkl          # Original Random Forest v1
    │   └── figures/
    │       ├── feature_importance.png
    │       ├── risk_heatmap.png
    │       ├── confusion_matrix.png
    │       ├── cholera_feature_importance.png
    │       ├── cholera_risk_heatmap.png
    │       └── cholera_confusion_matrix.png
    ├── download_era5.py                        # CDS API download script
    ├── venv/                                   # Python 3.14 virtual environment
    └── .cdsapirc                               # Copernicus API key (in home dir)
```

---

## 🧠 THE MACHINE LEARNING MODELS

### Model 1 — Lassa Fever + Cholera Combined (Primary)
- **File**: `outputs/ensemble_model_v2.pkl`
- **Scaler**: `outputs/scaler_v2.pkl`
- **Type**: Soft-voting Ensemble (Logistic Regression + Random Forest + XGBoost)
- **Dataset**: 70 monthly observations, 2020-2025
- **Target**: high_risk (1) or low_risk (0) based on combined Lassa+Cholera severity
- **Best single model**: Logistic Regression — Accuracy 91.43%, F1 91.60%, Recall 100%
- **Ensemble**: Accuracy 88.57%, F1 88.10%, Recall 93.33%

### Model 2 — Cholera Only (Larger Dataset)
- **File**: `outputs/cholera_ensemble_model.pkl`
- **Scaler**: `outputs/cholera_scaler.pkl`
- **Type**: Soft-voting Ensemble (LR + RF + XGB)
- **Dataset**: 190 monthly observations, 2010-2025
- **Best single model**: Logistic Regression — Accuracy 74.74%, Recall 100%
- **Neural Network**: Accuracy 71.58%, Recall 79.11%

### All 5 Models Compared (Cholera model — best for presentation):
| Model                    | Accuracy | F1     | Recall  |
|--------------------------|----------|--------|---------|
| Logistic Regression      | 74.74%   | 67.17% | 100.00% |
| Neural Network (Multi-Input) | 71.58% | 56.91% | 79.11% |
| XGBoost                  | 72.63%   | 45.39% | 43.33%  |
| Random Forest            | 70.53%   | 54.73% | 73.33%  |
| Ensemble (LR+RF+XGB)     | 71.05%   | 54.47% | 68.89%  |

---

## 📊 FEATURES USED BY THE MODEL

### Weather Features (Branch 1 of Neural Network):
1. `temperature_c` — Monthly average temperature (°C)
2. `humidity_pct` — Relative humidity (%) — **TOP PREDICTOR (0.2656)**
3. `wind_speed` — Wind speed (m/s)
4. `temp_lag1` — Temperature 1 month prior
5. `humidity_lag1` — Humidity 1 month prior — **2nd most important (0.1171)**
6. `wind_lag1` — Wind speed 1 month prior

### Seasonal Features (Branch 2 of Neural Network):
7. `month` — Calendar month (1-12)
8. `rainy_season` — 1 if May-Oct, else 0 — **2nd most important (0.2144)**
9. `temp_lag2` — Temperature 2 months prior
10. `humidity_lag2` — Humidity 2 months prior

### Feature Importance (Random Forest):
1. humidity_pct: 0.2656
2. rainy_season: 0.2144
3. humidity_lag1: 0.1171
4. month: 0.1098
5. temp_lag2: 0.0666
6. temp_lag1: 0.0481
7. humidity_lag2: 0.0474
8. wind_speed: 0.0454
9. temperature_c: 0.0444
10. wind_lag1: 0.0410

---

## 🐍 PYTHON ENVIRONMENT

- **Python**: 3.14
- **OS**: macOS
- **Virtual env**: `venv/` inside project folder
- **Activate**: `source venv/bin/activate`
- **Key libraries**: pandas, numpy, matplotlib, seaborn, scikit-learn, xgboost, torch (PyTorch 2.12), xarray, cfgrib, joblib, netCDF4

### Loading the Model in Python:
```python
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Load model and scaler
model = joblib.load('outputs/cholera_ensemble_model.pkl')
scaler = joblib.load('outputs/cholera_scaler.pkl')

# All 10 features in exact order
features = [
    'temperature_c', 'humidity_pct', 'wind_speed',
    'temp_lag1', 'humidity_lag1', 'wind_lag1',
    'month', 'rainy_season', 'temp_lag2', 'humidity_lag2'
]

# Make a prediction
sample = pd.DataFrame([{
    'temperature_c': 27.5, 'humidity_pct': 75.0, 'wind_speed': 1.2,
    'temp_lag1': 26.8, 'humidity_lag1': 72.0, 'wind_lag1': 1.1,
    'month': 7, 'rainy_season': 1, 'temp_lag2': 25.5, 'humidity_lag2': 68.0
}])

X_scaled = scaler.transform(sample[features])
prediction = model.predict(X_scaled)[0]
probability = model.predict_proba(X_scaled)[0]

print('Risk:', 'HIGH' if prediction == 1 else 'LOW')
print('Confidence:', f"{probability.max():.1%}")
```

---

## 🌐 AVAILABLE LIVE DATA APIs

### 1. ERA5 / Open-Meteo (Free, No Key Required) ← BEST FOR LIVE DATA
```
https://api.open-meteo.com/v1/forecast?
  latitude=9.0820&longitude=8.6753
  &hourly=temperature_2m,relative_humidity_2m,wind_speed_10m
  &timezone=Africa/Lagos
  &forecast_days=16
```
Returns live Nigeria weather — no API key needed.

### 2. Open-Meteo Historical (Free)
```
https://archive-api.open-meteo.com/v1/archive?
  latitude=9.0820&longitude=8.6753
  &start_date=2010-01-01&end_date=2024-12-31
  &monthly=temperature_2m_mean,relative_humidity_2m_mean,wind_speed_10m_mean
```

### 3. WHO Disease Outbreak API
```
https://ghoapi.azureedge.net/api/CHOLERA_0000000001
```
Returns global cholera cases by country (NGA = Nigeria).

### 4. NCDC Nigeria (Manual check)
```
https://ncdc.gov.ng/diseases/sitreps
```

### 5. NASA POWER API (Free, no key)
```
https://power.larc.nasa.gov/api/temporal/monthly/point?
  parameters=T2M,RH2M,WS2M
  &community=AG&longitude=8.6753&latitude=9.0820
  &start=2010&end=2024&format=JSON
```

---

## 🗺️ NIGERIA GEOGRAPHIC DATA

- **Center**: Latitude 9.0820, Longitude 8.6753
- **Bounding box**: North 14°N, South 4°N, West 3°E, East 15°E
- **36 States + FCT**: Use GeoJSON from https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-states.json
- **High-burden states for Lassa**: Edo, Ondo, Ebonyi, Bauchi, Plateau, Taraba
- **High-burden states for Cholera**: Borno, Adamawa, Yobe (northeast), Rivers, Lagos

---

## 🏗️ RECOMMENDED WEB APP ARCHITECTURE

### Backend: FastAPI (Python)
```
backend/
├── main.py              # FastAPI app
├── model_service.py     # Load model, make predictions
├── weather_service.py   # Fetch live Open-Meteo data
├── disease_service.py   # Fetch WHO/NCDC disease data
├── requirements.txt
└── models/              # Symlink or copy of outputs/*.pkl
```

### Frontend: React + Vite + TypeScript
```
frontend/
├── src/
│   ├── components/
│   │   ├── Globe/          # 3D globe with disease risk overlay
│   │   ├── Dashboard/      # Main metrics and charts
│   │   ├── RiskPredictor/  # Live slider-based prediction
│   │   ├── HeatMap/        # Monthly risk calendar heatmap
│   │   ├── ModelComparison/# 5-model bar chart comparison
│   │   └── FeatureImportance/
│   ├── services/
│   │   ├── api.ts           # Calls to FastAPI backend
│   │   └── weather.ts       # Direct Open-Meteo calls
│   └── App.tsx
├── package.json
└── vite.config.ts
```

### Key Libraries for Frontend:
- **Globe**: `react-globe.gl` or `three.js` with custom shader
- **Charts**: `recharts` or `d3.js`
- **Maps/Heatmap**: `react-leaflet` + `leaflet.heat`
- **3D**: `@react-three/fiber` + `@react-three/drei`
- **UI**: `tailwindcss` + `shadcn/ui`
- **Animations**: `framer-motion`

---

## 🎨 UI/UX VISION FOR DEFENCE DAY

### Page 1 — Hero Dashboard
- Dark theme (navy #0D2137 background)
- Animated 3D globe showing Nigeria with risk zones pulsing
- Live weather cards (temperature, humidity, wind) from Open-Meteo
- Current month risk prediction badge (HIGH/LOW with confidence %)
- Tagline: "Climate-Driven Disease Outbreak Early Warning System"

### Page 2 — Model Results
- 5-model accuracy comparison bar chart (animated)
- Feature importance horizontal bar chart
- ROC curves for all models
- Confusion matrix visualisation

### Page 3 — Risk Heatmap
- Calendar heatmap 2010-2025 (month × year grid)
- Red = high risk, green = low risk
- Nigeria state-level choropleth map (if state data available)

### Page 4 — Live Prediction
- Sliders for temperature, humidity, wind, month
- Real-time risk output that updates as sliders move
- Probability gauge/meter
- "Using live ERA5 data" badge

### Page 5 — Data & Methodology
- Timeline of data sources
- Pipeline flow diagram
- ERA5 weather trends chart (2010-2025)

---

## 🤖 MULTI-AGENT TASK BREAKDOWN

For Claude Code, recommended agent split:

### Agent 1 — Backend Agent
**Task**: Build FastAPI backend
- Load pickle models
- Create /predict endpoint
- Fetch live weather from Open-Meteo
- Serve historical data from CSVs
- CORS configuration for frontend

### Agent 2 — Globe & Map Agent
**Task**: Build 3D globe component
- react-globe.gl with Nigeria highlighted
- Animated risk pulse on high-risk states
- Satellite imagery layer
- Risk score overlay

### Agent 3 — Charts & Dashboard Agent
**Task**: Build all chart components
- Model comparison charts
- Feature importance chart
- Monthly risk heatmap (2010-2025)
- Weather trends line charts
- Recharts or D3

### Agent 4 — Live Prediction Agent
**Task**: Build interactive predictor
- Slider inputs for all 10 features
- Real-time API calls to backend
- Risk gauge animation
- Confidence percentage display

### Agent 5 — Integration & Polish Agent
**Task**: Wire everything together
- Navigation between pages
- Loading states and animations
- Responsive layout
- Presentation mode (fullscreen)

---

## 🚀 QUICK START COMMANDS

```bash
# Backend
cd Final-Year-Disease-Prediction
source venv/bin/activate
pip install fastapi uvicorn httpx python-dotenv
uvicorn backend.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 📋 DISEASES AND HIGH-SEVERITY YEARS

### Cholera (2010-2025):
- HIGH severity: 2010, 2011, 2014, 2019, 2021, 2022, 2023, 2024
- Median threshold: 7,386 cases/year
- Peak: 2021 (112,746 cases)

### Lassa Fever (2020-2025):
- HIGH severity: 2020, 2023, 2024
- Median threshold: 1,168 cases/year

---

## 🎓 ACADEMIC CONTEXT

- **Paper title**: "Predicting Climate-Driven Disease Outbreak Risk in Nigeria Using a Multi-Input Neural Network and Ensemble Machine Learning Framework"
- **Keywords**: cholera, Nigeria, ERA5, machine learning, neural network, ensemble, One Health
- **Target journal**: PLOS ONE / Frontiers in Public Health / One Health (Elsevier)
- **Supervisor requirement**: Multi-Input Neural Network + Ensemble model ✅ DONE
- **Evaluation**: 5-fold stratified cross-validation
- **Primary metric**: Recall (100% for best model — no missed outbreaks)

---

## ⚠️ IMPORTANT NOTES FOR AGENTS

1. Python venv is at `venv/` — always activate before running Python
2. Working directory must always be set to the project root before loading CSVs
3. Model files are .pkl — load with joblib, not pickle
4. The scaler MUST be applied before passing features to the model
5. Feature order MUST match exactly: temperature_c, humidity_pct, wind_speed, temp_lag1, humidity_lag1, wind_lag1, month, rainy_season, temp_lag2, humidity_lag2
6. rainy_season = 1 if month is 5,6,7,8,9,10 else 0
7. For live predictions, fetch current month weather from Open-Meteo API (no key needed)
8. The app must work fully offline on defence day — cache all necessary data
9. Use dark theme throughout — navy/teal/gold colour palette
10. All charts must be animated for presentation impact

