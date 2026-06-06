import { useEffect, useState } from "react";
import { Radio, Navigation, Gauge, Clock, Users, Route } from "lucide-react";
import Modal from "./Modal";
import Stat from "./Stat";
import { useOpsStore } from "../store/useOpsStore";
import { ALERT_HEX, ZONE_LABELS, zoneCode, STATUS_LABELS, COMMS_LABELS, timeAgo } from "../lib/format";

export default function CrewDetailModal({ crewId, onClose }: { crewId: string; onClose: () => void }) {
  const crew = useOpsStore((s) => s.crews.find((c) => c.id === crewId));
  const live = useOpsStore((s) => s.live[crewId]);
  const dispatches = useOpsStore((s) => s.dispatches);
  const drains = useOpsStore((s) => s.drains);
  const select = useOpsStore((s) => s.select);

  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!crew) return null;
  const alert = live?.alertLevel ?? crew.alertLevel;
  const heading = Math.round(live?.headingDeg ?? crew.headingDeg ?? 0);
  const speed = live?.speedKph ?? 0;
  const activeDisp = dispatches.find((d) => d.id === crew.activeDispatchId);
  const destDrain = activeDisp ? drains.find((dr) => dr.id === activeDisp.drainId) : undefined;
  const history = dispatches.filter((d) => d.crewId === crew.id);
  const offline = crew.comms === "offline";

  return (
    <Modal onClose={onClose} className="modal-crew">
      <div className="m-head">
        <div>
          <div className="m-eyebrow">Robot Crew</div>
          <h2 className="m-title">{crew.id}</h2>
          <div className="m-sub">{crew.model}</div>
        </div>
        <div className="m-status">
          <span className="m-led" style={{ background: `var(--status-${crew.status})` }} />
          <span>{STATUS_LABELS[crew.status]}</span>
          <span className="al-chip big" style={{ color: ALERT_HEX[alert], borderColor: ALERT_HEX[alert] }} title="Zone risk">{zoneCode(alert)}</span>
          <span className="m-alabel">{ZONE_LABELS[alert]}</span>
        </div>
      </div>

      <div className="m-grid">
        <Stat icon={<Gauge size={15} />} label="Speed"><span className="big-num tabular">{speed}</span> km/h</Stat>
        <Stat icon={<Navigation size={15} />} label="Heading"><span className="big-num tabular">{heading}°</span></Stat>
        <Stat icon={<Radio size={15} />} label="Comms"><span className={"chip comms-" + crew.comms}>{COMMS_LABELS[crew.comms]}</span></Stat>
        <Stat icon={<Users size={15} />} label="Crew size"><span className="tabular">{crew.crewSize ?? "—"}</span></Stat>
        <Stat icon={<Clock size={15} />} label="Last update">{live ? timeAgo(live.lastUpdate) : "—"}</Stat>
      </div>

      <div className="m-section">
        <h3>Current task</h3>
        {activeDisp ? (
          <div className="task-card">
            <span className="dispatch-id">{activeDisp.id}</span>
            <span className="arrow">→</span>
            <span>{destDrain?.name ?? activeDisp.drainId}</span>
            <span className="eta tabular">ETA {activeDisp.etaMinutes ?? "—"}m</span>
            <span className={"code code-" + activeDisp.status}>{activeDisp.status}</span>
          </div>
        ) : (
          <div className="muted">Idle — available for dispatch.</div>
        )}
      </div>

      <div className="m-section">
        <h3><Route size={14} /> Route</h3>
        <div className="muted">Patrol path highlighted on the map behind this panel.</div>
      </div>

      <div className="m-section">
        <h3>Dispatch history</h3>
        {history.length ? (
          <ul className="hist">
            {history.map((d) => {
              const dr = drains.find((x) => x.id === d.drainId);
              return (
                <li key={d.id}>
                  <span className="dispatch-id">{d.id}</span> → {dr?.name ?? d.drainId}
                  <span className={"code code-" + d.status}>{d.status}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="muted">No dispatch history.</div>
        )}
      </div>

      <div className="m-actions">
        <button className="btn primary" disabled={offline} onClick={() => select({ type: "dispatch-planning" })}>Reroute</button>
        <button className="btn" disabled={offline}>Recall to base</button>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
      {offline && <div className="m-warn">Comms offline — dispatch &amp; reroute disabled until recovery.</div>}
    </Modal>
  );
}
