import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react";
import { getMapInstance } from "../lib/mapRef";
import { HK_BOUNDS_LL } from "../data/hkGeo";
import { useOpsStore } from "../store/useOpsStore";

export default function MapControls() {
  const bump = useOpsStore((s) => s.bumpRefresh);
  const setFlash = useOpsStore((s) => s.setFlash);

  const zoom = (d: number) => {
    const m = getMapInstance();
    if (!m) return;
    m.easeTo({ zoom: m.getZoom() + d, duration: 200 });
  };
  const fit = () => {
    const m = getMapInstance();
    if (!m) return;
    m.fitBounds(HK_BOUNDS_LL, { padding: 48, duration: 600 });
  };
  const refresh = () => {
    bump();
    setFlash("Refreshing live feed…");
    setTimeout(() => setFlash(null), 1500);
  };

  return (
    <div className="map-controls">
      <button className="map-btn glass" title="Zoom in" onClick={() => zoom(1)}>
        <ZoomIn size={18} />
      </button>
      <button className="map-btn glass" title="Zoom out" onClick={() => zoom(-1)}>
        <ZoomOut size={18} />
      </button>
      <button className="map-btn glass" title="Fit to Hong Kong" onClick={fit}>
        <Maximize2 size={18} />
      </button>
      <button className="map-btn glass" title="Refresh live feed" onClick={refresh}>
        <RefreshCw size={18} />
      </button>
    </div>
  );
}
