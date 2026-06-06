import { useOpsStore } from "../store/useOpsStore";
import type { LayerKey } from "../types/operations";

const LABELS: Record<LayerKey, string> = {
  street: "Street Map",
  weather: "Weather",
  topography: "Topography",
};

export default function StatusStrip() {
  const layers = useOpsStore((s) => s.layers);
  const flash = useOpsStore((s) => s.flash);
  const crews = useOpsStore((s) => s.crews);

  const active = (Object.keys(layers) as LayerKey[]).filter((k) => layers[k]);

  return (
    <div className="status-strip glass">
      <span className="live-dot" />
      <span className="strip-live">LIVE</span>
      <span className="strip-sep" />
      <span className="strip-label">Layers:</span>
      {active.length ? (
        active.map((a) => (
          <span key={a} className="strip-chip">
            {LABELS[a]}
          </span>
        ))
      ) : (
        <span className="strip-dim">none</span>
      )}
      <span className="strip-sep" />
      <span className="strip-dim tabular">{crews.length} crews tracked</span>
      {flash && (
        <>
          <span className="strip-sep" />
          <span className="strip-flash">{flash}</span>
        </>
      )}
    </div>
  );
}
