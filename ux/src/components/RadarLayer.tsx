import type maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import { fetchRadarFrames, radarTileUrl } from "../lib/rainviewer";

const SRC = "radar";
const LYR = "radar-layer";
const COLOR = 4; // RainViewer "Weather Channel" ramp — vivid over the dark map

// Live precipitation-radar overlay (RainViewer). Real "what's falling on HK right
// now" raster tiles. The displayed frame is driven by the store's radarIndex, so
// the WeatherTimeline scrubber controls it and the storm visibly propagates. The
// WebGL raster sits above the basemap but below labels; DOM crew/drain markers and
// the crew-route lines stay on top. Falls back silently (no overlay) if RainViewer
// is unreachable — WeatherLayer's heatmap becomes the offline base.
export default function RadarLayer() {
  const map = useMapInstance();
  const visible = useOpsStore((s) => s.layers.weather);
  const refreshTick = useOpsStore((s) => s.refreshTick);
  const host = useOpsStore((s) => s.radarHost);
  const frames = useOpsStore((s) => s.timelineFrames);
  const index = useOpsStore((s) => s.radarIndex);
  const setRadarData = useOpsStore((s) => s.setRadarData);

  // Fetch frames on mount, every 5 min, and whenever Refresh fires → store.
  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetchRadarFrames();
        if (!cancelled && r.frames.length) setRadarData(r.host, r.frames);
      } catch {
        /* no radar overlay; WeatherLayer's heatmap remains as fallback */
      }
    };
    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [map, refreshTick, setRadarData]);

  // Create the raster source/layer once an observed frame exists, then swap tiles
  // per frame. Radar only shows on OBSERVED frames — there is no future radar, so
  // forecast frames hide the layer (the heatmap carries the forecast instead).
  useEffect(() => {
    if (!map || !host || !frames.length) return;
    const frame = frames[Math.min(index, frames.length - 1)];
    const isObserved = frame?.kind === "observed" && !!frame.radarPath;
    // Path to render/seed with: current observed frame, else the latest observed.
    const path = isObserved
      ? frame.radarPath
      : [...frames].reverse().find((f) => f.kind === "observed" && f.radarPath)?.radarPath;
    if (!path) return;
    const url = radarTileUrl(host, { time: frame?.time ?? 0, path }, { color: COLOR });

    let src = map.getSource(SRC) as maplibregl.RasterTileSource | undefined;
    if (!src) {
      // RainViewer's radar mosaic over HK tops out at z7 (deeper tiles return a
      // "Zoom Level Not Supported" placeholder). Cap the source there; MapLibre
      // overzooms it for the closer harbour view.
      map.addSource(SRC, { type: "raster", tiles: [url], tileSize: 256, maxzoom: 7 });
      const firstSymbol = map.getStyle().layers?.find((l) => l.type === "symbol")?.id;
      map.addLayer(
        {
          id: LYR,
          type: "raster",
          source: SRC,
          paint: {
            // Strong when zoomed out (real structure + weather-map vibe); fades to a
            // faint drifting texture at the overzoomed harbour view, where the warm
            // heatmap glow carries the look instead of a flat blue wash.
            "raster-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.85, 9, 0.62, 11, 0.32, 12.5, 0.16, 14, 0.14],
            "raster-fade-duration": 320, // crossfade between frames → smooth motion
            "raster-saturation": 0.4, // punchier storm colors
            "raster-contrast": 0.12,
            "raster-resampling": "linear",
          },
        } as maplibregl.RasterLayerSpecification,
        firstSymbol,
      );
      src = map.getSource(SRC) as maplibregl.RasterTileSource;
    } else if (isObserved) {
      src.setTiles([url]);
    }
    map.setLayoutProperty(LYR, "visibility", visible && isObserved ? "visible" : "none");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, host, frames, index, visible]);

  return null;
}
