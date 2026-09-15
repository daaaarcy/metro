import * as THREE from 'three';
import { ESC_RUNS } from '../registry.js';
import { M } from '../builders/materials.js';

const STEP_LEN = 0.4;      // step pitch along the slope (real M-Train pitch ~0.4 m)
const STEP_H = 0.22;       // step block height — covers the riser between treads
const SPEED = 0.6;         // m/s along the slope
const SINK = 0.55;         // end zones where steps fold under the comb

// Instanced moving steps for every escalator run in ESC_RUNS. Each tread stays
// HORIZONTAL like a real escalator — consecutive treads step up/down forming
// the staircase, not a smooth belt. A second instanced mesh draws the yellow
// demarcation strip on each tread's downhill edge (sloped runs only).
export class EscalatorSteps {
  constructor() {
    this.hidden = new Set();          // level ids currently toggled off
    this.instances = [];              // {run, phase}
    this.strips = [];                 // subset on sloped runs — {inst}
    let total = 0;
    for (const run of ESC_RUNS) total += Math.ceil(run.slopeLen / STEP_LEN) + 1;
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(STEP_LEN * 0.96, STEP_H, ESC_RUNS[0] ? ESC_RUNS[0].w - 0.1 : 1.0),
      M.stepMetal, total);
    this.stripMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.055, 0.016, ESC_RUNS[0] ? ESC_RUNS[0].w - 0.12 : 0.9),
      M.tactile, total);
    this.mesh.frustumCulled = this.stripMesh.frustumCulled = false;
    let i = 0;
    for (const run of ESC_RUNS) {
      const n = Math.ceil(run.slopeLen / STEP_LEN) + 1;
      run.stepRange = [i, i + n];
      for (let k = 0; k < n; k++) {
        this.instances.push({ run, phase: k * STEP_LEN });
        if (run.drop > 0.05) this.strips.push({ inst: i + k });
      }
      i += n;
    }
    this.mesh.count = this.instances.length;
    this.stripMesh.count = this.strips.length;
    this._m4 = new THREE.Matrix4();
    this._hide = new THREE.Matrix4().makeScale(0, 0, 0);
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._q = new THREE.Quaternion();
    this._up = new THREE.Vector3(0, 1, 0);
  }

  setLevelVisible(levelId, visible) {
    visible ? this.hidden.delete(levelId) : this.hidden.add(levelId);
  }

  // step s along the run -> {hx, topY}: horizontal offset + tread-top height
  _pos(run, phase, t) {
    const dir = run.going === 'down' ? 1 : -1;
    let s = (phase + dir * t * SPEED) % run.slopeLen;
    if (s < 0) s += run.slopeLen;
    const cosA = run.len / run.slopeLen, sinA = run.drop / run.slopeLen;
    const hx = s * cosA;
    let topY = run.y1 - s * sinA + 0.02;      // tread surface rides just above the ramp line
    if (s < SINK) topY -= (SINK - s) * 0.7;
    else if (s > run.slopeLen - SINK) topY -= (s - (run.slopeLen - SINK)) * 0.7;
    return { hx, topY, cosA, sinA };
  }

  update(t) {
    const m4 = this._m4, p = this._p, q = this._q, hide = this._hide;
    for (let i = 0; i < this.instances.length; i++) {
      const { run, phase } = this.instances[i];
      if (this.hidden.has(run.from)) {
        this.mesh.setMatrixAt(i, hide);
        continue;
      }
      const { hx, topY } = this._pos(run, phase, t);
      // tread stays horizontal — yaw only; the staircase look comes from the
      // vertical offset between consecutive horizontal treads
      p.set(run.x1 + run.dx * hx, topY - STEP_H / 2, run.z1 + run.dz * hx);
      q.setFromAxisAngle(this._up, -Math.atan2(run.dz, run.dx));
      m4.compose(p, q, this._s);
      this.mesh.setMatrixAt(i, m4);
    }
    // yellow demarcation on each tread's downhill edge (sloped runs only)
    for (let j = 0; j < this.strips.length; j++) {
      const i = this.strips[j].inst;
      const { run, phase } = this.instances[i];
      if (this.hidden.has(run.from)) {
        this.stripMesh.setMatrixAt(j, hide);
        continue;
      }
      const { hx, topY, cosA, sinA } = this._pos(run, phase, t);
      // strip sits on the tread's downhill edge (+u), just proud of the surface
      const e = STEP_LEN * 0.96 / 2 - 0.028;
      p.set(run.x1 + run.dx * (hx + e * cosA), topY + 0.008 - e * sinA,
        run.z1 + run.dz * (hx + e * cosA));
      q.setFromAxisAngle(this._up, -Math.atan2(run.dz, run.dx));
      m4.compose(p, q, this._s);
      this.stripMesh.setMatrixAt(j, m4);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.stripMesh.instanceMatrix.needsUpdate = true;
  }
}
