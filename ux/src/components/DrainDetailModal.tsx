import { useState } from "react";
import { Droplet, CloudRain, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import Stat from "./Stat";
import { useOpsStore } from "../store/useOpsStore";
import { PRIORITY_LABELS, PRIORITY_HEX } from "../lib/format";
import { recommendCrew, newDispatchId, type Recommendation } from "../lib/dispatch";

export default function DrainDetailModal({ drainId, onClose }: { drainId: string; onClose: () => void }) {
  const drain = useOpsStore((s) => s.drains.find((d) => d.id === drainId));
  const crews = useOpsStore((s) => s.crews);
  const live = useOpsStore((s) => s.live);
  const createDispatch = useOpsStore((s) => s.createDispatch);
  const setFlash = useOpsStore((s) => s.setFlash);

  const [rec, setRec] = useState<Recommendation | null>(null);
  const [done, setDone] = useState(false);

  if (!drain) return null;
  const riskColor =
    drain.blockageRiskPct >= 85 ? "var(--al-5)" : drain.blockageRiskPct >= 60 ? "var(--al-3)" : "var(--al-2)";
  const availableCount = crews.filter((c) => c.status === "available" && c.comms !== "offline").length;

  const recommend = () => setRec(recommendCrew(drain, crews, live));
  const confirm = () => {
    if (!rec) return;
    createDispatch({
      id: newDispatchId(),
      crewId: rec.crew.id,
      drainId: drain.id,
      status: "en_route",
      createdAt: new Date().toISOString(),
      etaMinutes: rec.etaMinutes,
      note: rec.note,
    });
    setFlash(`Dispatched ${rec.crew.id} → ${drain.id} (ETA ${rec.etaMinutes}m)`);
    setTimeout(() => setFlash(null), 3200);
    setDone(true);
    setTimeout(onClose, 750);
  };

  return (
    <Modal onClose={onClose} className="modal-drain">
      <div className="m-head">
        <div>
          <div className="m-eyebrow"><Droplet size={12} /> Drain</div>
          <h2 className="m-title">{drain.id}</h2>
          <div className="m-sub">{drain.name} · {drain.district}</div>
        </div>
        <div className="m-status">
          <span className="chip" style={{ color: PRIORITY_HEX[drain.priority], borderColor: PRIORITY_HEX[drain.priority] }}>
            {PRIORITY_LABELS[drain.priority]} priority
          </span>
          {drain.nearRainForecast && (
            <span className="chip rain"><CloudRain size={12} /> Rain forecast</span>
          )}
        </div>
      </div>

      <div className="m-grid two">
        <Stat label="Blockage risk">
          <div className="batt"><span className="batt-fill" style={{ width: `${drain.blockageRiskPct}%`, background: riskColor }} /></div>
          <span className="tabular">{drain.blockageRiskPct}%</span>
        </Stat>
        <Stat label="Last inspected">
          {drain.lastInspectedAt
            ? new Date(drain.lastInspectedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
            : "—"}
        </Stat>
      </div>

      <div className="m-section">
        <h3>Dispatch planning</h3>
        {done ? (
          <div className="rec-done"><CheckCircle2 size={16} /> Dispatch created and added to the queue.</div>
        ) : rec ? (
          <div className="rec-card">
            <div className="rec-row"><span className="rec-k">Recommended crew</span><span className="rec-v">{rec.crew.id}</span></div>
            <div className="rec-row"><span className="rec-k">Distance</span><span className="rec-v tabular">{rec.distanceKm} km</span></div>
            <div className="rec-row"><span className="rec-k">ETA</span><span className="rec-v tabular">{rec.etaMinutes} min</span></div>
            <div className="rec-row"><span className="rec-k">Risk note</span><span className="rec-v">{rec.note}</span></div>
            <div className="rec-actions">
              <button className="btn primary" onClick={confirm}>Confirm dispatch</button>
              <button className="btn ghost" onClick={() => setRec(null)}>Back</button>
            </div>
          </div>
        ) : availableCount > 0 ? (
          <button className="btn primary" onClick={recommend}>Recommend crew</button>
        ) : (
          <div className="m-warn">No available crews — all are active, servicing, or offline.</div>
        )}
      </div>
    </Modal>
  );
}
