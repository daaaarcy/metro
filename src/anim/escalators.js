import * as THREE from 'three';
import { ESC_RUNS } from '../registry.js';
import { M } from '../builders/materials.js';

const STEP_LEN = 0.4;      // step pitch along the slope
const SPEED = 0.6;         // m/s along the slope
const SINK = 0.55;         // end zones where steps fold under the comb

// Instanced moving steps for every escalator run in ESC_RUNS.
export class EscalatorSteps {
  constructor() {
    this.hidden = new Set();          // level ids currently toggled off
    this.instances = [];              // {run, phase}
    let total = 0;
    for (const run of ESC_RUNS) total += Math.ceil(run.slopeLen / STEP_LEN) + 1;
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(STEP_LEN * 0.92, 0.16, ESC_RUNS[0] ? ESC_RUNS[0].w - 0.1 : 1.0),
      M.stepMetal, total);
    this.mesh.frustumCulled = false;
    let i = 0;
    for (const run of ESC_RUNS) {
      const n = Math.ceil(run.slopeLen / STEP_LEN) + 1;
      run.stepRange = [i, i + n];
      for (let k = 0; k < n; k++) this.instances.push({ run, phase: k * STEP_LEN });
      i += n;
    }
    this.mesh.count = this.instances.length;
    this._m4 = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._q = new THREE.Quaternion();
    this._qYaw = new THREE.Quaternion();
    this._qPitch = new THREE.Quaternion();
    this._up = new THREE.Vector3(0, 1, 0);
    this._zAxis = new THREE.Vector3(0, 0, 1);
  }

  setLevelVisible(levelId, visible) {
    visible ? this.hidden.delete(levelId) : this.hidden.add(levelId);
  }

  update(t) {
    const m4 = this._m4, p = this._p, q = this._q;
    for (let i = 0; i < this.instances.length; i++) {
      const { run, phase } = this.instances[i];
      if (this.hidden.has(run.from)) {
        m4.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, m4);
        continue;
      }
      const dir = run.going === 'down' ? 1 : -1;
      let s = (phase + dir * t * SPEED) % run.slopeLen;
      if (s < 0) s += run.slopeLen;
      const cosA = run.len / run.slopeLen, sinA = run.drop / run.slopeLen;
      const hx = s * cosA;
      let y = run.y1 - s * sinA + 0.02;   // step tops ride just above the ramp line
      if (s < SINK) y -= (SINK - s) * 0.7;
      else if (s > run.slopeLen - SINK) y -= (s - (run.slopeLen - SINK)) * 0.7;
      p.set(run.x1 + run.dx * hx, y, run.z1 + run.dz * hx);
      this._qYaw.setFromAxisAngle(this._up, -Math.atan2(run.dz, run.dx));
      this._qPitch.setFromAxisAngle(this._zAxis, -Math.atan2(run.drop, run.len));
      q.copy(this._qYaw).multiply(this._qPitch);
      m4.compose(p, q, this._s);
      this.mesh.setMatrixAt(i, m4);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
