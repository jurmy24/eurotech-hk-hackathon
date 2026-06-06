import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import CollapsibleCard from "./CollapsibleCard";
import { useOpsStore } from "../store/useOpsStore";
import { ALERT_HEX, ALERT_LABELS } from "../lib/format";
import type { AlertLevel } from "../types/operations";

const ORDER: AlertLevel[] = ["AL-0", "AL-1", "AL-2", "AL-3", "AL-4", "AL-5"];

export default function StatusCard() {
  const crews = useOpsStore((s) => s.crews);
  const live = useOpsStore((s) => s.live);
  const alerts = useOpsStore((s) => s.alerts);
  const select = useOpsStore((s) => s.select);

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const offline = crews.filter((c) => c.comms === "offline").length;
  const crit = alerts.filter((a) => a.level === "AL-5").length;
  const overall =
    crit > 0
      ? { label: "Critical Incidents Active", cls: "crit" }
      : offline > 0
        ? { label: "Degraded — Crew Offline", cls: "warn" }
        : { label: "All Systems Operational", cls: "ok" };

  // Overall alert level = highest alert across the fleet.
  const overallAL = crews.reduce<AlertLevel>((m, c) => {
    const l = live[c.id]?.alertLevel ?? c.alertLevel;
    return ORDER.indexOf(l) > ORDER.indexOf(m) ? l : m;
  }, "AL-0");

  const badge = (
    <>
      <span className={"led-dot " + overall.cls} />
      <span className="al-chip mini" style={{ color: ALERT_HEX[overallAL], borderColor: ALERT_HEX[overallAL] }}>
        {overallAL}
      </span>
    </>
  );

  return (
    <CollapsibleCard title="System Status" icon={<Activity size={14} />} badge={badge}>
      <button className={"status-chip wide " + overall.cls} onClick={() => select({ type: "system" })}>
        <span className="status-led" />
        {overall.label}
      </button>
      <div className="status-meta">
        <div>
          <span className="meta-k">Overall alert</span>
          <span className="meta-v" style={{ color: ALERT_HEX[overallAL] }}>{overallAL} · {ALERT_LABELS[overallAL]}</span>
        </div>
        <button className="meta-link" onClick={() => select({ type: "alerts" })}>
          <span className="meta-k">Active alerts</span>
          <span className="meta-v tabular">{alerts.length} ›</span>
        </button>
      </div>
    </CollapsibleCard>
  );
}
