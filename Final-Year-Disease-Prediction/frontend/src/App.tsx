import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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

  return (
    <div className="app-shell">
      <Sidebar />

      {/* Presentation mode button */}
      <button
        className={`presentation-btn ${isPresentation ? 'active' : ''}`}
        onClick={toggle}
      >
        {isPresentation ? '⊠ EXIT PRESENTATION' : '⊡ PRESENT'}
      </button>

      {/* Watermark */}
      {isPresentation && (
        <div className="presentation-watermark">
          Odu Lucky Chibuike — Final Year Defence 2025
        </div>
      )}

      <main className="main-content">
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
  );
}
