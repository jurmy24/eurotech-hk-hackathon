import { useMemo } from "react";
import { Bot, Search } from "lucide-react";
import CollapsibleCard from "./CollapsibleCard";
import { useOpsStore } from "../store/useOpsStore";
import { STATUS_LABELS, ALERT_HEX, ZONE_LABELS, zoneCode } from "../lib/format";
import { getMapInstance } from "../lib/mapRef";
import type { CrewStatus } from "../types/operations";

const STATUSES: CrewStatus[] = ["available", "active", "servicing", "offline"];
const SHORT: Record<CrewStatus, string> = {
  available: "Avail",
  active: "Active",
  servicing: "Servic",
  offline: "Offl",
};

export default function CrewSummary() {
  const crews = useOpsStore((s) => s.crews);
  const live = useOpsStore((s) => s.live);
  const filter = useOpsStore((s) => s.crewFilter);
  const setFilter = useOpsStore((s) => s.setCrewFilter);
  const search = useOpsStore((s) => s.search);
  const setSearch = useOpsStore((s) => s.setSearch);
  const select = useOpsStore((s) => s.select);

  const counts = useMemo(() => {
    const c: Record<CrewStatus, number> = { available: 0, active: 0, servicing: 0, offline: 0 };
    crews.forEach((cr) => (c[cr.status] += 1));
    return c;
  }, [crews]);

  const q = search.trim().toLowerCase();
  const list = crews.filter(
    (c) => (filter === "all" || c.status === filter) && (!q || c.id.toLowerCase().includes(q)),
  );

  return (
    <CollapsibleCard title="Crews" icon={<Bot size={14} />} badge={<span className="count-badge">{crews.length}</span>}>
      <div className="search">
        <Search size={13} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crews…" />
      </div>
      <div className="crew-counts">
        <button className={"count-chip" + (filter === "all" ? " sel" : "")} onClick={() => setFilter("all")} title="All crews">
          <b className="tabular">{crews.length}</b> All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={"count-chip " + s + (filter === s ? " sel" : "")}
            title={STATUS_LABELS[s]}
            onClick={() => setFilter(filter === s ? "all" : s)}
          >
            <b className="tabular">{counts[s]}</b> {SHORT[s]}
          </button>
        ))}
      </div>
      <div className="crew-list">
        {list.map((c) => {
          const lvl = live[c.id]?.alertLevel ?? c.alertLevel;
          return (
            <button
              key={c.id}
              className="crew-item"
              onClick={() => {
                const loc = live[c.id] ?? c.location;
                getMapInstance()?.flyTo({ center: [loc.lng, loc.lat], zoom: 14.5 });
                select({ type: "crew", id: c.id });
              }}
              title={STATUS_LABELS[c.status]}
            >
              <span className="crew-led" style={{ background: `var(--status-${c.status})` }} />
              <span className="crew-id">{c.id}</span>
              <span className="flex-spacer" />
              <span className="al-chip" style={{ color: ALERT_HEX[lvl], borderColor: ALERT_HEX[lvl] }} title={`Zone risk · ${ZONE_LABELS[lvl]}`}>{zoneCode(lvl)}</span>
            </button>
          );
        })}
        {list.length === 0 && <div className="empty">No crews match.</div>}
      </div>
    </CollapsibleCard>
  );
}
