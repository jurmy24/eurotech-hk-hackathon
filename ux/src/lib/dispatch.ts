import type { RobotCrew, Drain, LivePosition } from "../types/operations";
import { haversineKm, etaMinutes } from "./geo";

export interface Recommendation {
  crew: RobotCrew;
  distanceKm: number;
  etaMinutes: number;
  note: string;
}

// Nearest available, comms-capable crew to a drain (uses live position if moving).
export function recommendCrew(
  drain: Drain,
  crews: RobotCrew[],
  live: Record<string, LivePosition>,
): Recommendation | null {
  const available = crews.filter((c) => c.status === "available" && c.comms !== "offline");
  if (!available.length) return null;

  let best = available[0];
  let bestKm = Infinity;
  for (const c of available) {
    const lp = live[c.id];
    const loc = lp ? { lat: lp.lat, lng: lp.lng } : c.location;
    const d = haversineKm(loc, drain.location);
    if (d < bestKm) {
      bestKm = d;
      best = c;
    }
  }
  return {
    crew: best,
    distanceKm: Math.round(bestKm * 10) / 10,
    etaMinutes: etaMinutes(bestKm),
    note: `${drain.blockageRiskPct}% blockage${drain.nearRainForecast ? " · rain forecast nearby" : ""}`,
  };
}

export function newDispatchId(): string {
  return "DSP-" + String(Math.floor(Date.now() % 100000)).padStart(5, "0");
}
