# AGENTS.md

## What this is

An interactive, schematic 3D model of the **Hong Kong MTR network** built with
Three.js — ~98 stations across 10 lines (TWL, KTL, ISL, TKO, EAL, SIL, TCL,
AEX, DRL, TML), with interchanges, above-ground surroundings (towers, roads,
waterfront, landmarks), and a fully simulated service.

Exterior orbit view + first-person **walk mode** with gravity/collision — you
can enter at street level, tap through Octopus gates, ride escalators, stairs
and lifts, and board moving trains that carry you between stations. Animated
crowds use every facility. Trains run on the real MTR Open Data feed with a
synthetic headway fallback for off-hours.

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
public/mtr-logo.svg   MTR logo asset used in the masthead (white glow for dark bg)
src/
  main.js             renderer, lights, scene, labels, clipping, sim loop, UI wiring
  controls.js         CameraRig: orbit/walk, gravity, floor snap,
                      circle-vs-OBB collision, gate proximity, escalator carry
  ui.js               panel wiring, hover info, departures ticker
  audio.js            WebAudio FX (octopus beep, door chime, HVAC rumble)
                      + speechSynthesis announcements (zh-HK / en-HK)
  station.js          assembles every level: slabs, walls, openings, dressing
  station-data.js     shared constants: level heights, box footprints,
                      TRAIN_SPEC, LIFT_SIZE — plus the station registry
  stations/           ~98 per-station data files (levels, boxes, exits,
                      escalators, lifts, platforms, walkRects) + template.js
                      (reusable shells: island / side / atGradeSide / ext…)
  registry.js         shared build-time registries (SOLIDS, WALKABLES,
                      ESC_RUNS, STAIR_RUNS, GATES, FITTINGS, LIFT_DOORS)
  builders/
    structure.js      box(), floorSlab, walls, columns, rectSubtract…
    platforms.js      platform screen doors (real sliding leaves + bays),
                      tactile strips, door decals, benches
    circulation.js    escalators, stairs, exit shafts/pavilions, lifts, footbridge
    city.js           above-ground surroundings: towers, blocks, hills,
                      waterfront — skips any footprint overlapping a dig
    link.js           inter-station scenery between adjacent stops
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
    lifts.js          rideable lifts — per-level landing doors, dynamic car
                      floor carries the player/NPCs, E calls / selects floors
    passengers.js     instanced articulated crowd: wander/gates/escalators/
                      stairs/lifts/train boarding & alighting
    trains.js         network service: ROUTES spawn N Consists per line, each
                      a state machine — dwell→run (tunnel leg) or
                      dwell→offOut→offWait→offIn→dwell (off-map reversal);
                      carried between station boxes; PSD leaf sync, door bays
    timetable.js      real MTR next-train feed (rt.data.gov.hk), 45 s poll +
                      synthetic per-platform top-up for off-hours
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
  floor will render solid through the shaft. For a run spanning **more than
  two levels** (e.g. an express escalator diving through an intermediate
  floor), cut the footprint at *every* level strictly between the endpoints
  too — an uncut intermediate slab wins `floorAt()` mid-ride and strands the
  player on it. `computeOpenings()` already loops intermediate levels for
  escalators; keep that invariant for any new circulation type.
- **Pedestrian pathing**: `WALK_RECTS` (per-level local coords) bound where
  people may walk; `STAIR_RUNS`/`ESC_RUNS`/`GATES`/`FITTINGS` connect levels.
  When adding an entrance/stair, register it and extend `WALK_RECTS`.
- **Passenger states**: idle → walk → toGate/throughGate, toEsc/esc,
  toStair/stair, toLift/liftWait/liftIn/lift, board/boarding/aboard/alight.
  New states must be added to the boarding-exclusion list in
  `passengers.js#onTrainEvent`.
- **Labels**: CSS2D objects tagged `userData.level`; `updateLabels()` in
  main.js filters by mode/clip (exterior-only in plain orbit view).
- **Signs**: canvas textures via `makeSign`/`canvasTex` — bilingual
  (zh over en), navy `#101c26` plates, MTR styling.

## Live train data + the service

`anim/timetable.js` polls
`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=X&sta=Y` every
45 s for each (line, station) the feed knows. API `plat` numbers map 1:1 onto
platform face `num`. `time` = arrival at through platforms; at termini it's
the departure (`timeType:'D'`), so the sim berths the train early enough to be
dwelling when due. `Service.consumed` stops one schedule firing twice.

The feed is CORS-restricted and winds down after ~1 am — so `TrainSim` hands
`Timetable.setPlatforms()` the full platform directory plus a per-face
*achievable* interval (`loopTime / consists`). `_topUp()` then pads every
platform to ~4 upcoming slots on that spacing whenever live coverage thins.
**Never promise tighter spacing than the fleet can serve** — an unclaimed slot
is a train that never arrives, which is worse than a longer honest headway.

`anim/trains.js` `ROUTES` spawns `consists` Consists per line. Consist spawn
indices are spread evenly across the loop (`floor(i*stops/total)`), not
`i % stops` — bunching on adjacent stops leaves half the line unserved. Keep
consist counts high enough that `loopTime / consists` stays near the target
headway (~4–5 min per direction is playable and late-night-plausible).

## Verifying

