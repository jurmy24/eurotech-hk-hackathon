import maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import { crewPathLngLat } from "../data/crewPaths";

const SRC = "crew-route";
const GLOW = "crew-route-glow";
const CORE = "crew-route-core";

const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const line = (coords: [number, number][]): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: coords.length
    ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }]
    : [],
});

// Highlights the selected crew's route on the map behind the detail modal.
export default function RouteLayer() {
  const map = useMapInstance();
  const selection = useOpsStore((s) => s.selection);
  const crewId = selection?.type === "crew" ? selection.id : null;
  // A crew that's parked & cleaning has no meaningful patrol route to draw.
  const working = useOpsStore((s) => {
    if (!crewId) return false;
    const c = s.crews.find((x) => x.id === crewId);
    if (!c?.activeDispatchId) return false;
    return s.dispatches.find((d) => d.id === c.activeDispatchId)?.status === "working";
  });

  useEffect(() => {
    if (!map || map.getSource(SRC)) return;
    map.addSource(SRC, { type: "geojson", data: empty });
    map.addLayer({
      id: GLOW,
      type: "line",
      source: SRC,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#36e2ff", "line-width": 8, "line-blur": 6, "line-opacity": 0.4 },
    } as any);
    map.addLayer({
      id: CORE,
      type: "line",
      source: SRC,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#a9ecff", "line-width": 2, "line-opacity": 0.9, "line-dasharray": [2, 2] },
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    const src = map?.getSource(SRC) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(crewId && !working ? line(crewPathLngLat(crewId)) : empty);
  }, [map, crewId, working]);

  return null;
}
