import maplibregl from "maplibre-gl";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import { useCrewAnimation } from "../hooks/useCrewAnimation";
import CrewMarker from "./CrewMarker";

export default function CrewLayer() {
  const map = useMapInstance();
  const crews = useOpsStore((s) => s.crews);
  const crewIds = crews.map((c) => c.id).join(",");
  const containers = useRef<Record<string, HTMLDivElement>>({});
  const markers = useRef<Record<string, maplibregl.Marker>>({});
  const [, force] = useState(0);

  // Create one MapLibre marker per crew; only re-runs when the roster changes.
  useEffect(() => {
    if (!map) return;
    for (const c of useOpsStore.getState().crews) {
      if (markers.current[c.id]) continue;
      const el = document.createElement("div");
      el.className = "crew-marker-container";
      containers.current[c.id] = el;
      markers.current[c.id] = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([c.location.lng, c.location.lat])
        .addTo(map);
    }
    force((n) => n + 1);
    return () => {
      Object.values(markers.current).forEach((m) => m.remove());
      markers.current = {};
      containers.current = {};
    };
  }, [map, crewIds]);

  useCrewAnimation(markers);

  if (!map) return null;
  return (
    <>
      {crews.map((c) =>
        containers.current[c.id]
          ? createPortal(<CrewMarker crewId={c.id} />, containers.current[c.id])
          : null,
      )}
    </>
  );
}
