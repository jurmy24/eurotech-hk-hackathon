import { useEffect } from "react";
import { useOpsStore } from "../store/useOpsStore";
import { fetchWeatherCells, fallbackWeatherCells, computeDrainRain } from "../lib/openMeteo";
import { deriveAlerts } from "../lib/alerts";
import { TOPOGRAPHY_ZONES } from "../lib/topography";

// Fetches live HK precipitation from Open-Meteo, refreshes every 5 min (and on
// the manual Refresh button), then recomputes drain highlights + alerts.
// Falls back to a cached synthetic field if the network is unavailable.
export function useWeather() {
  const refreshTick = useOpsStore((s) => s.refreshTick);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let snapshot;
      let error = false;
      try {
        snapshot = await fetchWeatherCells();
      } catch {
        snapshot = fallbackWeatherCells();
        error = true;
      }
      if (cancelled) return;
      const { cells, forecast } = snapshot;

      const st = useOpsStore.getState();
      st.setWeather(cells, Date.now(), error);
      st.setForecast(forecast);
      st.setDrainRain(computeDrainRain(st.drains, cells));

      const next = useOpsStore.getState();
      st.setAlerts(deriveAlerts(next.crews, next.drains, cells, TOPOGRAPHY_ZONES, next.live));
    };

    run();
    const iv = setInterval(run, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [refreshTick]);
}
