export interface WeatherData {
  temperature_c: number;
  humidity_pct: number;
  wind_speed: number;
  timestamp: string;
  source: string;
}

export interface PredictionRequest {
  temperature_c: number;
  humidity_pct: number;
  wind_speed: number;
  temp_lag1: number;
  humidity_lag1: number;
  wind_lag1: number;
  month: number;
  rainy_season: number;
  temp_lag2: number;
  humidity_lag2: number;
}

export interface PredictionResponse {
  risk: 'HIGH' | 'LOW';
  confidence: number;
  probabilities: { low_risk: number; high_risk: number };
}

export interface ModelResult {
  name: string;
  accuracy: number;
  f1: number;
  recall: number;
}

export interface FeatureImportance {
  feature: string;
  label: string;
  importance: number;
}

export interface HistoricalRecord {
  [key: string]: string | number;
}

export interface ApiResult<T> {
  data: T;
  offline: boolean;
}
