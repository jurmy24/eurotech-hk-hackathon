import maplibregl from "maplibre-gl";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import DrainMarker from "./DrainMarker";

export default function DrainLayer() {
  const map = useMapInstance();
  const drains = useOpsStore((s) => s.drains);
  const ids = drains.map((d) => d.id).join(",");
  const containers = useRef<Record<string, HTMLDivElement>>({});
  const markers = useRef<Record<string, maplibregl.Marker>>({});
  const [, force] = useState(0);

  useEffect(() => {
    if (!map) return;
    for (const d of useOpsStore.getState().drains) {
      if (markers.current[d.id]) continue;
      const el = document.createElement("div");
      el.className = "drain-marker-container";
      containers.current[d.id] = el;
      markers.current[d.id] = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([d.location.lng, d.location.lat])
        .addTo(map);
    }
    force((n) => n + 1);
    return () => {
      Object.values(markers.current).forEach((m) => m.remove());
      markers.current = {};
      containers.current = {};
    };
  }, [map, ids]);

  if (!map) return null;
  return (
    <>
      {drains.map((d) =>
        containers.current[d.id]
          ? createPortal(<DrainMarker drainId={d.id} />, containers.current[d.id])
          : null,
      )}
    </>
  );
}
