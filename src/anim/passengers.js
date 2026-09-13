import * as THREE from 'three';
import { ESC_RUNS, GATES } from '../registry.js';
import { WALK_RECTS, BOXES, levelById, boxToWorld, worldToBox } from '../station-data.js';
import { pointInRects, worldRectToLocal } from '../builders/structure.js';
import { openGate } from './gates.js';

const N_LEVELS = { L1: 62, L2: 46, L3: 46, L4: 26, L5: 26, L6: 20 };
const SPEED = [0.9, 1.5];   // walk speed range m/s

// cheap point-in-rect for a sampled segment
function pathClear(x0, z0, x1, z1, holes) {
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    if (pointInRects(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, holes)) return false;
  }
  return true;
}

export class Passengers {
  constructor(scene, openings) {
    // per-level holes in LOCAL frame (for path checks)
    this.holes = {};
    for (const id of Object.keys(N_LEVELS)) {
      const bx = BOXES[levelById(id).box];
      this.holes[id] = (openings[id] || []).map(wr => worldRectToLocal(bx, wr));
    }
    this.boxOf = {};
    for (const id of Object.keys(N_LEVELS)) this.boxOf[id] = BOXES[levelById(id).box];
    this.hidden = new Set();

    this.list = [];
    for (const [lvl, n] of Object.entries(N_LEVELS)) {
      for (let i = 0; i < n; i++) this.list.push(this.spawn(lvl));
    }

    this.max = 320;
    const bodyGeo = new THREE.CylinderGeometry(0.17, 0.2, 1.18, 6);
    const headGeo = new THREE.SphereGeometry(0.15, 8, 6);
    this.bodies = new THREE.InstancedMesh(bodyGeo,
      new THREE.MeshStandardMaterial({ roughness: 0.8 }), this.max);
    this.heads = new THREE.InstancedMesh(headGeo,
      new THREE.MeshStandardMaterial({ color: 0xd8b49a, roughness: 0.7 }), this.max);
    this.bodies.frustumCulled = this.heads.frustumCulled = false;
    this.bodies.count = this.heads.count = this.list.length;
    const palette = [0x3a6ea5, 0xc65b4e, 0x4e8a5a, 0x8a6db0, 0xbf9b30, 0x555b62, 0x9e5f7e, 0x2e8a8a];
    for (let i = 0; i < this.max; i++) {
      this.bodies.setColorAt(i, new THREE.Color(palette[i % palette.length]));
    }
    this.bodies.instanceColor.needsUpdate = true;
    scene.add(this.bodies, this.heads);

    this._m4 = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._up = new THREE.Vector3(0, 1, 0);
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._zero = new THREE.Matrix4().makeScale(0, 0, 0);
  }

  spawn(level, x, z) {
    const rects = WALK_RECTS[level];
    const r = rects[Math.floor(Math.random() * rects.length)];
    return {
      level,
      x: x ?? THREE.MathUtils.lerp(r.x0 + 1, r.x1 - 1, Math.random()),
      z: z ?? THREE.MathUtils.lerp(r.z0 + 1, r.z1 - 1, Math.random()),
      tx: 0, tz: 0, speed: THREE.MathUtils.lerp(...SPEED, Math.random()),
      state: 'idle', wait: Math.random() * 2, run: null, s: 0, gate: null,
      hideT: 0, yaw: Math.random() * Math.PI * 2, svc: null,
    };
  }

  setLevelVisible(id, v) { v ? this.hidden.delete(id) : this.hidden.add(id); }

