import maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import type { WeatherCell } from "../types/operations";

// Toggled heatmap of EXPECTED RAINFALL (mm) over the next 24 h. Uses the same
// Open-Meteo grid as the rain cells (no extra fetch), but weighted by the
// accumulated forecast total rather than instantaneous intensity.
const SRC = "rainfall-forecast";
const LYR = "rainfall-forecast-heat";

function toFeatureCollection(cells: WeatherCell[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cells.map((c) => ({
      type: "Feature",
      properties: { mm: c.precipTotalMm },
      geometry: { type: "Point", coordinates: [c.center.lng, c.center.lat] },
    })),
  };
}

export default function RainfallHeatmapLayer() {
  const map = useMapInstance();
  const cells = useOpsStore((s) => s.weatherCells);
  const visible = useOpsStore((s) => s.layers.rainfall);

  useEffect(() => {
    if (!map || map.getSource(SRC)) return;
    map.addSource(SRC, { type: "geojson", data: toFeatureCollection(cells) });
    // Insert beneath symbol labels so place names stay legible over the field.
    const firstSymbol = map.getStyle().layers?.find((l) => l.type === "symbol")?.id;
    map.addLayer(
      {
        id: LYR,
        type: "heatmap",
        source: SRC,
        layout: { visibility: visible ? "visible" : "none" },
        paint: {
          // Weight each grid point by its expected mm (cap ~100 mm/24 h → full
          // weight), so a heavy city-wide forecast still has spatial dynamic range.
          "heatmap-weight": [
            "interpolate", ["linear"], ["get", "mm"],
            0, 0, 5, 0.2, 25, 0.5, 60, 0.8, 100, 1,
          ],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 11, 0.62, 16, 1.05],
          // Density → color ramp (legend mirrors this): blue → green → yellow → orange → red.
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(8,16,31,0)",
            0.1, "rgba(54,226,255,0.35)",
            0.3, "rgba(34,224,122,0.55)",
            0.5, "rgba(244,212,35,0.7)",
            0.7, "rgba(255,157,46,0.82)",
            1, "rgba(255,45,79,0.92)",
          ],
          // Radius ≈ 3× the grid's pixel spacing (and doubles per zoom, base-2, to
          // track it) so the 14×11 grid blends into a continuous field, never dots.
          "heatmap-radius": ["interpolate", ["exponential", 2], ["zoom"], 11, 28, 16, 896],
          // Fade out as you zoom past neighbourhood level so street detail stays readable.
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 15, 0.68, 17.5, 0.32],
        },
      } as maplibregl.HeatmapLayerSpecification,
      firstSymbol,
    );
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
