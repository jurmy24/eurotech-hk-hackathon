import { useEffect, useState } from "react";
import { Activity, ChevronRight } from "lucide-react";
import { useOpsStore } from "../store/useOpsStore";
import { timeAgo } from "../lib/format";

export default function StatusCard() {
  const crews = useOpsStore((s) => s.crews);
  const alerts = useOpsStore((s) => s.alerts);
  const weatherUpdatedAt = useOpsStore((s) => s.weatherUpdatedAt);
  const weatherError = useOpsStore((s) => s.weatherError);
  const select = useOpsStore((s) => s.select);

  // Tick once a second so the "updated Xs ago" freshness stays live.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const offline = crews.filter((c) => c.comms === "offline").length;
  const critical = alerts.filter((a) => a.level === "AL-5").length;
  const overall =
    critical > 0
      ? { label: "Critical Incidents Active", cls: "crit" }
      : offline > 0
        ? { label: "Degraded — Crew Offline", cls: "warn" }
        : { label: "All Systems Operational", cls: "ok" };

  return (
    <section className="card glass clickable" onClick={() => select({ type: "system" })}>
      <div className="card-head">
        <h3 className="card-title">
          <Activity size={14} /> System Status
        </h3>
        <ChevronRight size={15} className="card-chevron" />
      </div>
      <div className={"status-chip " + overall.cls}>
        <span className="status-led" />
        {overall.label}
      </div>
      <div className="status-meta">
        <div>
          <span className="meta-k">Data</span>
          <span className="meta-v">
            {weatherError
              ? "weather offline (cached)"
              : weatherUpdatedAt
                ? `updated ${timeAgo(weatherUpdatedAt)}`
                : "connecting…"}
          </span>
        </div>
        <div>
          <span className="meta-k">Active alerts</span>
          <span className="meta-v tabular">{alerts.length}</span>
        </div>
      </div>
    </section>
  );
}
