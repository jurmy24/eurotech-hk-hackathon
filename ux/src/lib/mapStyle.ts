import type maplibregl from "maplibre-gl";
import { HK } from "../data/hkGeo";

// Neon cyberpunk palette applied over the CARTO Dark Matter base (OpenMapTiles schema).
export const NEON = {
  bg: "#070b14",
  water: "#05101f",
  buildingFill: "#0c2032",
  buildingOutline: "#27b6df",
  road: "#163a59", // dim blue
  roadMajor: "#2f8fd0",
  roadCase: "#0a1a2b",
  boundary: "#22354c",
  park: "#0c2418",
  label: "#8fc4e0",
  labelMajor: "#a9ecff",
  gridMagenta: "#ff3df2",
};

const GRID_SRC = "neon-grid";
const GRID_LAYER = "neon-grid-line";
const BUILDING_GLOW = "neon-building-glow";

// Captured at restyle time so the Street layer toggle can hide/show the whole base.
let baseLayerIds: string[] = [];

function firstSymbolId(map: maplibregl.Map): string | undefined {
  const layers = map.getStyle().layers ?? [];
  return layers.find((l) => l.type === "symbol")?.id;
}

export function applyNeonStyle(map: maplibregl.Map) {
  const layers = map.getStyle().layers ?? [];
  baseLayerIds = layers.map((l) => l.id);

  for (const layer of layers) {
    const id = layer.id.toLowerCase();
    const sl = ((layer as any)["source-layer"] ?? "").toLowerCase();
    try {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", NEON.bg);
      } else if (sl === "water") {
        map.setPaintProperty(layer.id, "fill-color", NEON.water);
      } else if (sl === "building") {
        map.setPaintProperty(layer.id, "fill-color", NEON.buildingFill);
        map.setPaintProperty(layer.id, "fill-opacity", 0.55);
      } else if (sl === "transportation") {
        if (id.includes("case")) {
          map.setPaintProperty(layer.id, "line-color", NEON.roadCase);
        } else {
          const major = /mot|trunk|pri/.test(id);
          map.setPaintProperty(layer.id, "line-color", major ? NEON.roadMajor : NEON.road);
        }
      } else if (sl === "boundary") {
        map.setPaintProperty(layer.id, "line-color", NEON.boundary);
      } else if (sl === "park") {
        map.setPaintProperty(layer.id, "fill-color", NEON.park);
        map.setPaintProperty(layer.id, "fill-opacity", 0.35);
      } else if (sl === "landcover" || sl === "landuse") {
        map.setPaintProperty(layer.id, "fill-opacity", 0.18);
      } else if (sl === "poi" || sl === "housenumber") {
        // De-clutter: keep the layer but make it invisible without using `visibility`
        // (so the Street toggle's visibility flips don't bring it back).
        if (layer.type === "symbol") {
          map.setPaintProperty(layer.id, "text-opacity", 0);
          try { map.setPaintProperty(layer.id, "icon-opacity", 0); } catch {}
        }
      } else if (layer.type === "symbol") {
        const major = sl === "place";
        map.setPaintProperty(layer.id, "text-color", major ? NEON.labelMajor : NEON.label);
        try { map.setPaintProperty(layer.id, "text-halo-color", "#02060c"); } catch {}
        try { map.setPaintProperty(layer.id, "text-halo-width", 1.2); } catch {}
      }
    } catch {
      /* layer doesn't support this paint prop; ignore */
    }
  }

  addBuildingGlow(map);
  addNeonGrid(map);
}

function addBuildingGlow(map: maplibregl.Map) {
  if (map.getLayer(BUILDING_GLOW)) return;
  const layers = map.getStyle().layers ?? [];
  const building = layers.find((l) => (l as any)["source-layer"] === "building" && l.type === "fill");
  if (!building) return;
  map.addLayer(
    {
      id: BUILDING_GLOW,
      type: "line",
      source: (building as any).source,
      "source-layer": "building",
      minzoom: 12,
      paint: {
        "line-color": NEON.buildingOutline,
        "line-width": 1.0,
        "line-blur": 1.4,
        "line-opacity": 0.6,
      },
    } as any,
    firstSymbolId(map),
  );
  baseLayerIds.push(BUILDING_GLOW);
}

function buildGrid(): GeoJSON.FeatureCollection {
  const { west, south, east, north } = HK.bounds;
  const step = 0.006;
  const features: GeoJSON.Feature[] = [];
  for (let lng = Math.ceil(west / step) * step; lng <= east; lng += step) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[lng, south], [lng, north]] },
    });
  }
  for (let lat = Math.ceil(south / step) * step; lat <= north; lat += step) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[west, lat], [east, lat]] },
    });
  }
  return { type: "FeatureCollection", features };
}

export function addNeonGrid(map: maplibregl.Map) {
  if (map.getSource(GRID_SRC)) return;
  map.addSource(GRID_SRC, { type: "geojson", data: buildGrid() });
  map.addLayer(
    {
      id: GRID_LAYER,
      type: "line",
      source: GRID_SRC,
      paint: {
        "line-color": NEON.gridMagenta,
        "line-width": 0.75,
        "line-opacity": 0.3,
        "line-blur": 0.5,
      },
    } as any,
    firstSymbolId(map),
  );
  baseLayerIds.push(GRID_LAYER);
}

// Street Map layer toggle: hide/show the entire base map + neon decoration.
export function setBaseVisibility(map: maplibregl.Map, visible: boolean) {
  const v = visible ? "visible" : "none";
  for (const id of baseLayerIds) {
    if (map.getLayer(id)) {
      try {
        map.setLayoutProperty(id, "visibility", v);
      } catch {
        /* ignore */
      }
    }
  }
}
