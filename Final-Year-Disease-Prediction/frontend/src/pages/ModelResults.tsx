import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid,
} from 'recharts';
import {
  fetchModelResults, fetchFeatureImportance,
  FALLBACK_MODEL_RESULTS, FALLBACK_FEATURES,
} from '../services/api';
import { ChartSkel } from '../components/LoadingSkeleton';
import type { ModelResult, FeatureImportance } from '../types';

type Tab = 'accuracy' | 'f1' | 'recall';

const TAB_LABELS: Record<Tab, string> = { accuracy: 'ACCURACY', f1: 'F1 SCORE', recall: 'RECALL' };
const COLORS = ['#0A7E8C','#7BA8BA','#3CCB7F','#E8A020','#E8453C'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--border)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--teal)', fontWeight: 600 }}>{payload[0].value.toFixed(2)}%</div>
    </div>
  );
};

function FeatureBar({ feature, idx }: { feature: FeatureImportance; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const pct = feature.importance * 100;
  return (
    <div ref={ref} className="feature-bar-row">
      <div className="feature-bar-label">{feature.label}</div>
      <div className="feature-bar-track">
        <motion.div
          className="feature-bar-fill"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6, delay: idx * 0.06, ease: 'easeOut' }}
          style={{ width: `${(feature.importance / 0.27) * 100}%` }}
        />
      </div>
      <div className="feature-bar-pct">{pct.toFixed(2)}%</div>
    </div>
  );
}

export default function ModelResults() {
  const [tab, setTab] = useState<Tab>('accuracy');
  const [models, setModels] = useState<ModelResult[]>([]);
  const [features, setFeatures] = useState<FeatureImportance[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartRef, { once: true });

  useEffect(() => {
    (async () => {
      try {
        const [mr, fi] = await Promise.all([fetchModelResults(), fetchFeatureImportance()]);
        setModels(mr.data.models);
        setFeatures(fi.data.features);
        if (mr.offline || fi.offline) setOffline(true);
      } catch {
        setModels(FALLBACK_MODEL_RESULTS);
        setFeatures(FALLBACK_FEATURES);
        setOffline(true);
      }
      setLoading(false);
    })();
  }, []);

  const chartData = models.map(m => ({
    name: m.name.replace(' (Multi-Input)', '').replace('Logistic Regression', 'Log. Reg.').replace('Ensemble (LR+RF+XGB)', 'Ensemble'),
    value: m[tab],
  }));

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
    >
      {offline && <div className="offline-badge">OFFLINE MODE</div>}

      <div className="section-label">Performance Analysis</div>
      <h1 className="page-title">Model Results</h1>
      <p className="page-subtitle">5-fold stratified cross-validation · Nigeria Cholera 2010–2025 · 190 observations</p>

      <div className="divider mt-5" />

      {/* Model comparison chart */}
      <div className="grid-2 mt-5" style={{ gap: 'var(--s5)', alignItems: 'start' }}>
        <div>
          <div className="section-label mb-4">Model Comparison</div>
          <div className="tabs">
            {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
          <div ref={chartRef}>
            {loading ? <ChartSkel height="260px" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 110]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 2, 2, 0]} isAnimationActive={inView} animationDuration={800}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recall highlight */}
          <div className="card mt-4" style={{ padding: 'var(--s3) var(--s4)' }}>
            <div className="card-label">Why Recall Matters</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Logistic Regression achieves <span className="text-gold bold">100% recall</span> — it never misses a real outbreak.
              In public health, a false negative (missed outbreak) is far more costly than a false alarm.
              This is the primary optimisation target.
            </div>
          </div>
        </div>

        {/* Confusion matrix */}
        <div>
          <div className="section-label mb-4">Confusion Matrix</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 'var(--s3)' }}>
            Logistic Regression · Test set (n=38)
          </div>
          <div style={{ display: 'flex', gap: 'var(--s5)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="cm-grid">
              {/* Header row */}
              <div className="cm-cell header" />
              <div className="cm-cell header">Pred: LOW</div>
              <div className="cm-cell header">Pred: HIGH</div>
              {/* Row 1 */}
              <div className="cm-cell header">Actual: LOW</div>
              <motion.div className="cm-cell tn" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <span className="cm-num">108</span><span className="cm-lbl">TN</span>
              </motion.div>
              <motion.div className="cm-cell fp" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <span className="cm-num">34</span><span className="cm-lbl">FP</span>
              </motion.div>
              {/* Row 2 */}
              <div className="cm-cell header">Actual: HIGH</div>
              <motion.div className="cm-cell fn" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                <span className="cm-num" style={{ color: 'var(--green)' }}>0</span><span className="cm-lbl">FN</span>
              </motion.div>
              <motion.div className="cm-cell tp" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                <span className="cm-num">48</span><span className="cm-lbl">TP</span>
              </motion.div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', fontSize: 'var(--text-xs)' }}>
              {[
                { label: 'Accuracy', val: '74.74%', color: 'var(--teal)' },
                { label: 'Recall',   val: '100%',   color: 'var(--gold)' },
                { label: 'F1 Score', val: '67.17%', color: 'var(--text-secondary)' },
                { label: 'FN (misses)', val: '0',   color: 'var(--green)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                  <span style={{ color: 'var(--text-dim)' }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature importance */}
      <div className="mt-6">
        <div className="section-label mb-4">Feature Importance</div>
        <div className="card">
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 'var(--s4)' }}>
            Random Forest · relative importance across all 10 input features
          </div>
          {loading
            ? [0,1,2,3,4,5,6,7,8,9].map(i => <div key={i} className="skeleton mt-2" style={{ height: 12 }} />)
            : features.map((f, i) => <FeatureBar key={f.feature} feature={f} idx={i} />)
          }
        </div>
      </div>

      <div style={{ height: 'var(--s7)' }} />
    </motion.div>
  );
}
