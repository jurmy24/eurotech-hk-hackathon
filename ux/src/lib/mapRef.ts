import type maplibregl from "maplibre-gl";

// Module-level handle to the live map so floating chrome (zoom/fit/refresh,
// fly-to-entity) can drive it without being mounted inside the map's React context.
let _map: maplibregl.Map | null = null;

export const setMapInstance = (m: maplibregl.Map | null) => {
  _map = m;
};
export const getMapInstance = () => _map;
