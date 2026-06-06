import type { ReactNode } from "react";
import { CircleDot, CloudRain, Droplets, Map as MapIcon, Mountain } from "lucide-react";
import { useOpsStore } from "../store/useOpsStore";
import type { LayerKey } from "../types/operations";

const ROWS: { key: LayerKey; label: string; icon: ReactNode }[] = [
  { key: "weather", label: "Weather", icon: <CloudRain size={16} /> },
  { key: "rainfall", label: "Rainfall (mm)", icon: <Droplets size={16} /> },
  { key: "street", label: "Street Map", icon: <MapIcon size={16} /> },
  { key: "topography", label: "Topography", icon: <Mountain size={16} /> },
  { key: "manholes", label: "Manholes", icon: <CircleDot size={16} /> },
];

export default function LayerToggles() {
  const layers = useOpsStore((s) => s.layers);
  const toggle = useOpsStore((s) => s.toggleLayer);

  return (
    <section className="card glass">
      <h3 className="card-title">Layers</h3>
      <div className="layer-rows">
        {ROWS.map((r) => (
          <div key={r.key} className="layer-row">
            <span className="layer-ico">{r.icon}</span>
            <span className="layer-name">{r.label}</span>
            <button
              role="switch"
              aria-checked={layers[r.key]}
              aria-label={`${r.label} layer`}
              className={"switch" + (layers[r.key] ? " on" : "")}
              onClick={() => toggle(r.key)}
            >
              <span className="knob" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
