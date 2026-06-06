import { useOpsStore } from "../store/useOpsStore";
import { ALERT_HEX, ZONE_LABELS, zoneCode } from "../lib/format";

// Rendered into a MapLibre marker element via React portal (see CrewLayer).
// Triangle colored by alert level + rotated to heading; ID tag beside it.
export default function CrewMarker({ crewId }: { crewId: string }) {
  const crew = useOpsStore((s) => s.crews.find((c) => c.id === crewId));
  const live = useOpsStore((s) => s.live[crewId]);
  const filter = useOpsStore((s) => s.crewFilter);
  const select = useOpsStore((s) => s.select);
  // Actively cleaning = its assigned dispatch is in the "working" state.
  const working = useOpsStore((s) => {
    const c = s.crews.find((x) => x.id === crewId);
    if (!c?.activeDispatchId) return false;
    return s.dispatches.find((d) => d.id === c.activeDispatchId)?.status === "working";
  });

  if (!crew) return null;
  const alert = live?.alertLevel ?? crew.alertLevel;
  const heading = live?.headingDeg ?? crew.headingDeg ?? 0;
  const dim = filter !== "all" && crew.status !== filter;
  const offline = crew.comms === "offline";

  return (
    <div
      className={
        "crew-marker" + (dim ? " dim" : "") + (offline ? " offline" : "") + (working ? " working" : "")
      }
      onClick={(e) => {
        e.stopPropagation();
        select({ type: "crew", id: crewId });
      }}
    >
      {working && <span className="crew-work-ring" />}
      {working && <span className="crew-work-ring d2" />}
      <span className="crew-tri" style={{ color: ALERT_HEX[alert], transform: `rotate(${heading}deg)` }} />
      <span className="crew-tag">{crewId}</span>
      {working && <span className="crew-work-badge">CLEANING</span>}
      <span className="crew-tip">
        {crewId} · {zoneCode(alert)} {ZONE_LABELS[alert]}
        {working ? " · CLEANING DRAIN" : ""}
        {offline ? " · COMMS OFFLINE" : ""}
      </span>
    </div>
  );
}
