import maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";

const SRC = "terrain-dem";
const LAYER = "terrain-hillshade";

// Shaded relief from AWS open Terrain Tiles (Terrarium-encoded PNG DEM, keyless).
// Slotted just beneath the basemap water fill so Victoria Harbour stays clean while
// HK's real terrain — the Peak, the Kowloon ridge — shows through the semi-transparent
// land layers. Paint is tuned for the dark neon base (mapStyle.ts NEON palette).
export default function TerrainLayer() {
  const map = useMapInstance();
  const visible = useOpsStore((s) => s.layers.topography);

  useEffect(() => {
    if (!map || map.getSource(SRC)) return;
    map.addSource(SRC, {
      type: "raster-dem",
      tiles: ["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 15,
      attribution: "Elevation: AWS Terrain Tiles (Mapzen / SRTM, public domain)",
    } as maplibregl.RasterDEMSourceSpecification);

    // Insert beneath the basemap water fill (fallback: first symbol layer) so the
    // opaque harbour draws over the hillshade and the sea doesn't read as hazed.
    const layers = map.getStyle().layers ?? [];
    const beforeId =
      layers.find((l) => (l as { "source-layer"?: string })["source-layer"] === "water")?.id ??
      layers.find((l) => l.type === "symbol")?.id;

    map.addLayer(
      {
        id: LAYER,
        type: "hillshade",
        source: SRC,
        layout: { visibility: visible ? "visible" : "none" },
        paint: {
          "hillshade-exaggeration": 0.45,
          "hillshade-illumination-direction": 315,
          "hillshade-shadow-color": "#00131f",
          "hillshade-highlight-color": "#1f6f96",
          "hillshade-accent-color": "#0a2236",
        },
      },
      beforeId,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (map?.getLayer(LAYER)) {
      map.setLayoutProperty(LAYER, "visibility", visible ? "visible" : "none");
    }
  }, [map, visible]);

  return null;
}
