import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { fetchHistoricalData } from '../services/api';
import { ChartSkel } from '../components/LoadingSkeleton';
import type { HistoricalRecord } from '../types';

const PIPELINE = [
  { num: '01', name: 'ERA5 Data',      sub: 'NetCDF via CDS' },
  { num: '02', name: 'Preprocessing',  sub: 'xarray + pandas' },
  { num: '03', name: 'Feature Eng.',   sub: 'Lags + season flags' },
  { num: '04', name: 'Train/Test',     sub: '5-fold stratified' },
  { num: '05', name: '5 Models',       sub: 'LR · NN · XGB · RF · Ens.' },
  { num: '06', name: 'Ensemble',       sub: 'Soft-voting' },
  { num: '07', name: 'Prediction',     sub: 'HIGH / LOW risk' },
];

const SOURCES = [
  { name: 'ERA5 Reanalysis',     type: 'Climate',  period: '2010–2025', obs: '220 months',   free: true },
  { name: 'Nigeria Cholera NCDC',type: 'Disease',  period: '2010–2025', obs: '190 months',   free: true },
  { name: 'Lassa Fever Map',     type: 'Disease',  period: '2020–2025', obs: '70 months',    free: true },
  { name: 'Open-Meteo API',      type: 'Live',     period: 'Real-time', obs: 'No key needed', free: true },
  { name: 'WHO GHO API',         type: 'Disease',  period: 'Historic',  obs: 'REST API',     free: true },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--border)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

function NNDiagram() {
  return (
    <div style={{ display: 'flex', gap: 'var(--s4)', flexWrap: 'nowrap', fontSize: 'var(--text-xs)', minWidth: 520 }}>
      {/* Branch 1 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--teal)', letterSpacing: '0.1em', marginBottom: 4 }}>BRANCH 1 — Weather</div>
        {['temperature_c','humidity_pct','wind_speed','temp_lag1','humidity_lag1','wind_lag1'].map(f => (
          <div key={f} style={{ background: 'var(--navy-light)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 2, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{f}</div>
        ))}
        <div style={{ width: 1, height: 10, background: 'var(--teal)' }} />
        <div style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal)', padding: '4px 14px', borderRadius: 2, color: 'var(--teal)' }}>Dense(32, ReLU)</div>
      </div>
      {/* Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 120, color: 'var(--teal)', fontSize: 20 }}>→</div>
      {/* Branch 2 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 4 }}>BRANCH 2 — Seasonal</div>
        {['month','rainy_season','temp_lag2','humidity_lag2'].map(f => (
          <div key={f} style={{ background: 'var(--navy-light)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 2, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{f}</div>
        ))}
        <div style={{ width: 1, height: 10, background: 'var(--gold)' }} />
        <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', padding: '4px 14px', borderRadius: 2, color: 'var(--gold)' }}>Dense(16, ReLU)</div>
      </div>
      {/* Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 120, color: 'var(--teal)', fontSize: 20 }}>→</div>
      {/* Merged path */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 140 }}>
        <div style={{ color: 'var(--text-dim)', fontSize: 'var(--text-xs)' }}>Concatenate ↓</div>
        <div style={{ background: 'var(--navy-light)', border: '1px solid var(--border)', padding: '4px 14px', borderRadius: 2, color: 'var(--text-secondary)' }}>Dense(32, ReLU)</div>
        <div style={{ background: 'var(--navy-light)', border: '1px solid var(--border)', padding: '4px 14px', borderRadius: 2, color: 'var(--text-secondary)' }}>Dropout(0.3)</div>
        <div style={{ background: 'var(--navy-light)', border: '1px solid var(--border)', padding: '4px 14px', borderRadius: 2, color: 'var(--text-secondary)' }}>Dense(16, ReLU)</div>
        <div style={{ width: 1, height: 10, background: 'var(--red)' }} />
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', padding: '4px 14px', borderRadius: 2, color: 'var(--red)', fontWeight: 700 }}>Dense(1, Sigmoid)</div>
        <div style={{ width: 1, height: 10, background: 'var(--red)' }} />
        <div style={{ background: 'var(--red)', padding: '4px 16px', borderRadius: 2, color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700 }}>HIGH / LOW RISK</div>
      </div>
    </div>
  );
}

