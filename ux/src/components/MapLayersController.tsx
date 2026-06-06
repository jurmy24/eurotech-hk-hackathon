import { useEffect } from "react";
import { useMapInstance } from "./OperationsMap";
import { useOpsStore } from "../store/useOpsStore";
import { setBaseVisibility } from "../lib/mapStyle";

// Applies store-driven layer toggles to the live map.
// (Weather & topography layer visibility are handled by their own layer components.)
export default function MapLayersController() {
  const map = useMapInstance();
  const street = useOpsStore((s) => s.layers.street);

  useEffect(() => {
    if (map) setBaseVisibility(map, street);
  }, [map, street]);

  return null;
}
