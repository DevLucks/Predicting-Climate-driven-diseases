import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePresentation } from '../context/PresentationContext';

const NAV = [
  {
    to: '/', label: 'Dashboard', short: 'Dash',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    to: '/model-results', label: 'Model Results', short: 'Models',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="10" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="6" y="6" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="3" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="1" y1="16.5" x2="17" y2="16.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    to: '/risk-heatmap', label: 'Risk Heatmap', short: 'Heatmap',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.4"/>
        <rect x="7" y="1" width="4" height="4" rx="0.5" fill="currentColor"/>
        <rect x="13" y="1" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.6"/>
        <rect x="1" y="7" width="4" height="4" rx="0.5" fill="currentColor"/>
        <rect x="7" y="7" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3"/>
        <rect x="13" y="7" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.8"/>
        <rect x="1" y="13" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7"/>
        <rect x="7" y="13" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.2"/>
        <rect x="13" y="13" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  {
    to: '/live-predictor', label: 'Live Predictor', short: 'Predict',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 9 L14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="9" r="2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    to: '/methodology', label: 'Methodology', short: 'Method',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="7" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="13" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

/* ── Desktop sidebar ─────────────────────────────────────────────────────── */
function DesktopSidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <motion.nav
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
        background: 'var(--navy-mid)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
      animate={{ width: expanded ? 220 : 68 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border)', minHeight: 72, display: 'flex', alignItems: 'center' }}>
        <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, flexShrink: 0, background: 'var(--teal)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="var(--navy)" strokeWidth="1.5"/>
              <circle cx="8" cy="8" r="3" fill="var(--navy)" opacity="0.6"/>
              <line x1="8" y1="1" x2="8" y2="15" stroke="var(--navy)" strokeWidth="1" opacity="0.5"/>
              <line x1="1" y1="8" x2="15" y2="8" stroke="var(--navy)" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }} style={{ whiteSpace: 'nowrap' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.2 }}>OUTBREAK</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--teal)', letterSpacing: '0.15em' }}>WATCH</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, paddingTop: 12 }}>
        {NAV.map(({ to, label, icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '11px 0 11px 22px', textDecoration: 'none',
                cursor: 'pointer',
                color: active ? 'var(--teal)' : 'var(--text-dim)',
                background: active ? 'var(--teal-dim)' : 'transparent',
                borderRight: active ? '2px solid var(--teal)' : '2px solid transparent',
                transition: 'color 0.2s, background 0.2s',
              }}
            >
              {/* title provides tooltip when sidebar is collapsed (icon-only state) */}
              <span style={{ flexShrink: 0, display: 'flex' }} title={!expanded ? label : undefined}>{icon}</span>
              <AnimatePresence>
                {expanded && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </div>

      {/* Status */}
      <div style={{ padding: '16px 0 16px 22px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, boxShadow: '0 0 6px var(--green)' }} />
          <AnimatePresence>
            {expanded && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                SYSTEM ONLINE
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}

/* ── Mobile bottom nav ───────────────────────────────────────────────────── */
function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 60,
      background: 'var(--navy-mid)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'stretch',
    }}>
      {NAV.map(({ to, short, icon }) => {
        const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              color: active ? 'var(--teal)' : 'var(--text-dim)',
              borderTop: active ? '2px solid var(--teal)' : '2px solid transparent',
              background: active ? 'var(--teal-dim)' : 'transparent',
              transition: 'color 0.2s, background 0.2s',
              paddingBottom: 2,
            }}
          >
            <span style={{ display: 'flex', lineHeight: 1 }}>{icon}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em' }}>
              {short}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/* ── Export ──────────────────────────────────────────────────────────────── */
export function Sidebar() {
  const isMobile = useIsMobile();
  const { isPresentation } = usePresentation();

  if (isPresentation) return null;
  return isMobile ? <MobileBottomNav /> : <DesktopSidebar />;
}
