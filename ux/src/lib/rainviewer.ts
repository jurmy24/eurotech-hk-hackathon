// RainViewer public weather-radar tiles (keyless, CORS-enabled). Real precipitation
// radar, updated ~every 10 min — used as the live "storm" overlay over Hong Kong.
// Docs: https://www.rainviewer.com/api/weather-maps-api.html

export interface RadarFrame {
  time: number; // unix seconds
  path: string; // e.g. "/v2/radar/7548422bede3"
}

export interface RadarMaps {
  host: string; // e.g. "https://tilecache.rainviewer.com"
  frames: RadarFrame[]; // chronological: past → latest (+ nowcast if available)
}

const MAPS_URL = "https://api.rainviewer.com/public/weather-maps.json";
const FALLBACK_HOST = "https://tilecache.rainviewer.com";

// One keyless request returning the currently-available radar frames (the last
// ~2 h of real scans, plus short-range nowcast frames when present).
export async function fetchRadarFrames(): Promise<RadarMaps> {
  const res = await fetch(MAPS_URL);
  if (!res.ok) throw new Error("rainviewer " + res.status);
  const data = await res.json();
  const host: string = data?.host ?? FALLBACK_HOST;
  const past: RadarFrame[] = data?.radar?.past ?? [];
  const nowcast: RadarFrame[] = data?.radar?.nowcast ?? [];
  return { host, frames: [...past, ...nowcast] };
}

export interface RadarTileOpts {
  color?: number; // RainViewer color scheme (see below)
  size?: number; // tile px (256 | 512)
  smooth?: number; // 1 = soft gradient, 0 = blocky
  snow?: number; // 1 = render snow in a separate color
}

// Build the {z}/{x}/{y} tile-URL template MapLibre expects for one radar frame.
// color 4 = "The Weather Channel" scheme (green→yellow→red→magenta) — the most
// storm-like ramp over the dark neon basemap. smooth=1 gives soft fronts.
export function radarTileUrl(host: string, frame: RadarFrame, opts: RadarTileOpts = {}): string {
  const { color = 4, size = 256, smooth = 1, snow = 0 } = opts;
  return `${host}${frame.path}/${size}/{z}/{x}/{y}/${color}/${smooth}_${snow}.png`;
}
