import maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import { TOPOGRAPHY_ZONES } from "../data/hkGeo";
import { ringToGeoJson } from "../lib/polygon";

const SRC = "topo-zones";
const FILL = "topo-fill";
const LINE = "topo-line";

const fc: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: TOPOGRAPHY_ZONES.map((z) => ({
    type: "Feature",
    properties: { id: z.id, name: z.name, risk: z.riskLabel },
    geometry: { type: "Polygon", coordinates: [ringToGeoJson(z.polygon)] },
  })),
};

// Muted flood-risk shading for low-lying zones (off by default, brief §6).
export default function TopographyLayer() {
  const map = useMapInstance();
  const visible = useOpsStore((s) => s.layers.topography);

  useEffect(() => {
    if (!map || map.getSource(SRC)) return;
    map.addSource(SRC, { type: "geojson", data: fc });
    // Insert beneath the road network so it reads as terrain.
    const beforeId = map.getStyle().layers?.find((l) => (l as any)["source-layer"] === "transportation")?.id;
    map.addLayer(
      {
        id: FILL,
        type: "fill",
        source: SRC,
        layout: { visibility: visible ? "visible" : "none" },
        paint: { "fill-color": "#ff9d2e", "fill-opacity": 0.16 },
      } as any,
      beforeId,
    );
    map.addLayer(
      {
        id: LINE,
        type: "line",
        source: SRC,
        layout: { visibility: visible ? "visible" : "none" },
        paint: { "line-color": "#ffb35a", "line-width": 1.4, "line-dasharray": [2, 2], "line-opacity": 0.7 },
      } as any,
      beforeId,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    const v = visible ? "visible" : "none";
    if (map?.getLayer(FILL)) map.setLayoutProperty(FILL, "visibility", v);
    if (map?.getLayer(LINE)) map.setLayoutProperty(LINE, "visibility", v);
  }, [map, visible]);

  return null;
}
