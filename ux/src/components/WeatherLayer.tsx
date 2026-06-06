import maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import type { TimelineFrame } from "../store/useOpsStore";
import type { WeatherCell } from "../types/operations";

const SRC = "weather-cells";
const HEAT = "weather-heat-layer"; // ambient field (also the offline fallback)
const HIT = "weather-hit-layer"; // invisible click targets for cell inspection

// Observed: glow only up close (radar carries the regional view). Forecast: no radar
// exists for the future, so the glow must read at every zoom.
const OPACITY_OBSERVED = ["interpolate", ["linear"], ["zoom"], 9.5, 0, 11, 0.45, 12.5, 0.62, 16, 0.66];
const OPACITY_FORECAST = ["interpolate", ["linear"], ["zoom"], 7, 0.55, 10, 0.58, 13, 0.62, 16, 0.66];

// Build the heatmap source. On a forecast frame, each cell's intensity comes from
// that hour's per-cell precip; otherwise from the live "now" peak (precipMaxMm).
function featuresFor(cells: WeatherCell[], frame?: TimelineFrame): GeoJSON.FeatureCollection {
  const fc =
    frame?.kind === "forecast" && frame.intensity && frame.intensity.length === cells.length
      ? frame.intensity
      : null;
  return {
    type: "FeatureCollection",
    features: cells.map((c, i) => ({
      type: "Feature",
      properties: { id: c.id, intensity: fc ? fc[i] : c.precipMaxMm, prob: c.probabilityPct },
      geometry: { type: "Point", coordinates: [c.center.lng, c.center.lat] },
    })),
  };
}

// Open-Meteo precipitation field rendered as a soft heatmap (violet→orange→yellow).
// It carries the close-in harbour view as a warm storm-glow; when the timeline is
// scrubbed into the FORECAST segment it shows that hour's expected rain at every
// zoom (the radar has no future frames). A transparent circle layer over the same
// points keeps click-to-inspect (WeatherCellModal) working.
export default function WeatherLayer() {
  const map = useMapInstance();
  const cells = useOpsStore((s) => s.weatherCells);
  const visible = useOpsStore((s) => s.layers.weather);
  const frames = useOpsStore((s) => s.timelineFrames);
  const index = useOpsStore((s) => s.radarIndex);
  const select = useOpsStore((s) => s.select);

  const frame = frames[Math.min(index, Math.max(0, frames.length - 1))];
  const isForecast = frame?.kind === "forecast";

  useEffect(() => {
    if (!map || map.getSource(SRC)) return;
    map.addSource(SRC, { type: "geojson", data: featuresFor(cells) });

    const firstSymbol = map.getStyle().layers?.find((l) => l.type === "symbol")?.id;

    map.addLayer(
      {
        id: HEAT,
        type: "heatmap",
        source: SRC,
        paint: {
          // Low per-point weight (the dense ~0.8 km grid means many kernels overlap)
          // + radius a few× the point spacing → one smooth, continuous storm-glow
          // with no visible sample lattice.
          "heatmap-weight": ["interpolate", ["linear"], ["get", "intensity"], 0, 0, 0.4, 0.12, 3, 0.42],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1.1, 13, 1.5, 16, 1.8],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 55, 13, 130, 16, 230],
          "heatmap-opacity": OPACITY_OBSERVED as unknown as number,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(8,12,40,0)",
            0.15, "rgba(72,28,150,0.45)", // deep violet
            0.35, "rgba(150,40,200,0.6)", // magenta
            0.55, "rgba(236,64,122,0.78)", // hot pink
            0.75, "rgba(255,138,40,0.9)", // orange
            1, "rgba(255,232,128,1)", // yellow-white core
          ],
        },
      } as maplibregl.HeatmapLayerSpecification,
      firstSymbol,
    );

    map.addLayer(
      {
        id: HIT,
        type: "circle",
        source: SRC,
        // Invisible hit targets — opacity 0 stays clickable (only visibility:none
        // removes a layer from queries), so the radar/heatmap stay uncluttered.
        paint: { "circle-radius": 28, "circle-opacity": 0, "circle-color": "#000" },
      } as maplibregl.CircleLayerSpecification,
      firstSymbol,
    );

    map.on("click", HIT, (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (id) select({ type: "weather", id: String(id) });
    });
    map.on("mouseenter", HIT, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", HIT, () => (map.getCanvas().style.cursor = ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Re-feed the heatmap whenever the cells refresh or the scrubbed frame changes.
  useEffect(() => {
    const src = map?.getSource(SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData(featuresFor(cells, frame));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, cells, frames, index]);

  // Visibility + zoom-opacity curve (forecast frames must read at every zoom).
  useEffect(() => {
    const v = visible ? "visible" : "none";
    if (map?.getLayer(HEAT)) {
      map.setLayoutProperty(HEAT, "visibility", v);
      map.setPaintProperty(HEAT, "heatmap-opacity", (isForecast ? OPACITY_FORECAST : OPACITY_OBSERVED) as unknown as number);
    }
    if (map?.getLayer(HIT)) map.setLayoutProperty(HIT, "visibility", v);
  }, [map, visible, isForecast]);

  return null;
}
