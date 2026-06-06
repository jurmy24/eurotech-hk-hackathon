import { useOpsStore } from "../store/useOpsStore";
import { PRIORITY_LABELS } from "../lib/format";

// Small neon point; pulses magenta when near forecast rain (brief §6).
export default function DrainMarker({ drainId }: { drainId: string }) {
  const drain = useOpsStore((s) => s.drains.find((d) => d.id === drainId));
  const select = useOpsStore((s) => s.select);
  if (!drain) return null;
  const hot = drain.nearRainForecast;

  return (
    <div
      className={"drain-marker" + (hot ? " hot" : "")}
      onClick={(e) => {
        e.stopPropagation();
        select({ type: "drain", id: drainId });
      }}
    >
      {hot && <span className="drain-ring" />}
      <span className="drain-dot" />
      <span className="drain-tip">
        {drain.id} · {drain.name} · {PRIORITY_LABELS[drain.priority]} · {drain.blockageRiskPct}% blockage
        {hot ? " · RAIN NEARBY" : ""}
      </span>
    </div>
  );
}
