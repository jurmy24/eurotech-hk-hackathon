// Build-time data prep: fetch terrain elevation for the app's fixed 14×11 weather
// grid and print a TS-ready `GRID_ELEVATION_M` array to paste into src/data/hkGeo.ts.
// The grid is fixed, so elevation never changes — bake it once.
// Run: `node scripts/fetch_grid_elevation.mjs`
//
// Source: OpenTopoData public API (SRTM 30 m), keyless. 100 locations/request,
// 1 request/sec. Docs: https://www.opentopodata.org/  (NASA SRTM, public domain)

// Must mirror HK.bounds + WEATHER_GRID in src/data/hkGeo.ts and the row-major
// loop in buildGridCells() (src/lib/openMeteo.ts) so indices line up exactly.
const HK_BOUNDS = { west: 114.118, south: 22.262, east: 114.232, north: 22.342 };
const GRID = { cols: 14, rows: 11 };

function gridCenters() {
  const { west, south, east, north } = HK_BOUNDS;
  const { cols, rows } = GRID;
  const dLng = (east - west) / cols;
  const dLat = (north - south) / rows;
  const pts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pts.push({
        lat: south + (r + 0.5) * dLat,
        lng: west + (c + 0.5) * dLng,
      });
    }
  }
  return pts;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJsonWithRetry(url, tries = 6) {
  for (let attempt = 0; attempt < tries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const wait = 2000 * 2 ** attempt; // 2s, 4s, 8s, …
      console.log(`HTTP ${res.status} — backing off ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${url} -> HTTP ${res.status}`);
  }
  throw new Error(`${url} -> gave up after ${tries} attempts`);
}

async function fetchElevations(pts) {
  // OpenTopoData public: 100 locations/request, max 1 request/second.
  const out = [];
  for (let i = 0; i < pts.length; i += 100) {
    const batch = pts.slice(i, i + 100);
    const locations = batch.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
    const url = `https://api.opentopodata.org/v1/srtm30m?locations=${locations}`;
    process.stdout.write(`fetching elevation ${i + 1}–${i + batch.length} … `);
    const data = await fetchJsonWithRetry(url);
    if (!Array.isArray(data.results)) throw new Error(`unexpected response: ${data.status ?? "?"}`);
    console.log(`${data.results.length} values`);
    // SRTM is land-only — null over open sea → treat as 0 m (sea level).
    out.push(...data.results.map((r) => r.elevation ?? 0));
    if (i + 100 < pts.length) await sleep(2000); // respect 1 req/sec limit
  }
  return out;
}

const pts = gridCenters();
const elev = (await fetchElevations(pts)).map((m) => Math.round(m * 10) / 10);

if (elev.length !== pts.length) {
  throw new Error(`got ${elev.length} elevations for ${pts.length} cells`);
}

// Summary so we can pick LOW_LYING_BAND sensibly.
const sorted = [...elev].sort((a, b) => a - b);
const min = sorted[0];
const max = sorted[sorted.length - 1];
const median = sorted[Math.floor(sorted.length / 2)];
const buckets = { "<=0 (sea)": 0, "0–5": 0, "5–12": 0, "12–30": 0, ">30": 0 };
for (const m of elev) {
  if (m <= 0) buckets["<=0 (sea)"]++;
  else if (m <= 5) buckets["0–5"]++;
  else if (m <= 12) buckets["5–12"]++;
  else if (m <= 30) buckets["12–30"]++;
  else buckets[">30"]++;
}

console.log(`\n${elev.length} cells — min ${min} m, median ${median} m, max ${max} m`);
console.log("distribution:", buckets);
console.log("\n// Paste into src/data/hkGeo.ts (row-major, same order as buildGridCells):");
console.log(`export const GRID_ELEVATION_M: number[] = [\n  ${
  // 14 per line = one grid row per source line, easy to eyeball.
  Array.from({ length: GRID.rows }, (_, r) =>
    elev.slice(r * GRID.cols, (r + 1) * GRID.cols).join(", "),
  ).join(",\n  ")
},\n];`);
