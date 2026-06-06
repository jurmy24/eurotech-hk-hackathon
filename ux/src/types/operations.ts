// Core data model for the robotic-ops prototype (brief §9, extended).
// Mock now; swap for real APIs later by keeping these shapes stable.

export type AlertLevel = "AL-0" | "AL-1" | "AL-2" | "AL-3" | "AL-4" | "AL-5";

export type Comms = "online" | "degraded" | "offline";

export type CrewStatus = "available" | "active" | "offline" | "servicing";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RobotCrew {
  id: string;
  name: string;
  alertLevel: AlertLevel; // seed value; live value comes from the animation loop
  location: LatLng; // seed value; live value comes from the animation loop
  headingDeg?: number;
  status: CrewStatus;
  activeDispatchId?: string;
  etaMinutes?: number;
  comms: Comms;
  model?: string;
  crewSize?: number;
}

export type DrainPriority = "low" | "medium" | "high" | "critical";

export interface Drain {
  id: string;
  name?: string;
  location: LatLng;
  priority: DrainPriority;
  blockageRiskPct: number;
  nearRainForecast: boolean;
  lastInspectedAt?: string;
  district?: string;
}

export type DispatchStatus =
  | "queued"
  | "assigned"
  | "en_route"
  | "working"
  | "complete"
  | "cancelled";

export interface Dispatch {
  id: string;
  crewId: string;
  drainId: string;
  status: DispatchStatus;
  createdAt: string;
  etaMinutes?: number;
  note?: string;
}

export type AlertKind =
  | "flooding"
  | "blocked_drain"
  | "lost_comms"
  | "low_battery"
  | "weather_topography";

export interface OpsAlert {
  id: string;
  kind: AlertKind;
  level: AlertLevel;
  title: string;
  detail: string;
  entityType?: "crew" | "drain";
  entityId?: string;
  createdAt: string;
}

// A sampled weather cell rendered as a semi-transparent rain blob.
export interface WeatherCell {
  id: string;
  center: LatLng;
  bounds: [LatLng, LatLng, LatLng, LatLng]; // sw, se, ne, nw
  precipNowMm: number; // near-term intensity
  precipMaxMm: number; // peak over the forecast window
  precipTotalMm: number; // expected accumulated rainfall over the window (mm)
  probabilityPct: number;
  windowLabel: string; // e.g. "now – 60 min"
}

// Live, interpolated state produced by the animation loop.
export interface LivePosition {
  lat: number;
  lng: number;
  headingDeg: number;
  alertLevel: AlertLevel;
  speedKph: number;
  lastUpdate: number; // epoch ms
}

export interface Waypoint {
  t: number; // seconds within the loop
  lat: number;
  lng: number;
  alert: AlertLevel;
}

export interface TopographyZone {
  id: string;
  name: string;
  riskLabel: string;
  polygon: LatLng[]; // ring (auto-closed)
  minElevM?: number; // lowest sampled elevation in the zone (m), when elevation-derived
}

export type LayerKey = "street" | "weather" | "topography" | "manholes" | "rainfall";
export type LayerState = Record<LayerKey, boolean>;

// Drives which modal / in-map panel is open.
export type Selection =
  | { type: "crew"; id: string }
  | { type: "drain"; id: string }
  | { type: "dispatch"; id: string }
  | { type: "weather"; id: string }
  | { type: "system" }
  | { type: "alerts" }
  | { type: "dispatch-planning"; drainId?: string }
  | null;
