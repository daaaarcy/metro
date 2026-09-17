import * as THREE from 'three';
import { ESC_RUNS, GATES, STAIR_RUNS, PSD_BAYS } from '../registry.js';
import { psdBlocked } from './trains.js';
import { WALK_RECTS, BOXES, PEOPLE_N, PAID_CORE, levelById, boxToWorld, worldToBox, concourseId } from '../station-data.js';
import { pointInRects, worldRectToLocal } from '../builders/structure.js';
import { openGate, gateBlocks } from './gates.js';
import { resolvePed, clampRect, clampOBB, PED_RADIUS } from '../colliders.js';
import { rollAppearance, PART_GEO, FACE_DARK } from '../builders/people.js';

const N_LEVELS = PEOPLE_N;   // uid ('ADM:L1' etc.) -> headcount
const SPEED = [0.9, 1.5];   // walk speed range m/s
const IDBOX = { cx: 0, cz: 0, rot: 0 };   // U1 bridge coords are already world axes

// cheap point-in-rect for a sampled segment
function pathClear(x0, z0, x1, z1, holes) {
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    if (pointInRects(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, holes)) return false;
  }
  return true;
}

// articulated instanced body: pivot points in unit-person space (~1.7 m tall,
// faces +Z). Parts swing about their pivot via a local rotation.
const PART_DEFS = {
  legL:  { geo: 'leg',   pivot: [-0.105, 0.88, 0] },
  legR:  { geo: 'leg',   pivot: [0.105, 0.88, 0] },
  footL: { geo: 'foot',  pivot: [-0.105, 0.88, 0] },
  footR: { geo: 'foot',  pivot: [0.105, 0.88, 0] },
  armL:  { geo: 'arm',   pivot: [-0.185, 1.35, 0] },
  armR:  { geo: 'arm',   pivot: [0.185, 1.35, 0] },
  handL: { geo: 'hand',  pivot: [-0.185, 1.35, 0] },
  handR: { geo: 'hand',  pivot: [0.185, 1.35, 0] },
  torso: { geo: 'torso', pivot: [0, 0.84, 0] },
  head:  { geo: 'head',  pivot: [0, 1.44, 0] },
  hair:  { geo: 'hair',  pivot: [0, 1.44, 0] },
  bun:   { geo: 'bun',   pivot: [0, 1.6, -0.09] },
  skirt: { geo: 'skirt', pivot: [0, 0.88, 0] },
  faceD: { geo: 'faceDark', pivot: [0, 1.44, 0] },
  faceS: { geo: 'faceSkin', pivot: [0, 1.44, 0] },
};

// states where the scripted path deliberately crosses a collider face —
// the gate lane, the open PSD bay, a ramp — so collision is skipped
const NOCLIP = new Set(['esc', 'stair', 'aboard', 'board', 'boarding', 'throughGate', 'alight']);
// states that are actively stepping somewhere (stall detection applies)
const MOVING = new Set(['walk', 'toGate', 'throughGate', 'toEsc', 'toStair', 'board', 'boarding', 'alight']);