  // pick a destination: mostly wander; sometimes ride an escalator or cross a gate
  choose(p) {
    const lvl = p.level;
    const roll = Math.random();

    if (roll < 0.22) {
      // find a rideable escalator from this level
      const opts = ESC_RUNS.filter(r =>
        (r.going === 'down' && r.from === lvl) || (r.going === 'up' && r.to === lvl));
      if (opts.length) {
        const run = opts[Math.floor(Math.random() * opts.length)];
        const top = run.going === 'down';
        const ex = top ? run.x1 - run.dx * 1.1 : run.x2 + run.dx * 1.1;
        const ez = top ? run.z1 - run.dz * 1.1 : run.z2 + run.dz * 1.1;
        const l = worldToBox(this.boxOf[lvl], ex, ez);
        p.run = run; p.rideTop = top;
        p.tx = l.x; p.tz = l.z; p.state = 'toEsc';
        return;
      }
    }
    if (lvl === 'L1' && roll < 0.4) {
      const g = GATES[Math.floor(Math.random() * GATES.length)];
      if (g) {
        const approach = p.z < g.z ? -1 : 1;       // approach side
        p.gate = g; p.gateSide = approach;
        p.tx = g.x; p.tz = g.z + approach * 1.7;
        p.state = 'toGate';
        return;
      }
    }
    // wander
    const rects = WALK_RECTS[lvl];
    for (let tries = 0; tries < 6; tries++) {
      const r = rects[Math.floor(Math.random() * rects.length)];
      const tx = THREE.MathUtils.lerp(r.x0 + 1, r.x1 - 1, Math.random());
      const tz = THREE.MathUtils.lerp(r.z0 + 1, r.z1 - 1, Math.random());
      if (pointInRects(tx, tz, this.holes[lvl])) continue;
      if (!pathClear(p.x, p.z, tx, tz, this.holes[lvl])) continue;
      p.tx = tx; p.tz = tz; p.state = 'walk';
      return;
    }
    p.state = 'idle'; p.wait = 1 + Math.random() * 3;
  }

