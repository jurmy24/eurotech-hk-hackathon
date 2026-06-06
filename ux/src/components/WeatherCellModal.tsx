import { CloudRain } from "lucide-react";
import Modal from "./Modal";
import Stat from "./Stat";
import { useOpsStore } from "../store/useOpsStore";

export default function WeatherCellModal({ cellId, onClose }: { cellId: string; onClose: () => void }) {
  const cell = useOpsStore((s) => s.weatherCells.find((c) => c.id === cellId));
  const err = useOpsStore((s) => s.weatherError);
  if (!cell) return null;

  return (
    <Modal onClose={onClose} className="modal-weather small">
      <div className="m-head">
        <div>
          <div className="m-eyebrow"><CloudRain size={12} /> Weather cell</div>
          <h2 className="m-title">Rain forecast</h2>
          <div className="m-sub">{cell.windowLabel} · {err ? "cached" : "live (Open-Meteo)"}</div>
        </div>
      </div>
      <div className="m-grid two">
        <Stat label="Peak intensity"><span className="big-num tabular">{cell.precipMaxMm}</span> mm</Stat>
        <Stat label="Probability"><span className="big-num tabular">{cell.probabilityPct}</span>%</Stat>
        <Stat label="Now"><span className="tabular">{cell.precipNowMm} mm</span></Stat>
        <Stat label="Location"><span className="tabular">{cell.center.lat.toFixed(3)}, {cell.center.lng.toFixed(3)}</span></Stat>
      </div>
    </Modal>
  );
}
