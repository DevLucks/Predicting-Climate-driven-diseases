import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { usePresentation } from './context/PresentationContext';
import Dashboard from './pages/Dashboard';
import ModelResults from './pages/ModelResults';
import RiskHeatmap from './pages/RiskHeatmap';
import LivePredictor from './pages/LivePredictor';
import Methodology from './pages/Methodology';

export default function App() {
  const location = useLocation();
  const { isPresentation, toggle } = usePresentation();
  const mainRef = useRef<HTMLElement>(null);

  // Move focus to main content after every page transition
  // so screen readers announce the new page
  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    // reducedMotion="user" makes all Framer Motion animations
    // respect the OS prefers-reduced-motion preference
    <MotionConfig reducedMotion="user">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="app-shell">
        <Sidebar />

        <button
          className={`presentation-btn ${isPresentation ? 'active' : ''}`}
          onClick={toggle}
          aria-label={isPresentation ? 'Exit presentation mode' : 'Enter presentation mode'}
          aria-pressed={isPresentation}
        >
          {isPresentation ? 'EXIT PRESENT' : 'PRESENT'}
        </button>

        {isPresentation && (
          <div className="presentation-watermark" aria-hidden="true">
            Odu Lucky Chibuike — Final Year Defence 2025
          </div>
        )}

        <main
          id="main-content"
          ref={mainRef}
          className="main-content"
          tabIndex={-1}
          aria-label="Page content"
        >
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/"                element={<Dashboard />} />
              <Route path="/model-results"   element={<ModelResults />} />
              <Route path="/risk-heatmap"    element={<RiskHeatmap />} />
              <Route path="/live-predictor"  element={<LivePredictor />} />
              <Route path="/methodology"     element={<Methodology />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}
