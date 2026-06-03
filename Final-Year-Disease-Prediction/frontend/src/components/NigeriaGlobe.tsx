import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';

const Globe = lazy(() => import('react-globe.gl'));

const POINTS = [
  { lat: 11.8, lng: 13.1, label: 'Borno' },
  { lat: 6.5,  lng: 3.4,  label: 'Lagos' },
  { lat: 4.8,  lng: 6.9,  label: 'Rivers' },
  { lat: 9.3,  lng: 12.5, label: 'Adamawa' },
];

const TOOLTIP = (d: object) => {
  const p = d as { label: string };
  return `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#E8453C;background:#0D2137;padding:4px 10px;border:1px solid #E8453C;border-radius:2px">${p.label}</div>`;
};

export function NigeriaGlobe() {
  const globeRef = useRef<{
    controls(): { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean };
    pointOfView(p: { lat: number; lng: number; altitude: number }, ms?: number): void;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 460, height: 460 });

  // Respect prefers-reduced-motion — disable auto-rotation when set
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const onReady = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate = !prefersReducedMotion;
    g.controls().autoRotateSpeed = 0.5;
    g.controls().enableZoom = false;
    // Shorter fly-in duration when reduced motion is preferred
    g.pointOfView({ lat: 9.0, lng: 8.6, altitude: 1.7 }, prefersReducedMotion ? 0 : 1600);
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      role="img"
      aria-label="3D globe showing Nigeria with pulsing red markers on high disease-burden states: Borno, Lagos, Rivers, and Adamawa"
    >
      <Suspense fallback={<div className="skeleton" style={{ width: '100%', height: '100%' }} aria-hidden="true" />}>
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="#0EA5B5"
          atmosphereAltitude={0.18}
          pointsData={POINTS}
          pointColor={() => '#E8453C'}
          pointAltitude={0.07}
          pointRadius={0.55}
          pointLabel={TOOLTIP}
          ringsData={prefersReducedMotion ? [] : POINTS}
          ringColor={() => '#E8453C'}
          ringMaxRadius={4}
          ringPropagationSpeed={2.5}
          ringRepeatPeriod={1100}
          enablePointerInteraction={false}
          onGlobeReady={onReady}
        />
      </Suspense>
    </div>
  );
}
