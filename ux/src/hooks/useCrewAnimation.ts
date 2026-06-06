import { useEffect, useRef, type MutableRefObject } from "react";
import type maplibregl from "maplibre-gl";
import { CREW_WAYPOINTS } from "../data/crewPaths";
import { useOpsStore } from "../store/useOpsStore";
import { haversineKm, bearingDeg } from "../lib/geo";
import type { LivePosition, Waypoint } from "../types/operations";

const LOOP_SEC = 180; // ~3-minute loop (brief §10)
const STORE_THROTTLE_MS = 140; // telemetry/label refresh; positions move every frame
const waypoints = CREW_WAYPOINTS;

function sample(wps: Waypoint[], t: number) {
  let i = 0;
  for (; i < wps.length - 1; i++) {
    if (t < wps[i + 1].t) break;
  }
  const a = wps[i];
  const b = wps[Math.min(i + 1, wps.length - 1)];
  const span = b.t - a.t || 1;
  const f = Math.min(1, Math.max(0, (t - a.t) / span));
  return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f, a, b };
}

// Drives smooth crew motion: markers move every animation frame (imperative,
// jank-free), while store telemetry updates on a throttle. Loops seamlessly at 180s.
export function useCrewAnimation(
  markersRef: MutableRefObject<Record<string, maplibregl.Marker>>,
) {
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const setLive = useOpsStore.getState().setLive;
    const startMs = performance.now();
    const headings: Record<string, number> = {};
    let lastStore = 0;

    const tick = (now: number) => {
      const t = ((now - startMs) / 1000) % LOOP_SEC;
      const live: Record<string, LivePosition> = {};
      for (const id in waypoints) {
        const wps = waypoints[id];
        const { lat, lng, a, b } = sample(wps, t);
        const segKm = haversineKm(a, b);
        let heading = headings[id] ?? 0;
        if (segKm > 0.0005) {
          heading = bearingDeg(a, b);
          headings[id] = heading;
        }
        const spanH = (b.t - a.t || 1) / 3600;
        const speed = Math.round((segKm / spanH) * 10) / 10;
        live[id] = {
          lat,
          lng,
          headingDeg: heading,
          alertLevel: a.alert,
          speedKph: speed,
          lastUpdate: Date.now(),
        };
        markersRef.current[id]?.setLngLat([lng, lat]);
      }
      if (now - lastStore > STORE_THROTTLE_MS) {
        setLive(live);
        lastStore = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [markersRef]);
}
