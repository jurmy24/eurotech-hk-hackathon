import maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import type { WeatherCell } from "../types/operations";

const SRC = "weather-cells";
const LYR = "weather-cells-layer";

function toFeatureCollection(cells: WeatherCell[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cells.map((c) => ({
      type: "Feature",
      properties: { id: c.id, intensity: c.precipMaxMm, prob: c.probabilityPct },
      geometry: { type: "Point", coordinates: [c.center.lng, c.center.lat] },
    })),
  };
}

// Semi-transparent rain "blobs" (soft circles) driven by live Open-Meteo data.
// Rendered on the WebGL canvas, so DOM crew/drain markers always sit above them.
export default function WeatherLayer() {
  const map = useMapInstance();
  const cells = useOpsStore((s) => s.weatherCells);
  const visible = useOpsStore((s) => s.layers.weather);
  const select = useOpsStore((s) => s.select);

  useEffect(() => {
    if (!map || map.getSource(SRC)) return;
    map.addSource(SRC, { type: "geojson", data: toFeatureCollection(cells) });
    map.addLayer({
      id: LYR,
      type: "circle",
      source: SRC,
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          10, ["+", 6, ["*", ["get", "intensity"], 6]],
          14, ["+", 26, ["*", ["get", "intensity"], 14]],
          16, ["+", 48, ["*", ["get", "intensity"], 22]],
        ],
        "circle-color": [
          "interpolate", ["linear"], ["get", "intensity"],
          0, "#1f6fb0", 0.5, "#36e2ff", 1.5, "#7a9bff", 3, "#ff3df2",
        ],
        "circle-opacity": [
          "interpolate", ["linear"], ["get", "intensity"],
          0, 0, 0.15, 0.16, 1, 0.26, 3, 0.36,
        ],
        "circle-blur": 0.85,
      },
    } as any);

    map.on("click", LYR, (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (id) select({ type: "weather", id: String(id) });
    });
    map.on("mouseenter", LYR, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", LYR, () => (map.getCanvas().style.cursor = ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    const src = map?.getSource(SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData(toFeatureCollection(cells));
  }, [map, cells]);

  useEffect(() => {
    if (map?.getLayer(LYR)) map.setLayoutProperty(LYR, "visibility", visible ? "visible" : "none");
  }, [map, visible]);

  return null;
}
