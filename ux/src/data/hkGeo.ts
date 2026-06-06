import type { LatLng } from "../types/operations";

// Hong Kong harbour area: HK Island north shore + Kowloon.
export const HK = {
  center: { lat: 22.3005, lng: 114.1722 } as LatLng,
  bounds: { west: 114.118, south: 22.262, east: 114.232, north: 22.342 },
  defaultZoom: 12.6,
};

// MapLibre LngLatBounds tuple: [[west, south], [east, north]]
export const HK_BOUNDS_LL: [[number, number], [number, number]] = [
  [HK.bounds.west, HK.bounds.south],
  [HK.bounds.east, HK.bounds.north],
];

export interface District {
  name: string;
  loc: LatLng;
}

export const DISTRICTS: District[] = [
  { name: "Central", loc: { lat: 22.282, lng: 114.1588 } },
  { name: "Admiralty", loc: { lat: 22.279, lng: 114.1647 } },
  { name: "Wan Chai", loc: { lat: 22.2796, lng: 114.173 } },
  { name: "Causeway Bay", loc: { lat: 22.28, lng: 114.185 } },
  { name: "North Point", loc: { lat: 22.2912, lng: 114.1928 } },
  { name: "Tsim Sha Tsui", loc: { lat: 22.2975, lng: 114.1722 } },
  { name: "Jordan", loc: { lat: 22.305, lng: 114.17 } },
  { name: "Yau Ma Tei", loc: { lat: 22.313, lng: 114.1705 } },
  { name: "Mong Kok", loc: { lat: 22.3193, lng: 114.1694 } },
  { name: "Sham Shui Po", loc: { lat: 22.3303, lng: 114.1622 } },
  { name: "Hung Hom", loc: { lat: 22.303, lng: 114.183 } },
];

// Weather sampling grid spanning HK.bounds. Kept dense (~0.8 km spacing) so the
// heatmap render fuses into a smooth field instead of a visible point lattice.
export const WEATHER_GRID = { cols: 14, rows: 11 };

// Terrain elevation (m) sampled on the WEATHER_GRID centres, row-major (same order
// as buildGridCells in lib/openMeteo). Source: SRTM 30 m via OpenTopoData — baked by
// scripts/fetch_grid_elevation.mjs (the grid is fixed, so elevation never changes).
// Used by lib/topography to derive low-lying flood zones from real terrain.
export const GRID_ELEVATION_M: number[] = [
  0, 18, 166, 320, 413, 291, 289, 196, 80, 280, 248, 305, 515, 283,
  94, 126, 395, 434, 236, 175, 163, 16, 74, 188, 332, 223, 266, 186,
  67, 57, 162, 227, 115, 52, 29, 46, 37, 129, 241, 67, 96, 27,
  0, 0, 54, 31, 9, 0, 0, 0, 0, 100, 132, 76, 46, 0,
  0, 0, 0, 0, 0, 0, 38, 0, 0, 0, -3, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 23, 10, 3, 0, 0, 0, 0, 7,
  0, 0, 0, 0, 0, 26, 29, 18, 41, 0, 0, 4, 9, 10,
  0, 0, 0, 0, 0, 17, 62, 33, 47, 0, 1, 7, 21, 42,
  11, 4, 26, 0, 3, 12, 27, 23, 28, 15, 12, 14, 24, 84,
  0, 4, 5, 2, 12, 23, 16, 16, 22, 6, 12, 23, 155, 150,
  0, 5, 19, 16, 9, 20, 58, 21, 44, 31, 15, 125, 250, 296,
];

// Low-lying band (metres) used to classify flood-prone grid cells.
// `min` is exclusive — it drops sea / flat reclamation that SRTM can't separate
// from open water (≈0 m), so alerts never fire over the harbour. `max` is the
// low-lying threshold (inclusive). Tuned against GRID_ELEVATION_M above.
export const LOW_LYING_BAND = { min: 0, max: 12 };
