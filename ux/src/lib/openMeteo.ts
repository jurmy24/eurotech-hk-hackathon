import { HK, WEATHER_GRID } from "../data/hkGeo";
import { haversineKm } from "./geo";
import type { Drain, LatLng, WeatherCell } from "../types/operations";

interface GridCell {
  id: string;
  center: LatLng;
  bounds: [LatLng, LatLng, LatLng, LatLng];
}

// One forecast hour: per-cell precipitation (mm), aligned to the cells array order.
export interface ForecastFrame {
  time: number; // unix seconds (top of the hour)
  intensity: number[]; // precip mm per cell, same index order as the cells
}

export interface WeatherSnapshot {
  cells: WeatherCell[]; // "now" truth — drives drain/alert logic + the glow
  forecast: ForecastFrame[]; // upcoming hours — drives the forecast timeline
}

const FORECAST_HOURS = 12; // how far ahead the timeline forecast extends

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

// One multi-point Open-Meteo request (keyless, CORS-enabled). Returns the per-cell
// "now" field (peak/now/total precip + probability over the next 24 h) plus the
// next ~12 hourly forecast frames that drive the timeline's forecast segment.
export async function fetchWeatherCells(): Promise<WeatherSnapshot> {
  const grid = buildGridCells();
  const lats = grid.map((c) => c.center.lat.toFixed(4)).join(",");
  const lngs = grid.map((c) => c.center.lng.toFixed(4)).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}` +
    `&hourly=precipitation,precipitation_probability&forecast_days=2` +
    `&timeformat=unixtime&timezone=Asia%2FHong_Kong`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("open-meteo " + res.status);
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [data];

  const times: number[] = arr[0]?.hourly?.time ?? [];
  const nowSec = Date.now() / 1000;
  // Current hour = last step at/just before now; window = the following 24 h.
  let curIdx = 0;
  for (let h = 0; h < times.length; h++) if (times[h] <= nowSec) curIdx = h;
  const windowEnd = Math.min(times.length, curIdx + 24);

  const cells: WeatherCell[] = grid.map((cell, i) => {
    const prec: number[] = (arr[i] ?? arr[0])?.hourly?.precipitation ?? [];
    const prob: number[] = (arr[i] ?? arr[0])?.hourly?.precipitation_probability ?? [];
    let pmax = 0;
    let probMax = 0;
    let psum = 0;
    for (let h = curIdx; h < windowEnd; h++) {
      if ((prec[h] ?? 0) > pmax) pmax = prec[h];
      if ((prob[h] ?? 0) > probMax) probMax = prob[h];
      psum += prec[h] ?? 0;
    }
    return {
      id: cell.id,
      center: cell.center,
      bounds: cell.bounds,
      precipNowMm: Math.round((prec[curIdx] ?? 0) * 100) / 100,
      precipMaxMm: Math.round(pmax * 100) / 100,
      precipTotalMm: Math.round(psum * 10) / 10,
      probabilityPct: Math.round(probMax),
      windowLabel: "next 24 h",
    };
  });

  // Upcoming hours (strictly future) → per-cell forecast frames for the timeline.
  const forecast: ForecastFrame[] = [];
  for (let h = 0; h < times.length && forecast.length < FORECAST_HOURS; h++) {
    if (times[h] <= nowSec) continue;
    forecast.push({
      time: times[h],
      intensity: grid.map(
        (_, i) => Math.round(((arr[i] ?? arr[0])?.hourly?.precipitation?.[h] ?? 0) * 100) / 100,
      ),
    });
  }

  return { cells, forecast };
}

// Used when the live fetch fails (e.g. venue Wi-Fi). Synthesizes two rain bands
// over Kowloon + Causeway Bay so the overlay + drain highlights still demo well,
// plus a gently-building forecast so the timeline's forecast segment still plays.
export function fallbackWeatherCells(): WeatherSnapshot {
  const band1: LatLng = { lat: 22.318, lng: 114.168 };
  const band2: LatLng = { lat: 22.282, lng: 114.184 };
  const grid = buildGridCells();
  const baseIntensity = grid.map((c) => {
    const i1 = Math.max(0, 2.4 - haversineKm(c.center, band1) * 0.7);
    const i2 = Math.max(0, 1.8 - haversineKm(c.center, band2) * 0.8);
    return Math.round((i1 + i2) * 10) / 10;
  });
  const cells: WeatherCell[] = grid.map((c, i) => {
    const intensity = baseIntensity[i];
    return {
      id: c.id,
      center: c.center,
      bounds: c.bounds,
      precipNowMm: Math.round(intensity * 0.6 * 10) / 10,
      precipMaxMm: intensity,
      precipTotalMm: Math.round(intensity * 6 * 10) / 10, // ~6 h of synthetic rain
      probabilityPct: Math.min(95, Math.round(intensity * 40)),
      windowLabel: "next 24 h (cached)",
    };
  });
  // Synthetic forecast: intensity swells then eases over the next 12 h.
  const nextHour = (Math.floor(Date.now() / 3_600_000) + 1) * 3600;
  const forecast: ForecastFrame[] = Array.from({ length: FORECAST_HOURS }, (_, h) => {
    const factor = 0.6 + 0.8 * Math.sin((h / FORECAST_HOURS) * Math.PI); // 0.6→1.4→0.6
    return {
      time: nextHour + h * 3600,
      intensity: baseIntensity.map((v) => Math.round(v * factor * 100) / 100),
    };
  });
  return { cells, forecast };
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
