import type { AlertLevel, CrewStatus, Comms, DrainPriority } from "../types/operations";

// Hex values (mirror tokens.css) for use in WebGL paint props, which can't read CSS vars.
export const ALERT_HEX: Record<AlertLevel, string> = {
  "AL-0": "#22e07a",
  "AL-1": "#9ee84a",
  "AL-2": "#f4d423",
  "AL-3": "#ff9d2e",
  "AL-4": "#ff6038",
  "AL-5": "#ff2d4f",
};

export const ALERT_LABELS: Record<AlertLevel, string> = {
  "AL-0": "Normal Operation",
  "AL-1": "Low Alert",
  "AL-2": "Moderate Alert",
  "AL-3": "Elevated Alert",
  "AL-4": "High Alert",
  "AL-5": "Critical Alert",
};

// Per-crew "zone risk" — the local conditions at a crew's current position.
// Shares the AlertLevel scale/colors but is labeled distinctly so it isn't
// confused with the system-wide ALERT level (see StatusCard).
export const ZONE_LABELS: Record<AlertLevel, string> = {
  "AL-0": "Normal",
  "AL-1": "Low Risk",
  "AL-2": "Moderate Risk",
  "AL-3": "Elevated Risk",
  "AL-4": "High Risk",
  "AL-5": "Critical Risk",
};

// "AL-3" -> "Z-3" for the crew-facing zone-risk chip.
export function zoneCode(level: AlertLevel): string {
  return level.replace("AL", "Z");
}

export const STATUS_HEX: Record<CrewStatus, string> = {
  available: "#22e07a",
  active: "#36e2ff",
  servicing: "#4d8cff",
  offline: "#6b7a93",
};

export const STATUS_LABELS: Record<CrewStatus, string> = {
  available: "Available",
  active: "Loaded / Active",
  servicing: "Servicing",
  offline: "Offline",
};

export const COMMS_LABELS: Record<Comms, string> = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
};

export const PRIORITY_LABELS: Record<DrainPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITY_HEX: Record<DrainPriority, string> = {
  low: "#4d8cff",
  medium: "#f4d423",
  high: "#ff9d2e",
  critical: "#ff2d4f",
};

// AL-0/1 green, AL-2 yellow, AL-3 orange, AL-4/5 red (brief §6 marker colors).
export function alertBucketColor(level: AlertLevel): string {
  return ALERT_HEX[level];
}

export function timeAgo(input: number | string, now = Date.now()): string {
  const t = typeof input === "number" ? input : Date.parse(input);
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function clockHHMMSS(d = new Date()): string {
  return d.toLocaleTimeString("en-GB", { hour12: false });
}
