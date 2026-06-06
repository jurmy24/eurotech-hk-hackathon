import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  RobotCrew,
  Drain,
  Dispatch,
  OpsAlert,
  WeatherCell,
  LivePosition,
  LayerState,
  LayerKey,
  Selection,
  CrewStatus,
} from "../types/operations";

interface OpsState {
  // data
  crews: RobotCrew[];
  drains: Drain[];
  dispatches: Dispatch[];
  alerts: OpsAlert[];
  live: Record<string, LivePosition>;
  weatherCells: WeatherCell[];
  weatherUpdatedAt: number | null;
  weatherError: boolean;
  baseRain: Record<string, boolean>; // seed near-rain flags, OR'd with live weather

  // ui
  layers: LayerState; // persisted
  selection: Selection;
  crewFilter: CrewStatus | "all";
  search: string;
  refreshTick: number;
  flash: string | null;

  // actions
  hydrate: (d: {
    crews: RobotCrew[];
    drains: Drain[];
    dispatches: Dispatch[];
    alerts: OpsAlert[];
  }) => void;
  toggleLayer: (k: LayerKey) => void;
  setLayer: (k: LayerKey, v: boolean) => void;
  select: (s: Selection) => void;
  clearSelection: () => void;
  setCrewFilter: (f: CrewStatus | "all") => void;
  setSearch: (s: string) => void;
  setLive: (live: Record<string, LivePosition>) => void;
  setWeather: (cells: WeatherCell[], at: number, error?: boolean) => void;
  setDrainRain: (rainByDrain: Record<string, boolean>) => void;
  createDispatch: (d: Dispatch) => void;
  updateDispatch: (id: string, patch: Partial<Dispatch>) => void;
  setAlerts: (alerts: OpsAlert[]) => void;
  bumpRefresh: () => void;
  setFlash: (msg: string | null) => void;
}

export const useOpsStore = create<OpsState>()(
  persist(
    (set) => ({
      crews: [],
      drains: [],
      dispatches: [],
      alerts: [],
      live: {},
      weatherCells: [],
      weatherUpdatedAt: null,
      weatherError: false,
      baseRain: {},

      layers: { street: true, weather: true, topography: false },
      selection: null,
      crewFilter: "all",
      search: "",
      refreshTick: 0,
      flash: null,

      hydrate: (d) =>
        set({
          crews: d.crews,
          drains: d.drains,
          dispatches: d.dispatches,
          alerts: d.alerts,
          baseRain: Object.fromEntries(d.drains.map((dr) => [dr.id, dr.nearRainForecast])),
        }),
      toggleLayer: (k) =>
        set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
      setLayer: (k, v) => set((s) => ({ layers: { ...s.layers, [k]: v } })),
      select: (sel) => set({ selection: sel }),
      clearSelection: () => set({ selection: null }),
      setCrewFilter: (f) => set({ crewFilter: f }),
      setSearch: (search) => set({ search }),
      setLive: (live) => set({ live }),
      setWeather: (weatherCells, weatherUpdatedAt, weatherError = false) =>
        set({ weatherCells, weatherUpdatedAt, weatherError }),
      setDrainRain: (rainByDrain) =>
        set((s) => ({
          drains: s.drains.map((dr) => ({
            ...dr,
            nearRainForecast: !!(s.baseRain[dr.id] || rainByDrain[dr.id]),
          })),
        })),
      createDispatch: (d) =>
        set((s) => ({
          dispatches: [d, ...s.dispatches],
          crews: s.crews.map((c) =>
            c.id === d.crewId
              ? { ...c, status: "active", activeDispatchId: d.id, etaMinutes: d.etaMinutes }
              : c,
          ),
        })),
      updateDispatch: (id, patch) =>
        set((s) => {
          const dispatches = s.dispatches.map((d) =>
            d.id === id ? { ...d, ...patch } : d,
          );
          // If a dispatch is cancelled/completed, free its crew.
          let crews = s.crews;
          if (patch.status === "cancelled" || patch.status === "complete") {
            const target = s.dispatches.find((d) => d.id === id);
            if (target) {
              crews = s.crews.map((c) =>
                c.id === target.crewId
                  ? { ...c, status: "available", activeDispatchId: undefined, etaMinutes: undefined }
                  : c,
              );
            }
          }
          return { dispatches, crews };
        }),
      setAlerts: (alerts) => set({ alerts }),
      bumpRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
      setFlash: (flash) => set({ flash }),
    }),
    {
      name: "ops-ux",
      // Only layer toggles persist to localStorage (brief §7).
      partialize: (s) => ({ layers: s.layers }) as Partial<OpsState>,
    },
  ),
);

if (import.meta.env.DEV) {
  (window as unknown as { __store: typeof useOpsStore }).__store = useOpsStore;
}
