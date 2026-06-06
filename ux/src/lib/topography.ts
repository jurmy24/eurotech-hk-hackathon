import { buildGridCells } from "./openMeteo";
import { haversineKm } from "./geo";
import { HK, GRID_ELEVATION_M, LOW_LYING_BAND, WEATHER_GRID, DISTRICTS } from "../data/hkGeo";
import type { LatLng, TopographyZone } from "../types/operations";

// Derives low-lying flood-risk zones from real terrain elevation sampled on the
// fixed weather grid (GRID_ELEVATION_M, SRTM 30 m). Grid cells whose elevation falls
// inside LOW_LYING_BAND are flood-filled into contiguous clusters; each cluster becomes
// one TopographyZone — a bounding ring named by its nearest district. This replaces the
// old hand-drawn illustrative polygons; downstream code keeps importing TOPOGRAPHY_ZONES.
// Pure + deterministic, computed once at module load (the grid + elevations never change).

type GridCell = ReturnType<typeof buildGridCells>[number];

function nearestDistrict(p: LatLng): string {
  let best = DISTRICTS[0];
  let bestKm = Infinity;
  for (const d of DISTRICTS) {
    const km = haversineKm(p, d.loc);
    if (km < bestKm) {
      bestKm = km;
      best = d;
    }
  }
  return best.name;
}

// Grid corner (i = lat-line 0..rows, j = lng-line 0..cols) → LatLng, using the same
// bounds/step as buildGridCells so the traced outline lands exactly on cell edges.
const { cols: COLS, rows: ROWS } = WEATHER_GRID;
const D_LAT = (HK.bounds.north - HK.bounds.south) / ROWS;
const D_LNG = (HK.bounds.east - HK.bounds.west) / COLS;
const cornerLL = (i: number, j: number): LatLng => ({
  lat: HK.bounds.south + i * D_LAT,
  lng: HK.bounds.west + j * D_LNG,
});

// Trace the rectilinear boundary ring of a set of grid cells. Each low cell emits its
// four directed edges (CCW, interior on the left) unless the neighbour across that edge
// is also in the set; shared edges cancel, leaving the outline. Walk start→end to stitch.
function componentOutline(comp: number[]): LatLng[] {
  const inComp = new Set(comp);
  const has = (r: number, c: number) => inComp.has(r * COLS + c);
  const k = (i: number, j: number) => i * (COLS + 1) + j; // corner-point id
  const next = new Map<number, [number, number]>(); // startCorner → endCorner(i,j)
  for (const idx of comp) {
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;
    // Cell (r,c) corners: SW(r,c) SE(r,c+1) NE(r+1,c+1) NW(r+1,c)
    if (!has(r - 1, c)) next.set(k(r, c), [r, c + 1]); // south edge → east
    if (!has(r, c + 1)) next.set(k(r, c + 1), [r + 1, c + 1]); // east edge → north
    if (!has(r + 1, c)) next.set(k(r + 1, c + 1), [r + 1, c]); // north edge → west
    if (!has(r, c - 1)) next.set(k(r + 1, c), [r, c]); // west edge → south
  }
  const startId = next.keys().next().value as number;
  const start: [number, number] = [Math.floor(startId / (COLS + 1)), startId % (COLS + 1)];
  const ring: LatLng[] = [];
  let cur = start;
  for (let guard = 0; guard <= next.size; guard++) {
    ring.push(cornerLL(cur[0], cur[1]));
    const step = next.get(k(cur[0], cur[1]));
    if (!step) break;
    if (step[0] === start[0] && step[1] === start[1]) break; // closed the ring
    cur = step;
  }
  return ring;
}

export function computeLowLyingZones(
  cells: GridCell[],
  elevations: number[],
  band = LOW_LYING_BAND,
): TopographyZone[] {
  const isLow = (r: number, c: number) => {
    const e = elevations[r * COLS + c];
    return e !== undefined && e > band.min && e <= band.max;
  };

  const seen = new Array(ROWS * COLS).fill(false);
  const zones: TopographyZone[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const start = r * COLS + c;
      if (seen[start] || !isLow(r, c)) continue;

      // BFS flood-fill the connected low-lying component (4-neighbour).
      const comp: number[] = [];
      const queue = [start];
      seen[start] = true;
      while (queue.length) {
        const idx = queue.pop() as number;
        comp.push(idx);
        const cr = Math.floor(idx / COLS);
        const cc = idx % COLS;
        for (const [nr, nc] of [
          [cr - 1, cc],
          [cr + 1, cc],
          [cr, cc - 1],
          [cr, cc + 1],
        ]) {
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          const nk = nr * COLS + nc;
          if (!seen[nk] && isLow(nr, nc)) {
            seen[nk] = true;
            queue.push(nk);
          }
        }
      }

      // Centroid (for naming) + min elevation across the component's cells.
      let sumLat = 0;
      let sumLng = 0;
      let minElev = Infinity;
      for (const idx of comp) {
        sumLat += cells[idx].center.lat;
        sumLng += cells[idx].center.lng;
        minElev = Math.min(minElev, elevations[idx]);
      }
      const centroid = { lat: sumLat / comp.length, lng: sumLng / comp.length };
      const name = nearestDistrict(centroid);
      const minElevM = Math.round(minElev);
      zones.push({
        id: `TOPO-${zones.length}-${name.replace(/\s+/g, "")}`,
        name,
        riskLabel: `Low-lying — min ${minElevM} m, surface-flooding prone`,
        minElevM,
        polygon: componentOutline(comp),
      });
    }
  }

  return zones;
}

// Same export name as the old hand-drawn constant — importers are unchanged.
export const TOPOGRAPHY_ZONES: TopographyZone[] = computeLowLyingZones(
  buildGridCells(),
  GRID_ELEVATION_M,
);
