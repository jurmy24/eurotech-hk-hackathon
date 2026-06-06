import { HK, WEATHER_GRID } from "../data/hkGeo";
import { haversineKm } from "./geo";
import type { Drain, LatLng, WeatherCell } from "../types/operations";

interface GridCell {
  id: string;
  center: LatLng;
  bounds: [LatLng, LatLng, LatLng, LatLng];
}

// Sampling grid over HK.bounds — each point becomes a rain "cell".
export function buildGridCells(): GridCell[] {
  const { west, south, east, north } = HK.bounds;
  const { cols, rows } = WEATHER_GRID;
  const dLng = (east - west) / cols;
  const dLat = (north - south) / rows;
  const cells: GridCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lng = west + (c + 0.5) * dLng;
      const lat = south + (r + 0.5) * dLat;
      cells.push({
        id: `WX-${r}-${c}`,
        center: { lat, lng },
        bounds: [
          { lat: lat - dLat / 2, lng: lng - dLng / 2 },
          { lat: lat - dLat / 2, lng: lng + dLng / 2 },
          { lat: lat + dLat / 2, lng: lng + dLng / 2 },
          { lat: lat + dLat / 2, lng: lng - dLng / 2 },
        ],
      });
    }
  }
  return cells;
}

// One multi-point Open-Meteo request (keyless, CORS-enabled). Returns a per-cell
// forecast: peak precipitation + probability over the available window (~24h).
export async function fetchWeatherCells(): Promise<WeatherCell[]> {
  const grid = buildGridCells();
  const lats = grid.map((c) => c.center.lat.toFixed(4)).join(",");
  const lngs = grid.map((c) => c.center.lng.toFixed(4)).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}` +
    `&hourly=precipitation,precipitation_probability&forecast_days=1&timezone=Asia%2FHong_Kong`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("open-meteo " + res.status);
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [data];

  return grid.map((cell, i) => {
    const loc = arr[i] ?? arr[0];
    const prec: number[] = loc?.hourly?.precipitation ?? [];
    const prob: number[] = loc?.hourly?.precipitation_probability ?? [];
    let pmax = 0;
    let probMax = 0;
    for (let h = 0; h < prec.length; h++) {
      if ((prec[h] ?? 0) > pmax) pmax = prec[h];
      if ((prob[h] ?? 0) > probMax) probMax = prob[h];
    }
    return {
      id: cell.id,
      center: cell.center,
      bounds: cell.bounds,
      precipNowMm: Math.round((prec[0] ?? 0) * 100) / 100,
      precipMaxMm: Math.round(pmax * 100) / 100,
      probabilityPct: Math.round(probMax),
      windowLabel: "next 24 h",
    };
  });
}

// Used when the live fetch fails (e.g. venue Wi-Fi). Synthesizes two rain bands
// over Kowloon + Causeway Bay so the overlay + drain highlights still demo well.
export function fallbackWeatherCells(): WeatherCell[] {
  const band1: LatLng = { lat: 22.318, lng: 114.168 };
  const band2: LatLng = { lat: 22.282, lng: 114.184 };
  return buildGridCells().map((c) => {
    const i1 = Math.max(0, 2.4 - haversineKm(c.center, band1) * 0.7);
    const i2 = Math.max(0, 1.8 - haversineKm(c.center, band2) * 0.8);
    const intensity = Math.round((i1 + i2) * 10) / 10;
    return {
      id: c.id,
      center: c.center,
      bounds: c.bounds,
      precipNowMm: Math.round(intensity * 0.6 * 10) / 10,
      precipMaxMm: intensity,
      probabilityPct: Math.min(95, Math.round(intensity * 40)),
      windowLabel: "next 24 h (cached)",
    };
  });
}

// Flags drains near the *heaviest* forecast cells (the top ~15% of the field
// that are also above a floor). This stays a meaningful discriminator in any
// conditions — light drizzle or a city-wide downpour — instead of flagging every
// drain at once. Seeded high-risk drains stay highlighted via the store's union.
export function computeDrainRain(
  drains: Drain[],
  cells: WeatherCell[],
  floor = 0.5,
  radiusKm = 1.4,
): Record<string, boolean> {
  const topK = Math.max(1, Math.round(cells.length * 0.15));
  const rainy = [...cells]
    .sort((a, b) => b.precipMaxMm - a.precipMaxMm)
    .slice(0, topK)
    .filter((c) => c.precipMaxMm >= floor);
  const out: Record<string, boolean> = {};
  for (const d of drains) {
    out[d.id] = rainy.some((c) => haversineKm(d.location, c.center) <= radiusKm);
  }
  return out;
}
