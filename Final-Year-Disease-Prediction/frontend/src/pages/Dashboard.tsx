import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NigeriaGlobe } from '../components/NigeriaGlobe';
import { Skel, CardSkel } from '../components/LoadingSkeleton';
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

      {/* Hero grid: globe + right panel */}
      <div className="hero-grid mt-5">
        {/* Globe */}
        <motion.div
          className="card globe-container"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: 'var(--s4)', left: 'var(--s4)', zIndex: 10 }}>
            <h2 className="section-label" style={{ marginBottom: 4 }}>Live Surveillance</h2>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
              Pulsing = high-burden states
            </div>
          </div>
          <NigeriaGlobe />
        </motion.div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          {/* Risk prediction badge */}
          <motion.div
            className="card"
            variants={ITEM} initial="hidden" animate="show"
            style={{ borderColor: isHigh ? 'var(--red)' : 'var(--green)' }}
            aria-live="polite"
            aria-atomic="true"
          >
            <h2 className="card-label">Current Month Risk</h2>
            {prediction ? (
              <>
                <div className={`risk-badge ${isHigh ? 'high' : 'low'}`} style={{ marginBottom: 'var(--s3)' }}>
                  <span className="dot" aria-hidden="true" />
                  {prediction.risk} RISK
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: isHigh ? 'var(--red)' : 'var(--green)' }}>
                  {(prediction.confidence * 100).toFixed(1)}%
                </div>
                <div className="card-sub">model confidence · {MONTH_NAMES[month-1]} {new Date().getFullYear()}</div>
                <div className="divider" style={{ margin: 'var(--s3) 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
                  <span>HIGH <span style={{ color: 'var(--red)' }}>{(prediction.probabilities.high_risk * 100).toFixed(0)}%</span></span>
                  <span>LOW <span style={{ color: 'var(--green)' }}>{(prediction.probabilities.low_risk * 100).toFixed(0)}%</span></span>
                </div>
              </>
            ) : <Skel height="80px" className="mt-2" />}
          </motion.div>

          {/* Weather cards */}
          {weather ? (
            <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              {[
                { label: 'Temperature', value: `${weather.temperature_c.toFixed(1)}°C`, sub: 'Nigeria average', color: 'var(--gold)' },
                { label: 'Humidity', value: `${weather.humidity_pct.toFixed(0)}%`, sub: RAINY.has(month) ? '⚠ Rainy season' : 'Dry season', color: RAINY.has(month) ? 'var(--red)' : 'var(--teal)' },
                { label: 'Wind Speed', value: `${weather.wind_speed.toFixed(1)} m/s`, sub: weather.source, color: 'var(--teal)' },
              ].map(({ label, value, sub, color }) => (
                <motion.div key={label} variants={ITEM} className="card" style={{ padding: 'var(--s3) var(--s4)' }}>
                  <h3 className="card-label">{label}</h3>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                  <div className="card-sub">{sub}</div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              {[0,1,2].map(i => <CardSkel key={i} />)}
            </div>
          )}
        </div>
      </div>

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
