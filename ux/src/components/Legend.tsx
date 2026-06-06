import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Legend() {
  const [open, setOpen] = useState(false); // collapsed by default
  return (
    <div className={"legend glass" + (open ? "" : " collapsed")}>
      <button className="legend-head" onClick={() => setOpen((o) => !o)}>
        <span>Legend</span>
        <ChevronDown size={14} style={{ transform: open ? "" : "rotate(-90deg)", transition: ".2s" }} />
      </button>
      {open && (
        <div className="legend-body">
          <div className="legend-section">Overlays</div>
          <div className="legend-row">
            <span className="swatch rain" />
            <small>Live rain radar (by intensity)</small>
          </div>
          <div className="legend-row">
            <span className="swatch rainfall" />
            <small>Expected rainfall · 24 h (mm)</small>
          </div>
          <div className="legend-row">
            <span className="swatch topo" />
            <small>Low-lying flood risk</small>
          </div>
          <div className="legend-section">Manholes (DSD) — zoom in to reveal</div>
          <div className="legend-row">
            <span className="dot mh-storm" />
            <small>Storm water</small>
          </div>
          <div className="legend-row">
            <span className="dot mh-sewer" />
            <small>Sewer</small>
          </div>
          <div className="legend-row">
            <span className="dot mh-combined" />
            <small>Combined</small>
          </div>
        </div>
      )}
    </div>
  );
}
