import { useEffect, useRef, useState } from 'react';
import {
  MapContainer, GeoJSON, ZoomControl, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature } from 'geojson';

/* ── Risk buckets ────────────────────────────────────────────────────────── */
const HIGH_RISK = new Set([
  'Borno', 'Adamawa', 'Yobe', 'Bauchi', 'Kano', 'Jigawa',
  'Katsina', 'Sokoto', 'Kebbi', 'Zamfara',
  'Rivers', 'Bayelsa', 'Delta', 'Cross River', 'Akwa Ibom',
]);

const MEDIUM_RISK = new Set([
  'Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Edo',
  'Anambra', 'Imo', 'Abia', 'Enugu', 'Ebonyi',
  'Kogi', 'Benue', 'Plateau', 'Kaduna', 'Niger', 'Kwara',
]);

// Everything else = LOW RISK

/* ── Outbreak hotspots ───────────────────────────────────────────────────── */
const HOTSPOTS = [
  { lat: 11.8333, lng: 13.1500, label: 'Borno Hotspot',   state: 'Borno',   risk: 'HIGH' },
  { lat: 12.0022, lng: 8.5920,  label: 'Kano Hotspot',    state: 'Kano',    risk: 'HIGH' },
  { lat: 6.5244,  lng: 3.3792,  label: 'Lagos Hotspot',   state: 'Lagos',   risk: 'HIGH' },
  { lat: 4.8156,  lng: 7.0498,  label: 'Rivers Hotspot',  state: 'Rivers',  risk: 'HIGH' },
  { lat: 9.2035,  lng: 12.4954, label: 'Adamawa Hotspot', state: 'Adamawa', risk: 'HIGH' },
  { lat: 11.7480, lng: 11.9600, label: 'Yobe Hotspot',    state: 'Yobe',    risk: 'HIGH' },
];

const NIGERIA_BOUNDS: L.LatLngBoundsExpression = [[4.0, 2.7], [13.9, 14.7]];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getStateName(f: Feature): string {
  const p = f.properties ?? {};
  return (p.name ?? p.NAME ?? p.Name ?? p.statename ?? p.NAME_1 ?? p.admin1Name ?? p.state ?? '')
    .replace(/ State$/i, '')
    .trim();
}

function stateColor(name: string): string {
  if (HIGH_RISK.has(name))   return '#C0392B';
  if (MEDIUM_RISK.has(name)) return '#E8A020';
  return '#1A7A4A';
}

function stateOpacity(name: string): number {
  if (HIGH_RISK.has(name))   return 0.8;
  if (MEDIUM_RISK.has(name)) return 0.6;
  return 0.4;
}

function riskLabel(name: string): string {
  if (HIGH_RISK.has(name))   return 'HIGH';
  if (MEDIUM_RISK.has(name)) return 'MEDIUM';
  return 'LOW';
}

/* ── Data fetcher ────────────────────────────────────────────────────────── */
const TOPOJSON_URL =
  'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-states.json';
const GEOJSON_BACKUP =
  'https://raw.githubusercontent.com/geodata/nigeria-geojson/master/states.geojson';

async function loadNigeriaGeoJSON(): Promise<FeatureCollection> {
  // Try topojson primary source
  try {
    const res = await fetch(TOPOJSON_URL);
    if (!res.ok) throw new Error('topojson fetch failed');
    const topo = await res.json() as Topology<{ [k: string]: GeometryCollection }>;
    const key = Object.keys(topo.objects)[0];
    return feature(topo, topo.objects[key]) as unknown as FeatureCollection;
  } catch {
    // Fall back to GeoJSON source
    const res = await fetch(GEOJSON_BACKUP);
    if (!res.ok) throw new Error('both sources failed');
    return res.json() as Promise<FeatureCollection>;
  }
}

