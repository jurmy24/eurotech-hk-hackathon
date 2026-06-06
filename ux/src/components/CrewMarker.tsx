import { useOpsStore } from "../store/useOpsStore";
import { ALERT_HEX, ALERT_LABELS } from "../lib/format";

// Rendered into a MapLibre marker element via React portal (see CrewLayer).
// Triangle colored by alert level + rotated to heading; ID tag beside it.
export default function CrewMarker({ crewId }: { crewId: string }) {
  const crew = useOpsStore((s) => s.crews.find((c) => c.id === crewId));
  const live = useOpsStore((s) => s.live[crewId]);
  const filter = useOpsStore((s) => s.crewFilter);
  const select = useOpsStore((s) => s.select);

  if (!crew) return null;
  const alert = live?.alertLevel ?? crew.alertLevel;
  const heading = live?.headingDeg ?? crew.headingDeg ?? 0;
  const dim = filter !== "all" && crew.status !== filter;
  const offline = crew.comms === "offline";

  return (
    <div
      className={"crew-marker" + (dim ? " dim" : "") + (offline ? " offline" : "")}
      onClick={(e) => {
        e.stopPropagation();
        select({ type: "crew", id: crewId });
      }}
    >
      <span className="crew-tri" style={{ color: ALERT_HEX[alert], transform: `rotate(${heading}deg)` }} />
      <span className="crew-tag">{crewId}</span>
      <span className="crew-tip">
        {crewId} · {alert} {ALERT_LABELS[alert]}
        {offline ? " · COMMS OFFLINE" : ""}
      </span>
    </div>
  );
}
