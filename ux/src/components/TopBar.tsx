import { useEffect, useState } from "react";
import { AlertTriangle, Radio } from "lucide-react";
import { useOpsStore } from "../store/useOpsStore";
import { clockHHMMSS } from "../lib/format";

export default function TopBar() {
  const alerts = useOpsStore((s) => s.alerts);
  const select = useOpsStore((s) => s.select);
  const [clock, setClock] = useState(clockHHMMSS());

  useEffect(() => {
    const t = setInterval(() => setClock(clockHHMMSS()), 1000);
    return () => clearInterval(t);
  }, []);

  const critical = alerts.filter((a) => a.level === "AL-4" || a.level === "AL-5").length;

  return (
    <header className="topbar glass">
      <div className="topbar-brand">
        <span className="brand-mark" aria-hidden />
        {/* Whitelabel: client logo slot — no product branding. */}
        <span className="brand-slot">CLIENT&nbsp;BRAND</span>
        <span className="topbar-divider" />
        <span className="topbar-context">Drainage &amp; Wastewater Operations · Hong Kong</span>
      </div>
      <div className="topbar-right">
        <button className="topbar-alerts" onClick={() => select({ type: "alerts" })}>
          <AlertTriangle size={15} />
          <span className="tabular">{alerts.length}</span> alerts
          {critical > 0 && <span className="dot-crit" aria-label={`${critical} critical`} />}
        </button>
        <span className="topbar-clock tabular">{clock}</span>
        <span className="conn-ok">
          <Radio size={13} /> LIVE
        </span>
      </div>
    </header>
  );
}
