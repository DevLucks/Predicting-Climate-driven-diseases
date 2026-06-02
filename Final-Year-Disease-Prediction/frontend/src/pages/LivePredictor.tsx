import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RiskGauge } from '../components/RiskGauge';
import { fetchPrediction, FALLBACK_PREDICTION, FALLBACK_FEATURES } from '../services/api';
import type { PredictionResponse } from '../types';

const RAINY = new Set([5,6,7,8,9,10]);
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TOP3_FEATURES = FALLBACK_FEATURES.slice(0, 3);

interface Sliders {
  temperature: number;
  humidity: number;
  wind: number;
  month: number;
  prevHumidity: number;
}

const DEFAULTS: Sliders = {
  temperature: 28,
  humidity: 65,
  wind: 1.2,
  month: new Date().getMonth() + 1,
  prevHumidity: 60,
};

function SliderRow({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="slider-row">
      <div className="slider-label">
        <span className="slider-name">{label}</span>
        <span className="slider-val">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function LivePredictor() {
  const [sliders, setSliders] = useState<Sliders>(DEFAULTS);
  const [prediction, setPrediction] = useState<PredictionResponse>(FALLBACK_PREDICTION);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  const set = (k: keyof Sliders) => (v: number) => setSliders(s => ({ ...s, [k]: v }));

  const predict = useCallback(async (s: Sliders) => {
    setLoading(true);
    try {
      const result = await fetchPrediction({
        temperature_c: s.temperature,
        humidity_pct: s.humidity,
        wind_speed: s.wind,
        temp_lag1: s.temperature - 0.5,
        humidity_lag1: s.prevHumidity,
        wind_lag1: s.wind,
        month: s.month,
        rainy_season: RAINY.has(s.month) ? 1 : 0,
        temp_lag2: s.temperature - 1,
        humidity_lag2: s.prevHumidity - 3,
      });
      setPrediction(result.data);
      if (result.offline) setOffline(true);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => predict(sliders), 350);
    return () => clearTimeout(id);
  }, [sliders, predict]);

  const isHigh = prediction.risk === 'HIGH';
  const rainySeason = RAINY.has(sliders.month);

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
    >
      {offline && <div className="offline-badge">OFFLINE MODE</div>}

      <div className="section-label">Interactive Analysis</div>
      <h1 className="page-title">Live Predictor</h1>
      <p className="page-subtitle">Adjust climate conditions · real-time ML inference · cholera ensemble model</p>

      <div className="divider mt-5" />

      <div className="predictor-grid mt-5">
        {/* Sliders panel */}
        <div className="card">
          <div className="section-label mb-4">Climate Inputs</div>
          <SliderRow label="Temperature"     value={sliders.temperature} min={23}  max={32}  step={0.1} unit="°C" onChange={set('temperature')} />
          <SliderRow label="Humidity"        value={sliders.humidity}    min={28}  max={85}  step={1}   unit="%"  onChange={set('humidity')} />
          <SliderRow label="Wind Speed"      value={sliders.wind}        min={0}   max={3}   step={0.1} unit=" m/s" onChange={set('wind')} />
          <SliderRow label="Month"           value={sliders.month}       min={1}   max={12}  step={1}   unit=""   onChange={set('month')} />
          <SliderRow label="Prev. Humidity"  value={sliders.prevHumidity} min={28} max={85}  step={1}   unit="%" onChange={set('prevHumidity')} />

          {/* Context badges */}
          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', fontSize: 'var(--text-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-dim">Month</span>
              <span className="text-teal">{MONTH_NAMES[sliders.month - 1]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-dim">Season</span>
              <span style={{ color: rainySeason ? 'var(--red)' : 'var(--green)' }}>
                {rainySeason ? '⚠ Rainy (high risk)' : '✓ Dry (lower risk)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-dim">rainy_season</span>
              <span className="text-secondary">{RAINY.has(sliders.month) ? '1' : '0'}</span>
            </div>
          </div>

          <div style={{ marginTop: 'var(--s4)', padding: 'var(--s3)', background: 'var(--navy)', borderRadius: 2, fontSize: 'var(--text-xs)', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Powered by live ERA5 + trained ML model<br />
            <span className="text-teal">cholera_ensemble_model.pkl</span> · lag features auto-derived
          </div>
        </div>

        {/* Output panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          {/* Gauge card */}
          <div className="card" style={{ borderColor: isHigh ? 'var(--red)' : 'var(--green)' }}>
            <div className="flex justify-between items-center mb-4">
              <div className="section-label" style={{ marginBottom: 0 }}>Risk Assessment</div>
              {loading && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>Computing…</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s6)', flexWrap: 'wrap' }}>
              <motion.div
                key={prediction.confidence}
                initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <RiskGauge probability={prediction.probabilities.high_risk} />
              </motion.div>
              <div>
                <div className={`risk-badge ${isHigh ? 'high' : 'low'}`} style={{ marginBottom: 'var(--s4)', fontSize: 'var(--text-base)' }}>
                  <span className="dot" />
                  {prediction.risk} RISK
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 800, color: isHigh ? 'var(--red)' : 'var(--green)', lineHeight: 1 }}>
                  {(prediction.confidence * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: 'var(--s2)' }}>model confidence</div>
                <div className="divider" style={{ margin: 'var(--s3) 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--text-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span className="text-dim">P(high risk)</span>
                    <span className="text-red">{(prediction.probabilities.high_risk * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span className="text-dim">P(low risk)</span>
                    <span className="text-green">{(prediction.probabilities.low_risk * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 influencing features */}
          <div className="card">
            <div className="section-label mb-4">Top 3 Influencing Features</div>
            {TOP3_FEATURES.map((f, i) => {
              let currentVal: string;
              if (f.feature === 'humidity_pct')  currentVal = `${sliders.humidity}%`;
              else if (f.feature === 'rainy_season') currentVal = RAINY.has(sliders.month) ? '1 (active)' : '0 (inactive)';
              else if (f.feature === 'humidity_lag1') currentVal = `${sliders.prevHumidity}%`;
              else currentVal = '—';

              return (
                <motion.div key={f.feature}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', marginBottom: 'var(--s3)', padding: 'var(--s3)', background: 'var(--navy)', borderRadius: 2, border: '1px solid var(--border)' }}
                >
                  <div style={{ width: 24, height: 24, background: 'var(--teal-dim)', border: '1px solid var(--teal)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', color: 'var(--teal)', fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500 }}>{f.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: 2 }}>
                      importance: <span className="text-teal">{(f.importance * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gold)', fontWeight: 600 }}>{currentVal}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>current</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ height: 'var(--s7)' }} />
    </motion.div>
  );
}
