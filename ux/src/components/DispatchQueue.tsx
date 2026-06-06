import { Send, X, Plus } from "lucide-react";
import CollapsibleCard from "./CollapsibleCard";
import { useOpsStore } from "../store/useOpsStore";
import type { DispatchStatus } from "../types/operations";

const STATUS_CODE: Record<DispatchStatus, string> = {
  queued: "QD",
  assigned: "AS",
  en_route: "EN",
  working: "WK",
  complete: "OK",
  cancelled: "XX",
};

export default function DispatchQueue() {
  const dispatches = useOpsStore((s) => s.dispatches);
  const drains = useOpsStore((s) => s.drains);
  const select = useOpsStore((s) => s.select);
  const update = useOpsStore((s) => s.updateDispatch);

  const active = dispatches.filter((d) => d.status !== "cancelled" && d.status !== "complete");

  return (
    <CollapsibleCard title="Dispatched" icon={<Send size={14} />} badge={<span className="count-badge">{active.length}</span>}>
      <button className="btn-row" onClick={() => select({ type: "dispatch-planning" })}>
        <Plus size={13} /> Plan a dispatch
      </button>
      <div className="dispatch-list">
        {active.map((d) => {
          const drain = drains.find((x) => x.id === d.drainId);
          return (
            <div key={d.id} className="dispatch-item" onClick={() => select({ type: "dispatch", id: d.id })}>
              <div className="dispatch-row1">
                <span className="dispatch-id">{d.id}</span>
                <span className={"code code-" + d.status}>{STATUS_CODE[d.status]}</span>
              </div>
              <div className="dispatch-row2">
                <span>{d.crewId}</span>
                <span className="arrow">→</span>
                <span>{drain?.name ?? d.drainId}</span>
              </div>
              <div className="dispatch-row3">
                <span className="eta tabular">ETA {d.etaMinutes ?? "—"}m</span>
                <button
                  className="mini-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    select({ type: "dispatch-planning", drainId: d.drainId });
                  }}
                >
                  Reroute
                </button>
                <button
                  className="mini-btn danger"
                  title="Cancel dispatch"
                  onClick={(e) => {
                    e.stopPropagation();
                    update(d.id, { status: "cancelled" });
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {active.length === 0 && <div className="empty">No active dispatches.</div>}
      </div>
    </CollapsibleCard>
  );
}
