# Data Sources

---

## 1. ERA5 Climate Reanalysis — Primary Weather Data

**Provider:** Copernicus Climate Data Store (CDS), ECMWF  
**Product:** `reanalysis-era5-single-levels-monthly-means`  
**Coverage:** Nigeria bounding box — N:14°, S:4°, W:3°E, E:15°E  
**Period:** 2010–2025 (January 2010 to present)  
**File (raw):** `data/raw/era5_nigeria_v2.nc` (NetCDF, ~3.16 MB) — **not in git**  
**File (processed):** `data/processed/era5_nigeria_v2_monthly.csv` (220 rows, ~7.9 KB) — **in git**

### Variables downloaded

| ERA5 variable | Description | Mapped to |
|---|---|---|
| `2m_temperature` | 2-metre air temperature (K → °C) | `temperature_c` |
| `2m_dewpoint_temperature` | Dewpoint at 2m (used to derive humidity) | intermediate |
| `total_precipitation` | Monthly total precipitation (m) | not used directly |
| `10m_u_component_of_wind` | Zonal wind component at 10m | `wind_speed` |
| `volumetric_soil_water_layer_1` | Top-layer soil moisture | not used directly |

**Humidity derivation:** Relative humidity was computed from 2m temperature and 2m dewpoint using the Magnus formula:
```
e_s = 6.1078 * exp(17.27 * T / (T + 237.3))
e_d = 6.1078 * exp(17.27 * Td / (Td + 237.3))
RH  = (e_d / e_s) * 100
```

### How to Download (ERA5 via CDS API)

