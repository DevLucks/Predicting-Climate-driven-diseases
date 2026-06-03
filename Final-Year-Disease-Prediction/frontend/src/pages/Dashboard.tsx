import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NigeriaChoroMap } from '../components/NigeriaChoroMap';
import { Skel } from '../components/LoadingSkeleton';
import {
  fetchLiveWeather, fetchPrediction,
  FALLBACK_WEATHER, FALLBACK_PREDICTION,
} from '../services/api';
import type { WeatherData, PredictionResponse } from '../types';

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const ITEM = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const RAINY = new Set([5,6,7,8,9,10]);

function buildPredictPayload(weather: WeatherData, month: number) {
  return {
    temperature_c: weather.temperature_c,
    humidity_pct: weather.humidity_pct,
    wind_speed: weather.wind_speed,
    temp_lag1: weather.temperature_c,
    humidity_lag1: weather.humidity_pct,
    wind_lag1: weather.wind_speed,
    month,
    rainy_season: RAINY.has(month) ? 1 : 0,
    temp_lag2: weather.temperature_c,
    humidity_lag2: weather.humidity_pct,
  };
}

export default function Dashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const month = new Date().getMonth() + 1;

  useEffect(() => {
    (async () => {
      try {
        const wr = await fetchLiveWeather();
        setWeather(wr.data);
        if (wr.offline) setOffline(true);
        const pr = await fetchPrediction(buildPredictPayload(wr.data, month));
        setPrediction(pr.data);
        if (pr.offline) setOffline(true);
      } catch {
        setWeather(FALLBACK_WEATHER);
        setPrediction(FALLBACK_PREDICTION);
        setOffline(true);
      }
    })();
  }, [month]);

  const isHigh = prediction?.risk === 'HIGH';

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {offline && (
        <div className="offline-badge" role="status" aria-live="polite">OFFLINE MODE</div>
      )}

      {/* Header */}
      <motion.div variants={STAGGER} initial="hidden" animate="show">
        <motion.div variants={ITEM}>
          <p className="page-eyebrow">Nigeria Disease Intelligence</p>
          <h1 className="page-title">Climate Risk<br />Early Warning</h1>
          <p className="page-subtitle">Real-time outbreak risk · {MONTH_NAMES[month-1]} {new Date().getFullYear()} · Cholera + Lassa Fever</p>
        </motion.div>
      </motion.div>

      <div className="divider mt-5" />

      {/* Full-width map with bottom overlay cards */}
      <motion.div
        className="mt-5"
        style={{ position: 'relative' }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="card globe-container" style={{ padding: 0, overflow: 'hidden', width: '100%' }}>
          <NigeriaChoroMap />
        </div>

        {/* Stats overlay — layered at the bottom of the map */}
        <div className="map-overlay-strip">
          {/* Risk badge */}
          {prediction ? (
            <div
              className="map-overlay-card"
              style={{ borderColor: isHigh ? 'var(--red)' : 'var(--green)', flex: '0 0 auto', minWidth: 170 }}
              aria-live="polite"
              aria-atomic="true"
            >
              <h2 className="card-label" style={{ marginBottom: 'var(--s2)' }}>Current Month Risk</h2>
              <div className={`risk-badge ${isHigh ? 'high' : 'low'}`} style={{ marginBottom: 'var(--s2)' }}>
                <span className="dot" aria-hidden="true" />
                {prediction.risk} RISK
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: isHigh ? 'var(--red)' : 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                {(prediction.confidence * 100).toFixed(1)}%
              </div>
              <div style={{ display: 'flex', gap: 'var(--s4)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: 'var(--s2)' }}>
                <span>HIGH <span style={{ color: 'var(--red)' }}>{(prediction.probabilities.high_risk * 100).toFixed(0)}%</span></span>
                <span>LOW <span style={{ color: 'var(--green)' }}>{(prediction.probabilities.low_risk * 100).toFixed(0)}%</span></span>
              </div>
            </div>
          ) : <Skel width="170px" height="120px" />}

          {/* Weather cards */}
          {weather ? [
            { label: 'Temperature', value: `${weather.temperature_c.toFixed(1)}°C`, sub: 'Nigeria average', color: 'var(--gold)' },
            { label: 'Humidity',    value: `${weather.humidity_pct.toFixed(0)}%`,   sub: RAINY.has(month) ? '⚠ Rainy season' : 'Dry season', color: RAINY.has(month) ? 'var(--red)' : 'var(--teal)' },
            { label: 'Wind Speed',  value: `${weather.wind_speed.toFixed(1)} m/s`,  sub: weather.source,   color: 'var(--teal)' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="map-overlay-card">
              <h3 className="card-label" style={{ marginBottom: 'var(--s1)' }}>{label}</h3>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div className="card-sub">{sub}</div>
            </div>
          )) : [0,1,2].map(i => <Skel key={i} width="130px" height="80px" />)}
        </div>
      </motion.div>

      {/* Metric cards */}
      <motion.div
        className="grid-4 mt-5"
        variants={STAGGER} initial="hidden" animate="show"
      >
        {[
          { label: 'Best Accuracy', value: '74.74%', sub: 'Logistic Regression', color: 'var(--teal)' },
          { label: 'Best Recall',   value: '100%',   sub: 'Zero missed outbreaks', color: 'var(--gold)' },
          { label: 'Observations', value: '190',     sub: 'Monthly records 2010–2025', color: 'var(--text-primary)' },
          { label: 'Models Compared', value: '5',    sub: 'LR · NN · XGB · RF · Ensemble', color: 'var(--text-primary)' },
        ].map(({ label, value, sub, color }) => (
          <motion.div key={label} variants={ITEM} className="card">
            <h3 className="card-label">{label}</h3>
            <div className="card-value" style={{ color }}>{value}</div>
            <div className="card-sub">{sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer note */}
      <div style={{ marginTop: 'var(--s6)', paddingBottom: 'var(--s6)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
        Cholera Ensemble Model · ERA5 Climate Data · Open-Meteo Live Feed
      </div>
    </motion.div>
  );
}
