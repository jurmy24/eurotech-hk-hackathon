// Single editable source of seed operations data (brief §14).
// Live crew positions/alert levels are overridden at runtime by the animation loop
// for crews that have waypoints in data/crewMovement.csv. Crews WITHOUT waypoints
// stay parked at their seed `location` (stationary) — see hooks/useCrewAnimation.ts.
import type { RobotCrew, Drain, Dispatch } from "../types/operations";

// 20 crews: 11 moving (have routes in crewMovement.csv) + 9 stationary (no routes).
export const CREWS: RobotCrew[] = [
  // ── Moving crews (patrol routes / en route to a drain) ──────────────────────
  { id: "CREW-01", name: "Sweeper Alpha", alertLevel: "AL-0", location: { lat: 22.284, lng: 114.15 }, headingDeg: 60, status: "available", comms: "online", model: "RB-Sweeper v3", crewSize: 2 },
  { id: "CREW-05", name: "Jet Echo", alertLevel: "AL-0", location: { lat: 22.2795, lng: 114.183 }, headingDeg: 15, status: "available", comms: "online", model: "RB-Jetter v2", crewSize: 2 },
  { id: "CREW-07", name: "Sweeper Golf", alertLevel: "AL-0", location: { lat: 22.2785, lng: 114.162 }, headingDeg: 45, status: "available", comms: "online", model: "RB-Sweeper v3", crewSize: 2 },
  { id: "CREW-09", name: "Jet India", alertLevel: "AL-1", location: { lat: 22.296, lng: 114.172 }, headingDeg: 0, status: "available", comms: "online", model: "RB-Jetter v2", crewSize: 3 },
  { id: "CREW-11", name: "Probe Kilo", alertLevel: "AL-0", location: { lat: 22.3285, lng: 114.159 }, headingDeg: 90, status: "available", comms: "online", model: "RB-Inspector v3", crewSize: 1 },
  { id: "CREW-12", name: "Sweeper Lima", alertLevel: "AL-0", location: { lat: 22.303, lng: 114.181 }, headingDeg: 30, status: "available", comms: "online", model: "RB-Sweeper v3", crewSize: 2 },
  { id: "CREW-13", name: "Hydro Mike", alertLevel: "AL-1", location: { lat: 22.327, lng: 114.186 }, headingDeg: 60, status: "available", comms: "online", model: "RB-Jetter v2", crewSize: 2 },
  { id: "CREW-08", name: "Hydro Hotel", alertLevel: "AL-1", location: { lat: 22.2905, lng: 114.19 }, headingDeg: 40, status: "active", activeDispatchId: "DSP-2004", etaMinutes: 6, comms: "online", model: "RB-Jetter v2", crewSize: 3 },
  { id: "CREW-10", name: "Cutter Juliet", alertLevel: "AL-2", location: { lat: 22.306, lng: 114.17 }, headingDeg: 350, status: "active", activeDispatchId: "DSP-2005", etaMinutes: 4, comms: "online", model: "RB-Cutter v4", crewSize: 2 },
  { id: "CREW-14", name: "Jet November", alertLevel: "AL-2", location: { lat: 22.2785, lng: 114.1745 }, headingDeg: 70, status: "active", activeDispatchId: "DSP-2006", etaMinutes: 9, comms: "online", model: "RB-Jetter v2", crewSize: 3 },
  { id: "CREW-15", name: "Cutter Oscar", alertLevel: "AL-3", location: { lat: 22.316, lng: 114.172 }, headingDeg: 300, status: "active", activeDispatchId: "DSP-2007", etaMinutes: 7, comms: "online", model: "RB-Cutter v4", crewSize: 2 },

  // ── Stationary crews (no route — parked) ───────────────────────────────────
  // Working: parked on a drain site, actively cleaning (dispatch status = working).
  { id: "CREW-02", name: "Hydro Bravo", alertLevel: "AL-1", location: { lat: 22.2802, lng: 114.1735 }, headingDeg: 200, status: "active", activeDispatchId: "DSP-2001", etaMinutes: 0, comms: "online", model: "RB-Jetter v2", crewSize: 3 },
  { id: "CREW-03", name: "Cutter Charlie", alertLevel: "AL-3", location: { lat: 22.3188, lng: 114.17 }, headingDeg: 280, status: "active", activeDispatchId: "DSP-2002", etaMinutes: 0, comms: "online", model: "RB-Cutter v4", crewSize: 2 },
  { id: "CREW-16", name: "Probe Papa", alertLevel: "AL-2", location: { lat: 22.324, lng: 114.1685 }, headingDeg: 120, status: "active", activeDispatchId: "DSP-2003", etaMinutes: 0, comms: "online", model: "RB-Cutter v4", crewSize: 2 },
  // Servicing: at depot.
  { id: "CREW-04", name: "Probe Delta", alertLevel: "AL-2", location: { lat: 22.279, lng: 114.173 }, headingDeg: 120, status: "servicing", comms: "degraded", model: "RB-Inspector v3", crewSize: 1 },
  { id: "CREW-17", name: "Scout Quebec", alertLevel: "AL-0", location: { lat: 22.322, lng: 114.21 }, headingDeg: 0, status: "servicing", comms: "online", model: "RB-Scout v1", crewSize: 1 },
  { id: "CREW-18", name: "Sweeper Romeo", alertLevel: "AL-1", location: { lat: 22.2825, lng: 114.13 }, headingDeg: 0, status: "servicing", comms: "online", model: "RB-Sweeper v3", crewSize: 2 },
  // Offline: lost comms, immobile.
  { id: "CREW-06", name: "Scout Foxtrot", alertLevel: "AL-4", location: { lat: 22.3303, lng: 114.1622 }, headingDeg: 0, status: "offline", comms: "offline", model: "RB-Scout v1", crewSize: 1 },
  { id: "CREW-19", name: "Scout Sierra", alertLevel: "AL-4", location: { lat: 22.317, lng: 114.19 }, headingDeg: 0, status: "offline", comms: "offline", model: "RB-Scout v1", crewSize: 1 },
  // Available but parked at a staging point.
  { id: "CREW-20", name: "Jet Tango", alertLevel: "AL-0", location: { lat: 22.296, lng: 114.18 }, headingDeg: 0, status: "available", comms: "online", model: "RB-Jetter v2", crewSize: 2 },
];

