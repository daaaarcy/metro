// Rideable lifts — each glazed shaft gets a car floor and per-level landing
// doors. Cars shuttle between their levels; doors only open where the car is
// berthed. E near a landing calls the car; E aboard sends it to the next
// level. The car floor is a dynamic entry in the shared floor list so the
// player is carried vertically; closed landing doors are dynamic barriers
// (LIFT_DOORS) resolved like gate flaps.
import * as THREE from 'three';
import { LIFT_SIZE } from '../station-data.js';
import { M } from '../builders/materials.js';
import { box } from '../builders/structure.js';
import { LIFT_DOORS } from '../registry.js';
import { CELL } from '../colliders.js';

const SPEED = 1.8;        // m/s vertical travel
const DOOR_T = 1.5;       // door slide rate (0..1)
const DWELL = 6;          // seconds berthed-open before moving on

export class LiftSim {
  // defs: [{x, z, door:±1, levels:[{uid,y}]}] — levels sorted top→bottom
  // col: the shared colliders index — each car floor is registered in
  // fgrid (which floorAt actually reads); pushing only into col.floors
  // used to leave the shaft with no floor at all
  constructor(scene, defs, col) {
    this.cars = defs.map(d => {
      const ys = d.levels.map(l => l.y);
      const fz = d.z + d.door * LIFT_SIZE.d / 2;
      const c = {
        x: d.x, z: d.z, door: d.door, ys, idx: 0, dir: 1, y: ys[0],
        open: 0, t: DWELL, state: 'dwell', callIdx: null, sel: null,
        levels: d.levels,
        // car floor reaches past the door face so the sill has footing
        floor: {
          x0: d.x - LIFT_SIZE.w / 2 + 0.05, x1: d.x + LIFT_SIZE.w / 2 - 0.05,
          z0: Math.min(d.z - d.door * (LIFT_SIZE.d / 2 - 0.08), fz + d.door * 0.26),
          z1: Math.max(d.z - d.door * (LIFT_SIZE.d / 2 - 0.08), fz + d.door * 0.26),
          top: ys[0],
        },
        doors: [],
      };
      col.floors.push(c.floor);
      // the floor rect's xz bounds are static even though `top` animates —
      // bucket it into the walkable grid like a built slab
      for (let cx = Math.floor((c.floor.x0 - 0.5) / CELL); cx <= Math.floor((c.floor.x1 + 0.5) / CELL); cx++) {
        for (let cz = Math.floor((c.floor.z0 - 0.5) / CELL); cz <= Math.floor((c.floor.z1 + 0.5) / CELL); cz++) {
          const k = cx + ',' + cz;
          let arr = col.fgrid.get(k);
          if (!arr) col.fgrid.set(k, arr = []);
          arr.push({ f: c.floor });
        }
      }

      const g = new THREE.Group();
      const fl = box(LIFT_SIZE.w - 0.2, 0.16, c.floor.z1 - c.floor.z0, M.steel);
      fl.position.set(0, 0.08, (c.floor.z0 + c.floor.z1) / 2 - d.z);
      const roof = box(LIFT_SIZE.w - 0.2, 0.14, LIFT_SIZE.d - 0.2, M.signPost);
      roof.position.y = 2.5;
      const lamp = box(LIFT_SIZE.w - 0.5, 0.05, 0.4, M.lightStrip);
      lamp.position.y = 2.42;
      g.add(fl, roof, lamp);
      for (const sx of [-1, 1]) {
        const post = box(0.08, 2.5, 0.08, M.signPost);
        post.position.set(sx * (LIFT_SIZE.w / 2 - 0.18), 1.25, d.door * (LIFT_SIZE.d / 2 - 0.18));
        g.add(post);
      }
      g.position.set(d.x, c.y, d.z);
      scene.add(g);
      c.mesh = g;

      // a pair of landing doors in each doorway — sealed unless berthed open
      for (const y of ys) {
        const dg = new THREE.Group();
        const leaves = [];
        for (const s of [-1, 1]) {
          const leaf = box(0.95, 2.3, 0.08, M.glassDark);
          leaf.position.set(s * 0.475, 1.15, 0);
          dg.add(leaf);
          leaves.push({ m: leaf, s });
        }
        dg.position.set(d.x, y, fz);
        scene.add(dg);
        const barrier = {
          x0: d.x - 0.95, x1: d.x + 0.95, z0: fz - 0.09, z1: fz + 0.09,
          y0: y - 0.3, y1: y + 2.4, open: 0, car: c,
        };
        LIFT_DOORS.push(barrier);
        c.doors.push({ leaves, barrier });
      }
      return c;
    });
    this.near = null;   // {car, idx} — landing the player could call from
    this.inCar = null;  // car the player is standing in
  }