1. Register at [cds.climate.copernicus.eu](https://cds.climate.copernicus.eu)
2. Install: `pip install cdsapi`
3. Create `~/.cdsapirc`:
   ```
   url: https://cds.climate.copernicus.eu/api/v2
   key: YOUR_UID:YOUR_API_KEY
   ```
4. Run: `python download_era5.py` from the project root
5. Output saved to `data/raw/era5_nigeria_v2.nc`

The script (`download_era5.py`) requests monthly means for the variables above at `time: '00:00'` and saves as unarchived NetCDF.

### Preprocessing (notebook: `02_preprocessing.ipynb`)

```python
import xarray as xr
import numpy as np

ds = xr.open_dataset("data/raw/era5_nigeria_v2.nc")

# Spatial mean over Nigeria bounding box
df = ds.mean(dim=["latitude", "longitude"]).to_dataframe()

# Convert temperature from Kelvin to Celsius
df["temperature_c"] = df["t2m"] - 273.15

# Derive relative humidity from dewpoint
df["humidity_pct"]  = relative_humidity(df["d2m"] - 273.15, df["t2m"] - 273.15)

# Extract wind speed magnitude
df["wind_speed"]    = df["u10"].abs()

df["year"]  = df.index.year
df["month"] = df.index.month

df.to_csv("data/processed/era5_nigeria_v2_monthly.csv", index=False)
```

### Processed CSV Columns

`data/processed/era5_nigeria_v2_monthly.csv` — 220 rows (Jan 2010 – Apr 2026):

| Column | Type | Description |
|---|---|---|
| `year` | int | Year (2010–2025) |
| `month` | int | Month (1–12) |
| `temperature_c` | float | Mean monthly 2m temp (°C), typically 25–34°C for Nigeria |
| `humidity_pct` | float | Mean monthly relative humidity (%), typically 28–85% |
| `wind_speed` | float | Mean monthly 10m wind speed (m/s), typically 0.5–3.0 |

---

## 2. Nigeria Cholera Data — Disease Target Variable

**Provider:** Nigeria Centre for Disease Control (NCDC)  
**File:** `data/raw/nigeria_cholera.csv` — **not in git**  
**Period:** 2010–2025  
**Observations:** 190 monthly records after merging with ERA5

### Expected CSV Columns

| Column | Type | Description |
|---|---|---|
| `year` | int | Year |
| `month` | int | Month (or may be annual) |
| `cases` | int | Confirmed cholera cases |
| `deaths` | int | Deaths (optional, not used for prediction) |
| `state` | str | State name (for state-level analysis) |

### High-Severity Classification

```python
MEDIAN_THRESHOLD = 7386  # median annual cases 2010–2025

# Annual cases > threshold → high severity year
high_severity_years = {2010, 2011, 2014, 2019, 2021, 2022, 2023, 2024}

# Monthly classification
df["high_risk"] = (
    df["year"].isin(high_severity_years) &
    df["month"].isin([5, 6, 7, 8, 9, 10])  # rainy season
).astype(int)
```

### Class Distribution (190 observations)
- LOW risk (0): ~111 months
- HIGH risk (1): ~79 months
- Ratio: roughly 58% / 42% — nearly balanced

---

## 3. Lassa Fever Map Data

**Provider:** Nigeria CDC / NCDC outbreak reports  
**File:** `data/raw/clean_lassa_fever_map_data.csv` — **not in git**  
**Period:** 2020–2025  
**Observations:** ~70 monthly records

### Expected CSV Columns

| Column | Type | Description |
|---|---|---|
| `year` | int | Year |
| `month` | int | Month |
| `cases` | int | Confirmed Lassa cases |
| `state` | str | State (high-burden: Edo, Ondo, Ebonyi, Bauchi, Plateau, Taraba) |
| `deaths` | int | Deaths |

### High-Severity Classification
```python
MEDIAN_THRESHOLD = 1168  # median annual cases 2020–2025
high_severity_years = {2020, 2023, 2024}
```

---

## 4. Open-Meteo API — Live Weather (Runtime)

**Provider:** Open-Meteo (open-source weather API)  
**Authentication:** None required  
**Documentation:** [open-meteo.com/en/docs](https://open-meteo.com/en/docs)

**URL used in production:**
```
https://api.open-meteo.com/v1/forecast
  ?latitude=9.0820
  &longitude=8.6753
  &current=temperature_2m,relative_humidity_2m,wind_speed_10m
  &timezone=Africa%2FLagos
```

**Nigeria coordinates:**
- Latitude: 9.0820 (geographic centre, near Lafia, Nasarawa State)
- Longitude: 8.6753

**Response field mapping:**
```json
{
  "current": {
    "temperature_2m": 29.1,          → temperature_c
    "relative_humidity_2m": 65,      → humidity_pct
    "wind_speed_10m": 1.8,           → wind_speed
    "time": "2025-07-15T14:00"       → timestamp
  }
}
```

The API returns the same ERA5-consistent meteorological variables that the model was trained on, making live inference consistent with training data.

---

## 5. WHO Global Health Observatory (WHO GHO)

**URL:** `https://ghoapi.azureedge.net/api/CHOLERA_0000000001`  
**Authentication:** None required  
**Use:** Secondary reference for annual cholera counts (not used in model training but available for frontend display)  
**Filter for Nigeria:** `?$filter=SpatialDim eq 'NGA'`

**Note:** Not currently called by the backend. Available for future enhancement.

---

## Merged Training Dataset

**File:** `data/processed/final_training_data.csv` — **in git** (~6.4 KB)  
**Rows:** 70 (monthly observations, 2020–2025, where both ERA5 + Lassa data overlap)

This is the final merged dataset used to train `ensemble_model_v2.pkl`. It was produced by `notebooks/03_model_final.ipynb` by merging ERA5 monthly averages with Lassa fever monthly case counts, computing lag features, and dropping rows with NaN lags.

### Columns

| Column | Source |
|---|---|
| `year` | ERA5 / calendar |
| `month` | ERA5 / calendar |
| `temperature_c` | ERA5 (preprocessed) |
| `humidity_pct` | ERA5 (derived from dewpoint) |
| `wind_speed` | ERA5 |
| `temp_lag1` | Shifted 1 month |
| `humidity_lag1` | Shifted 1 month |
| `wind_lag1` | Shifted 1 month |
| `temp_lag2` | Shifted 2 months |
| `humidity_lag2` | Shifted 2 months |
| `month` | Calendar (1–12) |
| `rainy_season` | Derived (May–Oct = 1) |
| `high_risk` | Target: 1 if high severity |

---

## Data Lineage Summary

```
CDS API download
    └─► era5_nigeria_v2.nc (raw NetCDF)
            └─► 02_preprocessing.ipynb
                    └─► era5_nigeria_v2_monthly.csv (220 rows)
                            │
NCDC Nigeria cholera CSV ───┤
                            └─► 03_model_nigeria_disease_outbreak.ipynb
                                        └─► final_training_data.csv (70 rows)
                                                └─► cholera_ensemble_model.pkl
                                                └─► cholera_scaler.pkl
```
