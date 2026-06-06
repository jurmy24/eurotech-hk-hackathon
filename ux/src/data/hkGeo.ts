import type { LatLng, TopographyZone } from "../types/operations";

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

// Weather sampling grid spanning HK.bounds.
export const WEATHER_GRID = { cols: 6, rows: 5 };

// Low-lying / flood-prone risk zones (illustrative polygons).
export const TOPOGRAPHY_ZONES: TopographyZone[] = [
  {
    id: "TOPO-WCH",
    name: "Wan Chai / Causeway Bay reclamation",
    riskLabel: "Low-lying reclaimed land — surface flooding",
    polygon: [
      { lat: 22.276, lng: 114.17 },
      { lat: 22.2772, lng: 114.188 },
      { lat: 22.284, lng: 114.1885 },
      { lat: 22.2835, lng: 114.1695 },
    ],
  },
  {
    id: "TOPO-WKL",
    name: "West Kowloon waterfront",
    riskLabel: "Coastal low-lying — storm-surge prone",
    polygon: [
      { lat: 22.301, lng: 114.156 },
      { lat: 22.312, lng: 114.1585 },
      { lat: 22.315, lng: 114.166 },
      { lat: 22.303, lng: 114.1665 },
    ],
  },
  {
    id: "TOPO-MK",
    name: "Mong Kok / Prince Edward basin",
    riskLabel: "Dense catchment — drainage overload risk",
    polygon: [
      { lat: 22.316, lng: 114.165 },
      { lat: 22.317, lng: 114.1745 },
      { lat: 22.324, lng: 114.174 },
      { lat: 22.3235, lng: 114.1648 },
    ],
  },
];
