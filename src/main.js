import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildStation, computeOpenings } from './station.js';
import { LEVELS, BOXES, STATIONS, worldToBox } from './station-data.js';
import { CameraRig } from './controls.js';
import { buildUI, showInfo, showPrompt, updateTicker, updateClock } from './ui.js';
import { EscalatorSteps } from './anim/escalators.js';
import { TrainSim } from './anim/trains.js';
import { Passengers } from './anim/passengers.js';
import { updateGates, gateBlocks } from './anim/gates.js';
import { LiftSim } from './anim/lifts.js';
import { StationAudio } from './audio.js';
import { buildColliders } from './colliders.js';
import { Weather } from './weather.js';
import { mergeStation } from './merge.js';
import { buildCity } from './builders/city.js';
import { GATES, ESC_RUNS } from './registry.js';

// ---------- renderer ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
root.updateMatrixWorld(true);
// one collision world shared by the player rig and the pedestrians
const colliders = buildColliders();
// collapse ~3.5k static meshes into one draw call per material per level —
// colliders are already snapshotted; instanced/dynamic meshes are untouched
mergeStation(scene, root, levelGroups, togglables);

// ground context — a big dark disc spanning all five stations with a
// rectangular excavation hole over each station footprint, so orbit views
// show the underground stacks instead of an opaque lid. Shape XY maps to
// world X,-Z after the -90° X rotation.
const groundShape = new THREE.Shape();
groundShape.absarc(-200, 0, 2100, 0, Math.PI * 2);
for (const [x0, x1, z0, z1] of [[-105, 105, -49, 41],       // Admiralty
                                [-1150, -950, -57, 57],     // Central
                                [-1615, -1345, -67, 67],    // Hong Kong
                                [785, 975, -33, 33],        // Wan Chai
                                [1578, 1822, -33, 33]]) {   // Causeway Bay
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

// ---------- simulation ----------
const escSteps = new EscalatorSteps();
scene.add(escSteps.mesh, escSteps.stripMesh);
const trainSim = new TrainSim(scene);
const liftSim = new LiftSim(scene, liftDefs, colliders.floors);
const passengers = new Passengers(scene, computeOpenings(), colliders);
const audio = new StationAudio();
// live Hong Kong weather drives the above-ground sky, light and rain
const weather = new Weather(scene, sun, hemi, ambient, ground);

// the sun rides the sky dome slowly — rebake the shadow map only when it
// actually moves instead of re-rendering ~2.6k casters every frame.
// Instanced meshes are the dynamic things (crowd, PSD leaves, esc steps) —
// a throttled map would freeze their shadows mid-motion, so they don't cast.
renderer.shadowMap.autoUpdate = false;
scene.traverse(o => { if (o.isInstancedMesh) o.castShadow = false; });
for (const g of GATES) for (const f of g.flaps) f.pivot.traverse(o => { o.castShadow = false; });
const lastSun = new THREE.Vector3(Infinity, Infinity, Infinity);

// ---------- CSS2D labels ----------
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
  root.add(o);
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
const EXT_TYPES = new Set(['ground', 'checkin', 'bridge']);
function levelAtY(y) {
  for (const l of sortedLevels) if (y >= l.y - 1.2) return l.uid;
  return sortedLevels[sortedLevels.length - 1].uid;
}
// which level's box (if any) contains the point — handles rotated boxes
function levelBoxAt(p) {
  for (const lvl of LEVELS) {
    const bx = BOXES[lvl.box];
    if (!bx) continue;
    if (p.y < lvl.y - 0.3 || p.y > lvl.y + 6.9) continue;
    const l = worldToBox(bx, p.x, p.z);
    if (Math.abs(l.x) < bx.len / 2 && Math.abs(l.z) < bx.wid / 2) return lvl.uid;
  }
  return null;
}
// ---------- masthead follows the station you're in / looking at ----------
// walk → the level box containing the player; orbit → the look-target.
// In the link corridor or in free space, the nearest station centre wins.
const titleZh = document.querySelector('#masthead h1 .zh');
const titleEn = document.querySelector('#masthead h1 .en');
const STN_CX = Object.fromEntries(Object.values(STATIONS)
  .map(s => [s.id, BOXES[Object.keys(s.boxes)[0]].cx]));
let titleStn = '';
function updateTitle() {
  const pt = rig.mode === 'walk' ? camera.position : rig.orbit.target;
  const uid = levelBoxAt(pt);
  let stn = uid ? uid.split(':')[0] : null;
  if (!stn) {
    let bd = Infinity;
    for (const [id, cx] of Object.entries(STN_CX)) {
      const d = Math.abs(pt.x - cx); if (d < bd) { bd = d; stn = id; }
    }
  }
  if (stn === titleStn) return;
  titleStn = stn;
  const s = STATIONS[stn];
  titleZh.textContent = `${s.zh}站`;
  titleEn.textContent = `${s.en} Station`;
  document.title = `${s.zh}站 ${s.en} Station — 3D Layout`;
}

// a level is "exposed" once a level above it *at the same station* is hidden
function exposedLevel(uid) {
  const lvl = LEVELS.find(l => l.uid === uid);
  if (!lvl) return true;
  return LEVELS.some(l => l.station === lvl.station && l.y > lvl.y + 1
    && levelGroups[l.uid] && !levelGroups[l.uid].visible);
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
      const me = LEVELS.find(l => l.uid === lvl);
      const coverY = me ? Math.min(...LEVELS.filter(l => l.station === me.station && l.y > me.y + 1).map(l => l.y), Infinity) : Infinity;
      o.visible = clipConst < coverY && o.position.y < clipConst + 0.5;
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
  m.renderOrder = -1;
  scene.add(m);
  pickMeshes.push(m);
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
window.__rig = rig; window.__cam = camera; window.__trains = trainSim; window.__people = passengers;
window.__lifts = liftSim;
window.__escRuns = ESC_RUNS; window.__weather = weather; window.__renderer = renderer;
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
  onLevelVisible: (id, v) => {
    if (levelGroups[id]) levelGroups[id].visible = v;
    (togglables[id] || []).forEach(o => (o.visible = v));
    escSteps.setLevelVisible(id, v);
    passengers.setLevelVisible(id, v);
    for (const s of trainSim.services) if (s.ds?.level === id) s.train.visible = v;
  },
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
renderer.domElement.addEventListener('pointerdown', () => { dragging = true; showInfo(null); });
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
  const l = LEVELS.find(l => l.uid === levelBoxAt(pt));
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
let tickerT = 0, escT = 0;
function tick() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = timer.getElapsed();
  const sdt = dt * speed;          // sim-time delta this frame
  simNow += sdt * 1000;
  escT += sdt;

  liftSim.update(sdt, rig);   // before rig.update — door barriers + carry feed collision
  rig.update(dt);
  updatePick(dt);
  updateLabels();

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
  if (peopleOn) passengers.update(sdt, escT, trainSim, audio);
  updateGates(sdt);

  // gate / lift / boarding prompt + ticker + clock refresh
  if (rig.mode === 'walk') {
    if (rig._aboard) {
      showPrompt('<span class="zh">乘搭中 — 下一站開門落車</span><span class="en">On board — doors open at the next stop</span>');
    } else if (liftSim.inCar) {
      showPrompt('<span class="zh">按 <b>E</b> 往下一層 · 或行出升降機</span><span class="en">Press <b>E</b> for the next floor — or step out</span>');
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
    updateTicker(trainSim.board(), trainSim.tt.live, simNow);
    updateClock(simNow, speed);
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});