/* ── Pulse icon factory ──────────────────────────────────────────────────── */
function makePulseIcon(): L.DivIcon {
  return L.divIcon({
    className: 'pulse-icon-wrapper',
    html: `<div class="pulse-dot">
      <div class="pulse-dot-inner"></div>
      <div class="pulse-dot-ring"></div>
      <div class="pulse-dot-ring delay"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

/* ── Sub-components that need useMap ─────────────────────────────────────── */
function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(NIGERIA_BOUNDS, { padding: [8, 8], animate: false });
  }, [map]);
  return null;
}

function MapLegend() {
  const map = useMap();
  useEffect(() => {
    const ctrl = new L.Control({ position: 'bottomleft' });
    ctrl.onAdd = () => {
      const div = L.DomUtil.create('div', 'choro-legend');
      div.innerHTML = `
        <span class="choro-legend-title">Cholera Risk by State — Nigeria 2010–2025</span>
        <div class="choro-legend-row">
          <span class="choro-legend-swatch" style="background:#C0392B"></span>High Risk
        </div>
        <div class="choro-legend-row">
          <span class="choro-legend-swatch" style="background:#E8A020"></span>Medium Risk
        </div>
        <div class="choro-legend-row">
          <span class="choro-legend-swatch" style="background:#1A7A4A"></span>Low Risk
        </div>
        <div class="choro-legend-row">
          <span class="choro-legend-pulse"></span>Outbreak Hotspot
        </div>
      `;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);
  return null;
}

function TileLayer() {
  const map = useMap();
  useEffect(() => {
    const tile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 20 },
    );
    tile.addTo(map);
    return () => { tile.remove(); };
  }, [map]);
  return null;
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function NigeriaChoroMap() {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pulseIcon = useRef(makePulseIcon());

  useEffect(() => {
    setMounted(true);
    loadNigeriaGeoJSON()
      .then(setGeoData)
      .catch(() => setError(true));
  }, []);

  const styleFeature = (f?: Feature): L.PathOptions => {
    const name = f ? getStateName(f) : '';
    return {
      fillColor: stateColor(name),
      fillOpacity: stateOpacity(name),
      color: '#0D2137',
      weight: 0.8,
      opacity: 1,
    };
  };

  const onEachFeature = (f: Feature, layer: L.Layer) => {
    const name = getStateName(f);
    const risk = riskLabel(name);
    const color = stateColor(name);
    ;(layer as L.Path).bindTooltip(
      `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;background:#0D2137;border:1px solid ${color};padding:5px 10px;color:#E8F4F8;border-radius:2px">
        <strong style="color:${color}">${name || 'Unknown'}</strong><br/>
        Risk Level: <span style="color:${color};font-weight:600">${risk}</span><br/>
        <span style="color:#5E8FA3;font-size:10px">Cholera burden 2010–2025</span>
      </div>`,
      { sticky: true, opacity: 1, className: '' },
    );
    ;(layer as L.Path).on({
      mouseover(e: L.LeafletMouseEvent) {
        ;(e.target as L.Path).setStyle({ weight: 2, color: '#0EA5B5', fillOpacity: Math.min(stateOpacity(name) + 0.15, 1) });
        ;(e.target as L.Path).bringToFront();
      },
      mouseout(e: L.LeafletMouseEvent) {
        ;(e.target as L.Path).setStyle(styleFeature(f));
      },
    });
  };

  if (!mounted) return <div className="skeleton" style={{ width: '100%', height: '100%' }} />;

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      role="img"
      aria-label="Nigeria choropleth map showing cholera risk by state. High-risk states in red, medium-risk in orange, low-risk in green. Pulsing red dots mark major outbreak hotspots."
    >
      {/* Label overlay */}
      <div style={{
        position: 'absolute', top: 'var(--s4)', left: 'var(--s4)', zIndex: 800,
        fontFamily: 'var(--font-mono)', pointerEvents: 'none',
      }}>
        <h2 className="section-label" style={{ marginBottom: 4 }}>Live Surveillance</h2>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
          Hover a state · pulsing = active hotspot
        </div>
      </div>

      {error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--navy-mid)', flexDirection: 'column', gap: 'var(--s3)',
          fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)',
        }}>
          <div>Could not load Nigeria GeoJSON</div>
          <div style={{ color: 'var(--text-dim)' }}>Check network connection</div>
        </div>
      )}

      <MapContainer
        style={{ width: '100%', height: '100%', background: '#0D2137' }}
        center={[9.082, 8.675]}
        zoom={6}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        key="nigeria-map"
      >
        <TileLayer />
        <FitBounds />
        <ZoomControl position="topright" />
        <MapLegend />

        {/* State choropleth */}
        {geoData && (
          <GeoJSON
            key={geoData.features?.length}
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Skeleton while loading */}
        {!geoData && !error && HOTSPOTS.map(h => (
          <div key={h.label} />
        ))}

        {/* Pulsing hotspot markers */}
        {geoData && HOTSPOTS.map(h => {
          const marker = L.marker([h.lat, h.lng], { icon: pulseIcon.current });
          marker.bindPopup(
            `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;background:#0D2137;border:1px solid #E8453C;padding:6px 10px;color:#E8F4F8;min-width:160px;border-radius:2px">
              <strong style="color:#E8453C">${h.label}</strong><br/>
              State: ${h.state}<br/>
              Risk: <span style="color:#E8453C;font-weight:600">${h.risk} RISK</span><br/>
              <span style="color:#5E8FA3;font-size:10px">Major cholera burden area</span>
            </div>`,
            { className: '' },
          );
          // Use an effect-rendered approach via a GeoJSON point feature
          return null;
        })}

        {/* Hotspot markers rendered as a GeoJSON point layer */}
        {geoData && (() => {
          const hotspotFeatures: FeatureCollection = {
            type: 'FeatureCollection',
            features: HOTSPOTS.map(h => ({
              type: 'Feature' as const,
              properties: { ...h },
              geometry: { type: 'Point' as const, coordinates: [h.lng, h.lat] },
            })),
          };
          return (
            <GeoJSON
              key="hotspots"
              data={hotspotFeatures}
              pointToLayer={(f, latlng) => {
                const m = L.marker(latlng, { icon: pulseIcon.current });
                const p = f.properties as typeof HOTSPOTS[0];
                m.bindPopup(
                  `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;background:#0D2137;border:1px solid #E8453C;padding:6px 10px;color:#E8F4F8;min-width:160px;border-radius:2px">
                    <strong style="color:#E8453C">${p.label}</strong><br/>
                    State: ${p.state}<br/>
                    Risk: <span style="color:#E8453C;font-weight:600">${p.risk} RISK</span><br/>
                    <span style="color:#5E8FA3;font-size:10px">Major cholera burden area</span>
                  </div>`,
                  { className: '' },
                );
                return m;
              }}
            />
          );
        })()}
      </MapContainer>
    </div>
  );
}
