import { useEffect } from "react";
import OperationsMap from "./components/OperationsMap";
import MapLayersController from "./components/MapLayersController";
import CrewLayer from "./components/CrewLayer";
import WeatherLayer from "./components/WeatherLayer";
import RadarLayer from "./components/RadarLayer";
import TerrainLayer from "./components/TerrainLayer";
import TopographyLayer from "./components/TopographyLayer";
import ManholeLayer from "./components/ManholeLayer";
import RainfallHeatmapLayer from "./components/RainfallHeatmapLayer";
import { useWeather } from "./hooks/useWeather";
import Sidebar from "./components/Sidebar";
import MapControls from "./components/MapControls";
import Legend from "./components/Legend";
import WeatherTimeline from "./components/WeatherTimeline";
import Toast from "./components/Toast";
import RouteLayer from "./components/RouteLayer";
import CrewDetailModal from "./components/CrewDetailModal";
import DrainDetailModal from "./components/DrainDetailModal";
import WeatherCellModal from "./components/WeatherCellModal";
import DispatchDetailModal from "./components/DispatchDetailModal";
import DispatchPlanningPanel from "./components/DispatchPlanningPanel";
import AlertsPanel from "./components/AlertsPanel";
import SystemHealthPanel from "./components/SystemHealthPanel";
import { useOpsStore } from "./store/useOpsStore";
import { CREWS, DRAINS, DISPATCHES } from "./data/mockOperations";
import { TOPOGRAPHY_ZONES } from "./lib/topography";
import { deriveAlerts } from "./lib/alerts";

export default function App() {
  const hydrate = useOpsStore((s) => s.hydrate);
  const setAlerts = useOpsStore((s) => s.setAlerts);

  useEffect(() => {
    hydrate({ crews: CREWS, drains: DRAINS, dispatches: DISPATCHES, alerts: [] });
    setAlerts(deriveAlerts(CREWS, DRAINS, [], TOPOGRAPHY_ZONES));
  }, [hydrate, setAlerts]);

  // Live weather feed (Open-Meteo) → rain cells, drain highlights, alerts.
  useWeather();

  return (
    <div className="app-shell">
      <OperationsMap>
        <MapLayersController />
        <TerrainLayer />
        <TopographyLayer />
        <ManholeLayer />
        <WeatherLayer />
        <RainfallHeatmapLayer />
        <RadarLayer />
        <RouteLayer />
        <CrewLayer />
      </OperationsMap>
      <Sidebar />
      <MapControls />
      <Legend />
      <WeatherTimeline />
      <Toast />
      <ModalRoot />
    </div>
  );
}

function ModalRoot() {
  const selection = useOpsStore((s) => s.selection);
  const clear = useOpsStore((s) => s.clearSelection);
  if (!selection) return null;
  switch (selection.type) {
    case "crew":
      return <CrewDetailModal crewId={selection.id} onClose={clear} />;
    case "drain":
      return <DrainDetailModal drainId={selection.id} onClose={clear} />;
    case "weather":
      return <WeatherCellModal cellId={selection.id} onClose={clear} />;
    case "dispatch":
      return <DispatchDetailModal dispatchId={selection.id} onClose={clear} />;
    case "dispatch-planning":
      return <DispatchPlanningPanel drainId={selection.drainId} onClose={clear} />;
    case "alerts":
      return <AlertsPanel onClose={clear} />;
    case "system":
      return <SystemHealthPanel onClose={clear} />;
    default:
      return null;
  }
}
