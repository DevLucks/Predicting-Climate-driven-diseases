# Machine Learning Model Documentation

---

## Model Files

All `.pkl` files live in `outputs/`. They are excluded from git (see `.gitignore`) because they are binary blobs that change on every retrain. Store them in cloud storage or regenerate from notebooks.

| File | Description | Size |
|---|---|---|
| `cholera_ensemble_model.pkl` | **Primary** — Ensemble (LR+RF+XGB), cholera only | ~615 KB |
| `cholera_scaler.pkl` | StandardScaler for cholera model | ~823 B |
| `ensemble_model_v2.pkl` | Combined Lassa+Cholera ensemble | ~442 KB |
| `scaler_v2.pkl` | StandardScaler for combined model | ~823 B |
| `disease_outbreak_model.pkl` | Original Random Forest v1 (superseded) | ~225 KB |
| `scaler.pkl` | Scaler for original v1 model | ~1.1 KB |

**Always load with joblib, never pickle:**
```python
import joblib
model  = joblib.load("outputs/cholera_ensemble_model.pkl")
scaler = joblib.load("outputs/cholera_scaler.pkl")
```

---

## Feature Engineering

### Raw inputs (from ERA5 + calendar)
- `temperature_c` — Monthly mean 2m air temperature in °C
- `humidity_pct` — Relative humidity % (derived from dewpoint temperature)
- `wind_speed` — 10m wind speed in m/s

### Engineered features
- `temp_lag1` — `temperature_c` shifted 1 month back
- `humidity_lag1` — `humidity_pct` shifted 1 month back
- `wind_lag1` — `wind_speed` shifted 1 month back
- `temp_lag2` — `temperature_c` shifted 2 months back
- `humidity_lag2` — `humidity_pct` shifted 2 months back
- `month` — Calendar month (1–12), captures seasonality
- `rainy_season` — Binary: `1` if month ∈ {5,6,7,8,9,10} else `0`

### Target variable
- `high_risk` — Binary classification target
  - For cholera model: `1` if annual cases > 7,386 (median) AND month is rainy season
  - For combined model: `1` if combined Lassa+Cholera severity is high

---

## Exact Feature Order

The scaler and model **must** receive features in this exact order:

```
Index  Feature        Description
  0    temperature_c  Monthly mean temperature (°C)
  1    humidity_pct   Relative humidity (%)         ← most important
  2    wind_speed     Wind speed (m/s)
  3    temp_lag1      Temperature 1 month prior
  4    humidity_lag1  Humidity 1 month prior         ← 3rd most important
  5    wind_lag1      Wind speed 1 month prior
  6    month          Calendar month (1–12)
  7    rainy_season   1 if May–Oct, else 0           ← 2nd most important
  8    temp_lag2      Temperature 2 months prior
  9    humidity_lag2  Humidity 2 months prior
```

---

## Model 1 — Cholera Only (Primary, Deployed)

**File:** `cholera_ensemble_model.pkl` + `cholera_scaler.pkl`  
**Type:** Soft-voting ensemble (`VotingClassifier`, `voting='soft'`)  
**Estimators:** Logistic Regression + Random Forest + XGBoost  
**Dataset:** 190 monthly observations, Nigeria, 2010–2025  
**Evaluation:** 5-fold stratified cross-validation  
**Primary metric:** Recall (minimise false negatives — missed outbreaks are more costly than false alarms)

### Performance Results

| Model | Accuracy | F1 Score | Recall | Notes |
|---|---|---|---|---|
| Logistic Regression | 74.74% | 67.17% | **100%** | Best — zero missed outbreaks |
| Neural Network (Multi-Input) | 71.58% | 56.91% | 79.11% | PyTorch, two input branches |
| XGBoost | 72.63% | 45.39% | 43.33% | Lowest recall |
| Random Forest | 70.53% | 54.73% | 73.33% | Best source of feature importance |
| **Ensemble (LR+RF+XGB)** | 71.05% | 54.47% | 68.89% | Deployed in backend |

### Confusion Matrix (Logistic Regression, best model)

```
                  Predicted LOW    Predicted HIGH
Actual LOW           108 (TN)         34 (FP)
Actual HIGH            0 (FN)         48 (TP)
```

Total = 190. Accuracy = 156/190 = 82.1% on this split (reported 74.74% from cross-validation average).

### Feature Importance (Random Forest)

