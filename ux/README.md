# Robotic Operations — Command Interface (whitelabel)

A dark, glass-morphism **command-center dashboard** for coordinating robotic crews doing
drainage / wastewater inspection, cleaning and emergency response. Map-first: a full-bleed
neon map of **Hong Kong** with live-moving robot crews, live rain overlays, risk layers, and a
human-in-the-loop dispatch workflow. No product branding — clients reskin it via CSS tokens.

## Quick start

```bash
cd ux
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
```

No API keys or backend required. Live weather comes from the **Open-Meteo** public API
(keyless, CORS-enabled); the dark vector basemap is **CARTO Dark Matter** (keyless). Both have
graceful fallbacks if the network is unavailable.

## What's implemented

- **Full-bleed MapLibre map of Hong Kong**, restyled neon (cyan buildings, glowing roads,
  magenta grid) with floating glass panels over it.
- **6 robot crews** moving along real streets on a seamless ~3-minute loop, rendered as
  triangular markers colored by alert level (AL-0…AL-5) with team-ID tags and heading.
- **Live weather** — Open-Meteo precipitation sampled on a grid → semi-transparent rain cells;
  drains near the heaviest forecast cells are highlighted (pulsing magenta).
- **Layer toggles** (Weather / Street Map / Topography) that visibly change the map and
  **persist to localStorage**.
- **Glass detail modals** (map stays fuzzily visible behind) for crews (full telemetry + route
  highlighted on the map), drains, and weather cells.
- **Dispatch flow**: select a drain → *Recommend crew* (nearest available + ETA + risk) →
  *Confirm* → appears in the queue, crew flips to active.
- **Alerts & Incidents** and **System Health** panels; left rail with status, dispatch queue,
  crew counts/search, and layer toggles.

## Editing the data

All seed data lives in **one file**: [`src/data/mockOperations.ts`](src/data/mockOperations.ts)
(crews, drains, dispatches). Crew movement is a CSV of timestamped waypoints:
[`src/data/crewMovement.csv`](src/data/crewMovement.csv) (`timestamp_sec,crew_id,lat,lng,alert_level`,
looping 0→180s). Geography/anchors/topography zones are in `src/data/hkGeo.ts`.

## Theming (whitelabel)

The entire palette lives as CSS custom properties in
[`src/styles/tokens.css`](src/styles/tokens.css). A client reskin = override `:root` variables.

## Stack

Vite · React + TypeScript · MapLibre GL JS · Zustand (with `persist`) · lucide-react. Data model
in `src/types/operations.ts` is kept simple to swap mock data for real APIs later.
