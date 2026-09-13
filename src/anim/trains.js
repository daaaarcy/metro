import * as THREE from 'three';
import { FITTINGS } from '../registry.js';
import { TRAIN_SPEC, LINES, BOXES, levelById, boxToWorld } from '../station-data.js';
import { M } from '../builders/materials.js';
import { box } from '../builders/structure.js';

const ARR_T = 13, DEP_T = 11;          // seconds to run in/out of the platform
const DOOR_T = 0.7;                     // door slide time
const easeOut = p => 1 - Math.pow(1 - p, 3);
const easeIn = p => p * p * p;

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc9ced4, roughness: 0.35, metalness: 0.6 });
const winMat  = new THREE.MeshStandardMaterial({ color: 0x18222e, roughness: 0.2, metalness: 0.3 });
const doorMat = new THREE.MeshStandardMaterial({ color: 0xb4bac2, roughness: 0.4, metalness: 0.5 });
const headMat = new THREE.MeshStandardMaterial({ color: 0xfff6cc, emissive: 0xffedb0, emissiveIntensity: 2.2 });

function buildTrain(line, cars, carLen, doorSide) {
  const g = new THREE.Group();
  const W = 3.0, H = 3.3, gap = 0.55;
  const stripe = new THREE.MeshStandardMaterial({ color: new THREE.Color(LINES[line].color), roughness: 0.5 });
  const leafGeo = new THREE.BoxGeometry(0.85, 2.05, 0.07);
  const leaves = [];
  for (let c = 0; c < cars; c++) {
    const x0 = (c - (cars - 1) / 2) * (carLen + gap);
    const body = box(carLen, H, W, bodyMat);
    body.position.set(x0, 2.1, 0);
    const win = box(carLen - 0.5, 0.9, W + 0.04, winMat);
    win.position.set(x0, 2.85, 0);
    const str = box(carLen, 0.28, W + 0.06, stripe);
    str.position.set(x0, 1.45, 0);
    // dark interior visible through the open doors
    const inner = box(carLen - 0.7, H - 0.7, W - 0.6, winMat);
    inner.position.set(x0, 2.0, 0);
    g.add(body, win, str, inner);
    // 3 door pairs per car on the platform side
    for (const dx of [-carLen * 0.3, 0, carLen * 0.3]) {
      for (const s of [-1, 1]) {
        const leaf = new THREE.Mesh(leafGeo, doorMat);
        leaf.userData = { x: x0 + dx + s * 0.44, z: doorSide * (W / 2 + 0.02), s };
        g.add(leaf);
        leaves.push(leaf);
      }
    }
  }
  // cab ends
  const half = (cars * (carLen + gap) - gap) / 2;
  for (const s of [-1, 1]) {
    const cab = box(0.5, H * 0.9, W * 0.96, winMat);
    cab.position.set(s * (half + 0.2), 2.05, 0);
    const light = box(0.15, 0.3, 1.9, headMat);
    light.position.set(s * (half + 0.5), 1.35, 0);
    g.add(cab, light);
  }
  return { group: g, leaves, len: cars * (carLen + gap) - gap };
}

// One scheduled service on a platform face.
class Service {
  constructor(scene, doorSet) {
    this.ds = doorSet;
    const face = doorSet.face, tr = doorSet.track;
    this.spec = TRAIN_SPEC[face.line];
    this.bx = BOXES[levelById(doorSet.level).box];
    this.zc = (tr.z0 + tr.z1) / 2;
    // train doors open toward the platform: island platforms face the centre,
    // side platforms face outward
    this.doorSide = doorSet.kind === 'island' ? -face.side : face.side;
    this.color = LINES[face.line].color;
    this.dir = face.dir;                                   // +1/-1 along local X
    const t = buildTrain(face.line, this.spec.cars, this.spec.carLen, this.doorSide);
    this.train = t.group;
    this.leaves = t.leaves;
    this.trainLen = t.len;
    scene.add(this.train);

    const mid = (tr.x0 + tr.x1) / 2;
    this.stopX = mid;
    if (doorSet.terminus) {
      this.enterX = tr.x1 + this.trainLen / 2 + 4;          // tunnel end is +X
      this.exitX = this.enterX;
    } else {
      this.enterX = this.dir > 0 ? tr.x0 - this.trainLen / 2 - 4 : tr.x1 + this.trainLen / 2 + 4;
      this.exitX = this.dir > 0 ? tr.x1 + this.trainLen / 2 + 4 : tr.x0 - this.trainLen / 2 - 4;
    }
    this.state = 'away';
    this.t = 2 + Math.random() * this.spec.headway;         // staggered first arrivals
    this.open = 0;                                          // door open fraction
    this.tx = this.enterX;
    this.doorXs = doorSet.xs;                               // PSD leaf positions (local)
    this._m4 = new THREE.Matrix4();
    this.events = [];                                       // {type:'arrive'|'dwell'|'depart'}
    this.place(this.enterX);
  }