export default function Methodology() {
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartRef, { once: true });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await fetchHistoricalData();
        setRecords(data.records.slice(0, 100));
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = records.map(r => ({
    label: `${r.year ?? ''}-${String(r.month ?? '').padStart(2,'0')}`,
    temperature: typeof r.temperature_c === 'number' ? +r.temperature_c.toFixed(1) : null,
    humidity: typeof r.humidity_pct === 'number' ? +r.humidity_pct.toFixed(1) : null,
  })).filter(d => d.temperature !== null || d.humidity !== null);

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
    >
      <p className="page-eyebrow">Research Framework</p>
      <h1 className="page-title">Methodology</h1>
      <p className="page-subtitle">
        "Predicting Climate-Driven Disease Outbreak Risk in Nigeria Using a<br />
        Multi-Input Neural Network and Ensemble ML Framework"
      </p>

      <div className="divider mt-5" />

      {/* Pipeline */}
      <div className="mt-5">
        <h2 className="section-label mb-4">Processing Pipeline</h2>
        <div className="card" style={{ overflowX: 'auto' }}>
          <div className="pipeline">
            {PIPELINE.map((step, i) => (
              <>
                <motion.div
                  key={step.num}
                  className="pipeline-step"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.09, duration: 0.35 }}
                >
                  <div className="step-num">{step.num}</div>
                  <div className="step-name">{step.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: 4 }}>{step.sub}</div>
                </motion.div>
                {i < PIPELINE.length - 1 && <div key={`arrow-${i}`} className="pipeline-arrow" />}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Neural network architecture */}
      <div className="mt-5">
        <h2 className="section-label mb-4">Multi-Input Neural Network Architecture</h2>
        <div className="card" style={{ overflowX: 'auto' }}>
          <NNDiagram />
        </div>
      </div>

      {/* Weather trends chart */}
      <div className="mt-5">
        <h2 className="section-label mb-4">ERA5 Weather Trends 2010–2025</h2>
        <div className="card" ref={chartRef}>
          {loading ? <ChartSkel height="240px" /> : chartData.length === 0 ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 'var(--text-sm)' }}>
              Start backend to load historical weather data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={11} />
                <YAxis yAxisId="temp" domain={['auto','auto']} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="hum" orientation="right" domain={['auto','auto']} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke="#E8A020" dot={false} name="Temp (°C)" strokeWidth={1.5} isAnimationActive={inView} animationDuration={1200} />
                <Line yAxisId="hum" type="monotone" dataKey="humidity" stroke="#0A7E8C" dot={false} name="Humidity (%)" strokeWidth={1.5} isAnimationActive={inView} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cross-validation */}
      <div className="mt-5 grid-2" style={{ gap: 'var(--s5)', alignItems: 'start' }}>
        <div className="card">
          <h2 className="section-label mb-4">Evaluation Strategy</h2>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p><span className="text-teal bold">5-fold Stratified Cross-Validation</span> ensures every fold contains the same proportion of HIGH/LOW risk samples as the full dataset. This is critical with imbalanced classes.</p>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', fontSize: 'var(--text-xs)' }}>
              {[
                { label: 'Primary metric', val: 'Recall — zero missed outbreaks' },
                { label: 'Class balance', val: '~49% high risk in training set' },
                { label: 'Scaling', val: 'StandardScaler (z-score)' },
                { label: 'Ensemble', val: 'Soft-voting: LR + RF + XGBoost' },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span className="text-dim">{label}</span>
                  <span className="text-secondary">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data sources */}
        <div>
          <h2 className="section-label mb-4">Data Sources</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Source','Type','Period','Coverage'].map(h => (
                    <th key={h} style={{ padding: 'var(--s2) var(--s3)', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 500, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s, i) => (
                  <tr key={s.name} style={{ borderBottom: i < SOURCES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: 'var(--s2) var(--s3)', color: 'var(--text-primary)' }}>{s.name}</td>
                    <td style={{ padding: 'var(--s2) var(--s3)', color: 'var(--teal)' }}>{s.type}</td>
                    <td style={{ padding: 'var(--s2) var(--s3)', color: 'var(--text-secondary)' }}>{s.period}</td>
                    <td style={{ padding: 'var(--s2) var(--s3)', color: 'var(--text-secondary)' }}>{s.obs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ height: 'var(--s7)' }} />
    </motion.div>
  );
}
