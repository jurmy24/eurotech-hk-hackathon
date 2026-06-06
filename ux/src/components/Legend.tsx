import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ALERT_HEX, ALERT_LABELS } from "../lib/format";
import type { AlertLevel } from "../types/operations";

const LEVELS: AlertLevel[] = ["AL-0", "AL-1", "AL-2", "AL-3", "AL-4", "AL-5"];

export default function Legend() {
  const [open, setOpen] = useState(true);
  return (
    <div className={"legend glass" + (open ? "" : " collapsed")}>
      <button className="legend-head" onClick={() => setOpen((o) => !o)}>
        <span>Legend</span>
        <ChevronDown size={14} style={{ transform: open ? "" : "rotate(-90deg)", transition: ".2s" }} />
      </button>
      {open && (
        <div className="legend-body">
          <div className="legend-section">Crew alert level</div>
          {LEVELS.map((l) => (
            <div key={l} className="legend-row">
              <span className="tri" style={{ borderBottomColor: ALERT_HEX[l], color: ALERT_HEX[l] }} />
              <span className="tabular">{l}</span>
              <small>{ALERT_LABELS[l]}</small>
            </div>
          ))}
          <div className="legend-section">Drains</div>
          <div className="legend-row">
            <span className="dot drain" />
            <small>Drain marker</small>
          </div>
          <div className="legend-row">
            <span className="dot drain-rain" />
            <small>Highlighted drains near forecast rain</small>
          </div>
          <div className="legend-section">Overlays</div>
          <div className="legend-row">
            <span className="swatch rain" />
            <small>Rain cell (by intensity)</small>
          </div>
          <div className="legend-row">
            <span className="swatch topo" />
            <small>Low-lying flood risk</small>
          </div>
        </div>
      )}
    </div>
  );
}