export class Passengers {
  constructor(scene, openings, colliders) {
    this.col = colliders;
    // per-level holes in LOCAL frame (for path checks)
    this.holes = {};
    for (const id of Object.keys(N_LEVELS)) {
      const bx = BOXES[levelById(id).box] || IDBOX;
      this.holes[id] = (openings[id] || []).map(wr => worldRectToLocal(bx, wr));
    }
    this.boxOf = {};
    for (const id of Object.keys(N_LEVELS)) this.boxOf[id] = BOXES[levelById(id).box] || IDBOX;
    this.hidden = new Set();

    this.list = [];
    for (const [lvl, n] of Object.entries(N_LEVELS)) {
      for (let i = 0; i < n; i++) this.list.push(this.spawn(lvl));
    }

    this._wyOf = {};                                  // level id -> floor y
    for (const id of Object.keys(N_LEVELS)) this._wyOf[id] = levelById(id).y;

    // dynamic barriers bucketed by level — the per-ped collision pass only
    // ever tests the peds' own level, not every gate/bay in the network
    this.gatesOf = new Map();
    for (const g of GATES) {
      const a = this.gatesOf.get(g.level) || [];
      a.push(g); this.gatesOf.set(g.level, a);
    }
    this.baysOf = new Map();
    for (const b of PSD_BAYS) {
      const a = this.baysOf.get(b.level) || [];
      a.push(b); this.baysOf.set(b.level, a);
    }

    // instanced capacity = the whole crowd + headroom for dwell-time
    // boarding/alighting spawns (cap() recycles 'aboard' peds past this)
    this.max = this.list.length + 80;
    this._m4 = new THREE.Matrix4();
    this._lm = new THREE.Matrix4();
    this._pm = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._qh = new THREE.Quaternion();
    this._up = new THREE.Vector3(0, 1, 0);
    this._x = new THREE.Vector3(1, 0, 0);
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._ps = new THREE.Vector3();
    this._c = new THREE.Color();
    this._zero = new THREE.Matrix4().makeScale(0, 0, 0);

    this.group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    this.parts = {};
    for (const [name, def] of Object.entries(PART_DEFS)) {
      const im = new THREE.InstancedMesh(PART_GEO[def.geo], mat, this.max);
      im.frustumCulled = false;
      im.castShadow = !['hair', 'bun', 'faceD', 'faceS', 'handL', 'handR'].includes(name);
      this.parts[name] = im;
      this.group.add(im);
    }
    scene.add(this.group);
  }

  // is a local point inside (or clipping) a collider?
  insideSolid(lvl, x, z) {
    const w = boxToWorld(this.boxOf[lvl], x, z);
    const [rx, rz] = resolvePed(this.col, w.x, w.z, levelById(lvl).y, 1.7);
    return Math.hypot(rx - w.x, rz - w.z) > 0.05;
  }

  spawn(level, x, z) {
    const rects = WALK_RECTS[level];
    if (x == null || z == null) {
      for (let t = 0; t < 10; t++) {
        const r = rects[Math.floor(Math.random() * rects.length)];
        x = THREE.MathUtils.lerp(r.x0 + 1, r.x1 - 1, Math.random());
        z = THREE.MathUtils.lerp(r.z0 + 1, r.z1 - 1, Math.random());
        if (!pointInRects(x, z, this.holes[level]) && !this.insideSolid(level, x, z)) break;
      }
    }
    const a = rollAppearance();
    return {
      level,
      x, z,
      tx: 0, tz: 0, speed: THREE.MathUtils.lerp(...SPEED, Math.random()) * a.speedK,
      state: 'idle', wait: Math.random() * 2, run: null, s: 0, gate: null,
      hideT: 0, yaw: Math.random() * Math.PI * 2, svc: null,
      px: x, pz: z, moving: 0, phase: Math.random() * 7, wy: null, dirty: true,
      ...a,
    };
  }

  setLevelVisible(id, v) { v ? this.hidden.delete(id) : this.hidden.add(id); }

  // per-instance colours, written when a (re)spawn changes appearance
  paint(i) {
    const p = this.list[i];
    if (!p) return;
    const set = (part, c) => this.parts[part].setColorAt(i, this._c.set(c));
    set('legL', p.skirted ? p.skin : p.pants); set('legR', p.skirted ? p.skin : p.pants);
    set('footL', p.shoes); set('footR', p.shoes);
    set('armL', p.shirt); set('armR', p.shirt);
    set('handL', p.skin); set('handR', p.skin);
    set('torso', p.shirt); set('head', p.skin);
    set('hair', p.hair); set('bun', p.hair); set('skirt', p.skirt);
    set('faceD', FACE_DARK); set('faceS', p.skin);
    for (const im of Object.values(this.parts)) im.instanceColor.needsUpdate = true;
  }

