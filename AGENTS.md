# AGENTS.md

## What this is

An interactive, schematic 3D viewer of **Admiralty MTR Station** (金鐘站) built
with Three.js — exterior orbit view, first-person walk mode with collision,
free-fly mode, section clipping, animated trains/escalators/gates/passengers,
and a live departures feed from the real MTR Open Data API.

This is an architectural *schematic*, not a surveyed model. Favour legibility
and correct spatial relationships over millimetre accuracy.

## Commands

```bash
npm install        # deps: three, vite only
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → dist/  (must exit 0)
npm run preview    # serve the built bundle
```

No test suite — verify by building + driving the app in a browser
(see "Verifying" below).

## Architecture

```
index.html            app shell: masthead, control panel, ticker, hint bar
public/mtr-logo.webp  MTR logo asset used in the masthead
src/
  main.js             renderer, lights, scene, labels, clipping, sim loop, UI wiring
  controls.js         CameraRig: orbit/walk/fly, gravity, floor snap,
                      circle-vs-OBB collision, gate proximity, escalator carry
  ui.js               panel wiring, hover info, departures ticker
  audio.js            WebAudio FX (octopus beep, door chime, HVAC rumble)
                      + speechSynthesis announcements (zh-HK / en-HK)
  station.js          assembles every level: slabs, walls, openings, dressing
  station-data.js     ALL the numbers: levels, box footprints, exits,
                      escalator banks, platforms, trains, walk rects, shops
  registry.js         shared build-time registries (SOLIDS, WALKABLES,
                      ESC_RUNS, STAIR_RUNS, GATES, FITTINGS)
  builders/
    structure.js      box(), floorSlab, walls, columns, rectSubtract…
    platforms.js      platform screen doors (real sliding leaves + bays),
                      tactile strips, door decals, benches
    circulation.js    escalators, stairs, exit shafts/pavilions, lifts, footbridge
    props.js          gates, shops + interiors, restaurants, 7-Eleven, mall,
                      kiosks, booths, toilets, HVAC
    signage.js        canvas-texture signs (hanging, platform, fascia, totem)
    decor.js          calligraphy walls, ad lightboxes, bins, fire cabinets,
                      system map board
    people.js         articulated person figures (parts, appearance rolls)
    materials.js      shared MeshStandardMaterials (M.*), lineMat()
    tracks.js         rails, sleepers, tunnel tubes
  anim/
    escalators.js     instanced moving steps over each ESC_RUNS ramp
    gates.js          Octopus gate state (tap → flaps open → close)
    passengers.js     instanced articulated crowd: wander/gates/escalators/
                      stairs/train boarding & alighting
    trains.js         per-face service state machine (away→arrive→dwell→depart),
                      PSD leaf sync, door bays for boarding
    timetable.js      real MTR next-train feed (rt.data.gov.hk), 45 s poll
```

## Conventions — follow these or things silently break

- **Units are metres.** X = platform axis (east +X), Y = up, Z = lateral.
- **Levels**: U1=8, G=0, L1=−7, L2=−14, L3=−21, L4=−28, L5=−35, L6=−42
  (`FLOOR_H=7`, `SLAB_T=1`). Defined once in `station-data.js` — never hardcode.
- **Box frames**: each level builds in a local frame (`BOXES[id]`: cx, cz, rot).
  `boxToWorld`/`worldToBox` convert. L5/L6 (`ext`) are rotated −0.30 rad —
  anything placed or path-checked there MUST go through the frame helpers.
- **Collision**: call `solid(mesh)` to register; `walkable(mesh, data)` for
  floors/ramps (`{ramp:run}` stairs, `{esc:run}` escalators). Solids use OBBs
  when rotated — keep `userData.solid` on real Meshes, not Groups.
- **Floor openings**: slabs get holes via `computeOpenings()` in station.js.
  Any new stair/escalator/lift must register its world rect there or the
  floor will render solid through the shaft.
- **Pedestrian pathing**: `WALK_RECTS` (per-level local coords) bound where
  people may walk; `STAIR_RUNS`/`ESC_RUNS`/`GATES`/`FITTINGS` connect levels.
  When adding an entrance/stair, register it and extend `WALK_RECTS`.
- **Passenger states**: idle → walk → toGate/throughGate, toEsc/esc,
  toStair/stair, board/boarding/aboard. New states must be added to the
  boarding-exclusion list in `passengers.js#onTrainEvent`.
- **Labels**: CSS2D objects tagged `userData.level`; `updateLabels()` in
  main.js filters by mode/clip (exterior-only in plain orbit view).
- **Signs**: canvas textures via `makeSign`/`canvasTex` — bilingual
  (zh over en), navy `#101c26` plates, MTR styling.

## Live train data

`anim/timetable.js` polls `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=X&sta=ADM`
(TWL/ISL/EAL/SIL) every 45 s. API `plat` numbers map 1:1 onto `PLATFORMS`
face `num`. `time` = arrival at through platforms; at termini it's the
departure (`timeType:'D'`), so the sim runs the train in early enough to be
dwelling when it's due. `Service.consumed` prevents one schedule firing twice.
When the feed is unreachable the sim silently falls back to the synthetic
headways in `TRAIN_SPEC`.

## Verifying

1. `npm run build` must exit 0 (the >500 kB chunk warning is known/OK).
2. Drive it in a browser (`npm run dev` + Playwright). Exposed globals for
   checks: `window.__rig` (mode, feetY, floorAt, teleport), `window.__cam`,
   `window.__trains` (services, `tt.byPlat`), `window.__people.list`.
3. Standard regression: all 8 level `go` buttons land on the right floor;
   walk collision holds at walls/gates/PSDs/escalator-well kerbs; a train
   dwells with open doors and passengers board; the ticker shows live
   countdowns when `tt.live`; zero console errors.

## Notes for agents

- Vanilla ES modules + Three.js — no framework, no TypeScript, no JSX.
- Code is compact; section banners use `// ---- name ----` comments. Keep
  comments sparse and only where the code isn't self-evident.
- Bilingual zh-HK + en throughout — don't ship English-only UI.
- Don't commit `node_modules/`, `dist/`, `.playwright-mcp/` (gitignored).