| Rank | Feature | Importance |
|---|---|---|
| 1 | humidity_pct | 0.2656 (26.56%) |
| 2 | rainy_season | 0.2144 (21.44%) |
| 3 | humidity_lag1 | 0.1171 (11.71%) |
| 4 | month | 0.1098 (10.98%) |
| 5 | temp_lag2 | 0.0666 (6.66%) |
| 6 | temp_lag1 | 0.0481 (4.81%) |
| 7 | humidity_lag2 | 0.0474 (4.74%) |
| 8 | wind_speed | 0.0454 (4.54%) |
| 9 | temperature_c | 0.0444 (4.44%) |
| 10 | wind_lag1 | 0.0410 (4.10%) |

**Interpretation:** Humidity (current + lagged) accounts for ~44% of predictive power. The rainy season flag is the second strongest predictor, confirming that May–October is the primary outbreak window.

---

## Model 2 — Combined Lassa + Cholera (Higher Accuracy)

**File:** `ensemble_model_v2.pkl` + `scaler_v2.pkl`  
**Type:** Soft-voting ensemble (LR + RF + XGB)  
**Dataset:** 70 monthly observations, 2020–2025  
**Note:** Smaller dataset but higher quality — both disease types included

### Performance Results

| Model | Accuracy | F1 Score | Recall |
|---|---|---|---|
| **Logistic Regression** | **91.43%** | **91.60%** | **100%** |
| Ensemble (LR+RF+XGB) | 88.57% | 88.10% | 93.33% |

The much higher accuracy is partly due to the smaller, more balanced dataset and the fact that Lassa fever's seasonal pattern aligns strongly with climate features.

---

## Multi-Input Neural Network Architecture

Implemented in PyTorch (training only). Architecture:

```
Branch 1 — Weather Features (6 inputs)        Branch 2 — Seasonal Features (4 inputs)
[temp, humidity, wind, lag features]           [month, rainy_season, temp_lag2, humidity_lag2]
         │                                               │
    Dense(32, ReLU)                              Dense(16, ReLU)
    Dropout(0.2)                                 Dropout(0.2)
         │                                               │
         └─────────────── Concatenate ──────────────────┘
                                │
                         Dense(32, ReLU)
                         Dropout(0.3)
                         Dense(16, ReLU)
                                │
                         Dense(1, Sigmoid)
                                │
                        0 = LOW RISK, 1 = HIGH RISK
```

**Training:** Adam optimiser, lr=0.001, binary cross-entropy loss, 100 epochs, batch size 16.  
**Not deployed** — the ensemble (.pkl) is used in production. PyTorch is not in `backend/requirements.txt`.

---

## High-Severity Years

### Cholera (2010–2025)
High severity (annual cases > 7,386 median): **2010, 2011, 2014, 2019, 2021, 2022, 2023, 2024**  
Peak: **2021** — 112,746 cases

### Lassa Fever (2020–2025)
High severity (annual cases > 1,168 median): **2020, 2023, 2024**

---

## How to Retrain the Model

1. Ensure the processed data is up to date: `data/processed/era5_nigeria_v2_monthly.csv`
2. Open `notebooks/04_model_nigeria_cholera.ipynb` in Jupyter
3. Run all cells — this will:
   - Load and merge `era5_nigeria_v2_monthly.csv` + `nigeria_cholera.csv`
   - Engineer all 10 features including lags and rainy_season flag
   - Train all 5 models with 5-fold stratified CV
   - Save `outputs/cholera_ensemble_model.pkl` and `outputs/cholera_scaler.pkl`
4. Update the hardcoded performance values in `backend/main.py` endpoints `/model-results` and `/feature-importance`
5. Restart the backend

**After retraining, the `.pkl` files must be transferred to the deployment server** (Render does not persist them across deploys — see `DEPLOYMENT.md` for options).

---

## How to Add a New Disease

1. Obtain monthly case data for the new disease (same format as `nigeria_cholera.csv`)
2. Define a severity threshold (e.g., median annual cases)
3. Create a new target column in the training data: `1` if severity > threshold AND rainy season
4. Train a new ensemble using the same notebook pattern
5. Save new `.pkl` files: e.g., `new_disease_model.pkl` + `new_disease_scaler.pkl`
6. In `backend/main.py`:
   - Load the new model at startup
   - Add `POST /predict-new-disease` endpoint with the same feature schema
7. In the frontend, add a disease selector and route the POST to the correct endpoint based on selection
