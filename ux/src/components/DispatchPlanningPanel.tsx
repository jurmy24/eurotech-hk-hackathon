import { Send } from "lucide-react";
import Modal from "./Modal";
import { useOpsStore } from "../store/useOpsStore";

// Reached via crew/dispatch "Reroute". Ranks drains by risk; selecting one opens
// its detail where a crew is recommended and the dispatch confirmed.
export default function DispatchPlanningPanel({ onClose }: { drainId?: string; onClose: () => void }) {
  const drains = useOpsStore((s) => s.drains);
  const select = useOpsStore((s) => s.select);

  const ranked = [...drains].sort(
    (a, b) =>
      Number(b.nearRainForecast) - Number(a.nearRainForecast) || b.blockageRiskPct - a.blockageRiskPct,
  );

  return (
    <Modal onClose={onClose} className="modal-planning">
      <div className="m-head">
        <div>
          <div className="m-eyebrow"><Send size={12} /> Dispatch Planning</div>
          <h2 className="m-title">Plan a dispatch</h2>
          <div className="m-sub">Drains ranked by risk — select one to recommend a crew</div>
        </div>
      </div>
      <div className="plan-list">
        {ranked.map((d) => (
          <button key={d.id} className="plan-row" onClick={() => select({ type: "drain", id: d.id })}>
            <span className="plan-id">{d.id}</span>
            <span className="plan-name">{d.name}</span>
            {d.nearRainForecast && <span className="chip rain small">rain</span>}
            <span className="plan-risk">
              <span className="batt mini">
                <span
                  className="batt-fill"
                  style={{
                    width: `${d.blockageRiskPct}%`,
                    background:
                      d.blockageRiskPct >= 85 ? "var(--al-5)" : d.blockageRiskPct >= 60 ? "var(--al-3)" : "var(--al-2)",
                  }}
                />
              </span>
              <span className="tabular">{d.blockageRiskPct}%</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