  aboard(c, rig) {
    const p = rig.camera.position;
    return Math.abs(p.x - c.x) < LIFT_SIZE.w / 2 - 0.2
        && Math.abs(p.z - c.z) < LIFT_SIZE.d / 2 - 0.2
        && Math.abs(rig.feetY - c.y) < 1.2;
  }

  // the floor E would send a rider to right now — a pending selection,
  // else the car's next shuttle stop
  previewIdx(c) { return c.callIdx ?? this.#nextIdx(c); }

  // E pressed: aboard a berthed car → cycle the target through the other
  // landings (the doors hold while the rider keeps choosing); near a
  // landing → call the car
  interact(rig) {
    if (this.inCar) {
      const c = this.inCar;
      if (c.state === 'dwell') {
        c.sel = c.sel == null ? this.#nextIdx(c) : (c.sel + 1) % c.ys.length;
        if (c.sel === c.idx) c.sel = (c.sel + 1) % c.ys.length;
        c.callIdx = c.sel;
        c.t = Math.max(c.t, 1.6);
      }
      return;
    }
    const n = this.near;
    if (!n) return;
    const c = n.car;
    if (c.idx === n.idx && c.state === 'dwell') c.t = Math.max(c.t, 4);  // already here — hold the doors
    else c.callIdx = n.idx;
  }

  #nextIdx(c) {
    if (c.idx >= c.ys.length - 1) c.dir = -1;
    else if (c.idx <= 0) c.dir = 1;
    return c.idx + c.dir;
  }

  update(dt, rig) {
    this.near = null;
    this.inCar = null;
    const p = rig.camera.position;
    for (const c of this.cars) {
      const aboard = this.aboard(c, rig);
      if (aboard) this.inCar = c;

      // state machine — dwell (doors open) -> travel -> dwell
      if (c.state === 'dwell') {
        c.open = Math.min(1, c.open + DOOR_T * dt);
        // a player standing in the doorway pins the doors open — a rider
        // deep in the car doesn't (the shuttle still departs on time)
        const fz = c.z + c.door * LIFT_SIZE.d / 2;
        const inDoor = Math.abs(p.x - c.x) < 1.25 && Math.abs(rig.feetY - c.y) < 1.2
          && Math.abs(p.z - fz) < 0.75;
        c.t -= dt;
        if (c.t <= 0 && !inDoor) {
          c.target = c.callIdx ?? this.#nextIdx(c);
          c.callIdx = null;
          c.sel = null;
          c.state = 'closing';
        }
      } else if (c.state === 'closing') {
        c.open = Math.max(0, c.open - DOOR_T * dt);
        if (c.open <= 0) c.state = c.target === c.idx ? 'dwell' : 'travel';
      } else if (c.state === 'travel') {
        const ty = c.ys[c.target], dy = ty - c.y;
        const step = Math.min(Math.abs(dy), (0.5 + Math.abs(dy) * 0.6) * SPEED * dt * 0.9);
        c.y += Math.sign(dy) * step;
        if (Math.abs(c.y - ty) < 0.02) {
          c.y = ty; c.idx = c.target; c.state = 'dwell'; c.t = DWELL;
        }
        if (aboard) rig.feetY = c.y;   // carry the rider
      }

      // landing doors: only the berthed level's pair follows `open`
      for (const [i, d] of c.doors.entries()) {
        const o = i === c.idx && c.state !== 'travel' ? c.open : 0;
        d.barrier.open = o;
        for (const l of d.leaves) l.m.position.x = l.s * (0.475 + o * 0.98);
      }
      c.mesh.position.y = c.y;
      c.floor.top = c.y;

      // nearest landing the player could call from (their level, near the door)
      for (const [i, y] of c.ys.entries()) {
        const d = c.doors[i].barrier;
        const dzf = (d.z0 + d.z1) / 2;
        if (Math.abs(rig.feetY - y) < 1.4
          && Math.abs(p.x - c.x) < 2.2
          && Math.abs(p.z - dzf) < 2.6) {
          this.near = { car: c, idx: i };
        }
      }
    }
    rig.nearLift = this.near;
    rig._inLift = this.inCar;
  }
}
