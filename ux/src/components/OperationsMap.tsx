import maplibregl from "maplibre-gl";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HK, HK_BOUNDS_LL } from "../data/hkGeo";
import { applyNeonStyle } from "../lib/mapStyle";
import { setMapInstance } from "../lib/mapRef";

// Free, keyless dark vector basemap (CARTO Dark Matter). Fallbacks if it fails to load.
const STYLE_URLS = [
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  "https://tiles.openfreemap.org/styles/positron",
];

const MapContext = createContext<maplibregl.Map | null>(null);
export const useMapInstance = () => useContext(MapContext);

interface Props {
  children?: ReactNode;
  onReady?: (map: maplibregl.Map) => void;
}

export default function OperationsMap({ children, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URLS[0],
      center: [HK.center.lng, HK.center.lat],
      zoom: HK.defaultZoom,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    let styleIdx = 0;
    let styleLoaded = false;
    map.on("error", (e) => {
      // Only fall back if the *primary basemap* never loaded. Once the basemap is
      // up, ignore errors — otherwise a failing overlay tile (e.g. radar) would
      // trip "tiles/load/fetch" and wipe the whole style + every custom layer.
      if (styleLoaded) return;
      const msg = String((e as any)?.error?.message ?? "");
      if (styleIdx === 0 && /style|tiles|fetch|load/i.test(msg)) {
        styleIdx = 1;
        map.setStyle(STYLE_URLS[1]);
        map.once("styledata", () => applyNeonStyle(map));
      }
    });

    const handleLoad = () => {
      styleLoaded = true;
      applyNeonStyle(map);
      setMapInstance(map);
      if (import.meta.env.DEV) (window as any).__map = map; // dev/verification handle
      map.fitBounds(HK_BOUNDS_LL, { padding: 48, duration: 0 });
      setReady(true);
      onReady?.(map);
    };
    map.on("load", handleLoad);

    return () => {
      setMapInstance(null);
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="map-root">
      <div ref={containerRef} className="map-canvas" />
      {ready && mapRef.current && (
        <MapContext.Provider value={mapRef.current}>{children}</MapContext.Provider>
      )}
    </div>
  );
}