  // the walkable rect a ped is standing in — destinations stay inside it so
  // paths never require crossing balustrades, track troughs or the void
  homeRect(p) {
    const rects = WALK_RECTS[p.level];
    return rects.find(r => p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1)
      || rects.reduce((best, r) => {
        const d = Math.hypot(p.x - (r.x0 + r.x1) / 2, p.z - (r.z0 + r.z1) / 2);
        return !best || d < best.d ? { r, d } : best;
      }, null).r;
  }

  // a grounded ped that ends up off the walkable floor or inside a floor
  // opening (slid there by collision, or a stale position from before) gets
  // pulled back to the nearest walkable spot — they can't float mid-air
  rehome(p) {
    const rects = WALK_RECTS[p.level] || [];
    const holes = this.holes[p.level] || [];
    const inRect = rects.some(r => p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1);
    const inHole = pointInRects(p.x, p.z, holes);
    if (inRect && !inHole) return;
    for (const h of holes) {
      if (p.x <= h.x0 || p.x >= h.x1 || p.z <= h.z0 || p.z >= h.z1) continue;
      const dxl = p.x - h.x0, dxr = h.x1 - p.x, dzl = p.z - h.z0, dzr = h.z1 - p.z;
      const m = Math.min(dxl, dxr, dzl, dzr);
      if (m === dxl) p.x = h.x0 - 0.4; else if (m === dxr) p.x = h.x1 + 0.4;
      else if (m === dzl) p.z = h.z0 - 0.4; else p.z = h.z1 + 0.4;
    }
    const r = this.homeRect(p);
    p.x = Math.max(r.x0 + 0.4, Math.min(r.x1 - 0.4, p.x));
    p.z = Math.max(r.z0 + 0.4, Math.min(r.z1 - 0.4, p.z));
  }

