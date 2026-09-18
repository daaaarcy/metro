import * as THREE from 'three';
import { GATES } from '../registry.js';
import { levelById } from '../station-data.js';
import { flapMat, FLAP_LEN } from '../builders/props.js';

const OPEN_TIME = 3.2;   // seconds the flaps stay open after a tap
const SWING = 1.35;      // radians the paddles fold back

// Octopus gate state: open fraction per lane, auto-close timer.
export function openGate(gate, audio) {
  if (gate.timer > 0) return;
  gate.timer = OPEN_TIME;
  audio?.octopusBeep(gate);
}

const _m = new THREE.Matrix4(), _t = new THREE.Matrix4();

// paddle matrix in level-local space: hinge translate × swing × panel offset
function writeFlap(f, open) {
  _m.makeRotationY(f.dir * open * SWING);
  _m.setPosition(f.x, f.y, f.z);
  _m.multiply(_t.makeTranslation(f.s * -FLAP_LEN / 2, 0, 0));
  f.inst.setMatrixAt(f.idx, _m);
}

// one InstancedMesh of swing paddles per level group — hides/shows with the
// level like the old per-flap meshes did, but costs one draw call per bank.
// The level bucketing doubles as the nearestGate index.
let _byLevel = null;
const _lvlY = new Map();          // uid -> floor y, avoids LEVELS.find per frame
export function initGateFlaps(levelGroups) {
  const geo = new THREE.BoxGeometry(FLAP_LEN, 0.8, 0.06);
  const byLevel = _byLevel = new Map();
  for (const g of GATES) {
    if (!g.level) continue;
    let arr = byLevel.get(g.level);
    if (!arr) byLevel.set(g.level, arr = []);
    arr.push(g);
  }
  for (const [uid, gates] of byLevel) {
    _lvlY.set(uid, levelById(uid).y);
    const grp = levelGroups[uid];
    if (!grp) continue;
    const inst = new THREE.InstancedMesh(geo, flapMat, gates.length * 2);
    inst.frustumCulled = false;   // geometry bounds cover one paddle, not the bank
    inst.castShadow = false;
    grp.add(inst);
    gates.forEach((g, gi) => g.flaps.forEach((f, fi) => {
      f.inst = inst; f.idx = gi * 2 + fi;
      writeFlap(f, 0);
    }));
    inst.instanceMatrix.needsUpdate = true;
  }
}

export function updateGates(dt) {
  for (const g of GATES) {
    if (g.timer <= 0 && g.open === 0) continue;   // shut and still — most lanes
    if (g.timer > 0) g.timer -= dt;
    const target = g.timer > 0 ? 1 : 0;
    g.open += Math.sign(target - g.open) * Math.min(Math.abs(target - g.open), dt * 3.2);
    if (g.open !== g._applied) {
      g._applied = g.open;
      for (const f of g.flaps) if (f.inst) { writeFlap(f, g.open); f.inst.instanceMatrix.needsUpdate = true; }
    }
  }
}

// Is the lane blocking right now? (closed = solid)
export function gateBlocks(g) { return g.open < 0.6; }

// nearest gate lane to a world point within maxDist — when feetY is given,
// only lanes on the level we're standing on count (stacked concourses put
// gates at identical x/z on different floors)
export function nearestGate(x, z, maxDist = 2.2, feetY = null) {
  let best = null, bd = maxDist;
  if (feetY !== null && _byLevel) {
    for (const [uid, arr] of _byLevel) {
      if (Math.abs(feetY - _lvlY.get(uid)) > 1.4) continue;
      for (const g of arr) {
        const d = Math.hypot(x - g.x, z - g.z);
        if (d < bd) { bd = d; best = g; }
      }
    }
    return best;
  }
  for (const g of GATES) {
    if (feetY !== null && g.level && Math.abs(feetY - levelById(g.level).y) > 1.4) continue;
    const d = Math.hypot(x - g.x, z - g.z);
    if (d < bd) { bd = d; best = g; }
  }
  return best;
}
