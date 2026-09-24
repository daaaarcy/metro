import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildStation, computeOpenings } from './station.js';
import { LEVELS, BOXES, STATIONS, worldToBox, boxToWorld, groundBoxes, levelById } from './station-data.js';
import { CameraRig } from './controls.js';
import { buildUI, showInfo, showPrompt, showBusStop, updateTicker, updateClock } from './ui.js';
import { EscalatorSteps } from './anim/escalators.js';
import { TrainSim } from './anim/trains.js';
import { Passengers } from './anim/passengers.js';
import { updateGates, gateBlocks, initGateFlaps } from './anim/gates.js';
import { LiftSim } from './anim/lifts.js';
import { StationAudio } from './audio.js';
import { buildColliders } from './colliders.js';
import { Weather } from './weather.js';
import { mergeStation } from './merge.js';
import { buildCity, CITY_ROADS, CITY_WATER } from './builders/city.js';
import { rectSubtract } from './builders/structure.js';
import { BusSim } from './bus/buses.js';
import { GATES, ESC_RUNS } from './registry.js';

// ---------- renderer ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', stencil: false });
const PR_CAP = Math.min(devicePixelRatio, 1.5);
renderer.setPixelRatio(PR_CAP);                            // 3.7M-tri scene is fill-bound on Retina
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:5;';
document.body.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x11151c);
scene.fog = new THREE.Fog(0x11151c, 500, 2600);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2600);
camera.position.set(105, 55, 118);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xbfd0e0, 0x4a4640, 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0dd, 1.6);
sun.position.set(90, 160, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, far: 400 });
sun.shadow.bias = -0.0004;
scene.add(sun);
const ambient = new THREE.AmbientLight(0x50565e, 1.0);
scene.add(ambient);
// constant interior fill — stations are lit 24/7, so the underground stack
// stays readable in the zoomed-out view even at HK night (not weather-driven)
const interiorFill = new THREE.HemisphereLight(0xd7e3ee, 0x3f3a35, 0.55);
scene.add(interiorFill);

// ---------- station ----------
const { root, levelGroups, togglables, labels, liftDefs } = buildStation();
scene.add(root);
// schematic city around the station digs — towers register solids, so this
// must run before buildColliders()
const city = buildCity();
scene.add(city.group);
labels.push(...city.labels);
// Citybus network — fleet, kerbside stops + live ETAs on the island corridor.
// Its shelter panels register solids, so it must exist before buildColliders.
const busSim = new BusSim(scene);
busSim.root.updateMatrixWorld(true);
root.updateMatrixWorld(true);
// one collision world shared by the player rig and the pedestrians
const colliders = buildColliders();
// collapse ~30k static meshes into one BatchedMesh per material network-wide
// (one GL call each, per-level visibility via setVisibleAt, per-instance
// frustum culling). Colliders are already snapshotted; instanced/dynamic
// meshes are untouched. Returns uid -> batch-instance list for toggles.
const visItems = mergeStation(scene, root, levelGroups, togglables);
initGateFlaps(levelGroups);   // instanced Octopus paddles, one draw per level

// every sign plate has a unique canvas texture, so they can't merge — that's
// ~1.8k extra draw calls. They're unreadable past ~50 m anyway, so cull them
// by distance each frame (radius grows with zoom in orbit mode).
const signCulls = [];
root.traverse(o => {
  if (o.isMesh && !o.isInstancedMesh && o.material?.isMeshBasicMaterial
      && o.material.map && o.geometry.parameters)
    signCulls.push({ o, p: o.getWorldPosition(new THREE.Vector3()) });
});
function cullSigns() {
  const focus = rig.mode === 'walk' ? camera.position : rig.orbit.target;
  const r = rig.mode === 'walk' ? 140 : Math.max(150, rig.orbit.getDistance() * 0.35);
  const r2 = r * r;
  for (const s of signCulls) s.o.visible = s.p.distanceToSquared(focus) < r2;
}