1. `npm run build` must exit 0 (the >500 kB chunk warning is known/OK).
2. Drive it in a browser (`npm run dev` + Playwright/chrome-devtools MCP).
   **Eval safety**: `browser_evaluate`/`evaluate_script` `await` the returned
   value with no timeout — a promise that never settles hangs the tool call
   forever. `~/.config/devin/mcp-eval-guard.mjs` proxies both servers and
   races evals against `MCP_EVAL_TIMEOUT_MS` (default 60 s, returns
   `{__evalTimeout: ms}` on expiry). Still write bounded evals: prefer
   `async () => {…}` over `new Promise(async r => …)` (a throw inside the
   executor never resolves), and cap long waits with `Promise.race`. Exposed
   globals for checks:
   - `window.__rig` — `mode`, `feetY`, `floorAt(x,z,from)`, `teleport(p,l)`,
     `keys`, `yaw`, `_aboard`, `nearLift`, `nearGate`, `_fly`
   - `window.__cam`, `window.__scene`, `window.__weather`
   - `window.__trains` — the `TrainSim`: `.services` (Consists — `.route.line`,
     `.stops`, `.i`, `.state`, `.open`, `.ds`, `.bx`, `.tx`, `.zc`,
     `.doorSide`, `._doorXs`, `.doorWorld()`), `.tt` (Timetable: `.byPlat`,
     `.live`)
   - `window.__people` — `.list` (peds: `.state`, `.level`, `.wx/.wz/.wy`),
     `.liftOpts`
   - `window.__lifts` — `LiftSim`: `.cars`, `.interact(rig)`, `.inCar`, `.near`
   - `window.__escRuns`, `window.__gates`, `window.__renderer`
     (`renderer.info.render.calls` for draw calls)
3. Standard regression: every level `go` button lands on the right floor;
   walk collision holds at walls/gates/PSDs/escalator-well kerbs; you can
   ride an escalator, a stair, and a lift between levels; a train dwells
   with open doors and you can step aboard through a bay and alight; the
   ticker/boards show countdowns (live or synthetic) with `tt.live` set;
   zero console errors (CORS + `city … overlaps the dig` lines are expected).

## Driving the player — pitfalls that cost me time

Hard-won lessons from scripting walk mode in the browser. Re-read before
driving `__rig`/`__trains` from `evaluate_script`.

- **`teleport(p, look)` is a ~0.6 s flight, not instant.** It sets `rig._fly`
  and lerps over frames — reading the position right after returns mid-flight
  coords. Wait for `rig._fly` to clear (or just set `camera.position` +
  `feetY` directly when you need an instant, non-animated move). It takes
  **two** `THREE.Vector3` args; `window.__THREE__` is a version string, not the
  module — get the ctor via `rig.camera.position.constructor`.
- **`floorAt(x, z, from)` returns `{y, ramp}`, not a number.** Probe with
  `from = feetY + STEP_MAX` (≈ +0.42). Probing from too high returns a slab
  above you; too low reads the track bed.
- **A consist's `ds` is `null` while running between stops** — it's only set
  while berthed. Guard `if (!s.ds) continue` AND cache it in a local — it can
  go null between your check and use. Door openness is `svc.open` (0..1), not
  `svc.doors`. `window.__trains` has `.services`, not `.consists`.
- **Boarding needs you inside the car at a real bay.** `_aboard` sets when
  `u ≤ ~0.97` toward the door side (`u = (lp.z−zc)·doorSide`) AND `lp.x` is
  within `BAY/2` of an *open* bay (`ds.xs` covered by `svc._doorXs`) AND
  `open`. Reaching the doorway or a slid-open PSD leaf is not enough — walk
  *through* it into the car. Use `svc.doorWorld(n, off)` for world coords —
  `off ≈ −1.6` is just inside the car, `+1.6` is on the platform. It's the
  same helper the crowd uses, so it already handles `bx`/`doorSide`.
- **Alight the way a real rider does: stand at a bay before the doors open.**
  Navigating to the door *during* the dwell races the ~dwell window and the
  consist often departs mid-exit (doors close → you're correctly carried
  along — that's containment, not a bug). Pre-position near a bay while the
  train is still running, then step straight out on `open`.
- **Terminus dwells are ~3 s real at 4×.** For board/alight tests drop to
  1× (`speed` control) or you can't react inside the window.
- **One nav loop at a time.** A forgotten `async` loop still calling
  `__nav.go()` keeps steering the rig and looks like "the player is jumping
  around." `__nav.stop()` between attempts; give each `go()` a bounded wait.
- **Don't "fix" correct containment.** Aboard a consist you're carried by its
  frame delta and can't step off mid-run; stepping onto the platform through
  an open bay while berthed clears `_aboard`. A mid-doorway rider at door
  close staying aboard is intended.
- **Falling out of the world respawns** at (−20, −7, 0) via the `feetY < −60`
  net in `controls.js` — if your position suddenly resets to the concourse,
  you walked off an open edge (e.g. an elevated platform end), not a render
  bug.

## Notes for agents

- Vanilla ES modules + Three.js — no framework, no TypeScript, no JSX.
- Code is compact; section banners use `// ---- name ----` comments. Keep
  comments sparse and only where the code isn't self-evident.
- Bilingual zh-HK + en throughout — don't ship English-only UI.
- Don't commit `node_modules/`, `dist/`, `.playwright-mcp/` (gitignored).
