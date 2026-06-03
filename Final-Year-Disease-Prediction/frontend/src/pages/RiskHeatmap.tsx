import { Fragment, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/* ── Constants ─────────────────────────────────────────────────────────── */
const YEARS = Array.from({ length: 16 }, (_, i) => 2010 + i);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HIGH_YEARS = new Set([2010, 2011, 2014, 2019, 2021, 2022, 2023, 2024]);
const RAINY = new Set([5, 6, 7, 8, 9, 10]);

const isHigh = (year: number, month: number) =>
  HIGH_YEARS.has(year) && RAINY.has(month);

const STATES = [
  { name: 'Borno',     region: 'NE', cholera: 95, lassa: 0  },
  { name: 'Adamawa',   region: 'NE', cholera: 88, lassa: 0  },
  { name: 'Yobe',      region: 'NE', cholera: 82, lassa: 0  },
  { name: 'Rivers',    region: 'SS', cholera: 80, lassa: 0  },
  { name: 'Lagos',     region: 'SW', cholera: 78, lassa: 0  },
  { name: 'Edo',       region: 'SS', cholera: 0,  lassa: 85 },
  { name: 'Ondo',      region: 'SW', cholera: 0,  lassa: 82 },
  { name: 'Ebonyi',    region: 'SE', cholera: 0,  lassa: 78 },
  { name: 'Bauchi',    region: 'NE', cholera: 0,  lassa: 76 },
  { name: 'Plateau',   region: 'NC', cholera: 0,  lassa: 74 },
  { name: 'Taraba',    region: 'NE', cholera: 0,  lassa: 72 },
  { name: 'Kano',      region: 'NW', cholera: 25, lassa: 0  },
  { name: 'Kaduna',    region: 'NW', cholera: 28, lassa: 0  },
  { name: 'FCT Abuja', region: 'NC', cholera: 20, lassa: 0  },
  { name: 'Ogun',      region: 'SW', cholera: 25, lassa: 0  },
  { name: 'Delta',     region: 'SS', cholera: 35, lassa: 30 },
];

/* ── Heatmap grid ──────────────────────────────────────────────────────── */
function HeatGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `56px repeat(${YEARS.length}, 32px)`,
          gap: 3,
          minWidth: 580,
        }}
      >
        {/* Year headers */}
        <div />
        {YEARS.map(y => (
          <div
            key={y}
            style={{
              textAlign: 'center',
              fontSize: 8,
              color: HIGH_YEARS.has(y) ? 'var(--red)' : 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              lineHeight: '22px',
            }}
          >
            {String(y).slice(2)}
          </div>
        ))}

        {/* Rows — Fragment with key to avoid reconciler crash */}
        {Array.from({ length: 12 }, (_, m) => (
          <Fragment key={m}>
            {/* Month label */}
            <div
              style={{
                fontSize: 8,
                color: RAINY.has(m + 1) ? 'var(--teal)' : 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
                textAlign: 'right',
                paddingRight: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: 24,
              }}
            >
              {MONTHS[m]}
            </div>

            {/* Year cells */}
            {YEARS.map((y, yi) => {
              const high = isHigh(y, m + 1);
              const delayMs = visible ? (m * 30 + yi * 15) : 0;
              return (
                <div
                  key={`${y}-${m}`}
                  className={`heatmap-cell ${high ? 'high' : 'low'}`}
                  title={`${MONTHS[m]} ${y}: ${high ? 'HIGH RISK' : 'LOW RISK'}`}
                  style={{
                    width: 32,
                    height: 24,
                    fontSize: 8,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'scale(1)' : 'scale(0.3)',
                    transition: visible
                      ? `opacity 0.25s ${delayMs}ms ease, transform 0.25s ${delayMs}ms ease`
                      : 'none',
                  }}
                >
                  {high ? '1' : '0'}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/* ── State risk table ──────────────────────────────────────────────────── */
function StateRiskTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['State', 'Region', 'Cholera Risk', 'Lassa Risk', 'Combined'].map(h => (
              <th key={h} style={{ padding: 'var(--s2) var(--s3)', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 500, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STATES.sort((a, b) => (b.cholera + b.lassa) - (a.cholera + a.lassa)).map((s, i) => {
            const combined = Math.max(s.cholera, s.lassa);
            const isHighRisk = combined >= 70;
            return (
              <tr
                key={s.name}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'transparent' : 'var(--navy-light)',
                  opacity: 0,
                  animation: `fadeIn 0.3s ${i * 40}ms ease forwards`,
                }}
              >
                <td style={{ padding: 'var(--s2) var(--s3)', color: isHighRisk ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isHighRisk ? 600 : 400 }}>
                  {s.name}
                </td>
                <td style={{ padding: 'var(--s2) var(--s3)', color: 'var(--text-dim)' }}>{s.region}</td>
                <td style={{ padding: 'var(--s2) var(--s3)' }}>
                  {s.cholera > 0 ? (
                    <span style={{ color: s.cholera >= 70 ? 'var(--red)' : 'var(--text-secondary)' }}>
                      {s.cholera}%
                    </span>
                  ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                </td>
                <td style={{ padding: 'var(--s2) var(--s3)' }}>
                  {s.lassa > 0 ? (
                    <span style={{ color: s.lassa >= 70 ? 'var(--gold)' : 'var(--text-secondary)' }}>
                      {s.lassa}%
                    </span>
                  ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                </td>
                <td style={{ padding: 'var(--s2) var(--s3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--navy-light)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${combined}%`,
                        background: combined >= 70 ? 'var(--red)' : combined >= 40 ? 'var(--gold)' : 'var(--green)',
                        borderRadius: 2,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <span style={{ color: combined >= 70 ? 'var(--red)' : 'var(--text-secondary)', width: 32, textAlign: 'right' }}>
                      {combined}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function RiskHeatmap() {
  const totalHigh = YEARS.reduce<number>(
    (acc, y) => acc + Array.from({ length: 12 }, (_, m) => isHigh(y, m + 1) ? 1 : 0).reduce<number>((a, b) => a + b, 0),
    0,
  );

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
    >
      <p className="page-eyebrow">Temporal Analysis</p>
      <h1 className="page-title">Risk Heatmap</h1>
      <p className="page-subtitle">
        Monthly outbreak risk classification · 2010–2025 · {totalHigh} high-risk months identified
      </p>

      <div className="divider mt-5" />

      {/* Heatmap grid */}
      <div className="card mt-5">
        <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: 'var(--s3)' }}>
          <h2 className="section-label" style={{ marginBottom: 0 }}>Month × Year Grid</h2>
          <div className="flex gap-4" style={{ fontSize: 'var(--text-xs)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, background: 'var(--red)', borderRadius: 2, display: 'inline-block' }} />
              <span className="text-secondary">High Risk (1) — high-severity year + rainy month</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, background: 'var(--green-dim)', border: '1px solid #3CCB7F30', borderRadius: 2, display: 'inline-block' }} />
              <span className="text-secondary">Low Risk (0)</span>
            </span>
          </div>
        </div>

        <HeatGrid />

        <div className="flex gap-5 mt-4" style={{ paddingTop: 'var(--s3)', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {[
            { label: 'High-risk months',    val: `${totalHigh} / ${YEARS.length * 12}`, color: 'var(--red)' },
            { label: 'High-severity years', val: '8 of 16',                             color: 'var(--gold)' },
            { label: 'Rainy season',        val: 'May – Oct',                           color: 'var(--teal)' },
            { label: 'Peak year',           val: '2021 — 112,746 cases',               color: 'var(--text-primary)' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>{label}</div>
              <div style={{ fontSize: 'var(--text-sm)', color, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* State risk table */}
      <div className="mt-5">
        <h2 className="section-label mb-4">State-Level Risk Breakdown</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <StateRiskTable />
        </div>
        <div className="flex gap-5 mt-3" style={{ flexWrap: 'wrap', fontSize: 'var(--text-xs)' }}>
          {[
            { color: 'var(--red)',  label: 'High cholera burden — Borno, Adamawa, Yobe, Rivers, Lagos' },
            { color: 'var(--gold)', label: 'High Lassa burden — Edo, Ondo, Ebonyi, Bauchi, Plateau, Taraba' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 1, background: color, display: 'inline-block', flexShrink: 0 }} />
              <span className="text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 'var(--s7)' }} />
    </motion.div>
  );
}