// ground context — a big dark disc spanning every station, with a
// rectangular excavation hole over each ground slab, so orbit views
// show the underground stacks instead of an opaque lid. Holes and the
// disc radius are derived from the station boxes (ground-level frames
// + padding). Shape XY maps to world X,-Z after the -90° X rotation.
const holes = groundBoxes().map(b => {
  const pts = [[-b.len / 2, -b.wid / 2], [b.len / 2, -b.wid / 2],
               [b.len / 2, b.wid / 2], [-b.len / 2, b.wid / 2]]
    .map(([x, z]) => boxToWorld(b, x, z));
  const xs = pts.map(p => p.x), zs = pts.map(p => p.z);
  const pad = 6;
  return [Math.min(...xs) - pad, Math.max(...xs) + pad,
          Math.min(...zs) - pad, Math.max(...zs) + pad];
});
const gx0 = Math.min(...holes.map(h => h[0])), gx1 = Math.max(...holes.map(h => h[1]));
const gz0 = Math.min(...holes.map(h => h[2])), gz1 = Math.max(...holes.map(h => h[3]));
const gcx = (gx0 + gx1) / 2, gcz = (gz0 + gz1) / 2;
const gr = Math.hypot(Math.max(gx1 - gcx, gcx - gx0), Math.max(gz1 - gcz, gcz - gz0)) + 500;
const groundShape = new THREE.Shape();
groundShape.absarc(gcx, -gcz, gr, 0, Math.PI * 2);
for (const [x0, x1, z0, z1] of holes) {
  const dig = new THREE.Path();
  dig.moveTo(x0, -z1); dig.lineTo(x1, -z1);
  dig.lineTo(x1, -z0); dig.lineTo(x0, -z0); dig.closePath();
  groundShape.holes.push(dig);
}
const ground = new THREE.Mesh(
  new THREE.ShapeGeometry(groundShape, 48),
  new THREE.MeshStandardMaterial({ color: 0x171b21, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
ground.receiveShadow = true;
scene.add(ground);

// the disc is visual-only — pave the collision world with flat street-floor
// records: the whole disc minus the station digs and the water, plus every
// paved road rect (so harbour-crossing links keep a deck over the sea).
// floorAt() consults these only when no walkable mesh claims the point, so
// station slabs and stairwell mouths always win.
{
  const digRects = groundBoxes().map(b => {
    const pts = [[-b.len / 2, -b.wid / 2], [b.len / 2, -b.wid / 2],
                 [b.len / 2, b.wid / 2], [-b.len / 2, b.wid / 2]]
      .map(([x, z]) => boxToWorld(b, x, z));
    const xs = pts.map(p => p.x), zs = pts.map(p => p.z);
    return { x0: Math.min(...xs), x1: Math.max(...xs),
             z0: Math.min(...zs), z1: Math.max(...zs) };
  });
  const world = { x0: gcx - gr, z0: gcz - gr, x1: gcx + gr, z1: gcz + gr };
  const cuts = digRects.concat(CITY_WATER.map(([x0, z0, x1, z1]) => ({ x0, z0, x1, z1 })));
  colliders.streetRects = rectSubtract(world, cuts)
    .concat(CITY_ROADS.map(([x0, z0, x1, z1]) => ({ x0, z0, x1, z1 })))
    .map(r => ({ ...r, top: 0 }));
}

// ---------- simulation ----------
const escSteps = new EscalatorSteps();
scene.add(escSteps.mesh, escSteps.stripMesh);
const trainSim = new TrainSim(scene);
const liftSim = new LiftSim(scene, liftDefs, colliders);
const passengers = new Passengers(scene, computeOpenings(), colliders);
passengers.bindLifts(liftSim);
const audio = new StationAudio();
// live Hong Kong weather drives the above-ground sky, light and rain
const weather = new Weather(scene, sun, hemi, ambient, ground);

// the sun rides the sky dome slowly — rebake the shadow map only when it
// actually moves instead of re-rendering ~2.6k casters every frame.
// Instanced meshes are the dynamic things (crowd, PSD leaves, esc steps) —
// a throttled map would freeze their shadows mid-motion, so they don't cast.
renderer.shadowMap.autoUpdate = false;
scene.traverse(o => { if (o.isInstancedMesh) o.castShadow = false; });
const lastSun = new THREE.Vector3(Infinity, Infinity, Infinity);

// ---------- CSS2D labels ----------
// separate flat scene: CSS2DRenderer traverses whatever it's handed, so a
// dedicated scene visits ~500 label nodes instead of the whole 11k-node scene
const labelScene = new THREE.Scene();
const labelObjs = [];
let labelsOn = true;
for (const l of labels) {
  const div = document.createElement('div');
  div.className = `lbl ${l.cls}`;
  if (l.css) div.style.cssText = l.css;
  div.innerHTML = l.html;
  const o = new CSS2DObject(div);
  o.position.copy(l.pos);
  o.userData.level = l.level;
  labelScene.add(o);
  labelObjs.push(o);
}

// Label visibility rules:
//  orbit, no section, camera outside → only exterior labels (U1/G level tags +
//                       exit tags); a level's labels also appear once a higher
//                       level is hidden
//  orbit, no section, camera inside a level box → only that level's labels
//                       (otherwise G/exit tags float mid-air underground)
//  orbit + x/z section → labels on the kept side of the cut plane
//  orbit + y section   → labels below the peel plane only
//  walk                → labels on the level the camera is inside
const sortedLevels = [...LEVELS].sort((a, b) => b.y - a.y);
const TYPE_OF = {}; for (const l of LEVELS) TYPE_OF[l.uid] = l.type;
const LVL_OF = {}; for (const l of LEVELS) LVL_OF[l.uid] = l;
// levels stacked above each uid at the same station — bakes the
// exposedLevel/coverY scans so updateLabels isn't O(labels × levels)
const ABOVE = {}, COVER_Y = {};
for (const l of LEVELS) {
  const above = LEVELS.filter(m => m.station === l.station && m.y > l.y + 1);
  ABOVE[l.uid] = above.map(m => m.uid);
  COVER_Y[l.uid] = above.length ? Math.min(...above.map(m => m.y)) : Infinity;
}
const EXT_TYPES = new Set(['ground', 'checkin', 'bridge']);
function levelAtY(y) {
  for (const l of sortedLevels) if (y >= l.y - 1.2) return l.uid;
  return sortedLevels[sortedLevels.length - 1].uid;
}
// which level's box (if any) contains the point — handles rotated boxes
const _lb = {};
function levelBoxAt(p) {
  for (const lvl of LEVELS) {
    const bx = BOXES[lvl.box];
    if (!bx) continue;
    if (p.y < lvl.y - 0.3 || p.y > lvl.y + 6.9) continue;
    const l = worldToBox(bx, p.x, p.z, _lb);
    if (Math.abs(l.x) < bx.len / 2 && Math.abs(l.z) < bx.wid / 2) return lvl.uid;
  }
  return null;
}
// ---------- masthead follows the station you're in / looking at ----------
// walk → the level box containing the player; orbit → the look-target.
// In the link corridor or in free space, the nearest station centre wins.
const titleZh = document.querySelector('#masthead h1 .zh');
const titleEn = document.querySelector('#masthead h1 .en');
const STN_C = Object.fromEntries(Object.values(STATIONS)
  .map(s => [s.id, BOXES[Object.keys(s.boxes)[0]]]));
let titleStn = '';
let nearStop = null;   // set each tick by the bus-stop chip block below
function updateTitle() {
  // standing at a bus stop: the masthead names the stop, not the nearest
  // station — the station fallback is hopeless off-network (Stanley → ST)
  if (nearStop) {
    const key = 'bus:' + nearStop.id;
    if (titleStn !== key) {
      titleStn = key;
      const term = nearStop.id.endsWith('_T');
      const zh = `${nearStop.zh}巴士${term ? '總' : ''}站`, en = `${nearStop.en} ${term ? 'Bus Terminus' : 'Bus Stop'}`;
      titleZh.textContent = zh;
      titleEn.textContent = en;
      document.title = `${zh} ${en} — 3D Layout`;
    }
    return;
  }
  const pt = rig.mode === 'walk' ? camera.position : rig.orbit.target;
  const uid = levelBoxAt(pt);
  let stn = uid ? uid.split(':')[0] : null;
  if (!stn) {
    let bd = Infinity;
    for (const [id, b] of Object.entries(STN_C)) {
      const dx = pt.x - b.cx, dz = pt.z - b.cz, d = dx * dx + dz * dz;
      if (d < bd) { bd = d; stn = id; }
    }
  }
  if (stn === titleStn) return;
  titleStn = stn;
  const s = STATIONS[stn];
  if (!s) { titleStn = ''; return; }   // non-station box uid — retry next tick
  titleZh.textContent = `${s.zh}站`;
  titleEn.textContent = `${s.en} Station`;
  document.title = `${s.zh}站 ${s.en} Station — 3D Layout`;
}

// a level is "exposed" once a level above it *at the same station* is hidden
function exposedLevel(uid) {
  const above = ABOVE[uid];
  if (!above) return true;
  return above.some(u => levelGroups[u] && !levelGroups[u].visible);
}
function updateLabels() {
  // walk mode: only the level box the camera is inside (station-aware —
  // matching by height alone would show Admiralty's labels at Hong Kong)
  const camLvl = rig.mode === 'orbit' ? levelAtY(camera.position.y) : levelBoxAt(camera.position);
  const inside = rig.mode === 'orbit' ? levelBoxAt(camera.position) : null;
  for (const o of labelObjs) {
    const lvl = o.userData.level;
    if (!labelsOn || (lvl && levelGroups[lvl] && !levelGroups[lvl].visible)) { o.visible = false; continue; }
    if (!lvl) { o.visible = true; continue; }
    if (rig.mode !== 'orbit') { o.visible = lvl === camLvl; continue; }
    if (clipAxis === 'y') {
      // a level is only exposed once the slab covering it is cut — the floor
      // of the next level up *at that station*. Top levels have no cover.
      o.visible = clipConst < (COVER_Y[lvl] ?? Infinity) && o.position.y < clipConst + 0.5;
      continue;
    }
    if (clipAxis === 'x') { o.visible = o.position.x < clipConst; continue; }
    if (clipAxis === 'z') { o.visible = o.position.z < clipConst; continue; }
    o.visible = inside ? lvl === inside : (EXT_TYPES.has(TYPE_OF[lvl]) || exposedLevel(lvl));
  }
}

// ---------- invisible pick proxies per level (cheap raycast) ----------
const pickMeshes = [];
for (const lvl of LEVELS) {
  if (!lvl.box) continue;
  const bx = BOXES[lvl.box];
  const geo = new THREE.BoxGeometry(bx.len, 7, bx.wid);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(bx.cx, lvl.y + 3, bx.cz);
  m.rotation.y = bx.rot;
  m.userData.level = lvl;
  m.visible = false;   // raycast targets only — Raycaster ignores .visible
  scene.add(m);
  pickMeshes.push(m);
}

// every transform is baked — the renderers skip the whole-scene traversal
// entirely, and each tick updates only the few roots that still move:
// train consists, lift cars + landing doors, the weather-driven sun.
// Instanced parts (crowd, PSD leaves, escalator steps, gate flaps) animate
// their instance buffers without touching matrixWorld.
scene.updateMatrixWorld(true);
scene.matrixWorldAutoUpdate = false;
const dynRoots = [
  sun,
  busSim.root,
  ...trainSim.services.map(s => s.train),
  ...liftSim.cars.flatMap(c => [c.mesh, ...c.doors.map(d => d.dg)]),
];

// level visibility combines two drivers: the section-panel toggle and orbit
// distance culling. Both write through applyLevelVis so neither clobbers the
// other, and the sim layers (steps, crowd, berthed trains) follow the result.
const levelUserOn = {};          // uid -> false when hidden via the panel
const levelFar = new Set();      // uids dropped by orbit distance culling
function applyLevelVis(id) {
  const v = levelUserOn[id] !== false && !levelFar.has(id);
  if (levelGroups[id]) levelGroups[id].visible = v;
  for (const o of togglables[id] || []) o.visible = v;
  for (const it of visItems.get(id) || []) it.batch.setVisibleAt(it.id, v);
  escSteps.setLevelVisible(id, v);
  passengers.setLevelVisible(id, v);
  for (const s of trainSim.services) if (s.ds?.level === id) s.train.visible = v;
}
// in a wide orbit view an underground interior past ~1.1 km is a few pixels
// inside its dig hole — the whole level group (one visibility flag ≈ 80 draw
// calls) drops out, with hysteresis so it can't flicker at the boundary.
// Ground/viaduct levels always stay — they're the skyline context.
const levelCull = LEVELS
  .filter(l => l.y < -0.5 && l.box && levelGroups[l.uid])
  .map(l => ({ id: l.uid, p: new THREE.Vector3(BOXES[l.box].cx, l.y, BOXES[l.box].cz), far: false }));
function cullLevels() {
  const orbit = rig.mode === 'orbit';
  // orbit reads interiors across the map → wide radius; walk mode sits inside
  // one station so a neighbouring interior past ~450 m is always occluded.
  // While the pointer is held either radius tightens ~40% — far interiors
  // are illegible mid-drag, and dropping them frees vertex + draw budget.
  const base = orbit ? [1100, 850] : [450, 330];
  const [hideR, showR] = dragging ? [base[0] * 0.6, base[1] * 0.6] : base;
  const f = orbit ? rig.orbit.target : camera.position;
  for (const c of levelCull) {
    const d2 = f.distanceToSquared(c.p);
    const far = c.far ? d2 > showR * showR : d2 > hideR * hideR;
    if (far !== c.far) { c.far = far; far ? levelFar.add(c.id) : levelFar.delete(c.id); applyLevelVis(c.id); }
  }
}

// ---------- clipping planes ----------
const clipPlanes = {
  x: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 200),
  y: new THREE.Plane(new THREE.Vector3(0, -1, 0), 200),
  z: new THREE.Plane(new THREE.Vector3(0, 0, -1), 200),
};
const clipRange = { x: 1700, y: [50, -55], z: 300 };
let clipAxis = 'none', clipConst = Infinity;
// section cuts are an orbit-mode inspection tool — in walk mode the planes
// would decapitate street-level geometry, so they're suppressed (the UI
// selection is kept and re-applied on return to orbit)
function syncClipPlanes() {
  renderer.clippingPlanes = (rig.mode === 'orbit' && clipAxis !== 'none')
    ? [clipPlanes[clipAxis]] : [];
}
function applyClip(axis, t) {
  // slider max is the full view, not a cut at the far edge — collapse it to
  // 'none' so labels, picking and planes all follow the no-cut rules
  clipAxis = (axis === 'none' || t >= 1) ? 'none' : axis;
  if (clipAxis === 'none') { syncClipPlanes(); clipConst = Infinity; return; }
  const p = clipPlanes[axis];
  p.constant = axis === 'y'
    ? THREE.MathUtils.lerp(clipRange.y[1], clipRange.y[0], t)
    : THREE.MathUtils.lerp(-clipRange[axis], clipRange[axis], t);
  clipConst = p.constant;
  syncClipPlanes();
}

// ---------- controls ----------
const rig = new CameraRig(camera, renderer.domElement);
rig.trains = trainSim;              // lets the player board dwelling trains
rig.audio = audio;
rig.initColliders(colliders);
rig.onLiftTap = () => liftSim.interact(rig);
rig.onBusTap = () => busSim.interact(rig);
window.__rig = rig; window.__cam = camera; window.__trains = trainSim; window.__people = passengers;
window.__lifts = liftSim;
window.__escRuns = ESC_RUNS; window.__weather = weather; window.__renderer = renderer;
window.__scene = scene; window.__gates = GATES; window.__buses = busSim;
const HOME_POS = new THREE.Vector3(105, 55, 118);
const HOME_TARGET = new THREE.Vector3(5, -16, 12);
// orbit "home" frames all three stations — Admiralty near field, Central and
// Hong Kong stretching west down the harbour line
const NET_POS = new THREE.Vector3(200, 520, 780);
const NET_TARGET = new THREE.Vector3(-650, -20, 0);
// walk mode is the default — spawn at street level facing the exit pavilions
const WALK_HOME = new THREE.Vector3(-30, 1.62, 26);
const WALK_LOOK = new THREE.Vector3(-10, 1, -6);
// restore the last camera pose across reloads/rebuilds (localStorage 'adm-pos')
const saved = (() => { try { return JSON.parse(localStorage.getItem('adm-pos')); } catch { return null; } })();
if (saved?.p?.length === 3 && saved.p.every(Number.isFinite)) {
  camera.position.fromArray(saved.p);
  if (saved.m === 'orbit' && saved.t?.length === 3) {
    rig.orbit.target.fromArray(saved.t);
    camera.lookAt(rig.orbit.target);
    rig.setMode('orbit');
  } else {
    rig.setMode('walk');
    rig.yaw = saved.yaw || 0; rig.pitch = saved.pitch || 0;
    camera.rotation.set(rig.pitch, rig.yaw, 0, 'YXZ');
    const fl = rig.floorAt(camera.position.x, camera.position.z, camera.position.y);
    rig.feetY = fl.y > -Infinity ? fl.y : camera.position.y - 1.62;
    rig.vy = 0;
  }
} else {
  rig.orbit.target.copy(HOME_TARGET);
  camera.position.copy(WALK_HOME);
  camera.lookAt(WALK_LOOK);
  rig.setMode('walk');
}
const savePos = () => {
  if (rig._fly) return;   // don't persist a mid-teleport pose
  try {
    localStorage.setItem('adm-pos', JSON.stringify({
      m: rig.mode, p: camera.position.toArray(),
      yaw: rig.yaw, pitch: rig.pitch, t: rig.orbit.target.toArray(),
    }));
  } catch {}
};
setInterval(savePos, 500);
addEventListener('pagehide', savePos);
addEventListener('visibilitychange', () => { if (document.hidden) savePos(); });

let peopleOn = true;
buildUI({
  onMode: m => {
    rig.setMode(m);
    syncClipPlanes();
    if (m === 'orbit') { rig.teleport(NET_POS, NET_TARGET); return; }
    if (m === 'walk') {
      // land on whatever surface is under the camera; over a void, go home
      const fl = rig.floorAt(camera.position.x, camera.position.z, camera.position.y + 0.5);
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir); dir.y = 0;
      if (dir.lengthSq() < 0.01) dir.set(0, 0, -1); else dir.normalize();
      const pos = fl.y > -Infinity && camera.position.y - fl.y < 30
        ? new THREE.Vector3(camera.position.x, fl.y + 1.62, camera.position.z)
        : WALK_HOME.clone();
      rig.teleport(pos, pos.clone().add(dir));
    }
  },
  onClip: applyClip,
  onLevelVisible: (id, v) => { levelUserOn[id] = v; applyLevelVis(id); },
  onGoto: (id, vp) => {
    if (!vp) return;
    if (rig.mode === 'orbit') rig.orbit.target.copy(vp.look);
    rig.teleport(vp.pos, vp.look);
  },
  onLabels: v => { labelsOn = v; },
  onAudio: v => { v ? audio.enable() : audio.disable(); },
  onPeople: v => {
    peopleOn = v;
    passengers.group.visible = v;
  },
  onSpeed: v => { speed = v; },
  floorAt: (x, z, y) => rig.floorAt(x, z, y),
  capsuleFree: (x, z, feet) => {
    const [nx, nz] = rig.resolve(x, z, feet + 0.02, 1.7, x, z);
    return Math.hypot(nx - x, nz - z) < 0.05;
  },
});

// keep the mode buttons honest after a restored pose
document.querySelectorAll('#mode-buttons button').forEach(b =>
  b.classList.toggle('active', b.dataset.mode === rig.mode));

// browsers gate audio behind a user gesture — flip Sound on at the first one
const wakeAudio = () => {
  const cb = document.getElementById('toggle-audio');
  if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
};
window.addEventListener('pointerdown', wakeAudio, { once: true });
window.addEventListener('keydown', wakeAudio, { once: true });

// ---------- level hover info ----------
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const crossPt = new THREE.Vector3();
let dragging = false;
renderer.domElement.addEventListener('pointermove', e => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});
let dragHold = 0;   // seconds of low-res left after the pointer releases
renderer.domElement.addEventListener('pointerdown', () => { dragging = true; dragHold = 0.45; showInfo(null); });
renderer.domElement.addEventListener('wheel', () => { dragHold = 0.3; }, { passive: true });
addEventListener('pointerup', () => { dragging = false; });
addEventListener('pointercancel', () => { dragging = false; });
let hoverT = 0;
function updatePick(dt) {
  hoverT += dt;
  if (rig.mode !== 'orbit' || dragging || hoverT < 0.12) {
    if (rig.mode !== 'orbit' || dragging) showInfo(null);
    return;
  }
  hoverT = 0;
  ray.setFromCamera(mouse, camera);
  // pick volumes are stacked boxes that overlap in screen space — the level
  // is decided by the hit point's height band, not by which box was hit.
  // With a section cut the visible surface sits ON the clip plane, so the
  // ray/plane crossing (nearer than any kept box face) wins.
  const plane = clipAxis !== 'none' ? clipPlanes[clipAxis] : null;
  let kept = null;
  for (const h of ray.intersectObjects(pickMeshes, false)) {
    if (plane && plane.distanceToPoint(h.point) < -0.01) continue;
    kept = h;
    break;
  }
  let pt = null;
  if (plane && kept) {
    const c = ray.ray.intersectPlane(plane, crossPt);
    if (c && ray.ray.origin.distanceTo(c) < kept.distance) pt = c;
  }
  if (!pt && kept) pt = kept.point;
  if (!pt) { showInfo(null); return; }
  const l = LVL_OF[levelBoxAt(pt)];
  if (!l) { showInfo(null); return; }
  showInfo(`<span class="zh">${l.station === 'ADM' ? '' : l.station + ' · '}${l.id} ${l.zh}</span><span class="en">${l.en}</span>`);
}

