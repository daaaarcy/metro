import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GATES, PSD_BAYS, FITTINGS, LIFT_DOORS } from './registry.js';
import { psdBlocked } from './anim/trains.js';
import { buildColliders, sweepMove, CELL } from './colliders.js';
import { gateBlocks, nearestGate, openGate } from './anim/gates.js';
import { worldToBox, boxToWorld, levelById, BOXES } from './station-data.js';
import { BAY } from './builders/platforms.js';

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
    this.nearLift = null;        // set by LiftSim — landing the player could call
    this._inLift = null;         // lift car the player is riding
    this.onLiftTap = null;
    this.trains = null;            // TrainSim — injected by main for boarding
    this._aboard = null;           // service whose car the player is inside

    this.orbit = new OrbitControls(camera, dom);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.maxPolarAngle = Math.PI * 0.52;

    this.yaw = 0; this.pitch = 0;
    this.keys = new Set();
    this.vy = 0;
    this.feetY = camera.position.y - EYE;
    this._last = null;
    this._fly = null;

    // static collision world (built once by initColliders)
    this.solidAABBs = [];
    this.solidOBBs = [];   // rotated solids can't use world AABBs — they'd sweep huge areas
    this.floors = [];
    this.ramps = [];

    // walk-mode look: hold the mouse button and drag (hover does nothing —
    // pointer lock was tried and rolled back for being too twitchy)
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
    const endDrag = () => { this._drag = null; };
    dom.addEventListener('pointerup', endDrag);
    dom.addEventListener('pointercancel', endDrag);
    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (e.code === 'KeyE' && this.mode === 'walk') {
        if (this.nearGate) {
          openGate(this.nearGate, this.audio);
          this.onGateTap?.(this.nearGate);
        } else if (this.nearLift || this._inLift) this.onLiftTap?.();
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
    this.fgrid = col.fgrid;
    this.grid = col.grid;
    this.colliders = col;
    // dynamic barriers bucketed by floor height — the player only ever meets
    // the ones on the level they're standing on (same trick as the peds)
    this._gatesByY = new Map();
    for (const g of GATES) {
      const gy0 = g.level ? levelById(g.level).y : -7;
      // the y-banded rect resolve() used to spread-allocate every frame —
      // gate geometry and floor height are static, so bake it once here
      g._rectEx = { x0: g.rect.x0, x1: g.rect.x1, z0: g.rect.z0, z1: g.rect.z1, y0: gy0 - 0.5, y1: gy0 + 2 };
      const gy = Math.round(gy0);
      let a = this._gatesByY.get(gy);
      if (!a) this._gatesByY.set(gy, a = []);
      a.push(g);
    }
    this._baysByY = new Map();
    for (const b of PSD_BAYS) {
      const by = Math.round(b.y0 + 0.5);
      let a = this._baysByY.get(by);
      if (!a) this._baysByY.set(by, a = []);
      a.push(b);
    }
    // rescueTracks scans the track-bearing levels every frame — bake the
    // level lookups once
    this._trackLvls = Object.keys(FITTINGS).map(uid => {
      const l = levelById(uid);
      return { ly: l.y, bx: BOXES[l.box], sets: FITTINGS[uid].doorSets };
    });
    this._wlp = {};          // scratch for worldToBox/boxToWorld
    this._wlp2 = {};
    // per-frame scratch — resolve/floorAt run every tick; fresh arrays per
    // call were ~10 small allocations a frame of pure GC churn
    this._aabbs = []; this._obbs = []; this._obbsAll = [];
    this._gateRects = []; this._gatesScr = []; this._baysScr = [];
    this._sm = [0, 0]; this._rsv = [0, 0]; this._fl = { y: -Infinity, ramp: null };
    this._tc = [0, 0, -Infinity]; this._rt = [0, 0];
  }

  // entries of a y-bucketed map within band metres of feet
  _bands(map, feet, band, out) {
    for (let k = Math.floor(feet - band); k <= Math.ceil(feet + band); k++) {
      const arr = map.get(k);
      if (arr) for (const e of arr) out.push(e);
    }
    return out;
  }

  rampY(r, x, z) {
    const run = r.run;
    const t = THREE.MathUtils.clamp(((x - run.x1) * run.dx + (z - run.z1) * run.dz) / run.len, 0, 1);
    return run.y1 - t * run.drop;
  }

  // highest floor surface at (x,z) not above maxY; -Infinity if none.
  // Queries the walkable grid — a couple of cells instead of every floor
  // rect and ramp in the network.
  floorAt(x, z, maxY) {
    let best = -Infinity, onRamp = null;
    const c0x = Math.floor((x - RADIUS) / CELL), c1x = Math.floor((x + RADIUS) / CELL);
    const c0z = Math.floor((z - RADIUS) / CELL), c1z = Math.floor((z + RADIUS) / CELL);
    for (let cx = c0x; cx <= c1x; cx++) {
      for (let cz = c0z; cz <= c1z; cz++) {
        const arr = this.fgrid.get(cx + ',' + cz);
        if (!arr) continue;
        for (const ent of arr) {
          if (ent.f) {
            const f = ent.f;
            if (x >= f.x0 - RADIUS && x <= f.x1 + RADIUS && z >= f.z0 - RADIUS && z <= f.z1 + RADIUS) {
              if (f.top <= maxY && f.top > best) best = f.top;
            }
          } else {
            const r = ent.r;
            // ramp footprint is an OBB — test the point in its local frame
            const lx = (x - r.cx) * r.cos - (z - r.cz) * r.sin;
            const lz = (x - r.cx) * r.sin + (z - r.cz) * r.cos;
            if (Math.abs(lx) <= r.hx + RADIUS && Math.abs(lz) <= r.hz + RADIUS) {
              const y = this.rampY(r, x, z);
              if (y <= maxY && y > best) { best = y; onRamp = r; }
            }
          }
        }
      }
    }
    const fl = this._fl; fl.y = best; fl.ramp = onRamp;
    return fl;
  }

  // push a circle (px,pz,r) out of solid AABBs overlapping [feet, feet+h].
  // (ox,oz) = previous position — swept clamp stops thin glass/panels being
  // tunneled through on a big frame step.
  resolve(px, pz, feet, h, ox = px, oz = pz) {
    // nearby solids from the shared spatial grid — duplicates across cell
    // boundaries are harmless since every clamp below is idempotent
    const aabbs = this._aabbs, obbs = this._obbs;
    aabbs.length = obbs.length = 0;
    const c0x = Math.floor((Math.min(px, ox) - RADIUS) / CELL), c1x = Math.floor((Math.max(px, ox) + RADIUS) / CELL);
    const c0z = Math.floor((Math.min(pz, oz) - RADIUS) / CELL), c1z = Math.floor((Math.max(pz, oz) + RADIUS) / CELL);
    for (let cx = c0x; cx <= c1x; cx++) {
      for (let cz = c0z; cz <= c1z; cz++) {
        const arr = this.grid.get(cx + ',' + cz);
        if (!arr) continue;
        for (const ent of arr) (ent.a ? aabbs : obbs).push(ent.a || ent.o);
      }
    }
    const gateRects = this._gateRects, gates = this._gatesScr;
    gateRects.length = gates.length = 0;
    this._bands(this._gatesByY, feet, 1.35, gates);
    for (const g of gates) {
      if (!gateBlocks(g)) continue;
      gateRects.push(g._rectEx);
    }
    // closed PSD door bays are barriers too — open only while a consist
    // dwells there with doors open (psdBlocked), so the edge stays sealed
    const bayList = this._baysScr; bayList.length = 0;
    this._bands(this._baysByY, feet, 1.85, bayList);
    let bayN = 0;
    for (const b of bayList) if (psdBlocked(b)) bayList[bayN++] = b;
    bayList.length = bayN;
    // closed lift landing doors are barriers too — a doorway opens only
    // where the car is berthed with its doors parted
    for (const d of LIFT_DOORS) {
      if (d.open > 0.55) continue;
      if (d.y1 < feet + 0.25 || d.y0 > feet + h) continue;
      gateRects.push(d);
    }
    const obbAll = this._obbsAll; obbAll.length = 0;
    for (const o of obbs) obbAll.push(o);
    for (const b of bayList) obbAll.push(b);
    [px, pz] = sweepMove(aabbs, obbAll, gateRects, ox, oz, px, pz, feet, h, RADIUS, this._sm);
    for (let iter = 0; iter < 3; iter++) {
      for (const s of aabbs) {
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
      for (const s of obbs) {
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
      // closed gates block too (each gate knows its level's floor height)
      for (const g of gates) {
        if (!gateBlocks(g)) continue;
        const s = g.rect;
        const nx = Math.max(s.x0, Math.min(px, s.x1));
        const nz = Math.max(s.z0, Math.min(pz, s.z1));
        const dx = px - nx, dz = pz - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= RADIUS * RADIUS || d2 < 1e-9) continue;
        const d = Math.sqrt(d2);
        px = nx + dx / d * RADIUS; pz = nz + dz / d * RADIUS;
      }
      // closed PSD bays need a persistent push-out, not just the swept
      // clamp — that one snaps to the razor edge of the hit zone, which
      // FP reads as "inside" next frame and the wall stops existing.
      // Always eject to the platform side, never into the track.
      if (bayList) {
        for (const b of bayList) {
          const lx = (px - b.cx) * b.cos - (pz - b.cz) * b.sin;
          const lz = (px - b.cx) * b.sin + (pz - b.cz) * b.cos;
          if (Math.abs(lx) >= b.hx + RADIUS || Math.abs(lz) >= b.hz + RADIUS) continue;
          const side = Math.sign(b.ds.z - (b.ds.track.z0 + b.ds.track.z1) / 2) || 1;
          const lz2 = side * (b.hz + RADIUS + 1e-3);
          px = b.cx + lx * b.cos + lz2 * b.sin;
          pz = b.cz - lx * b.sin + lz2 * b.cos;
        }
      }
    }
    const rsv = this._rsv; rsv[0] = px; rsv[1] = pz;
    return rsv;
  }

  // Dynamic train/platform-door constraints — runs in each consist's live
  // frame (u = signed distance from car centre, + = platform side):
  //  · aboard a car: floor + walls + end caps; carried by the train's motion
  //    (consists move between stations — the frame follows the consist)
  //  · doorway corridor at a stop: floored only while dwelling with doors open
  //  · otherwise the bays seal and hold the player on the platform side
  constrainTrains(px, pz) {
    const tc = this._tc;
    let floor = -Infinity;
    if (!this.trains) { tc[0] = px; tc[1] = pz; tc[2] = floor; return tc; }
    let sawAboard = false;
    for (const svc of this.trains.services) {
      const ds = svc.ds;                       // null while running between stops
      const lvlY = svc.floorY - 0.08;
      if (ds == null && this._aboard !== svc) continue;
      if (ds != null && Math.abs(this.feetY - lvlY) > 2.5 && this._aboard !== svc) continue;
      const zc = svc.zc, dSide = svc.doorSide, halfLen = svc.trainLen / 2;
      const INNER = 1.2, OUTER = 1.5;
      const psdU = ds ? (ds.z - zc) * dSide : INNER + 0.4;
      const open = svc.state === 'dwell' && svc.open > 0.55;
      const inBay = x => ds && ds.xs.some(b => Math.abs(x - b) < BAY / 2 + 0.05);
      const put = () => { const w = boxToWorld(svc.bx, lp.x, lp.z, this._wlp2); px = w.x; pz = w.z; };

      // carry a rider by the consist's full frame delta — translation AND
      // rotation — BEFORE resolving the local frame. Off-leg arrivals
      // re-place into a new box and run-frames yaw through tunnel curves,
      // so a stale pre-carry position reads far outside and drops the rider
      let lp = worldToBox(svc.bx, px, pz, this._wlp);
      if (this._aboard === svc && (svc.dwx || svc.dwz || svc.drot)) {
        const ox = px - (svc.train.position.x - svc.dwx);
        const oz = pz - (svc.train.position.z - svc.dwz);
        const c = Math.cos(svc.drot), s = Math.sin(svc.drot);
        px = svc.train.position.x + ox * c + oz * s;
        pz = svc.train.position.z - ox * s + oz * c;
        lp = worldToBox(svc.bx, px, pz, this._wlp);
      }
      let relX = lp.x - svc.tx;
      let u = (lp.z - zc) * dSide;
      const inX = Math.abs(relX) < halfLen - 0.45;

      // a rider stays aboard unless they're stepping out through an open
      // bay while berthed — a consist on the move carries and contains them
      // unconditionally (no dead zone between the car wall and the range
      // check for them to be dropped through)
      const exiting = this._aboard === svc && ds && open && u > INNER + 0.1 && inX && inBay(lp.x);
      if (this._aboard === svc && !exiting) {
        sawAboard = true;
        floor = Math.max(floor, svc.floorY);
        const maxX = halfLen - 0.55;
        if (relX > maxX) lp.x = svc.tx + maxX;
        else if (relX < -maxX) lp.x = svc.tx - maxX;
        const lim = INNER - RADIUS + 0.12;
        if (Math.abs(lp.z - zc) > lim && !(open && u > 0 && inBay(lp.x))) {
          lp.z = zc + Math.sign(lp.z - zc) * lim;
        }
        put();
        continue;
      }
      if (Math.abs(relX) > halfLen + 4 || u < -2.5 || u > psdU + 3) continue;

      // ended up on the track bed — recover to the platform edge
      if (ds && this.feetY < lvlY - 0.5) {
        lp.z = zc + dSide * (psdU + RADIUS + 0.3);
        floor = Math.max(floor, lvlY);
        put();
        continue;
      }
      if (ds == null) continue;   // running — no corridor to interact with

      // doorway corridor: floored only while a stopped train dwells with
      // doors open — every other state seals the corridor to platform side
      const inCorridor = u > INNER - RADIUS && u <= psdU + RADIUS + 0.15;
      if (inCorridor && open && inX) {
        floor = Math.max(floor, lvlY + 0.08);
        if (u <= INNER - RADIUS + 0.12 && inBay(lp.x)) this._aboard = svc;
        else if (!inBay(lp.x) && u <= OUTER + RADIUS) {
          lp.z = zc + dSide * (OUTER + RADIUS);
          put();
        }
      } else if (inCorridor) {
        lp.z = zc + dSide * (psdU + RADIUS + 0.02);
        put();
      }
      if (this._aboard === svc) sawAboard = u <= psdU + RADIUS;
    }
    if (this._aboard && !sawAboard) this._aboard = null;
    tc[0] = px; tc[1] = pz; tc[2] = floor;
    return tc;
  }

  // Ended up on a track bed (past an end-wall portal) — put back on the
  // nearest platform edge of that trough. Skipped while aboard a consist.
  rescueTracks(px, pz) {
    const rt = this._rt;
    if (this._aboard || this.feetY > -1) { rt[0] = px; rt[1] = pz; return rt; }
    for (const t of this._trackLvls) {
      if (this.feetY > t.ly - 0.6 || this.feetY < t.ly - 4) continue;
      const lp = worldToBox(t.bx, px, pz, this._wlp);
      for (const ds of t.sets) {
        const tr = ds.track;
        if (!tr) continue;
        if (lp.x < tr.x0 || lp.x > tr.x1 || lp.z < tr.z0 || lp.z > tr.z1) continue;
        // put back on the platform side of this door set's PSD plane
        const sgn = Math.sign(ds.z - (tr.z0 + tr.z1) / 2) || 1;
        lp.z = ds.z + sgn * (RADIUS + 0.25);
        const w = boxToWorld(t.bx, lp.x, lp.z, this._wlp2);
        this.feetY = t.ly; this.vy = 0;
        rt[0] = w.x; rt[1] = w.z;
        return rt;
      }
    }
    rt[0] = px; rt[1] = pz;
    return rt;
  }

  setMode(mode) {
    this.mode = mode;
    this.orbit.enabled = mode === 'orbit';
    this._drag = null;
    this._vx = this._vz = 0;
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
    const v = this._v || (this._v = new THREE.Vector3());
    v.set(0, 0, 0);
    if (k.has('KeyW') || k.has('ArrowUp')) v.z -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) v.z += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) v.x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) v.x += 1;

    // ---- walk ----
    const boost = k.has('ShiftLeft') || k.has('ShiftRight') ? 1.9 : 1;
    // velocity is smoothed, not instant — a ~80 ms ramp kills the start/stop/
    // strafe jerk while staying responsive (exp decay = frame-rate independent)
    let tvx = 0, tvz = 0;
    if (v.lengthSq() > 0) {
      v.y = 0;
      v.applyQuaternion(this.camera.quaternion);
      v.y = 0; v.normalize();
      tvx = v.x * 4.08 * boost;
      tvz = v.z * 4.08 * boost;
    }
    const ease = 1 - Math.exp(-dt * 12);
    this._vx = (this._vx || 0) + (tvx - this._vx) * ease;
    this._vz = (this._vz || 0) + (tvz - this._vz) * ease;
    if (tvx === 0 && tvz === 0 && this._vx * this._vx + this._vz * this._vz < 0.002) {
      this._vx = this._vz = 0;      // settle fully — no asymptotic creep
    }
    let mx = this._vx * dt, mz = this._vz * dt;

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
    [px, pz] = this.resolve(px, pz, this.feetY, 1.7, this.camera.position.x, this.camera.position.z);
    const tc = this.constrainTrains(px, pz);
    px = tc[0]; pz = tc[1];
    [px, pz] = this.rescueTracks(px, pz);
    this.camera.position.x = px;
    this.camera.position.z = pz;

    // floor snap + gravity (train interior/corridor adds dynamic floors)
    const fl = this.floorAt(px, pz, this.feetY + STEP_MAX);
    const floorY = Math.max(fl.y, tc[2]);
    if (floorY > -Infinity && this.feetY <= floorY + 0.08 && this.vy <= 0) {
      this.feetY = floorY; this.vy = 0;
    } else {
      this.vy -= GRAVITY * dt;
      this.feetY += this.vy * dt;
      if (floorY > -Infinity && this.feetY < floorY) { this.feetY = floorY; this.vy = 0; }
      if (this.feetY < -60) {                    // fell out of the world — back to concourse
        this.feetY = -7; this.vy = 0;
        this.camera.position.set(-20, -7 + EYE, 0);
      }
    }
    this.camera.position.y = this.feetY + EYE;

    // octopus gate prompt — the nearest lane on the level we're standing on
    const ng = nearestGate(px, pz, 2.4, this.feetY);
    this.nearGate = ng && Math.abs(this.feetY - (ng.level ? levelById(ng.level).y : -7)) < 1.4 ? ng : null;
  }
}
