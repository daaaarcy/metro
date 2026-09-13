import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GATES } from './registry.js';
import { buildColliders } from './colliders.js';
import { gateBlocks, nearestGate, openGate } from './anim/gates.js';

const EYE = 1.62, RADIUS = 0.35, STEP_MAX = 0.42, GRAVITY = 22;

// Camera modes:
//  'orbit' — OrbitControls exterior view
//  'walk'  — first-person with gravity, collision, escalator riding
export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.mode = 'orbit';
    this.audio = null;           // injected by main for gate beeps
    this.onGateTap = null;
    this.nearGate = null;

    this.orbit = new OrbitControls(camera, dom);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.maxPolarAngle = Math.PI * 0.52;

    this.yaw = 0; this.pitch = 0;
    this.keys = new Set();
    this.vy = 0;
    this.feetY = camera.position.y - EYE;
    this._drag = null;
    this._fly = null;

    // static collision world (built once by initColliders)
    this.solidAABBs = [];
    this.solidOBBs = [];   // rotated solids can't use world AABBs — they'd sweep huge areas
    this.floors = [];
    this.ramps = [];

    dom.addEventListener('pointerdown', e => {
      if (this.mode === 'orbit') return;
      this._drag = { x: e.clientX, y: e.clientY };
      dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', e => {
      if (!this._drag || this.mode === 'orbit') return;
      this.yaw -= (e.clientX - this._drag.x) * 0.0032;
      this.pitch = THREE.MathUtils.clamp(this.pitch - (e.clientY - this._drag.y) * 0.0032, -1.45, 1.45);
      this._drag = { x: e.clientX, y: e.clientY };
    });
    dom.addEventListener('pointerup', () => { this._drag = null; });
    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (e.code === 'KeyE' && this.mode === 'walk' && this.nearGate) {
        openGate(this.nearGate, this.audio);
        this.onGateTap?.(this.nearGate);
      }
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
  }

  // Build/attach static collision data — call once after the station is in
  // the scene. Shares the world built in colliders.js (callers may inject a
  // prebuilt index so pedestrians resolve against the same data).
  initColliders(col = buildColliders()) {
    this.solidAABBs = col.solidAABBs;
    this.solidOBBs = col.solidOBBs;
    this.floors = col.floors;
    this.ramps = col.ramps;
    this.colliders = col;
  }

  rampY(r, x, z) {
    const run = r.run;
    const t = THREE.MathUtils.clamp(((x - run.x1) * run.dx + (z - run.z1) * run.dz) / run.len, 0, 1);
    return run.y1 - t * run.drop;
  }

  // highest floor surface at (x,z) not above maxY; -Infinity if none
  floorAt(x, z, maxY) {
    let best = -Infinity, onRamp = null;
    for (const f of this.floors) {
      if (x >= f.x0 - RADIUS && x <= f.x1 + RADIUS && z >= f.z0 - RADIUS && z <= f.z1 + RADIUS) {
        if (f.top <= maxY && f.top > best) best = f.top;
      }
    }
    for (const r of this.ramps) {
      // ramp footprint is an OBB — test the point in its local frame
      const lx = (x - r.cx) * r.cos - (z - r.cz) * r.sin;
      const lz = (x - r.cx) * r.sin + (z - r.cz) * r.cos;
      if (Math.abs(lx) <= r.hx + RADIUS && Math.abs(lz) <= r.hz + RADIUS) {
        const y = this.rampY(r, x, z);
        if (y <= maxY && y > best) { best = y; onRamp = r; }
      }
    }
    return { y: best, ramp: onRamp };
  }

  // push a circle (px,pz,r) out of solid AABBs overlapping [feet, feet+h]
  resolve(px, pz, feet, h) {
    for (let iter = 0; iter < 3; iter++) {
      for (const s of this.solidAABBs) {
        if (s.y1 < feet + 0.25 || s.y0 > feet + h) continue;
        const nx = Math.max(s.x0, Math.min(px, s.x1));
        const nz = Math.max(s.z0, Math.min(pz, s.z1));
        const dx = px - nx, dz = pz - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= RADIUS * RADIUS) continue;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2);
          px = nx + dx / d * RADIUS; pz = nz + dz / d * RADIUS;
        } else {
          // centre inside the box — push out along smallest axis
          const pushes = [
            [s.x1 + RADIUS - px, 1, 0], [px - (s.x0 - RADIUS), -1, 0],
            [s.z1 + RADIUS - pz, 0, 1], [pz - (s.z0 - RADIUS), 0, -1],
          ];
          pushes.sort((a, b) => a[0] - b[0]);
          px += pushes[0][1] * pushes[0][0];
          pz += pushes[0][2] * pushes[0][0];
        }
      }
      // rotated solids — circle vs OBB in the box's local XZ frame
      for (const s of this.solidOBBs) {
        if (s.y1 < feet + 0.25 || s.y0 > feet + h) continue;
        const lx = (px - s.cx) * s.cos - (pz - s.cz) * s.sin;
        const lz = (px - s.cx) * s.sin + (pz - s.cz) * s.cos;
        const nx = Math.max(-s.hx, Math.min(lx, s.hx));
        const nz = Math.max(-s.hz, Math.min(lz, s.hz));
        const dx = lx - nx, dz = lz - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= RADIUS * RADIUS) continue;
        let ox, oz;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2);
          ox = nx + dx / d * RADIUS; oz = nz + dz / d * RADIUS;
        } else {
          const pushes = [
            [s.hx + RADIUS - lx, 1, 0], [lx + s.hx + RADIUS, -1, 0],
            [s.hz + RADIUS - lz, 0, 1], [lz + s.hz + RADIUS, 0, -1],
          ];
          pushes.sort((a, b) => a[0] - b[0]);
          ox = lx + pushes[0][1] * pushes[0][0];
          oz = lz + pushes[0][2] * pushes[0][0];
        }
        px = s.cx + ox * s.cos + oz * s.sin;
        pz = s.cz - ox * s.sin + oz * s.cos;
      }
      // closed gates block too
      for (const g of GATES) {
        if (!gateBlocks(g)) continue;
        const s = g.rect;
        if (feet > -6.4 || feet < -7.8) continue;   // gates only exist at L1 height
        const nx = Math.max(s.x0, Math.min(px, s.x1));
        const nz = Math.max(s.z0, Math.min(pz, s.z1));
        const dx = px - nx, dz = pz - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= RADIUS * RADIUS || d2 < 1e-9) continue;
        const d = Math.sqrt(d2);
        px = nx + dx / d * RADIUS; pz = nz + dz / d * RADIUS;
      }
    }
    return [px, pz];
  }

  setMode(mode) {
    this.mode = mode;
    this.orbit.enabled = mode === 'orbit';
    if (mode !== 'orbit') {
      const e = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.yaw = e.y; this.pitch = e.x;
      this.vy = 0;
      this.feetY = this.camera.position.y - EYE;
    }
  }

  teleport(pos, look) {
    this._fly = {
      p0: this.camera.position.clone(), p1: pos.clone(),
      q0: this.camera.quaternion.clone(),
      q1: new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(pos, look, new THREE.Vector3(0, 1, 0))),
      t: 0,
    };
    if (this.mode === 'orbit') this.orbit.target.copy(look);
  }

  update(dt) {
    if (this._fly) {
      const f = this._fly;
      f.t = Math.min(1, f.t + dt * 1.6);
      const k = f.t * f.t * (3 - 2 * f.t);
      this.camera.position.lerpVectors(f.p0, f.p1, k);
      this.camera.quaternion.slerpQuaternions(f.q0, f.q1, k);
      if (f.t >= 1) {
        this._fly = null;
        const e = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        this.yaw = e.y; this.pitch = e.x;
        if (this.mode === 'walk') {
          const fl = this.floorAt(this.camera.position.x, this.camera.position.z, this.camera.position.y);
          this.feetY = fl.y === -Infinity ? this.camera.position.y - EYE : fl.y;
          this.vy = 0;
        }
      }
      return;
    }
    if (this.mode === 'orbit') { this.orbit.update(); return; }

    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    const k = this.keys;
    const v = new THREE.Vector3();
    if (k.has('KeyW') || k.has('ArrowUp')) v.z -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) v.z += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) v.x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) v.x += 1;

    // ---- walk ----
    const boost = k.has('ShiftLeft') || k.has('ShiftRight') ? 1.9 : 1;
    let mx = 0, mz = 0;
    if (v.lengthSq() > 0) {
      const move = new THREE.Vector3(v.x, 0, v.z).applyQuaternion(this.camera.quaternion);
      move.y = 0; move.normalize();
      mx = move.x * 3.4 * boost * dt;
      mz = move.z * 3.4 * boost * dt;
    }

    // escalator carry: standing on a moving ramp drags you along
    const fl0 = this.floorAt(this.camera.position.x, this.camera.position.z, this.feetY + STEP_MAX);
    if (fl0.ramp && fl0.ramp.carry && Math.abs(this.feetY - fl0.y) < 0.3) {
      const run = fl0.ramp.run;
      const dir = run.going === 'down' ? 1 : -1;
      mx += run.dx * dir * 0.55 * dt;
      mz += run.dz * dir * 0.55 * dt;
    }

    let px = this.camera.position.x + mx;
    let pz = this.camera.position.z + mz;
    [px, pz] = this.resolve(px, pz, this.feetY, 1.7);
    this.camera.position.x = px;
    this.camera.position.z = pz;

    // floor snap + gravity
    const fl = this.floorAt(px, pz, this.feetY + STEP_MAX);
    if (fl.y > -Infinity && this.feetY <= fl.y + 0.08 && this.vy <= 0) {
      this.feetY = fl.y; this.vy = 0;
    } else {
      this.vy -= GRAVITY * dt;
      this.feetY += this.vy * dt;
      if (fl.y > -Infinity && this.feetY < fl.y) { this.feetY = fl.y; this.vy = 0; }
      if (this.feetY < -60) {                    // fell out of the world — back to concourse
        this.feetY = -7; this.vy = 0;
        this.camera.position.set(-20, -7 + EYE, 0);
      }
    }
    this.camera.position.y = this.feetY + EYE;

    // octopus gate prompt
    this.nearGate = (Math.abs(this.feetY + 7) < 1.2)
      ? nearestGate(px, pz, 2.4) : null;
  }
}
