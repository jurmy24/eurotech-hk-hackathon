import { useCallback, useEffect, useRef } from "react";
import { Play, Pause, Radar } from "lucide-react";
import { useOpsStore } from "../store/useOpsStore";

const STEP_MS = 850; // playback cadence between frames

function hkTime(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Hong_Kong",
  });
}

// Playback / scrubber for the unified weather timeline: observed RainViewer radar
// (last ~2 h) flowing into the Open-Meteo hourly forecast (~next 12 h), split by a
// NOW marker. Drives store.radarIndex — dragging scrubs the storm + forecast, Play
// animates through both. Hidden when the Weather layer is off.
export default function WeatherTimeline() {
  const weatherOn = useOpsStore((s) => s.layers.weather);
  const frames = useOpsStore((s) => s.timelineFrames);
  const index = useOpsStore((s) => s.radarIndex);
  const playing = useOpsStore((s) => s.radarPlaying);
  const setIndex = useOpsStore((s) => s.setRadarIndex);
  const setPlaying = useOpsStore((s) => s.setRadarPlaying);
  const trackRef = useRef<HTMLDivElement>(null);

  // Playback clock — read fresh state each tick so it survives frame refreshes.
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const iv = setInterval(() => {
      const st = useOpsStore.getState();
      st.setRadarIndex((st.radarIndex + 1) % st.timelineFrames.length);
    }, STEP_MS);
    return () => clearInterval(iv);
  }, [playing, frames.length]);

  const seek = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || frames.length < 2) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      setIndex(Math.round(ratio * (frames.length - 1)));
    },
    [frames.length, setIndex],
  );

  if (!weatherOn || frames.length < 2) return null;

  const last = frames.length - 1;
  const cur = frames[Math.min(index, last)];
  const pct = (index / last) * 100;

  // Boundary between observed and forecast (the NOW marker).
  let lastObs = 0;
  for (let i = 0; i < frames.length; i++) if (frames[i].kind === "observed") lastObs = i;
  const hasForecast = frames.some((f) => f.kind === "forecast");
  const nowPct = (lastObs / last) * 100;

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setPlaying(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    seek(e.clientX);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons & 1) seek(e.clientX);
  };

  return (
    <div className="weather-timeline glass">
      <button
        className="wt-play"
        onClick={() => {
          if (!playing && index >= last) setIndex(0); // replay from the start
          setPlaying(!playing);
        }}
        title={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>

      <div className="wt-main">
        <div className="wt-labels">
          <span className="wt-edge">{hkTime(frames[0].time)}</span>
          <span className={"wt-current" + (cur.kind === "forecast" ? " forecast" : "")}>
            {hkTime(cur.time)}
            <em>{cur.kind === "forecast" ? "forecast" : "observed"}</em>
          </span>
          <span className="wt-edge">{hkTime(frames[last].time)}</span>
        </div>

        <div className="wt-track" ref={trackRef} onPointerDown={onDown} onPointerMove={onMove}>
          <div className="wt-fill" style={{ width: `${pct}%` }} />
          {hasForecast && (
            <div className="wt-now" style={{ left: `${nowPct}%` }}>
              <span>NOW</span>
            </div>
          )}
          <div className="wt-ticks">
            {frames.map((f, i) => (
              <span
                key={f.time}
                className={
                  "wt-tick" +
                  (f.kind === "forecast" ? " future" : "") +
                  (i === index ? " active" : "")
                }
              />
            ))}
          </div>
          <div className="wt-head" style={{ left: `${pct}%` }} />
        </div>
      </div>

      <div className="wt-tag">
        <Radar size={12} /> {cur.kind === "forecast" ? "FORECAST" : "LIVE RADAR"}
      </div>
    </div>
  );
}
