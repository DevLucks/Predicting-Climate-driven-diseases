# Outbreak Watch — Climate-Driven Disease Surveillance System

A real-time disease outbreak surveillance platform for Nigeria that predicts **Cholera** and **Lassa Fever** risk using climate data, ML ensemble models, and live weather feeds.

**Live Demo:** https://outbreak-watch-frontend.onrender.com/

---

## Overview

Outbreak Watch combines machine learning with real-time weather data to predict disease outbreak risk across Nigerian states. The system achieves **74% prediction accuracy** using an ensemble of XGBoost and scikit-learn models trained on historical climate and disease incidence data.

## Features

- Real-time risk scoring for Cholera and Lassa Fever across Nigerian states
- Interactive map and 3D globe visualization of outbreak risk levels
- Live weather data integration (temperature, humidity, wind) via Open-Meteo API
- Historical disease trend charts powered by WHO GHO data
- ML ensemble model with 74% accuracy on held-out test data
- Fully responsive — works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Visualization | Recharts, Leaflet, react-globe.gl, Three.js |
| Animation | Framer Motion |
| Backend | FastAPI (Python) |
| ML Models | scikit-learn, XGBoost |
| Data Processing | pandas, numpy, joblib |
| Weather API | Open-Meteo (no API key required) |
| Disease Data | WHO GHO API |

---

## Project Structure

```
Final-Year-Disease-Prediction/
├── backend/                  # FastAPI + ML inference service
│   ├── main.py               # App entry point, CORS, routes
│   ├── model_service.py      # Loads .pkl models, exposes predict()
│   ├── weather_service.py    # Fetches live weather from Open-Meteo
│   ├── disease_service.py    # Fetches cholera data from WHO GHO API
│   └── requirements.txt
├── frontend/                 # React + TypeScript + Vite
│   └── src/                  # Components, pages, charts, map
├── notebooks/                # Data exploration & model training
├── data/                     # Training datasets
├── outputs/                  # Trained model files (.pkl)
└── render.yaml               # Render.com deployment config
```

---

## Running Locally

### Backend

```bash
cd Final-Year-Disease-Prediction/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd Final-Year-Disease-Prediction/frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## ML Model

The ensemble model was trained on climate indicators (temperature, rainfall, humidity) correlated with historical disease incidence across Nigerian states. XGBoost and scikit-learn classifiers are combined for improved accuracy. At runtime, predictions are refreshed with live weather readings from Open-Meteo, so risk scores reflect current conditions.

---

## Built By

**Lucky Odu** — React & React Native Developer  
[Portfolio](https://devlucks.github.io/Portifolio) · [LinkedIn](https://ng.linkedin.com/in/lucky-odu-8a7a99303) · [GitHub](https://github.com/DevLucks)
