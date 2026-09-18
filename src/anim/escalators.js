import * as THREE from 'three';
import { ESC_RUNS } from '../registry.js';
import { M } from '../builders/materials.js';

const STEP_LEN = 0.4;      // step pitch along the slope (real M-Train pitch ~0.4 m)
const STEP_H = 0.22;       // step block height — covers the riser between treads
const SPEED = 0.6;         // m/s along the slope
const SINK = 0.55;         // end zones where steps fold under the comb
const TICK = 1 / 30;       // 0.6 m/s × 1/30 s = 2 cm/tick — reads smooth

// Instanced moving steps for every escalator run in ESC_RUNS. Each tread stays
// HORIZONTAL like a real escalator — consecutive treads step up/down forming
// the staircase, not a smooth belt. A second instanced mesh draws the yellow
// demarcation strip on each tread's downhill edge (sloped runs only).
export class EscalatorSteps {
  constructor() {
    this.hidden = new Set();          // level ids currently toggled off
    this.instances = [];              // {run, phase, strip}
    let total = 0;
    for (const run of ESC_RUNS) total += Math.ceil(run.slopeLen / STEP_LEN) + 1;
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(STEP_LEN * 0.96, STEP_H, ESC_RUNS[0] ? ESC_RUNS[0].w - 0.1 : 1.0),
      M.stepMetal, total);
    this.stripMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.055, 0.016, ESC_RUNS[0] ? ESC_RUNS[0].w - 0.12 : 0.9),
      M.tactile, total);
    this.mesh.frustumCulled = this.stripMesh.frustumCulled = false;
    let i = 0, j = 0;
    for (const run of ESC_RUNS) {
      const n = Math.ceil(run.slopeLen / STEP_LEN) + 1;
      const sloped = run.drop > 0.05;
      run.stepRange = [i, i + n];
      run.stripRange = [j, j + (sloped ? n : 0)];
      // slope trig + yaw never change — bake them once
      run._cosA = run.len / run.slopeLen;
      run._sinA = run.drop / run.slopeLen;
      run._q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(run.dz, run.dx));
      for (let k = 0; k < n; k++) {
        this.instances.push({ run, phase: k * STEP_LEN, strip: sloped ? j++ : -1 });
      }
      i += n;
    }
    this.mesh.count = this.instances.length;
    this.stripMesh.count = j;
    this._m4 = new THREE.Matrix4();
    this._hide = new THREE.Matrix4().makeScale(0, 0, 0);
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._lastT = -1;
  }

  setLevelVisible(levelId, visible) {
    if (visible) {
      this.hidden.delete(levelId);
      for (const run of ESC_RUNS) if (run.from === levelId) run._hid = false;
    } else {
      this.hidden.add(levelId);
    }
    this._lastT = -1;   // force a pass so the hide writes land immediately
  }

  update(t) {
    if (t - this._lastT < TICK) return;
    this._lastT = t;
    const m4 = this._m4, p = this._p, hide = this._hide;
    const e = STEP_LEN * 0.96 / 2 - 0.028;   // strip offset to the downhill tread edge
    let wroteSteps = false, wroteStrips = false;
    for (let i = 0; i < this.instances.length; i++) {
      const { run, phase, strip } = this.instances[i];
      if (this.hidden.has(run.from)) {
        // blank the run's instance range once, not every frame
        if (!run._hid) {
          run._hid = true;
          for (let k = run.stepRange[0]; k < run.stepRange[1]; k++) this.mesh.setMatrixAt(k, hide);
          for (let k = run.stripRange[0]; k < run.stripRange[1]; k++) this.stripMesh.setMatrixAt(k, hide);
          wroteSteps = wroteStrips = true;
        }
        continue;
      }
      const dir = run.going === 'down' ? 1 : -1;
      let s = (phase + dir * t * SPEED) % run.slopeLen;
      if (s < 0) s += run.slopeLen;
      const hx = s * run._cosA;
      let topY = run.y1 - s * run._sinA + 0.02;   // tread surface rides just above the ramp line
      if (s < SINK) topY -= (SINK - s) * 0.7;
      else if (s > run.slopeLen - SINK) topY -= (s - (run.slopeLen - SINK)) * 0.7;
      // tread stays horizontal — yaw only; the staircase look comes from the
      // vertical offset between consecutive horizontal treads
      p.set(run.x1 + run.dx * hx, topY - STEP_H / 2, run.z1 + run.dz * hx);
      m4.compose(p, run._q, this._s);
      this.mesh.setMatrixAt(i, m4);
      wroteSteps = true;
      if (strip >= 0) {
        // yellow demarcation on the tread's downhill edge (+u), just proud of the surface
        p.set(run.x1 + run.dx * (hx + e * run._cosA), topY + 0.008 - e * run._sinA,
          run.z1 + run.dz * (hx + e * run._cosA));
        m4.compose(p, run._q, this._s);
        this.stripMesh.setMatrixAt(strip, m4);
        wroteStrips = true;
      }
    }
    if (wroteSteps) this.mesh.instanceMatrix.needsUpdate = true;
    if (wroteStrips) this.stripMesh.instanceMatrix.needsUpdate = true;
  }
}
