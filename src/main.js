import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildStation, computeOpenings } from './station.js';
import { LEVELS, BOXES, worldToBox } from './station-data.js';
import { CameraRig } from './controls.js';
import { buildUI, showInfo, showPrompt, updateTicker } from './ui.js';
import { EscalatorSteps } from './anim/escalators.js';
import { TrainSim } from './anim/trains.js';
import { Passengers } from './anim/passengers.js';
import { updateGates, gateBlocks } from './anim/gates.js';
import { StationAudio } from './audio.js';
import { buildColliders } from './colliders.js';
import { Weather } from './weather.js';

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
scene.fog = new THREE.Fog(0x11151c, 320, 720);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1200);
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
const { root, levelGroups, togglables, labels } = buildStation();
scene.add(root);
root.updateMatrixWorld(true);
// one collision world shared by the player rig and the pedestrians
const colliders = buildColliders();

// ground context — a big dark disc with a rectangular excavation hole over
// the station footprint, so orbit views show the underground stack instead
// of an opaque lid. Shape XY maps to world X,-Z after the -90° X rotation.
const groundShape = new THREE.Shape();
groundShape.absarc(0, 0, 500, 0, Math.PI * 2);
const dig = new THREE.Path();
dig.moveTo(-105, -49); dig.lineTo(105, -49);
dig.lineTo(105, 41); dig.lineTo(-105, 41); dig.closePath();
groundShape.holes.push(dig);
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
scene.add(escSteps.mesh);
const trainSim = new TrainSim(scene);
const passengers = new Passengers(scene, computeOpenings(), colliders);
const audio = new StationAudio();
// live Hong Kong weather drives the above-ground sky, light and rain
const weather = new Weather(scene, sun, hemi, ambient, ground);

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
function levelAtY(y) {
  for (const l of sortedLevels) if (y >= l.y - 1.2) return l.id;
  return sortedLevels[sortedLevels.length - 1].id;
}
// which level's box (if any) contains the point — handles rotated boxes
function levelBoxAt(p) {
  for (const lvl of LEVELS) {
    const bx = BOXES[lvl.box];
    if (!bx) continue;
    if (p.y < lvl.y - 0.3 || p.y > lvl.y + 6.9) continue;
    const l = worldToBox(bx, p.x, p.z);
    if (Math.abs(l.x) < bx.len / 2 && Math.abs(l.z) < bx.wid / 2) return lvl.id;
  }
  return null;
}
function exposedLevel(id) {
  const lvl = LEVELS.find(l => l.id === id);
  if (!lvl) return true;
  return LEVELS.some(l => l.y > lvl.y + 1 && levelGroups[l.id] && !levelGroups[l.id].visible);
}
function updateLabels() {
  const camLvl = levelAtY(camera.position.y);
  const inside = rig.mode === 'orbit' ? levelBoxAt(camera.position) : null;
  for (const o of labelObjs) {
    const lvl = o.userData.level;
    if (!labelsOn || (lvl && levelGroups[lvl] && !levelGroups[lvl].visible)) { o.visible = false; continue; }
    if (!lvl) { o.visible = true; continue; }
    if (rig.mode !== 'orbit') { o.visible = lvl === camLvl; continue; }
    if (clipAxis === 'y') {
      // a level is only exposed once the slab covering it is cut — the floor
      // of the next level up. U1/G (i<2) have nothing above them.
      const i = sortedLevels.findIndex(l => l.id === lvl);
      const coverY = i > 1 ? sortedLevels[i - 1].y : Infinity;
      o.visible = clipConst < coverY && o.position.y < clipConst + 0.5;
      continue;
    }
    if (clipAxis === 'x') { o.visible = o.position.x < clipConst; continue; }
    if (clipAxis === 'z') { o.visible = o.position.z < clipConst; continue; }
    o.visible = inside ? lvl === inside : (lvl === 'U1' || lvl === 'G' || exposedLevel(lvl));
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
const clipRange = { x: 130, y: [50, -55], z: 95 };
let clipAxis = 'none', clipConst = Infinity;
// section cuts are an orbit-mode inspection tool — in walk mode the planes
// would decapitate street-level geometry, so they're suppressed (the UI
// selection is kept and re-applied on return to orbit)
function syncClipPlanes() {
  renderer.clippingPlanes = (rig.mode === 'orbit' && clipAxis !== 'none')
    ? [clipPlanes[clipAxis]] : [];
}
function applyClip(axis, t) {
  clipAxis = axis;
  if (axis === 'none') { syncClipPlanes(); clipConst = Infinity; return; }
  const p = clipPlanes[axis];
  p.constant = axis === 'y'
    ? THREE.MathUtils.lerp(clipRange.y[1], clipRange.y[0], t)
    : THREE.MathUtils.lerp(-clipRange[axis], clipRange[axis], t);
  clipConst = p.constant;
  syncClipPlanes();
}

// ---------- controls ----------
const rig = new CameraRig(camera, renderer.domElement);
rig.audio = audio;
rig.initColliders(colliders);
window.__rig = rig; window.__cam = camera; window.__trains = trainSim; window.__people = passengers; window.__weather = weather;
const HOME_POS = new THREE.Vector3(105, 55, 118);
const HOME_TARGET = new THREE.Vector3(5, -16, 12);
// walk mode is the default — spawn at street level facing the exit pavilions
const WALK_HOME = new THREE.Vector3(-30, 1.62, 26);
const WALK_LOOK = new THREE.Vector3(-10, 1, -6);
rig.orbit.target.copy(HOME_TARGET);
camera.position.copy(WALK_HOME);
camera.lookAt(WALK_LOOK);
rig.setMode('walk');

let peopleOn = true;
buildUI({
  onMode: m => {
    rig.setMode(m);
    syncClipPlanes();
    if (m === 'orbit') { rig.teleport(HOME_POS, HOME_TARGET); return; }
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
    for (const s of trainSim.services) if (s.ds.level === id) s.train.visible = v;
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
});

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
  const l = LEVELS.find(l => l.id === levelAtY(pt.y));
  if (!l) { showInfo(null); return; }
  showInfo(`<span class="zh">${l.id} ${l.zh}</span><span class="en">${l.en}</span>`);
}

// ---------- loop ----------
const timer = new THREE.Timer();
let tickerT = 0;
function tick() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = timer.getElapsed();

  rig.update(dt);
  updatePick(dt);
  updateLabels();

  // sim
  escSteps.update(t);
  weather.update(dt, t);
  passengers.hurry = weather.rainAmt > 0.25;   // people hurry on the street in rain
  audio.setRain?.(weather.rainAmt * (camera.position.y > -3 ? 1 : 0.12));
  const events = trainSim.update(dt, audio);
  for (const ev of events) passengers.onTrainEvent(ev, audio);
  if (peopleOn) passengers.update(dt, t, trainSim, audio);
  updateGates(dt);

  // gate prompt + ticker refresh
  if (rig.mode === 'walk') {
    showPrompt(rig.nearGate && gateBlocks(rig.nearGate)
      ? '拍卡進站 · Tap Octopus card — press <b>E</b>' : null);
  } else showPrompt(null);

  tickerT += dt;
  if (tickerT > 0.5) { tickerT = 0; updateTicker(trainSim.services, trainSim.tt.live); }

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
