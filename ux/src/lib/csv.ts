import type { AlertLevel, Waypoint } from "../types/operations";

// Parse the crew-movement CSV (timestamp_sec,crew_id,lat,lng,alert_level)
// into per-crew waypoint lists sorted by time.
export function parseCrewCsv(text: string): Record<string, Waypoint[]> {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",").map((s) => s.trim());
  const col = (name: string) => header.indexOf(name);
  const ti = col("timestamp_sec");
  const ci = col("crew_id");
  const lai = col("lat");
  const lni = col("lng");
  const ai = col("alert_level");

  const out: Record<string, Waypoint[]> = {};
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;
    const c = row.split(",");
    const id = c[ci].trim();
    (out[id] ||= []).push({
      t: Number(c[ti]),
      lat: Number(c[lai]),
      lng: Number(c[lni]),
      alert: c[ai].trim() as AlertLevel,
    });
  }
  for (const id in out) out[id].sort((a, b) => a.t - b.t);
  return out;
}
