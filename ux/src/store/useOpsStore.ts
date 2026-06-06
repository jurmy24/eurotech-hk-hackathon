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
import type { RadarFrame } from "../lib/rainviewer";
import type { ForecastFrame } from "../lib/openMeteo";

// One slot on the unified weather timeline: past RainViewer radar scans ("observed")
// followed by upcoming Open-Meteo hours ("forecast"). Observed frames carry a radar
// tile path; forecast frames carry per-cell precip intensity for the glow heatmap.
export interface TimelineFrame {
  time: number; // unix seconds
  kind: "observed" | "forecast";
  radarPath?: string;
  intensity?: number[];
}

function lastObservedIndex(frames: TimelineFrame[]): number {
  let idx = 0;
  for (let i = 0; i < frames.length; i++) if (frames[i].kind === "observed") idx = i;
  return idx;
}

function nearestIndexByTime(frames: TimelineFrame[], t: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < frames.length; i++) {
    const d = Math.abs(frames[i].time - t);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function buildTimeline(radarFrames: RadarFrame[], forecastFrames: ForecastFrame[]): TimelineFrame[] {
  const observed: TimelineFrame[] = radarFrames.map((f) => ({
    time: f.time,
    kind: "observed",
    radarPath: f.path,
  }));
  const lastObs = observed.length ? observed[observed.length - 1].time : 0;
  const forecast: TimelineFrame[] = forecastFrames
    .filter((f) => f.time > lastObs)
    .map((f) => ({ time: f.time, kind: "forecast", intensity: f.intensity }));
  return [...observed, ...forecast];
}

// Choose the index into a freshly-rebuilt timeline: keep the user parked at "now"
// (latest observed) if they were there, otherwise preserve their scrubbed time.
function reindex(
  s: { timelineFrames: TimelineFrame[]; radarIndex: number },
  newFrames: TimelineFrame[],
): number {
  if (!newFrames.length) return 0;
  const prev = s.timelineFrames[s.radarIndex];
  if (!prev) return lastObservedIndex(newFrames);
  const wasAtNow =
    prev.kind === "observed" && s.radarIndex === lastObservedIndex(s.timelineFrames);
  return wasAtNow ? lastObservedIndex(newFrames) : nearestIndexByTime(newFrames, prev.time);
}

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

  // unified weather timeline — observed RainViewer radar + Open-Meteo forecast
  radarHost: string;
  radarFrames: RadarFrame[]; // raw observed radar scans
  forecastFrames: ForecastFrame[]; // raw upcoming Open-Meteo hours
  timelineFrames: TimelineFrame[]; // combined observed→forecast, what the UI scrubs
  radarIndex: number; // currently-displayed frame (index into timelineFrames)
  radarPlaying: boolean;

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
  setRadarData: (host: string, frames: RadarFrame[]) => void;
  setForecast: (frames: ForecastFrame[]) => void;
  setRadarIndex: (i: number) => void;
  setRadarPlaying: (playing: boolean) => void;
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

      radarHost: "",
      radarFrames: [],
      forecastFrames: [],
      timelineFrames: [],
      radarIndex: 0,
      radarPlaying: true,

      // `topography` drives both the terrain relief (TerrainLayer) and the
      // low-lying flood zones (TopographyLayer) — one toggle for all terrain.
      layers: { street: true, weather: true, topography: true, manholes: false, rainfall: false },
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
      setRadarData: (radarHost, radarFrames) =>
        set((s) => {
          const timelineFrames = buildTimeline(radarFrames, s.forecastFrames);
          return { radarHost, radarFrames, timelineFrames, radarIndex: reindex(s, timelineFrames) };
        }),
      setForecast: (forecastFrames) =>
        set((s) => {
          const timelineFrames = buildTimeline(s.radarFrames, forecastFrames);
          return { forecastFrames, timelineFrames, radarIndex: reindex(s, timelineFrames) };
        }),
      setRadarIndex: (radarIndex) => set({ radarIndex }),
      setRadarPlaying: (radarPlaying) => set({ radarPlaying }),
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
      // v2: merged the "Terrain relief" toggle into "topography". Bumped so stale
      // persisted layer state (which had relief/topography split) resets to the
      // current defaults instead of suppressing the merged terrain.
      version: 2,
      migrate: () => ({}) as OpsState, // drop old layer toggles → merge backfills defaults
      // Only layer toggles persist to localStorage (brief §7).
      partialize: (s) => ({ layers: s.layers }) as Partial<OpsState>,
      // Deep-merge `layers` so toggles added in newer versions get their default
      // for users with older persisted state (the default shallow merge would drop them).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<OpsState>;
        return { ...current, ...p, layers: { ...current.layers, ...(p.layers ?? {}) } };
      },
    },
  ),
);

if (import.meta.env.DEV) {
  (window as unknown as { __store: typeof useOpsStore }).__store = useOpsStore;
}
