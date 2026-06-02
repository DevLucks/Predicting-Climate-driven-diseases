declare module 'react-globe.gl' {
  import { ComponentType, Ref } from 'react';
  interface GlobeInstance {
    controls(): { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean };
    pointOfView(pov: { lat: number; lng: number; altitude: number }, ms?: number): void;
  }
  interface GlobeProps {
    ref?: Ref<GlobeInstance>;
    width?: number;
    height?: number;
    globeImageUrl?: string;
    backgroundImageUrl?: string;
    backgroundColor?: string;
    atmosphereColor?: string;
    atmosphereAltitude?: number;
    enablePointerInteraction?: boolean;
    pointsData?: object[];
    pointColor?: (d: object) => string;
    pointAltitude?: number | ((d: object) => number);
    pointRadius?: number | ((d: object) => number);
    pointLabel?: string | ((d: object) => string);
    ringsData?: object[];
    ringColor?: (d: object) => string;
    ringMaxRadius?: number;
    ringPropagationSpeed?: number;
    ringRepeatPeriod?: number;
    onGlobeReady?: () => void;
  }
  const Globe: ComponentType<GlobeProps>;
  export default Globe;
}
