# HONESTY.md

Before the hackathon window we had one ~1-hour meeting to pick the idea. No application code was written before kickoff (one prep script + physical props excepted — see §5).

---

## 1. Team

| Member           | GitHub handle                                    | Main contributions                                                                                              |
| ---------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Victor Oldensand | [@jurmy24](https://github.com/jurmy24)           | React + MapLibre dashboard, Open-Meteo / RainViewer / topography / manhole integrations, HIL skill-chain script |
| Lewis Lu         | [@ylewislu](https://github.com/ylewislu)         | Hardware props (hooks, fake drain, 3D-printed chopper), robot-arm demo setup, UX, policy chaining               |
| C. Piggott       | [@Cpiggott-lab](https://github.com/Cpiggott-lab) | Hardware props, robot-arm demo setup, policy chaining                                                           |

---

## 2. What is fully working

Features that run end-to-end on the live app, with real data and real logic.

- **Live weather over Hong Kong**: one multi-point [Open-Meteo](https://open-meteo.com) request samples precipitation across a 14×11 grid; the result renders as semi-transparent rain cells and drives flooding alerts on at-risk drains.
- **Live precipitation radar**: real [RainViewer](https://www.rainviewer.com) radar tiles (keyless), the last ~2 h of scans + nowcast, overlaid on the map.
- **Full-bleed MapLibre map** of HK, neon-restyled, with glass panels, detail modals, and **layer toggles persisted to localStorage**.
- **Dispatch recommendation**: given a drain, it picks the nearest _available crew and_ then adds it to the queue and flips the crew to active.
- **Crew animation**: real waypoint interpolation + bearing math moving markers along streets on a ~3-min loop. `ux/src/hooks/useCrewAnimation.ts` (the _waypoints for crews themselves_ are fake see §3).
- **HIL robot skill chain** — `src/hil_skill_chain.py` is real LeRobot rollout code that runs prompt-conditioned pi0.5 skills one at a time, operator-gated, on the reBot B601-DM arm (runs separately on the robot host, not in the web app).

---

## 3. What is mocked, stubbed, or hardcoded

Every shortcut.

| What is faked                                           | Why we mocked it                                             | What the real version would do                     |
| ------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| Robot crew roster (20 crews, status, model, comms)      | No fleet telemetry backend in a hackathon                    | Stream live crew state from a fleet-management API |
| Crew GPS movement / patrol routes                       | No real robots on HK streets                                 | Real-time GPS from deployed robots                 |
| Drain blockage-risk % and `nearRainForecast` seed flags | No inspection/ML pipeline                                    | Risk scored from sensors + an actual model         |
| Dispatch records (queue seed)                           | Demo seed                                                    | Persisted dispatches from a backend                |
| Weather fallback field (two synthetic rain bands)       | Demo still works on venue Wi-Fi if Open-Meteo is unreachable | n/a — only used when the real call fails           |
| pi0.5 skill prompts + policy checkpoint                 | Placeholders; checkpoint not trained/validated in time       | A pi0.5 checkpoint trained on real teleop data     |

---

## 4. Pre-existing code

Anything written **before** kickoff that we brought in.

| Item                                                   | Source (URL or description)                                                                       | Roughly how much | License        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------- | -------------- |
| `scripts/spin_chopper.py`                              | Written before the event to spin the Feetech STS3215 in the chopper prop                          | ~95 lines        | Our own        |
| Physical props — hooks, fake drain, 3D-printed chopper | Built before the event by @ylewislu & @Cpiggott-lab (see `assets/`)                               | 3 props          | n/a (hardware) |
| LeRobot                                                | [https://github.com/huggingface/lerobot](https://github.com/huggingface/lerobot) (git dependency) | Whole library    | Apache-2.0     |
| Frontend libraries                                     | MapLibre GL, React, Zustand, lucide-react (npm)                                                   | Dependencies     | OSS (BSD/MIT)  |

All other application code in this repo was written during the hackathon window.