  place(tx) {
    this.tx = tx;
    const w = boxToWorld(this.bx, tx, this.zc);
    this.train.position.set(w.x, levelById(this.ds.level).y - 0.62, w.z);
    this.train.rotation.y = this.bx.rot;
  }

  setDoors(open, dt) {
    this.open = THREE.MathUtils.clamp(this.open + (open ? dt : -dt) / DOOR_T, 0, 1);
    const o = this.open;
    for (const leaf of this.leaves) {
      leaf.position.set(leaf.userData.x + leaf.userData.s * o * 0.78, 2.05, leaf.userData.z);
    }
    // PSD leaves slide in step with train doors — pairs part into the panels
    const ds = this.ds;
    const target = o * 0.9;
    if (ds._slide === undefined) ds._slide = 0;
    if (Math.abs(ds._slide - target) > 0.001) {
      ds._slide += Math.sign(target - ds._slide) * Math.min(Math.abs(target - ds._slide), dt * 1.4);
      for (let i = 0; i < ds.leafX.length; i++) {
        this._m4.makeTranslation(ds.leafX[i] + ds.leafDir[i] * ds._slide, ds.y, ds.z);
        ds.doors.setMatrixAt(i, this._m4);
      }
      ds.doors.instanceMatrix.needsUpdate = true;
    }
  }

  update(dt, audio) {
    this.t -= dt;
    switch (this.state) {
      case 'away':
        this.setDoors(false, dt);
        if (this.t <= 0) {
          this.state = 'arrive'; this.t = ARR_T;
          this.events.push({ type: 'arrive', face: this.ds.face, level: this.ds.level });
          audio?.announceArrive(this.ds.face, this.ds.level);
        }
        break;
      case 'arrive': {
        const p = 1 - Math.max(this.t, 0) / ARR_T;
        this.place(THREE.MathUtils.lerp(this.enterX, this.stopX, easeOut(p)));
        if (this.t <= 0) {
          this.state = 'dwell'; this.t = this.spec.dwell;
          this.events.push({ type: 'dwell', face: this.ds.face, level: this.ds.level, service: this });
        }
        break;
      }
      case 'dwell': {
        const closing = this.t < 1.6;
        this.setDoors(!closing, dt);
        if (closing && !this._chimed) { this._chimed = true; audio?.doorChime(); }
        if (this.t <= 0) {
          this._chimed = false;
          this.state = 'depart'; this.t = DEP_T;
          this.events.push({ type: 'depart', face: this.ds.face, level: this.ds.level, service: this });
          audio?.announceDepart(this.ds.face, this.ds.level);
        }
        break;
      }
      case 'depart': {
        const p = 1 - Math.max(this.t, 0) / DEP_T;
        this.place(THREE.MathUtils.lerp(this.stopX, this.exitX, easeIn(p)));
        if (this.t <= 0) {
          this.state = 'away';
          this.t = Math.max(this.spec.headway - ARR_T - this.spec.dwell - DEP_T, 4);
          this.place(this.enterX);
        }
        break;
      }
    }
  }

  // world positions of a few PSD door bays. off>0 = platform side (approach),
  // off<0 = inside the car (passengers emerge from / vanish into the train).
  doorWorld(n = 5, off = 0.9) {
    const ds = this.ds, out = [];
    const step = Math.max(1, Math.floor(ds.xs.length / n));
    for (let i = 2; i < ds.xs.length - 2; i += step) {
      const w = boxToWorld(this.bx, ds.xs[i], ds.z + this.doorSide * off);
      out.push({ x: w.x, z: w.z });
    }
    return out;
  }
}

export class TrainSim {
  constructor(scene) {
    this.services = [];
    for (const lvl of Object.keys(FITTINGS)) {
      for (const ds of FITTINGS[lvl].doorSets) {
        this.services.push(new Service(scene, ds));
      }
    }
  }

  update(dt, audio) {
    const events = [];
    for (const s of this.services) {
      s.update(dt, audio);
      if (s.events.length) { events.push(...s.events); s.events.length = 0; }
    }
    return events;
  }

  // faces currently dwelling with doors open — used by passengers
  dwelling() {
    return this.services.filter(s => s.state === 'dwell' && s.open > 0.8);
  }
}