  // pick a destination: mostly wander; sometimes ride an escalator or cross a gate
  choose(p) {
    const lvl = p.level;
    const roll = Math.random();
    const home = this.homeRect(p);
    const inHome = (x, z) => x >= home.x0 - 0.5 && x <= home.x1 + 0.5 && z >= home.z0 - 0.5 && z <= home.z1 + 0.5;
    const lvlType = levelById(lvl).type;
    // the paid strip is sealed by gate banks + railings — a ped only targets
    // what its own side can reach; crossing the line means taking a gate
    const core = PAID_CORE[lvl];
    const inCore = !!core && Math.abs(p.z) < core.z && p.x > core.x0 && p.x < core.x1;
    // an unpaid ped inside the strip's z-range but beyond an end cap is in
    // the wraparound — it can't reach a gate lane without first getting to
    // a side band, so gate/escalator choices wait until |z| clears the caps
    const inWrap = !!core && !inCore && Math.abs(p.z) < core.z;

    if (roll < 0.22 && !(core && !inCore && lvlType === 'concourse')) {
      // find a rideable escalator from this level — mouth must be reachable,
      // i.e. on the same platform strip / bridge section the ped is on
      const opts = ESC_RUNS.filter(r =>
        (r.going === 'down' && r.from === lvl) || (r.going === 'up' && r.to === lvl))
        .map(run => {
          const top = run.going === 'down';
          const ex = top ? run.x1 - run.dx * 1.1 : run.x2 + run.dx * 1.1;
          const ez = top ? run.z1 - run.dz * 1.1 : run.z2 + run.dz * 1.1;
          return { run, top, l: worldToBox(this.boxOf[lvl], ex, ez) };
        })
        .filter(o => inHome(o.l.x, o.l.z));
      if (opts.length) {
        const { run, top, l } = opts[Math.floor(Math.random() * opts.length)];
        p.run = run; p.rideTop = top;
        p.tx = l.x; p.tz = l.z; p.state = 'toEsc';
        return;
      }
    }
    if (lvlType === 'concourse' && roll < 0.4 && !inWrap) {
      const bx0 = this.boxOf[lvl];
      const lanes = GATES.filter(g => g.level === lvl);
      // outside the paid strip only this side's gate rows are reachable —
      // the opposite line is behind the railings
      const pick = core && !inCore
        ? lanes.filter(g => Math.sign(worldToBox(bx0, g.x, g.z).z) === Math.sign(p.z))
        : lanes;
      const g = pick[Math.floor(Math.random() * pick.length)];
      if (g) {
        const lg = worldToBox(bx0, g.x, g.z);
        const approach = core
          ? (inCore ? -Math.sign(lg.z) : Math.sign(lg.z))
          : (p.z < lg.z ? -1 : 1);
        p.gate = g; p.gateSide = approach;
        p.tx = lg.x; p.tz = lg.z + approach * 1.7;
        p.state = 'toGate';
        return;
      }
    }
    // street traffic: descend an exit stair toward the concourse, or climb
    // to the footbridge — stairs register station-level uids
    if ((lvlType === 'ground' || lvlType === 'checkin') && roll < 0.55) {
      const down = STAIR_RUNS.filter(r => r.from === lvl && r.to !== lvl);
      const up = STAIR_RUNS.filter(r => r.to === lvl);
      const pick = Math.random() < 0.7 ? down : up;
      if (pick.length) {
        const r = pick[Math.floor(Math.random() * pick.length)];
        const goingDown = r.from === lvl;
        const a = goingDown ? r.top : r.bot;
        const sgn = goingDown ? -1 : 1;
        const l = worldToBox(this.boxOf[lvl], a.x + r.ux * 1.4 * sgn, a.z + r.uz * 1.4 * sgn);
        p.stair = { r, down: goingDown };
        p.tx = l.x; p.tz = l.z; p.state = 'toStair';
        return;
      }
    }
    // people leaving: concourse/bridge -> street via an exit stair — the
    // stair landings are all in the unpaid bands, so a paid-strip ped has to
    // tap out through a gate first; an unpaid ped only picks its own side
    // (the two bands are separated by the sealed strip)
    if ((lvlType === 'concourse' || lvlType === 'bridge') && roll < 0.08 && !inCore) {
      const up = STAIR_RUNS.filter(r => r.to === lvl);
      const bx0 = this.boxOf[lvl];
      const sameSide = core ? up.filter(r => {
        const bl = worldToBox(bx0, r.bot.x, r.bot.z);
        // wraparound peds: reachable only if the straight path crosses the
        // gate line beyond the cap — otherwise it runs into an end fence
        if (inWrap) {
          const t = (Math.sign(bl.z) * core.z - p.z) / (bl.z - p.z);
          const xc = p.x + t * (bl.x - p.x);
          return p.x > core.x1 ? xc > core.x1 : xc < core.x0;
        }
        return Math.sign(bl.z) === Math.sign(p.z);
      }) : up;
      const pick = sameSide.length ? sameSide : up;
      if (pick.length) {
        const r = pick[Math.floor(Math.random() * pick.length)];
        const l = worldToBox(this.boxOf[lvl], r.bot.x + r.ux * 1.4, r.bot.z + r.uz * 1.4);
        p.stair = { r, down: false };
        p.tx = l.x; p.tz = l.z; p.state = 'toStair';
        return;
      }
    }
    // wander — inside the current walkable region only
    for (let tries = 0; tries < 6; tries++) {
      const tx = THREE.MathUtils.lerp(home.x0 + 1, home.x1 - 1, Math.random());
      const tz = THREE.MathUtils.lerp(home.z0 + 1, home.z1 - 1, Math.random());
      if (pointInRects(tx, tz, this.holes[lvl])) continue;
      if (!pathClear(p.x, p.z, tx, tz, this.holes[lvl])) continue;
      if (this.insideSolid(lvl, tx, tz)) continue;
      // wander stays on the ped's own side of the paid boundary
      if (core) {
        const tCore = Math.abs(tz) < core.z && tx > core.x0 && tx < core.x1;
        if (tCore !== inCore) continue;
        // wraparound peds: targets within the strip z-range stay this end;
        // targets into a band must cross the gate line beyond the cap —
        // anything else is a straight-line path into an end fence
        if (inWrap) {
          if (Math.abs(tz) < core.z) {
            if (p.x > core.x1 ? tx < core.x1 : tx > core.x0) continue;
          } else {
            const t = (Math.sign(tz) * core.z - p.z) / (tz - p.z);
            if (p.x > core.x1 ? p.x + t * (tx - p.x) < core.x1
                              : p.x + t * (tx - p.x) > core.x0) continue;
          }
        // a band ped aiming into a wraparound has to cross the gate line
        // outside the caps — inside them it runs into a z-line railing
        } else if (!inCore && Math.abs(tz) < core.z && (tx < core.x0 || tx > core.x1)) {
          const t = (Math.sign(p.z) * core.z - p.z) / (tz - p.z);
          const xc = p.x + t * (tx - p.x);
          if (xc > core.x0 && xc < core.x1) continue;
        }
      }
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
      p.tx = lo.x; p.tz = lo.z; p.state = 'alight';
      p.wait = 0;
      this.list.push(p);
    }
    // passengers already near a doorway head in and board — dwell is short,
    // so anyone farther than ~20 m would never make it before departure
    const localOut = out.map(d => worldToBox(this.boxOf[lvl], d.x, d.z));
    const near = this.list.filter(p => p.level === lvl &&
      !['aboard', 'esc', 'board', 'boarding', 'toEsc', 'throughGate', 'toStair', 'stair', 'toGate', 'alight'].includes(p.state) &&
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
    // keep the crowd bounded: recycle 'aboard' passengers. Splicing shifts
    // every later index, so the whole crowd repaints to stay in sync.
    let culled = false;
    while (this.list.length > this.max - 4) {
      const i = this.list.findIndex(p => p.state === 'aboard');
      if (i < 0) break;
      this.list.splice(i, 1); culled = true;
    }
    if (culled) for (const p of this.list) p.dirty = true;
  }

  update(dt, t, trainSim, audio, focus) {
    const m4 = this._m4, lm = this._lm, pm = this._pm, q = this._q, pv = this._p;
    const count = Math.min(this.list.length, this.max);
    for (const im of Object.values(this.parts)) im.count = count;

    for (let i = 0; i < count; i++) {
      const p = this.list[i];
      if (p.dirty) { this.paint(i); p.dirty = false; }
      let visible = !this.hidden.has(p.level);

      // frame-start pose — the "from" for the swept wall clamp; if a scripted
      // state teleports the ped across levels the sweep is skipped that frame
      const lvlPre = p.level;
      const stPre = p.state;
      const wPre = boxToWorld(this.boxOf[lvlPre], p.x, p.z);

      // collapse hidden/aboard peds once, before the throttle skip — the
      // instanced parts are global, so a ped that vanishes out of range
      // would otherwise keep rendering frozen mid-pose
      if ((!visible || p.state === 'aboard') && !p._zeroed) {
        p._zeroed = true;
        for (const im of Object.values(this.parts)) im.setMatrixAt(i, this._zero);
      }

      // distant crowd runs at half rate: accumulate dt so speeds stay right
      // and skip the frame entirely (no state, no matrix rewrites) on off
      // frames — at >120 m the reduced cadence is invisible
      let pdt = dt;
      if (focus) {
        const ddx = wPre.x - focus.x, ddz = wPre.z - focus.z;
        if (ddx * ddx + ddz * ddz > 14400) {
          p._acc = (p._acc || 0) + dt;
          if (p._acc < 1 / 15) continue;
          pdt = p._acc; p._acc = 0;
        } else p._acc = 0;
      }
      const sdt = dt; dt = pdt;

      switch (p.state) {
        case 'aboard':
          visible = false;
          p.hideT -= dt;
          // reappear on the platform the next time their consist dwells —
          // they really did ride the train to another station
          if (p.svc && p.svc.state === 'dwell' && p.svc.ds && p.hideT <= 0) {
            const lvl2 = p.svc.ds.level;
            const doors = p.svc.doorWorld(4, -1.6);
            const outs = p.svc.doorWorld(4, 1.6);
            if (doors.length) {
              const li = worldToBox(this.boxOf[lvl2], doors[0].x, doors[0].z);
              const lo = worldToBox(this.boxOf[lvl2], outs[0].x, outs[0].z);
              const np = this.spawn(lvl2, li.x, li.z);
              Object.assign(p, np);
              p.tx = lo.x; p.tz = lo.z; p.state = 'alight'; p.svc = null;
            }
          } else if (p.hideT <= -60) {
            // consist went off-map — respawn at that station's concourse
            const np = this.spawn(concourseId(p.level.split(':')[0]) || 'ADM:L1');
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
          // walk through once the flaps open (gate coords are world-space)
          if (!p.gate || p.gate.open < 0.7) break;
          const gl = worldToBox(this.boxOf[p.level], p.gate.x, p.gate.z - p.gateSide * 2.0);
          const gx = worldToBox(this.boxOf[p.level], p.gate.x, p.gate.z).x;
          p.tz = gl.z;
          if (this.stepTo(p, dt, gx)) { p.state = 'seek'; }
          break;
        }
        case 'toStair': {
          if (this.stepTo(p, dt)) {
            p.state = 'stair';
            p.s = p.stair.down ? 0 : p.stair.r.slope;
          }
          break;
        }
        case 'stair': {
          // walk the ramp at ~60% pace — slower than flat ground like real stairs
          const st = p.stair, r = st.r;
          p.s += (st.down ? 1 : -1) * p.speed * 0.6 * dt;
          const f = THREE.MathUtils.clamp(p.s / r.slope, 0, 1);
          const l = worldToBox(this.boxOf[p.level],
            r.top.x + r.ux * r.horiz * f, r.top.z + r.uz * r.horiz * f);
          p.x = l.x; p.z = l.z;
          p.wy = r.top.y - r.drop * f;
          p.yaw = Math.atan2(st.down ? r.ux : -r.ux, st.down ? r.uz : -r.uz);
          if (f <= 0 || f >= 1) {
            const nl = st.down ? r.to : r.from;
            if (nl !== p.level) {
              // arrival level can live in a different station box (ADM's ext
              // box is rotated) — re-express the position or the ped keeps
              // old-box coords and teleports onto the void/track
              const w = boxToWorld(this.boxOf[p.level], p.x, p.z);
              const l2 = worldToBox(this.boxOf[nl], w.x, w.z);
              p.x = l2.x; p.z = l2.z;
            }
            p.level = nl;
            p.state = 'seek'; p.stair = null; p.wy = null;
          }
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
          p.wy = run.y1 - (hx / run.len) * run.drop;   // ride the ramp down/up
          p.yaw = Math.atan2(run.dx * d, run.dz * d);
          if (done) {
            const nl = p.rideTop ? run.to : run.from;
            if (nl !== p.level) {
              const w = boxToWorld(this.boxOf[p.level], p.x, p.z);
              const l2 = worldToBox(this.boxOf[nl], w.x, w.z);
              p.x = l2.x; p.z = l2.z;
            }
            p.level = nl;
            p.state = 'seek'; p.run = null; p.wy = null;
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
        case 'alight': {
          // step out of the car through the open bay, then join the crowd
          if (this.stepTo(p, dt)) { p.state = 'seek'; }
          break;
        }
        case 'seek':
          // just arrived somewhere (off an escalator, stair, or train) — pull
          // back onto solid footing if the landing left it over an opening,
          // then pick a fresh destination; walking on toward a stale target
          // would push the ped across walls/balustrades
          this.rehome(p);
          this.choose(p);
          break;
        default:   // 'walk'
          if (this.stepTo(p, dt)) { p.state = 'idle'; p.wait = 0.5 + Math.random() * 2.5; }
      }

      // physical collision: pedestrians slide along walls, glass, furniture
      // like the player does — only scripted crossings skip it. The swept
      // clamp stops thin glass being tunneled through at high sim speed.
      // (idle peds don't move, and peds on hidden levels aren't seen — the
      // barrier sweep is pointless for both)
      if (!NOCLIP.has(p.state) && p.state !== 'idle' && visible) {
        const bx0 = this.boxOf[p.level];
        const w0 = boxToWorld(bx0, p.x, p.z);
        const wy0 = p.wy ?? levelById(p.level).y;
        const sameSpot = p.level === lvlPre;
        const ox = sameSpot ? wPre.x : w0.x, oz = sameSpot ? wPre.z : w0.z;
        let [rx, rz] = resolvePed(this.col, w0.x, w0.z, wy0, 1.7, PED_RADIUS, ox, oz);
        // closed Octopus flaps block the lane (dynamic — not in SOLIDS)
        for (const g of this.gatesOf.get(p.level) || []) {
          if (!gateBlocks(g)) continue;
            [rx, rz] = clampRect(g.rect, ox, oz, rx, rz, 0.3);
            const s = g.rect;
            const nx = Math.max(s.x0, Math.min(rx, s.x1));
            const nz = Math.max(s.z0, Math.min(rz, s.z1));
            const dx = rx - nx, dz = rz - nz, d2 = dx * dx + dz * dz;
            if (d2 >= 0.09 || d2 < 1e-9) continue;
            const d = Math.sqrt(d2);
            rx = nx + dx / d * 0.3; rz = nz + dz / d * 0.3;
          }
        // closed PSD bays are solid too — the edge seals whenever no consist
        // is berthed with its doors open (boarding uses NOCLIP states)
        for (const b of this.baysOf.get(p.level) || []) {
          if (!psdBlocked(b)) continue;
            [rx, rz] = clampOBB(b, ox, oz, rx, rz, 0.3);
          }
        if (rx !== w0.x || rz !== w0.z) {
          const l = worldToBox(bx0, rx, rz);
          p.x = l.x; p.z = l.z;
        }
      }

      if (!visible) { dt = sdt; continue; }
      p._zeroed = false;

      // walk-cycle amount eases toward 1 while moving, 0 when standing —
      // and while grinding against a wall (stuck), so limbs stop swinging
      const moved = Math.hypot(p.x - (p.px ?? p.x), p.z - (p.pz ?? p.z));
      p.px = p.x; p.pz = p.z;

      // stuck = no progress toward the current target. A ped pressed against
      // a balustrade still jitters a few mm per frame (collision push-back),
      // so displacement can't detect it — distance-to-target can.
      if (p.state !== stPre) { p.stuck = 0; p.lastD = null; }   // new target/state
      if (MOVING.has(p.state)) {
        const dist = Math.hypot(p.tx - p.x, p.tz - p.z);
        if (p.lastD == null || dist < p.lastD - 0.004) { p.stuck = 0; p.lastD = dist; }
        else {
          p.stuck = (p.stuck || 0) + dt;
          if (p.stuck > 2.5) { p.state = 'idle'; p.wait = 0.4 + Math.random() * 0.9; p.stuck = 0; p.lastD = null; }
        }
      } else { p.stuck = 0; p.lastD = null; }

      const movingTgt = p.state === 'esc' || p.stuck > 0.6 ? 0 : moved > 0.002 ? 1 : 0;
      p.moving += (movingTgt - p.moving) * Math.min(1, dt * 8);
      if (p.moving > 0.02) p.phase += moved / 0.38 * Math.PI;

      const bx = this.boxOf[p.level];
      const w = boxToWorld(bx, p.x, p.z);
      const wy = p.wy ?? levelById(p.level).y;
      const s = p.scale;
      const swing = 0.52 * p.moving;
      const bob = Math.abs(Math.sin(p.phase)) * 0.035 * p.moving * s;

      q.setFromAxisAngle(this._up, p.yaw);
      if (p.hunch) { this._qh.setFromAxisAngle(this._x, p.hunch); q.multiply(this._qh); }
      pv.set(w.x, wy + bob, w.z);
      this._s.set(s, s, s);
      m4.compose(pv, q, this._s);

      const ph = p.phase;
      const legSwing = Math.sin(ph) * swing;
      const armSwing = -Math.sin(ph) * swing * 0.75;

      this.writePart(i, 'legL', legSwing, 1, 1, 1);
      this.writePart(i, 'legR', -legSwing, 1, 1, 1);
      this.writePart(i, 'footL', legSwing, 1, 1, 1);
      this.writePart(i, 'footR', -legSwing, 1, 1, 1);
      this.writePart(i, 'armL', armSwing, 1, 1, 1);
      this.writePart(i, 'armR', -armSwing, 1, 1, 1);
      this.writePart(i, 'handL', armSwing, 1, 1, 1);
      this.writePart(i, 'handR', -armSwing, 1, 1, 1);
      this.writePart(i, 'torso', 0,
        p.kind === 'woman' ? 0.86 : 1, 1, p.kind === 'woman' ? 0.9 : 1);
      this.writePart(i, 'head', 0, p.kind === 'child' ? 1.16 : 1, 1, p.kind === 'child' ? 1.16 : 1);
      this.writePart(i, 'faceD', 0, p.kind === 'child' ? 1.16 : 1, 1, p.kind === 'child' ? 1.16 : 1);
      this.writePart(i, 'faceS', 0, p.kind === 'child' ? 1.16 : 1, 1, p.kind === 'child' ? 1.16 : 1);
      const hs = p.kind === 'woman' ? [1.02, 1.45, 1.08] : p.kind === 'elder' ? [0.95, 0.82, 0.95] : [1, 1, 1];
      this.writePart(i, 'hair', 0, hs[0], hs[1], hs[2]);
      this.writePart(i, 'bun', 0, p.bun ? 1 : 0, p.bun ? 1 : 0, p.bun ? 1 : 0);
      this.writePart(i, 'skirt', 0, p.skirted ? 1 : 0, p.skirted ? 1 : 0, p.skirted ? 1 : 0);
      dt = sdt;
    }
    this.flushParts();
  }

  // passengers within `r` metres of a world-space point — feeds crowd audio
  countNear(wx, wy, wz, r = 16) {
    let n = 0;
    for (const p of this.list) {
      if (Math.abs((p.wy ?? this._wyOf[p.level]) - wy) > 4) continue;
      const w = boxToWorld(this.boxOf[p.level], p.x, p.z);
      if (Math.hypot(w.x - wx, w.z - wz) < r) n++;
    }
    return n;
  }

  flushParts() {
    for (const im of Object.values(this.parts)) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }

  // part matrix = personBase * T(pivot) * R(swing about X) * S(partScale)
  writePart(i, name, swing, sx, sy, sz) {
    const def = PART_DEFS[name];
    this._qh.setFromAxisAngle(this._x, swing);
    this._p.set(def.pivot[0], def.pivot[1], def.pivot[2]);
    this._ps.set(sx, sy, sz);
    this._lm.compose(this._p, this._qh, this._ps);
    this._pm.multiplyMatrices(this._m4, this._lm);
    this.parts[name].setMatrixAt(i, this._pm);
  }

  // move local (x,z) toward (tx,tz); returns true on arrival
  stepTo(p, dt, fixedX) {
    const gx = fixedX ?? p.tx, gz = p.tz;
    const dx = gx - p.x, dz = gz - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.25) return true;
    // street-level pedestrians hurry when it's raining
    const hurry = this.hurry && (p.level === 'G' || p.level === 'U1') ? 1.4 : 1;
    const v = p.speed * hurry * dt;
    p.x += dx / d * v; p.z += dz / d * v;
    p.yaw = Math.atan2(dx, dz);   // figure faces +Z
    return false;
  }
}
