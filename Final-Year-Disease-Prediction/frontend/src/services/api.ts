import type {
  WeatherData, PredictionRequest, PredictionResponse,
  HistoricalRecord, ModelResult, FeatureImportance, ApiResult,
} from '../types';

const BASE = 'http://localhost:8000';
const CACHE_TTL = 10 * 60 * 1000;

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`ow_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    return Date.now() - ts < CACHE_TTL ? data : null;
  } catch { return null; }
}

function writeCache<T>(key: string, data: T) {
  try { localStorage.setItem(`ow_${key}`, JSON.stringify({ data, ts: Date.now() })); } catch { /* ignore */ }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const key = path + (init?.body ?? '');
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as T;
    writeCache(key, data);
    return { data, offline: false };
  } catch {
    const cached = readCache<T>(key);
    if (cached) return { data: cached, offline: true };
    throw new Error('Backend unreachable — no cached data');
  }
}

/* ── Fallback data (shown when offline and nothing is cached) ─────────── */
export const FALLBACK_WEATHER: WeatherData = {
  temperature_c: 28.4, humidity_pct: 68, wind_speed: 1.4,
  timestamp: new Date().toISOString(), source: 'Fallback (offline)',
};

export const FALLBACK_PREDICTION: PredictionResponse = {
  risk: 'LOW', confidence: 0.62,
  probabilities: { low_risk: 0.62, high_risk: 0.38 },
};

export const FALLBACK_MODEL_RESULTS: ModelResult[] = [
  { name: 'Logistic Regression',       accuracy: 74.74, f1: 67.17, recall: 100.00 },
  { name: 'Neural Network (Multi-Input)', accuracy: 71.58, f1: 56.91, recall: 79.11 },
  { name: 'XGBoost',                   accuracy: 72.63, f1: 45.39, recall: 43.33 },
  { name: 'Random Forest',             accuracy: 70.53, f1: 54.73, recall: 73.33 },
  { name: 'Ensemble (LR+RF+XGB)',      accuracy: 71.05, f1: 54.47, recall: 68.89 },
];

export const FALLBACK_FEATURES: FeatureImportance[] = [
  { feature: 'humidity_pct',  label: 'Humidity (%)',             importance: 0.2656 },
  { feature: 'rainy_season',  label: 'Rainy Season (May–Oct)',   importance: 0.2144 },
  { feature: 'humidity_lag1', label: 'Humidity lag 1 month',     importance: 0.1171 },
  { feature: 'month',         label: 'Calendar Month',           importance: 0.1098 },
  { feature: 'temp_lag2',     label: 'Temp lag 2 months',        importance: 0.0666 },
  { feature: 'temp_lag1',     label: 'Temp lag 1 month',         importance: 0.0481 },
  { feature: 'humidity_lag2', label: 'Humidity lag 2 months',    importance: 0.0474 },
  { feature: 'wind_speed',    label: 'Wind Speed (m/s)',         importance: 0.0454 },
  { feature: 'temperature_c', label: 'Temperature (°C)',         importance: 0.0444 },
  { feature: 'wind_lag1',     label: 'Wind lag 1 month',         importance: 0.0410 },
];

/* ── API calls ────────────────────────────────────────────────────────── */
export async function fetchLiveWeather(): Promise<ApiResult<WeatherData>> {
  return apiFetch<WeatherData>('/live-weather');
}

export async function fetchPrediction(req: PredictionRequest): Promise<ApiResult<PredictionResponse>> {
  return apiFetch<PredictionResponse>('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
}

export async function fetchHistoricalData(): Promise<ApiResult<{ count: number; records: HistoricalRecord[] }>> {
  return apiFetch<{ count: number; records: HistoricalRecord[] }>('/historical-data');
}

export async function fetchModelResults(): Promise<ApiResult<{ models: ModelResult[] }>> {
  return apiFetch<{ models: ModelResult[] }>('/model-results');
}

export async function fetchFeatureImportance(): Promise<ApiResult<{ features: FeatureImportance[] }>> {
  return apiFetch<{ features: FeatureImportance[] }>('/feature-importance');
}
