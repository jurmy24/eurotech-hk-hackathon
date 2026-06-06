import { AlertTriangle, Droplet, Radio, CloudRain } from "lucide-react";
import type { ReactNode } from "react";
import Modal from "./Modal";
import { useOpsStore } from "../store/useOpsStore";
import { ALERT_HEX } from "../lib/format";
import { getMapInstance } from "../lib/mapRef";
import type { AlertKind, OpsAlert } from "../types/operations";

const KIND_ICON: Record<AlertKind, ReactNode> = {
  flooding: <CloudRain size={16} />,
  blocked_drain: <Droplet size={16} />,
  lost_comms: <Radio size={16} />,
  low_battery: <Radio size={16} />,
  weather_topography: <AlertTriangle size={16} />,
};

export default function AlertsPanel({ onClose }: { onClose: () => void }) {
  const alerts = useOpsStore((s) => s.alerts);
  const crews = useOpsStore((s) => s.crews);
  const drains = useOpsStore((s) => s.drains);
  const live = useOpsStore((s) => s.live);
  const select = useOpsStore((s) => s.select);

  const focus = (a: OpsAlert) => {
    if (a.entityType === "crew" && a.entityId) {
      const lp = live[a.entityId];
      const c = crews.find((x) => x.id === a.entityId);
      const loc = lp ?? c?.location;
      if (loc) getMapInstance()?.flyTo({ center: [loc.lng, loc.lat], zoom: 14.5 });
      select({ type: "crew", id: a.entityId });
    } else if (a.entityType === "drain" && a.entityId) {
      const d = drains.find((x) => x.id === a.entityId);
      if (d) getMapInstance()?.flyTo({ center: [d.location.lng, d.location.lat], zoom: 14.5 });
      select({ type: "drain", id: a.entityId });
    }
  };

  return (
    <Modal onClose={onClose} className="modal-alerts">
      <div className="m-head">
        <div>
          <div className="m-eyebrow"><AlertTriangle size={12} /> Alerts &amp; Incidents</div>
          <h2 className="m-title">{alerts.length} active</h2>
          <div className="m-sub">Prioritized by severity — click to locate</div>
        </div>
      </div>
      <div className="alert-list">
        {alerts.map((a) => (
          <button key={a.id} className="alert-row" onClick={() => focus(a)} disabled={!a.entityId}>
            <span className="alert-ico" style={{ color: ALERT_HEX[a.level] }}>{KIND_ICON[a.kind]}</span>
            <span className="alert-body">
              <span className="alert-title">{a.title}</span>
              <span className="alert-detail">{a.detail}</span>
            </span>
            <span className="al-chip" style={{ color: ALERT_HEX[a.level], borderColor: ALERT_HEX[a.level] }}>{a.level}</span>
          </button>
        ))}
        {alerts.length === 0 && <div className="muted">No active alerts.</div>}
      </div>
    </Modal>
  );
}
