import Modal from "./Modal";
import Stat from "./Stat";
import { useOpsStore } from "../store/useOpsStore";

export default function DispatchDetailModal({ dispatchId, onClose }: { dispatchId: string; onClose: () => void }) {
  const d = useOpsStore((s) => s.dispatches.find((x) => x.id === dispatchId));
  const crews = useOpsStore((s) => s.crews);
  const drains = useOpsStore((s) => s.drains);
  const update = useOpsStore((s) => s.updateDispatch);
  const select = useOpsStore((s) => s.select);
  const setFlash = useOpsStore((s) => s.setFlash);
  if (!d) return null;

  const crew = crews.find((c) => c.id === d.crewId);
  const drain = drains.find((x) => x.id === d.drainId);
  const closed = d.status === "cancelled" || d.status === "complete";

  return (
    <Modal onClose={onClose} className="modal-dispatch small">
      <div className="m-head">
        <div>
          <div className="m-eyebrow">Dispatch</div>
          <h2 className="m-title">{d.id}</h2>
          <div className="m-sub">{d.crewId} → {drain?.name ?? d.drainId}</div>
        </div>
        <span className={"code code-" + d.status}>{d.status}</span>
      </div>
      <div className="m-grid two">
        <Stat label="Crew">{crew?.name ?? d.crewId}</Stat>
        <Stat label="Destination">{drain?.name ?? d.drainId}</Stat>
        <Stat label="ETA"><span className="tabular">{d.etaMinutes ?? "—"} min</span></Stat>
        <Stat label="Created">{new Date(d.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</Stat>
      </div>
      {d.note && (
        <div className="m-section">
          <h3>Risk note</h3>
          <div className="muted">{d.note}</div>
        </div>
      )}
      <div className="m-actions">
        <button className="btn" onClick={() => select({ type: "crew", id: d.crewId })}>View crew</button>
        <button className="btn" disabled={closed} onClick={() => select({ type: "dispatch-planning", drainId: d.drainId })}>Reroute</button>
        <button
          className="btn ghost danger"
          disabled={closed}
          onClick={() => {
            update(d.id, { status: "cancelled" });
            setFlash(`Cancelled ${d.id}`);
            setTimeout(() => setFlash(null), 2500);
            onClose();
          }}
        >
          Cancel dispatch
        </button>
      </div>
    </Modal>
  );
}
