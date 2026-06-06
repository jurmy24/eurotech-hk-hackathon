import type { LatLng } from "../types/operations";

// Ray-casting point-in-polygon test (ring auto-closed).
export function pointInPolygon(p: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng;
    const yi = ring[i].lat;
    const xj = ring[j].lng;
    const yj = ring[j].lat;
    const intersect =
      yi > p.lat !== yj > p.lat &&
      p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// GeoJSON polygon ring [ [lng,lat], ... ] (closed) from a LatLng ring.
export function ringToGeoJson(ring: LatLng[]): number[][] {
  const coords = ring.map((p) => [p.lng, p.lat]);
  if (coords.length) coords.push(coords[0]);
  return coords;
}