  onTrainEvent(ev, audio) {
    if (ev.type !== 'dwell') return;
    const svc = ev.service, lvl = ev.level;
    const inside = svc.doorWorld(4, -1.6);   // just inside the car
    const out = svc.doorWorld(4, 1.6);       // just outside on the platform
    // passengers alight: spawn inside the car, walk out through the door bay
    const nAlight = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < nAlight && inside.length; i++) {
      const li = worldToBox(this.boxOf[lvl], inside[i % inside.length].x, inside[i % inside.length].z);
      const lo = worldToBox(this.boxOf[lvl], out[i % out.length].x, out[i % out.length].z);
      const p = this.spawn(lvl, li.x, li.z);
      p.tx = lo.x; p.tz = lo.z; p.state = 'walk';
      p.wait = 0;
      this.list.push(p);
    }
    // passengers already near a doorway head in and board — dwell is short,
    // so anyone farther than ~20 m would never make it before departure
    const localOut = out.map(d => worldToBox(this.boxOf[lvl], d.x, d.z));
    const near = this.list.filter(p => p.level === lvl &&
      !['aboard', 'esc', 'board', 'boarding', 'toEsc', 'throughGate'].includes(p.state) &&
      localOut.some(d => Math.hypot(p.x - d.x, p.z - d.z) < 20));
    for (let i = 0; i < Math.min(6, near.length); i++) {
      const p = near[Math.floor(Math.random() * near.length)];
      const di = Math.floor(Math.random() * inside.length);
      const li = worldToBox(this.boxOf[lvl], inside[di].x, inside[di].z);
      const lo = worldToBox(this.boxOf[lvl], out[di].x, out[di].z);
      p.svc = svc;
      p.door = { ox: lo.x, oz: lo.z, ix: li.x, iz: li.z };
      p.tx = lo.x; p.tz = lo.z; p.state = 'board';
    }
    this.cap();
  }

  cap() {
    // keep the crowd bounded: recycle 'aboard' passengers
    while (this.list.length > this.max - 4) {
      const i = this.list.findIndex(p => p.state === 'aboard');
      if (i < 0) break;
      this.list.splice(i, 1);
    }
  }

  update(dt, t, trainSim, audio) {
    const m4 = this._m4, q = this._q, pv = this._p;
    const count = Math.min(this.list.length, this.max);
    this.bodies.count = this.heads.count = count;

    for (let i = 0; i < count; i++) {
      const p = this.list[i];
      let visible = !this.hidden.has(p.level);

      switch (p.state) {
        case 'aboard':
          visible = false;
          p.hideT -= dt;
          if (p.hideT <= 0) {
            // reappear at the concourse as if they travelled and returned
            const np = this.spawn('L1');
            Object.assign(p, np);
          }
          break;
        case 'idle':
          p.wait -= dt;
          if (p.wait <= 0) this.choose(p);
          break;
        case 'toGate': {
          if (this.stepTo(p, dt)) {
            openGate(p.gate, audio);
            p.state = 'throughGate';
          }
          break;
        }
        case 'throughGate': {
          // walk through once the flaps open
          if (!p.gate || p.gate.open < 0.7) break;
          const goal = p.gate.z - p.gateSide * 2.0;
          p.tz = goal;
          if (this.stepTo(p, dt, p.gate.x)) { p.state = 'seek'; }
          break;
        }
        case 'toEsc': {
          if (this.stepTo(p, dt)) {
            p.state = 'esc';
            p.s = p.rideTop ? 0 : p.run.slopeLen;
          }
          break;
        }
        case 'esc': {
          const run = p.run;
          const d = p.rideTop ? 1 : -1;
          p.s += d * (0.55 + 0.15 * Math.sin(t * 2 + i)) * dt;
          const done = p.rideTop ? p.s >= run.slopeLen - 0.4 : p.s <= 0.4;
          const cosA = run.len / run.slopeLen, sinA = run.drop / run.slopeLen;
          const hx = Math.max(0, Math.min(run.slopeLen, p.s)) * cosA;
          const wx = run.x1 + run.dx * hx, wz = run.z1 + run.dz * hx;
          const l = worldToBox(this.boxOf[p.level], wx, wz);
          p.x = l.x; p.z = l.z;
          p.yaw = -Math.atan2(run.dz * d, run.dx * d);
          if (done) {
            p.level = p.rideTop ? run.to : run.from;
            p.state = 'seek'; p.run = null;
          }
          break;
        }
        case 'board': {
          // train left before they reached the door — give up and wander off
          if (p.svc && p.svc.state !== 'dwell') {
            p.state = 'idle'; p.wait = 0.3; p.svc = null; break;
          }
          if (this.stepTo(p, dt)) {
            // at the doorway — step through the open bay into the car
            p.tx = p.door.ix; p.tz = p.door.iz; p.state = 'boarding';
          }
          break;
        }
        case 'boarding': {
          if (p.svc && (p.svc.state !== 'dwell' || p.svc.open < 0.5)) {
            p.state = 'idle'; p.wait = 0.3; p.svc = null; break;
          }
          if (this.stepTo(p, dt)) {
            p.state = 'aboard'; p.hideT = 25 + Math.random() * 40; p.svc = null;
          }
          break;
        }
        default:   // 'walk' / 'seek'
          if (this.stepTo(p, dt)) { p.state = 'idle'; p.wait = 0.5 + Math.random() * 2.5; }
      }

      if (!visible) {
        this.bodies.setMatrixAt(i, this._zero);
        this.heads.setMatrixAt(i, this._zero);
        continue;
      }
      const bx = this.boxOf[p.level];
      const w = boxToWorld(bx, p.x, p.z);
      const wy = levelById(p.level).y;
      q.setFromAxisAngle(this._up, p.yaw);
      pv.set(w.x, wy + 0.62, w.z);
      m4.compose(pv, q, this._s);
      this.bodies.setMatrixAt(i, m4);
      pv.y = wy + 1.42;
      m4.compose(pv, q, this._s);
      this.heads.setMatrixAt(i, m4);
    }
    this.bodies.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
  }

  // move local (x,z) toward (tx,tz); returns true on arrival
  stepTo(p, dt, fixedX) {
    const gx = fixedX ?? p.tx, gz = p.tz;
    const dx = gx - p.x, dz = gz - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.25) return true;
    const v = p.speed * dt;
    p.x += dx / d * v; p.z += dz / d * v;
    p.yaw = -Math.atan2(dz, dx) + Math.PI / 2;   // body cylinder axis-aligned; face travel dir
    return false;
  }
}
