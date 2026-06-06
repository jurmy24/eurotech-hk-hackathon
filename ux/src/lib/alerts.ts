import type {
  RobotCrew,
  Drain,
  WeatherCell,
  TopographyZone,
  OpsAlert,
  LivePosition,
} from "../types/operations";
import { haversineKm } from "./geo";
import { pointInPolygon } from "./polygon";

// Derive the prioritized alert list from current state (brief §5 Alerts & Incidents).
// Pure + deterministic given inputs; recomputed whenever crews/weather change.
export function deriveAlerts(
  crews: RobotCrew[],
  drains: Drain[],
  weatherCells: WeatherCell[],
  topoZones: TopographyZone[],
  live: Record<string, LivePosition> = {},
  nowIso = new Date().toISOString(),
): OpsAlert[] {
  const out: OpsAlert[] = [];

  for (const d of drains) {
    if (d.nearRainForecast && d.blockageRiskPct >= 60) {
      out.push({
        id: `AL-FLOOD-${d.id}`,
        kind: "flooding",
        level: d.blockageRiskPct >= 85 ? "AL-5" : "AL-4",
        title: `Flooding risk — ${d.id}`,
        detail: `${d.name ?? d.id} (${d.district ?? ""}) ${d.blockageRiskPct}% blockage with rain forecast nearby.`,
        entityType: "drain",
        entityId: d.id,
        createdAt: nowIso,
      });
    } else if (d.blockageRiskPct >= 85) {
      out.push({
        id: `AL-BLOCK-${d.id}`,
        kind: "blocked_drain",
        level: "AL-3",
        title: `Blocked drain — ${d.id}`,
        detail: `${d.name ?? d.id} at ${d.blockageRiskPct}% blockage. Inspection/cleaning recommended.`,
        entityType: "drain",
        entityId: d.id,
        createdAt: nowIso,
      });
    }
  }

  // Weather + topography overlap: a rain cell sitting over a low-lying zone.
  for (const zone of topoZones) {
    const wet = weatherCells.find(
      (cell) => cell.precipMaxMm >= 1.0 && pointInPolygon(cell.center, zone.polygon),
    );
    if (wet) {
      out.push({
        id: `AL-TOPO-${zone.id}`,
        kind: "weather_topography",
        level: "AL-3",
        title: `Weather × terrain — ${zone.name}`,
        detail: `Rain (${wet.precipMaxMm.toFixed(1)} mm) forecast over low-lying ${zone.name}. Pre-position crews.`,
        createdAt: nowIso,
      });
    }
  }

  const rank: Record<string, number> = { "AL-5": 5, "AL-4": 4, "AL-3": 3, "AL-2": 2, "AL-1": 1, "AL-0": 0 };
  return out.sort((a, b) => rank[b.level] - rank[a.level]);
}

// Re-export for callers that compute proximity (kept here for convenience).
export { haversineKm };