export const DRAINS: Drain[] = [
  { id: "DRN-001", name: "Des Voeux Rd Central", location: { lat: 22.2835, lng: 114.1572 }, priority: "high", blockageRiskPct: 71, nearRainForecast: true, lastInspectedAt: "2026-06-05T18:40:00+08:00", district: "Central" },
  { id: "DRN-002", name: "Harcourt Rd", location: { lat: 22.2788, lng: 114.164 }, priority: "medium", blockageRiskPct: 38, nearRainForecast: false, lastInspectedAt: "2026-06-05T22:10:00+08:00", district: "Admiralty" },
  { id: "DRN-003", name: "Lockhart Rd", location: { lat: 22.2802, lng: 114.1735 }, priority: "critical", blockageRiskPct: 88, nearRainForecast: true, lastInspectedAt: "2026-06-04T09:05:00+08:00", district: "Wan Chai" },
  { id: "DRN-004", name: "Yee Wo St", location: { lat: 22.2795, lng: 114.1858 }, priority: "high", blockageRiskPct: 64, nearRainForecast: true, lastInspectedAt: "2026-06-05T14:25:00+08:00", district: "Causeway Bay" },
  { id: "DRN-005", name: "King's Rd", location: { lat: 22.2916, lng: 114.193 }, priority: "low", blockageRiskPct: 22, nearRainForecast: false, lastInspectedAt: "2026-06-06T07:50:00+08:00", district: "North Point" },
  { id: "DRN-006", name: "Nathan Rd (TST)", location: { lat: 22.2968, lng: 114.1735 }, priority: "medium", blockageRiskPct: 45, nearRainForecast: false, lastInspectedAt: "2026-06-05T19:30:00+08:00", district: "Tsim Sha Tsui" },
  { id: "DRN-007", name: "Argyle St", location: { lat: 22.3188, lng: 114.17 }, priority: "critical", blockageRiskPct: 92, nearRainForecast: true, lastInspectedAt: "2026-06-03T16:00:00+08:00", district: "Mong Kok" },
  { id: "DRN-008", name: "Waterloo Rd", location: { lat: 22.3125, lng: 114.1712 }, priority: "high", blockageRiskPct: 69, nearRainForecast: true, lastInspectedAt: "2026-06-05T11:15:00+08:00", district: "Yau Ma Tei" },
  { id: "DRN-009", name: "Cheung Sha Wan Rd", location: { lat: 22.3309, lng: 114.163 }, priority: "medium", blockageRiskPct: 51, nearRainForecast: false, lastInspectedAt: "2026-06-05T20:45:00+08:00", district: "Sham Shui Po" },
  { id: "DRN-010", name: "Jordan Rd", location: { lat: 22.3052, lng: 114.1695 }, priority: "low", blockageRiskPct: 19, nearRainForecast: false, lastInspectedAt: "2026-06-06T06:20:00+08:00", district: "Jordan" },
  { id: "DRN-011", name: "Chatham Rd", location: { lat: 22.3035, lng: 114.1828 }, priority: "medium", blockageRiskPct: 43, nearRainForecast: false, lastInspectedAt: "2026-06-05T13:05:00+08:00", district: "Hung Hom" },
  { id: "DRN-012", name: "Prince Edward Rd", location: { lat: 22.324, lng: 114.1685 }, priority: "high", blockageRiskPct: 76, nearRainForecast: true, lastInspectedAt: "2026-06-04T21:35:00+08:00", district: "Prince Edward" },
];

export const DISPATCHES: Dispatch[] = [
  // Working (crew parked on site, cleaning).
  { id: "DSP-2001", crewId: "CREW-02", drainId: "DRN-003", status: "working", createdAt: "2026-06-06T09:12:00+08:00", etaMinutes: 0, note: "On site — jetting / cleaning blockage" },
  { id: "DSP-2002", crewId: "CREW-03", drainId: "DRN-007", status: "working", createdAt: "2026-06-06T08:40:00+08:00", etaMinutes: 0, note: "Critical blockage — cutting debris" },
  { id: "DSP-2003", crewId: "CREW-16", drainId: "DRN-012", status: "working", createdAt: "2026-06-06T09:25:00+08:00", etaMinutes: 0, note: "On site — clearing silt" },
  // En route.
  { id: "DSP-2004", crewId: "CREW-08", drainId: "DRN-005", status: "en_route", createdAt: "2026-06-06T09:40:00+08:00", etaMinutes: 6, note: "Routine inspection" },
  { id: "DSP-2005", crewId: "CREW-10", drainId: "DRN-008", status: "en_route", createdAt: "2026-06-06T09:44:00+08:00", etaMinutes: 4, note: "High blockage + rain forecast" },
  { id: "DSP-2006", crewId: "CREW-14", drainId: "DRN-002", status: "en_route", createdAt: "2026-06-06T09:46:00+08:00", etaMinutes: 9, note: "Scheduled clean" },
  { id: "DSP-2007", crewId: "CREW-15", drainId: "DRN-001", status: "en_route", createdAt: "2026-06-06T09:48:00+08:00", etaMinutes: 7, note: "High blockage + rain forecast" },
];