// ---------- loop ----------
// sim clock: anchored to real Hong Kong time at 1×; fast-forward multipliers
// advance the sim epoch faster so trains, crowds and the clock all speed up
let speed = 1;
let simNow = Date.now();
const simNowFn = () => simNow;
const timer = new THREE.Timer();
let tickerT = 0, escT = 0, peopleAcc = 0, frameNo = 0;
// dynamic resolution — the scene is fill-bound on Retina, so when the frame
// rate sags the pixel ratio steps down (and back up with headroom) to keep
// motion smooth instead of locking at a slow full-res
const PR_STEPS = [1, 0.85, 0.72, 0.6];
let prStep = 0, fpsAvg = 60, prT = 0;
function tick() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = timer.getElapsed();
  const sdt = dt * speed;          // sim-time delta this frame
  simNow += sdt * 1000;
  escT += sdt;
  frameNo++;

  fpsAvg += (1 / Math.max(dt, 0.001) - fpsAvg) * 0.05;
  // while the view is being dragged the averaged governor reacts too late —
  // drop straight to the lowest step for the drag plus a short damping tail
  if (dragging) dragHold = 0.45; else if (dragHold > 0) dragHold -= dt;
  const dragActive = dragging || dragHold > 0;
  if (dragActive) {
    if (prStep !== PR_STEPS.length - 1) {
      prStep = PR_STEPS.length - 1;
      renderer.setPixelRatio(PR_CAP * PR_STEPS[prStep]);
    }
  } else if ((prT += dt) > 1.5) {
    prT = 0;
    if (fpsAvg < 30 && prStep < PR_STEPS.length - 1) renderer.setPixelRatio(PR_CAP * PR_STEPS[++prStep]);
    else if (fpsAvg > 55 && prStep > 0) renderer.setPixelRatio(PR_CAP * PR_STEPS[--prStep]);
  }

  liftSim.update(sdt, rig);   // before rig.update — door barriers + carry feed collision
  rig.update(dt);
  updatePick(dt);
  cullLevels();
  // label/sign sweeps can lag a beat mid-drag — the next idle frame refreshes
  if (!dragActive) { updateLabels(); cullSigns(); }

  // sim
  escSteps.update(escT);
  weather.update(dt, t);
  if (sun.position.distanceToSquared(lastSun) > 4) {   // sun moved — rebake shadows
    renderer.shadowMap.needsUpdate = true;
    lastSun.copy(sun.position);
  }
  passengers.hurry = weather.rainAmt > 0.25;   // people hurry on the street in rain
  audio.setRain?.(weather.rainAmt * (camera.position.y > -3 ? 1 : 0.12));
  audio.setListener?.(rig.mode === 'walk' ? camera.position : rig.orbit.target);
  audio.setCrowd?.(rig.mode === 'walk'
    ? Math.min(passengers.countNear(camera.position.x, rig.feetY, camera.position.z) / 12, 1)
    : 0);
  // riders stay aboard through 'off' legs — the consist carries them
  // through the void to the route's next face (terminus reversal)
  for (const s of trainSim.services) s.hasRider = rig._aboard === s;
  const events = trainSim.update(sdt, audio, simNowFn, speed);
  for (const ev of events) {
    passengers.onTrainEvent(ev, audio);
  }
  busSim.update(sdt, rig);
  // a berthed consist follows its level's visibility; a moving one always
  // shows — without this a train that left a culled level stays invisible
  // when it berths at a visible platform (applyLevelVis only runs on toggles)
  for (const s of trainSim.services) {
    s.train.visible = !s.ds || (levelUserOn[s.ds.level] !== false && !levelFar.has(s.ds.level));
  }
  // the crowd pass is ~10 ms at busy views — tick it on a reduced cadence
  // while dragging (and when fps already sags) so camera motion stays fluid;
  // the accumulated dt keeps everyone's total movement correct
  const cadence = dragActive ? 3 : fpsAvg < 30 ? 2 : 1;
  if (peopleOn) {
    peopleAcc += sdt;
    if (frameNo % cadence === 0) {
      passengers.update(peopleAcc, escT, trainSim, audio,
        rig.mode === 'walk' ? camera.position : rig.orbit.target,
        rig.mode === 'walk' ? 150 : Math.max(250, rig.orbit.getDistance()));
      peopleAcc = 0;
    }
  }
  updateGates(sdt);

  // citybus stop chip — nearest stop kerb within 16 m at street level, or
  // anywhere inside a terminus zone's apron rect (its `area`). Apron
  // membership outranks kerb distance but still resolves nearest-kerb when
  // two termini share an apron (Wah Fu + Cyberport).
  if (rig.mode === 'walk' && !rig._aboard && !rig.aboardBus && !liftSim.inCar && Math.abs(rig.feetY) < 2.5) {
    let near = null, best = Infinity;
    const px = camera.position.x, pz = camera.position.z;
    for (const z of busSim.zones) {
      const dx = z.kerb[0] - px, dz = z.kerb[1] - pz, d2 = dx * dx + dz * dz;
      const inside = z.area && px >= z.area[0] && px <= z.area[2] && pz >= z.area[1] && pz <= z.area[3];
      if (!inside && d2 > 256) continue;
      const score = inside ? d2 * 1e-4 : d2;
      if (score < best) { best = score; near = z; }
    }
    nearStop = near;
  } else nearStop = null;
  showBusStop(nearStop);

  // gate / lift / boarding prompt + ticker + clock refresh
  if (rig.mode === 'walk') {
    if (rig._aboard) {
      const s = rig._aboard;
      const nxt = s.stops[(s.i + (s.state === 'dwell' ? 1 : 0)) % s.stops.length];
      const nm = nxt ? STATIONS[nxt.stn] : null;
      showPrompt(nm
        ? `<span class="zh">乘搭中 — 下一站 ${nm.zh} 開門落車</span><span class="en">On board — next stop ${nm.en}</span>`
        : '<span class="zh">乘搭中 — 下一站開門落車</span><span class="en">On board — doors open at the next stop</span>');
    } else if (liftSim.inCar) {
      const c = liftSim.inCar;
      const lv = levelById(c.levels[c.state === 'dwell' ? liftSim.previewIdx(c) : c.target].uid);
      showPrompt(c.state === 'travel'
        ? `<span class="zh">往 ${lv.id} ${lv.zh}</span><span class="en">To ${lv.id} ${lv.en}</span>`
        : `<span class="zh">按 <b>E</b> 往 ${lv.id} ${lv.zh} · 再按轉層</span><span class="en"><b>E</b> — ${lv.id} ${lv.en} · press again to change floor</span>`);
    } else if (rig.aboardBus) {
      const b = rig.aboardBus;
      const zn = (b.state === 'dwell' ? b.stop?.zoneObj : busSim.nextStop(b).stop?.zoneObj);
      showPrompt(b.state === 'dwell'
        ? `<span class="zh">${zn?.zh ?? ''} — 按 <b>E</b> 落車</span><span class="en">${zn?.en ?? ''} — <b>E</b> to alight</span>`
        : `<span class="zh">乘搭 ${b.route.id} — 下一站 ${zn?.zh ?? ''}</span><span class="en">On ${b.route.id} — next stop ${zn?.en ?? ''}</span>`);
    } else if (rig.nearBus) {
      const b = rig.nearBus, dest = b.route[b.destFor === 'B' ? 'destB' : 'destA'];
      showPrompt(`<span class="zh">按 <b>E</b> 上車 ${b.route.id} 往${dest[0]}</span><span class="en"><b>E</b> — board ${b.route.id} to ${dest[1]}</span>`);
    } else if (rig.nearLift) {
      const here = rig.nearLift.car.state === 'dwell' && rig.nearLift.car.idx === rig.nearLift.idx;
      showPrompt(here
        ? '<span class="zh">升降機門開 — 入內按 <b>E</b> 揀層</span><span class="en">Lift doors open — step in, <b>E</b> for the next floor</span>'
        : '<span class="zh">召喚升降機 · 按 <b>E</b></span><span class="en">Call lift — press <b>E</b></span>');
    } else {
      showPrompt(rig.nearGate && gateBlocks(rig.nearGate)
        ? '<span class="zh">拍卡進站 · 按 <b>E</b></span><span class="en">Tap Octopus card — press <b>E</b></span>' : null);
    }
  } else showPrompt(null);

  tickerT += dt;
  if (tickerT > 0.5) {
    tickerT = 0;
    updateTitle();
    // board shows only the station you're looking at — the full network's
    // faces grew to an unreadable wall of rows
    updateTicker(trainSim.board().filter(r => r.ds.level.split(':')[0] === titleStn),
      trainSim.tt.live, simNow);
    updateClock(simNow, speed);
  }

  // scene traversal is frozen — refresh only the roots that actually moved
  for (const o of dynRoots) o.updateMatrixWorld();
  renderer.render(scene, camera);
  labelRenderer.render(labelScene, camera);
  requestAnimationFrame(tick);
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});
