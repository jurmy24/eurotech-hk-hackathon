import { Activity } from "lucide-react";
import Modal from "./Modal";
import Stat from "./Stat";
import { useOpsStore } from "../store/useOpsStore";
import { timeAgo } from "../lib/format";
import type { CrewStatus } from "../types/operations";

export default function SystemHealthPanel({ onClose }: { onClose: () => void }) {
  const crews = useOpsStore((s) => s.crews);
  const drains = useOpsStore((s) => s.drains);
  const dispatches = useOpsStore((s) => s.dispatches);
  const alerts = useOpsStore((s) => s.alerts);
  const weatherUpdatedAt = useOpsStore((s) => s.weatherUpdatedAt);
  const weatherError = useOpsStore((s) => s.weatherError);

  const by = (st: CrewStatus) => crews.filter((c) => c.status === st).length;
  const offline = crews.filter((c) => c.comms === "offline").length;
  const activeDisp = dispatches.filter((d) => d.status !== "complete" && d.status !== "cancelled").length;
  const crit = alerts.filter((a) => a.level === "AL-5").length;
  const headline = crit > 0 ? "Critical Incidents Active" : offline > 0 ? "Degraded — Crew Offline" : "All Systems Operational";

  return (
    <Modal onClose={onClose} className="modal-system">
      <div className="m-head">
        <div>
          <div className="m-eyebrow"><Activity size={12} /> System Health</div>
          <h2 className="m-title">{headline}</h2>
          <div className="m-sub">Fleet &amp; data-feed overview</div>
        </div>
      </div>
      <div className="m-grid">
        <Stat label="Crews online"><span className="big-num tabular">{crews.length - offline}</span>/{crews.length}</Stat>
        <Stat label="Available"><span className="big-num tabular">{by("available")}</span></Stat>
        <Stat label="Active"><span className="big-num tabular">{by("active")}</span></Stat>
        <Stat label="Servicing"><span className="big-num tabular">{by("servicing")}</span></Stat>
        <Stat label="Offline / lost comms"><span className="big-num tabular">{offline}</span></Stat>
        <Stat label="Active dispatches"><span className="big-num tabular">{activeDisp}</span></Stat>
        <Stat label="Drains monitored"><span className="big-num tabular">{drains.length}</span></Stat>
        <Stat label="Active alerts"><span className="big-num tabular">{alerts.length}</span></Stat>
      </div>
      <div className="m-section">
        <h3>Data feed</h3>
        <div className="muted">
          Weather:{" "}
          {weatherError
            ? "offline — using cached field"
            : weatherUpdatedAt
              ? `live (Open-Meteo), updated ${timeAgo(weatherUpdatedAt)}`
              : "connecting…"}
          . Crew telemetry: live, interpolated continuously.
        </div>
      </div>
    </Modal>
  );
}
