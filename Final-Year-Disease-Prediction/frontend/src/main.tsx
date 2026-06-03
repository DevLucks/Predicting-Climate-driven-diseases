import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PresentationProvider } from './context/PresentationContext';
import './index.css';
import 'leaflet/dist/leaflet.css';
import App from './App';

// StrictMode is intentionally omitted: react-leaflet v4's MapContainer uses a
// ref-callback to initialise L.Map synchronously during the commit phase.
// React 18 StrictMode fires that callback twice on the same DOM node before
// the async useEffect cleanup (map.remove()) can clear _leaflet_id, causing
// Leaflet to throw "Map container is already initialized" and crash the tree.

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <PresentationProvider>
      <App />
    </PresentationProvider>
  </BrowserRouter>,
);
