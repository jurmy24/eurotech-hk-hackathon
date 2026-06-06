import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";

// DSD "Drainage Records" manholes (open data, data.gov.hk), pre-filtered to the
// harbour window by scripts/fetch_manholes.mjs and served as a static asset (~78k).
// No clustering: once zoomed in past MIN_ZOOM, every manhole in view is drawn as an
// individual kind-colored dot (MapLibre tiles the GeoJSON internally, so only the
// in-viewport points render). Below MIN_ZOOM nothing shows — a hint nudges to zoom.
const SRC = "manholes";
const DOT = "manholes-dot";
const LABEL = "manholes-label";
const ALL_LAYERS = [DOT, LABEL];
const MIN_ZOOM = 14; // manholes reveal once zoomed in this far

type MHProps = { id: string; kind: string; cl: number | null };
const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

const KIND_LABEL: Record<string, string> = {
  storm: "Storm water",
  storm_terminal: "Storm water terminal",
  sewer: "Sewer",
  sewer_terminal: "Sewer terminal",
  combined: "Combined",
};

export default function ManholeLayer() {
  const map = useMapInstance();
  const visible = useOpsStore((s) => s.layers.manholes);
  const loadedRef = useRef(false);
  const inflightRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [zoomedOut, setZoomedOut] = useState(true);

  // One-time: source + dot + label + interactions (hidden until toggled on).
  useEffect(() => {
    if (!map || map.getSource(SRC)) return;
    map.addSource(SRC, {
      type: "geojson",
      data: EMPTY,
      attribution: "Manholes © Drainage Services Dept / DATA.GOV.HK",
    });

    const firstSymbol = map.getStyle().layers?.find((l) => l.type === "symbol")?.id;

    map.addLayer(
      {
        id: DOT,
        type: "circle",
        source: SRC,
        minzoom: MIN_ZOOM,
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 2.5, 16, 5, 18, 7],
          "circle-color": [
            "match", ["get", "kind"],
            "sewer", "#ffb35a", "sewer_terminal", "#ffb35a",
            "combined", "#b388ff",
            /* storm + storm_terminal */ "#36e2ff",
          ],
          "circle-stroke-color": "#02060c",
          "circle-stroke-width": 1,
          "circle-opacity": 0.95,
          "circle-blur": 0.1,
        },
      } as maplibregl.CircleLayerSpecification,
      firstSymbol,
    );
    map.addLayer({
      id: LABEL,
      type: "symbol",
      source: SRC,
      minzoom: 17,
      layout: {
        visibility: "none",
        "text-field": ["get", "id"],
        "text-size": 10,
        "text-offset": [0, 1.1],
        "text-anchor": "top",
        "text-optional": true,
      },
      paint: { "text-color": "#a9ecff", "text-halo-color": "#02060c", "text-halo-width": 1.2 },
    } as maplibregl.SymbolLayerSpecification);

    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, className: "mh-popup", offset: 10 });
    map.on("click", DOT, (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties as MHProps;
      const cl = p.cl != null && (p.cl as unknown) !== "" ? `${Number(p.cl).toFixed(2)} mPD` : "—";
      popup
        .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
        .setHTML(
          `<div class="mh-pop"><strong>${p.id}</strong>` +
            `<span>${KIND_LABEL[p.kind] ?? p.kind} manhole</span>` +
            `<span>Cover level: ${cl}</span></div>`,
        )
        .addTo(map);
    });
    map.on("mouseenter", DOT, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", DOT, () => (map.getCanvas().style.cursor = ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Track zoom so the "zoom in" hint reflects whether dots are currently revealed.
  useEffect(() => {
    if (!map) return;
    const onZoom = () => setZoomedOut(map.getZoom() < MIN_ZOOM);
    onZoom();
    map.on("moveend", onZoom);
    return () => {
      map.off("moveend", onZoom);
    };
  }, [map]);

  // Lazy-load the dataset the first time the layer is switched on.
  useEffect(() => {
    if (!map || !visible || loadedRef.current || inflightRef.current) return;
    let cancelled = false;
    inflightRef.current = true;
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}data/manholes.json`)
      .then((r) => r.json())
      .then((fc: GeoJSON.FeatureCollection) => {
        inflightRef.current = false;
        setLoading(false);
        if (cancelled) return;
        loadedRef.current = true;
        (map.getSource(SRC) as maplibregl.GeoJSONSource | undefined)?.setData(fc);
      })
      .catch(() => {
        inflightRef.current = false;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [map, visible]);

  // Show/hide the manhole layers with the toggle.
  useEffect(() => {
    if (!map) return;
    const v = visible ? "visible" : "none";
    for (const id of ALL_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", v);
  }, [map, visible]);

  if (!visible) return null;
  if (loading) return <div className="manhole-hint glass">Loading manholes…</div>;
  if (zoomedOut) return <div className="manhole-hint glass">Zoom in to reveal manholes</div>;
  return null;
}
