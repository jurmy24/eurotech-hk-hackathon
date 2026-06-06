import csvText from "./crewMovement.csv?raw";
import { parseCrewCsv } from "../lib/csv";

// Parsed once and shared by the animation loop (hooks/useCrewAnimation) and the
// route-visualization layer (components/RouteLayer).
export const CREW_WAYPOINTS = parseCrewCsv(csvText);

export function crewPathLngLat(id: string): [number, number][] {
  return (CREW_WAYPOINTS[id] ?? []).map((w) => [w.lng, w.lat] as [number, number]);
}
