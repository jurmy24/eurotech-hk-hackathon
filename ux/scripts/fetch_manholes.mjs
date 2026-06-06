// Build-time data prep: download DSD "Drainage Records" manhole datasets from
// data.gov.hk, filter to the app's Hong Kong harbour window, and write a small
// bundled GeoJSON (src/data/manholes.json). Run: `node scripts/fetch_manholes.mjs`.
//
// Source: https://data.gov.hk/en-data/dataset/hk-dsd-dsd_psi_1-drainage-record
// Coordinates are already WGS84 [lng, lat]. Open data — attribute DSD / DATA.GOV.HK.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Served as a static asset and lazy-fetched on first layer toggle (11 MB — too big
// to inline into the JS bundle). Kept out of git via .gitignore; regenerate with this script.
const OUT = resolve(__dirname, "../public/data/manholes.json");

// Must match HK.bounds in src/data/hkGeo.ts (the harbour window the map is locked to).
const BBOX = { west: 114.118, south: 22.262, east: 114.232, north: 22.342 };

const SOURCES = [
  { kind: "storm", url: "https://www.dsd.gov.hk/datagovhk/data/Storm_Water_Manhole.json" },
  { kind: "sewer", url: "https://www.dsd.gov.hk/datagovhk/data/Sewer_Manhole.json" },
  { kind: "combined", url: "https://www.dsd.gov.hk/datagovhk/data/Combined_Manhole.json" },
  { kind: "storm_terminal", url: "https://www.dsd.gov.hk/datagovhk/data/Storm_Water_Terminal_Manhole.json" },
  { kind: "sewer_terminal", url: "https://www.dsd.gov.hk/datagovhk/data/Sewer_Terminal_Manhole.json" },
];

const inBbox = ([lng, lat]) =>
  lng >= BBOX.west && lng <= BBOX.east && lat >= BBOX.south && lat <= BBOX.north;

const round6 = (n) => Math.round(n * 1e6) / 1e6; // ~0.1 m precision, smaller payload

const out = [];
for (const { kind, url } of SOURCES) {
  process.stdout.write(`fetching ${kind} … `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const fc = await res.json();
  let kept = 0;
  for (const f of fc.features ?? []) {
    const c = f.geometry?.coordinates;
    if (!c || !inBbox(c)) continue;
    out.push({
      type: "Feature",
      properties: {
        id: f.properties?.FEAT_NUM ?? String(f.id),
        kind,
        cl: f.properties?.CL ?? null, // cover level (m), may be null
      },
      geometry: { type: "Point", coordinates: [round6(c[0]), round6(c[1])] },
    });
    kept++;
  }
  console.log(`${kept} in window (of ${fc.features?.length ?? 0})`);
}

const collection = { type: "FeatureCollection", features: out };
await writeFile(OUT, JSON.stringify(collection));
console.log(`\nwrote ${out.length} manholes -> ${OUT}`);
