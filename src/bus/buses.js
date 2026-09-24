// ---- Citybus sim -------------------------------------------------------------
// A fleet per route circulates its closed loop built from shared road legs:
// island-corridor routes run the EB south band / WB north band couplet (east
// of SKW the south road goes two-way), southern routes drop down the Aberdeen
// Tunnel link to Wong Chuk Hang, Lei Tung and South Horizons. Buses ease into
// stops, dwell while the kerbside crowd boards/alights, keep a following gap
// to whatever is ahead on the same road, and swing around the termini.
// Live ETAs on the stop boards come from BusTimes (data.gov.hk).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { personFigure } from '../builders/people.js';
import { resolveRoutes, zonesWithRoutes } from './bus-data.js';
import { BusTimes } from './bustimes.js';
import { buildBusStops } from './busstops.js';

const CRUISE = 11, ACCEL = 1.7, DECEL = 2.6;
const BUS_L = 10.8, BUS_W = 2.5;

// ---- arc-length path over a closed loop --------------------------------------
function buildPath(pts) {
  const n = pts.length, cum = [0];
  for (let i = 1; i <= n; i++) {
    const a = pts[i - 1], b = pts[i % n];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const L = cum[n];
  // slow zones around sharp vertices (junction turns + U-turns)
  const slow = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const a1 = Math.atan2(b[1] - a[1], b[0] - a[0]), a2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let d = Math.abs(a2 - a1); if (d > Math.PI) d = Math.PI * 2 - d;
    if (d > 0.45) slow.push({ s: cum[i], lim: d > 1.1 ? 3.2 : 5.5 });
  }
  return {
    L, pts, cum, slow,
    at(s, out) {
      s = ((s % L) + L) % L;
      let lo = 0, hi = n;
      while (lo < hi - 1) { const m = (lo + hi) >> 1; (cum[m] <= s ? lo = m : hi = m); }
      const a = pts[lo], b = pts[(lo + 1) % n], seg = Math.max(cum[lo + 1] - cum[lo], 1e-6);
      const t = Math.min(Math.max((s - cum[lo]) / seg, 0), 1);
      out.x = a[0] + (b[0] - a[0]) * t; out.z = a[1] + (b[1] - a[1]) * t;
      out.dx = (b[0] - a[0]) / seg; out.dz = (b[1] - a[1]) / seg;
      return out;
    },
    limit(s) {
      let v = CRUISE;
      for (const z of slow) {
        let d = Math.abs(z.s - s); d = Math.min(d, L - d);
        if (d < 26) v = Math.min(v, z.lim);
      }
      return v;
    },
    // arc position + distance of the point nearest a world point
    find(x, z, out = {}) {
      let best = 1e9, bs = 0;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
        const t = l2 ? Math.min(Math.max(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0), 1) : 0;
        const px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(px - x, pz - z);
        if (d < best) { best = d; bs = cum[i] + Math.sqrt(l2) * t; }
      }
      out.s = bs; out.d = best;
      return out;
    },
  };
}

// ---- Citybus livery: yellow body, dark band, red skirt + blue pinstripe ------
const YEL = 0xf6b500, GLASS = 0x101c26, RED = 0xc8102e, BLU = 0x1e5aa8,
      DARK = 0x171c22, SILVER = 0x9aa4ac, SEAT = 0x37477c, TRIM = 0xdde2e8,
      FLOORC = 0x2a2f36, UNIFORM = 0x1f3a5f, SKIN = 0xd9a679, HAIR = 0x201a15;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3();
function part(geo, color, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = geo.clone();
  _q.setFromEuler(_e.set(rx, ry, rz));
  _m.compose(_v.set(x, y, z), _q, new THREE.Vector3(1, 1, 1));
  g.applyMatrix4(_m);
  const n = g.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color(color);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.deleteAttribute('uv');
  return g;
}
const busMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x2a4055, transparent: true, opacity: 0.42, roughness: 0.1, metalness: 0.6, depthWrite: false });
const cabinLightMat = new THREE.MeshBasicMaterial({ color: 0xffe9b0 });  // interior light strip — unlit so it glows at night

function destTex(routeId, zh) {
  const c = document.createElement('canvas'); c.width = 192; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, 192, 48);
  ctx.fillStyle = '#ffd23c'; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(routeId, 10, 26);
  ctx.font = 'bold 20px "PingFang HK","PingFang SC",sans-serif';
  ctx.fillText(zh, 78, 26);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// rear plate shows the fleet number alone, like the real bus
function numTex(routeId) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, 96, 48);
  ctx.fillStyle = '#ffd23c'; ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(routeId, 48, 26);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// forward = +X, doors on local -Z (left side in HK traffic); driver sits
// right (+Z) like every HK bus. The body is a hollow shell — lower wall
// panels with real gaps at the doorways, a glass band at window height and
// a roof — so the interior reads through the glazing and open doors.
const DOORS_X = [3.1, 1.0];                        // front + rear doorway centres
function busMesh() {
  const B = THREE.BoxGeometry;
  const parts = [
    // ---- shell: lower walls, door-side segments, ends, roof ---------------
    part(new B(BUS_L, 1.4, 0.1), YEL, 0, 1.15, BUS_W / 2 - 0.05),          // +Z wall
    part(new B(5.95, 1.4, 0.1), YEL, -2.475, 1.15, -BUS_W / 2 + 0.05),     // -Z rear of rear door
    part(new B(1.2, 1.4, 0.1), YEL, 2.05, 1.15, -BUS_W / 2 + 0.05),        // -Z between doors
    part(new B(1.85, 1.4, 0.1), YEL, 4.475, 1.15, -BUS_W / 2 + 0.05),      // -Z front of front door
    part(new B(0.1, 1.4, BUS_W), YEL, BUS_L / 2 - 0.05, 1.15, 0),          // front wall
    part(new B(0.1, 1.4, BUS_W), YEL, -BUS_L / 2 + 0.05, 1.15, 0),         // rear wall
    part(new B(BUS_L, 0.28, BUS_W), YEL, 0, 2.96, 0),                      // roof
    part(new B(BUS_L + 0.06, 0.42, BUS_W + 0.05), RED, 0, 0.62, 0),        // red skirt
    part(new B(0.5, 0.5, BUS_W - 0.2), DARK, BUS_L / 2 - 0.1, 0.55, 0),    // bumpers
    part(new B(0.5, 0.5, BUS_W - 0.2), DARK, -BUS_L / 2 + 0.1, 0.55, 0),
    part(new B(BUS_L + 0.06, 0.14, BUS_W + 0.06), BLU, 0, 0.9, 0),         // blue pinstripe
    part(new B(BUS_L - 0.3, 0.28, BUS_W - 0.15), YEL, 0, 3.18, 0),         // roof cap
    // glazing mullions — corner posts, a windscreen centre divider and
    // spaced pillars along each flank, so the band reads as framed glass
    part(new B(0.1, 1.0, 0.1), YEL, BUS_L / 2 - 0.05, 2.35, 0),           // windscreen divider
    part(new B(0.06, 0.66, 2.0), DARK, BUS_L / 2 - 0.04, 2.62, 0),         // blind recess inside the windscreen
    part(new B(0.12, 0.4, 0.3), SILVER, BUS_L / 2 - 0.05, 2.1, -BUS_W / 2 - 0.1), // mirrors
    part(new B(0.12, 0.4, 0.3), SILVER, BUS_L / 2 - 0.05, 2.1, BUS_W / 2 + 0.1),
    // ---- interior ---------------------------------------------------------
    part(new B(BUS_L - 0.2, 0.08, BUS_W - 0.2), FLOORC, 0, 1.06, 0),       // floor
    part(new B(BUS_L - 0.3, 0.06, BUS_W - 0.3), TRIM, 0, 2.82, 0),         // ceiling
    part(new B(BUS_L - 0.3, 0.8, 0.04), TRIM, 0, 1.48, BUS_W / 2 - 0.12),  // liners below the sills
    part(new B(5.9, 0.8, 0.04), TRIM, -2.45, 1.48, -BUS_W / 2 + 0.12),     // -Z liners split at the door gaps
    part(new B(1.1, 0.8, 0.04), TRIM, 2.05, 1.48, -BUS_W / 2 + 0.12),
    part(new B(1.7, 0.8, 0.04), TRIM, 4.45, 1.48, -BUS_W / 2 + 0.12),
    part(new B(0.04, 0.8, BUS_W - 0.3), TRIM, BUS_L / 2 - 0.14, 1.48, 0),  // front + rear liners
    part(new B(0.04, 0.8, BUS_W - 0.3), TRIM, -BUS_L / 2 + 0.14, 1.48, 0),
    part(new B(0.9, 0.1, 0.5), FLOORC, DOORS_X[0], 0.72, -BUS_W / 2 + 0.2), // step treads in the doorways
    part(new B(0.9, 0.1, 0.5), FLOORC, DOORS_X[0], 0.94, -BUS_W / 2 + 0.12),
    part(new B(0.9, 0.1, 0.5), FLOORC, DOORS_X[1], 0.72, -BUS_W / 2 + 0.2),
    part(new B(0.9, 0.1, 0.5), FLOORC, DOORS_X[1], 0.94, -BUS_W / 2 + 0.12),
    // cab — dash, wheel, partition, Octopus farebox by the front door
    part(new B(0.4, 0.3, 1.15), DARK, 4.72, 1.72, 0.55),
    part(new B(0.14, 0.1, 0.34), DARK, 4.62, 1.94, 0.62),
    part(new B(0.34, 0.07, 0.07), DARK, 4.55, 1.72, 0.62, 0, 0, -0.5),
    part(new B(0.06, 1.15, 0.45), DARK, 3.68, 1.72, 0.98),                 // cab partition — driver stays in view
    part(new B(0.26, 0.52, 0.26), YEL, 3.72, 1.36, -0.52),                 // farebox
    part(new B(0.2, 0.06, 0.2), DARK, 3.72, 1.66, -0.52, 0.35, 0, 0),
    // the driver — seated, hands on the wheel
    part(new B(0.46, 0.16, 0.5), DARK, 3.95, 1.32, 0.62),                  // driver seat
    part(new B(0.14, 0.56, 0.5), DARK, 3.72, 1.62, 0.62),
    part(new B(0.42, 0.24, 0.38), UNIFORM, 4.12, 1.34, 0.62),              // legs
    part(new B(0.3, 0.52, 0.4), UNIFORM, 3.98, 1.78, 0.62),                // torso
    part(new B(0.4, 0.09, 0.09), UNIFORM, 4.28, 1.9, 0.5, 0, 0, -0.35),    // arms to the wheel
    part(new B(0.4, 0.09, 0.09), UNIFORM, 4.28, 1.9, 0.74, 0, 0, -0.35),
    part(new B(0.22, 0.24, 0.22), SKIN, 3.95, 2.18, 0.62),                 // head
    part(new B(0.24, 0.09, 0.24), HAIR, 3.97, 2.32, 0.62),
  ];
  // steering wheel — torus facing the driver
  parts.push(part(new THREE.TorusGeometry(0.19, 0.028, 6, 14), DARK, 4.42, 1.86, 0.62, 0.5, Math.PI / 2, 0));
  // corner posts + spaced mullions framing the glass band
  for (const x of [-BUS_L / 2 + 0.05, BUS_L / 2 - 0.05])
    for (const z of [-BUS_W / 2 + 0.05, BUS_W / 2 - 0.05])
      parts.push(part(new B(0.12, 1.0, 0.12), YEL, x, 2.35, z));
  for (const x of [-4.4, -3.2, -2.0, -0.8, 0.4, 1.6, 2.8, 4.0])
    for (const z of [-BUS_W / 2 + 0.02, BUS_W / 2 - 0.02])
      parts.push(part(new B(0.09, 1.0, 0.09), YEL, x, 2.35, z));
  // seats — one bench shell per side per row; -Z skips the two door gaps
  const seat = (x, z) => [
    part(new B(0.62, 0.13, 0.62), SEAT, x, 1.24, z),
    part(new B(0.13, 0.62, 0.62), SEAT, x - 0.27, 1.55, z),
  ];
  for (const x of [-4.6, -3.8, -3.0, -2.2, -1.4, -0.6, 0.2, 1.8]) parts.push(...seat(x, -0.82));
  for (const x of [-4.6, -3.8, -3.0, -2.2, -1.4, -0.6, 0.2, 1.0, 1.8, 2.6]) parts.push(...seat(x, 0.82));
  // stanchion poles + overhead grab rails — Citybus yellow
  for (const [x, z] of [[0.5, -1.05], [1.5, -1.05], [2.6, -1.05], [3.6, -1.05], [-1.0, 0.45], [-2.6, 0.45], [-4.0, 0.45], [1.2, 0.45], [2.2, 0.45]])
    parts.push(part(new B(0.05, 1.3, 0.05), YEL, x, 1.75, z));
  parts.push(part(new B(7.4, 0.05, 0.05), YEL, -1.4, 2.38, 0.5), part(new B(7.4, 0.05, 0.05), YEL, -1.4, 2.38, -0.5));
  for (const wx of [3.6, -3.2]) for (const wz of [-1.15, 1.15])
    parts.push(part(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 10), DARK, wx, 0.46, wz, Math.PI / 2));
  const mesh = new THREE.Mesh(mergeGeometries(parts, false), busMat);
  mesh.castShadow = true;
  // wraparound glazing — one transparent shell over the window line, so the
  // cabin, seats and driver read through the glass
  const glass = new THREE.Mesh(
    mergeGeometries([
      part(new B(BUS_L + 0.06, 0.98, 0.05), GLASS, -0.1, 2.35, BUS_W / 2 + 0.005),
      part(new B(BUS_L + 0.06, 0.98, 0.05), GLASS, -0.1, 2.35, -BUS_W / 2 - 0.005),
      part(new B(0.05, 0.98, BUS_W + 0.06), GLASS, BUS_L / 2 + 0.005, 2.35, 0),
      part(new B(0.05, 0.98, BUS_W + 0.06), GLASS, -BUS_L / 2 - 0.005, 2.35, 0),
    ], false), glassMat);

  // plug doors: a leaf pair per doorway, sliding apart along the body. The
  // four leaves merge into two meshes by slide direction — two draw calls.
  const leaf = (x, edge) => [
    part(new THREE.BoxGeometry(0.46, 1.9, 0.07), GLASS, x, 1.46, -BUS_W / 2 - 0.1),
    part(new THREE.BoxGeometry(0.05, 1.9, 0.075), YEL, x + edge * 0.215, 1.46, -BUS_W / 2 - 0.1),
  ];
  const doorL = new THREE.Mesh(mergeGeometries([
    ...leaf(DOORS_X[0] - 0.245, 1), ...leaf(DOORS_X[1] - 0.245, 1)], false), busMat);
  const doorR = new THREE.Mesh(mergeGeometries([
    ...leaf(DOORS_X[0] + 0.245, -1), ...leaf(DOORS_X[1] + 0.245, -1)], false), busMat);
  return { mesh, glass, doorL, doorR };
}

// ---- the sim ------------------------------------------------------------------
export class BusSim {
  constructor(scene) {
    this.root = new THREE.Group();
    const { root: stopRoot, stops: zones } = buildBusStops((this.times = new BusTimes(zonesWithRoutes())));
    this.root.add(stopRoot);
    this.zones = zones;
    this.zoneById = Object.fromEntries(zones.map(z => [z.id, z]));

    this.routes = resolveRoutes();
    this.buses = [];
    for (const r of this.routes) {
      r.path = buildPath(r.pts);
      // shared per-leg sign materials — the whole fleet swaps blinds together
      r.destA_mat = new THREE.MeshBasicMaterial({ map: destTex(r.id, r.destA[0]) });
      r.destB_mat = new THREE.MeshBasicMaterial({ map: destTex(r.id, r.destB[0]) });
      r.num_mat = new THREE.MeshBasicMaterial({ map: numTex(r.id) });
      // arc-position each stop on this route's loop + the front door's
      // kerbside point (fwd along the lane, then out to the door side)
      const tmp = {};
      for (const st of r.stops) {
        const { s } = r.path.find(st.halt[0], st.halt[1], tmp);
        st.s = s;
        st.zoneObj = this.zoneById[st.zone];
        r.path.at(s, tmp);
        st.door = { x: tmp.x + tmp.dx * 2.8 + tmp.dz * 1.35, z: tmp.z + tmp.dz * 2.8 - tmp.dx * 1.35 };
      }
      r.stopsByS = [...r.stops].sort((a, b) => a.s - b.s);
      for (let i = 0; i < r.fleet; i++) {
        const g = new THREE.Group();
        const bm = busMesh();
        g.add(bm.mesh, bm.glass, bm.doorL, bm.doorR);
        // destination blinds — front face + kerb side over the front door +
        // a number plate on the back; both blinds share the leg material
        const signF = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.5), r.destA_mat);
        signF.position.set(BUS_L / 2 - 0.02, 2.62, 0);   // behind the windscreen
        signF.rotation.y = Math.PI / 2;
        const signS = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.44), r.destA_mat);
        signS.position.set(2.05, 2.5, -BUS_W / 2 - 0.05);
        signS.rotation.y = Math.PI;
        const signR = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), r.num_mat);
        signR.position.set(-BUS_L / 2 - 0.045, 2.5, 0.7);
        signR.rotation.y = -Math.PI / 2;
        // warm cabin light strip down the ceiling
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(BUS_L - 2, 0.5), cabinLightMat);
        glow.position.set(-0.4, 2.79, 0);
        glow.rotation.x = Math.PI / 2;   // faces down into the cabin
        g.add(signF, signS, signR, glow);
        this.root.add(g);
        this.buses.push({
          g, signs: [signF, signS], doorL: bm.doorL, doorR: bm.doorR, open: 0,
          route: r, destFor: null,
          s: (r.path.L * i / r.fleet + Math.random() * 300) % r.path.L,
          v: 5 + Math.random() * 4, state: 'drive', dwellT: 0, stop: null,
          pax: 4 + Math.floor(Math.random() * 18),
        });
      }
    }

    this.figRoot = new THREE.Group();
    this.root.add(this.figRoot);
    this.near = null;          // dwelling bus whose front door is in reach
    this.aboard = null;        // bus carrying the player
    this._seat = new THREE.Vector3(1.8, 2.24, -0.82);    // window seat just aft of the rear door
    scene.add(this.root);
  }

  nextStop(b) {
    const p = b.route.path;
    let best = null, bd = Infinity;
    for (const st of b.route.stopsByS) {
      const d = (st.s - b.s + p.L) % p.L;
      if (d < bd) { bd = d; best = st; }
    }
    return { stop: best, d: bd };
  }

  spawnFig(x, z) {
    const m = personFigure({ yaw: 0 });
    m.position.set(x, 0, z);
    this.figRoot.add(m);
    return { mesh: m, mode: 'walk', tx: x, tz: z, speed: 1.3 + Math.random() * 0.3 };
  }

  // E at the kerb: board a dwelling bus; aboard at a dwell: step off
  interact(rig) {
    if (this.aboard) {
      const b = this.aboard;
      if (b.state === 'dwell' && b.stop) {
        const t = b.stop.zoneObj.kerbside();
        rig.camera.position.x = t.x;
        rig.camera.position.z = t.z;
        rig.feetY = 0; rig._vx = rig._vz = 0;
        this.aboard = null;
      }
      return;
    }
    const b = this.near;
    if (b) {
      this.aboard = b; b.dwellT = Math.max(b.dwellT, 3);   // hold the doors
      rig.yaw = -b.g.rotation.y - Math.PI / 2; rig.pitch = -0.06;   // face forward
    }
  }

  update(dt, rig) {
    this.times.update(dt);
    const out = this._out ??= {}, prj = this._prj ??= {};

    // ---- buses -------------------------------------------------------------
    for (const b of this.buses) {
      const p = b.route.path;
      if (b.state === 'dwell') {
        b.dwellT -= dt;
        const z = b.stop?.zoneObj;
        if (z) {
          z.boardT -= dt;
          if (z.boardT <= 0 && z.figures.length) {
            z.boardT = 1.1;
            const f = z.figures.find(f => f.mode === 'queue');
            if (f) { f.mode = 'toDoor'; f.tx = b.stop.door.x; f.tz = b.stop.door.z; b.pax++; }
          }
          if (b.alightT > 0) {
            b.alightT -= dt;
            if (b.alightT <= 0 && b.alightN > 0) {
              b.alightN--;
              const f = this.spawnFig(b.stop.door.x, b.stop.door.z);
              f.mode = 'toKerbside';
              const t = z.kerbside();
              f.tx = t.x; f.tz = t.z;
              z.figures.push(f);
              b.pax = Math.max(0, b.pax - 1);
              if (b.alightN > 0) b.alightT = 0.9;
            }
          }
        }
        if (b.dwellT <= 0) { b.state = 'drive'; b.stop = null; }
      } else {
        const { stop, d } = this.nextStop(b);
        // hold a following gap to whatever is ahead on this road — any route
        p.at(b.s, out);
        let lead = Infinity;
        for (const o of this.buses) {
          if (o === b) continue;
          if (Math.abs(o.g.position.x - out.x) > 32 || Math.abs(o.g.position.z - out.z) > 32) continue;
          const { s: os, d: od } = p.find(o.g.position.x, o.g.position.z, prj);
          if (od < 7) {
            const gap = (os - b.s + p.L) % p.L;
            if (gap < lead) lead = gap;
          }
        }
        let want = p.limit(b.s);
        if (lead < 16) want = Math.min(want, Math.max(0, (lead - 12) * 0.5));
        if (stop && d < 70) want = Math.min(want, Math.sqrt(2 * DECEL * d));
        b.v += THREE.MathUtils.clamp(want - b.v, -DECEL * dt * 1.4, ACCEL * dt);
        if (b.v < 0) b.v = 0;
        b.s = (b.s + b.v * dt) % p.L;
        if (stop && d < 1.6 && b.v < 0.4) {
          b.state = 'dwell'; b.dwellT = 6 + Math.random() * 6; b.stop = stop;
          b.alightN = Math.min(b.pax, Math.random() < 0.45 ? 0 : 1 + Math.floor(Math.random() * 2));
          b.alightT = b.alightN ? 0.8 : 0;
          stop.zoneObj.boardT = 1.6;
        }
      }
      p.at(b.s, out);
      b.g.position.set(out.x, 0.02, out.z);
      b.g.rotation.y = Math.atan2(-out.dz, out.dx);
      // doors open for the dwell — the leaf pair slides apart along the body
      b.open = THREE.MathUtils.clamp(b.open + (b.state === 'dwell' ? dt : -dt) / 0.5, 0, 1);
      b.doorL.position.x = -b.open * 0.42;
      b.doorR.position.x = b.open * 0.42;
      // destination blind follows the leg of the next stop
      const { stop } = this.nextStop(b);
      const leg = stop?.leg ?? 'A';
      if (leg !== b.destFor) {
        b.destFor = leg;
        const m = leg === 'A' ? b.route.destA_mat : b.route.destB_mat;
        for (const sgn of b.signs) sgn.material = m;
      }
    }

    // ---- stop crowds -----------------------------------------------------------
    for (const z of this.zones) {
      const queued = z.figures.filter(f => f.mode === 'queue' || f.mode === 'toQueue').length;
      z.spawnT -= dt;
      if (z.spawnT <= 0) {
        z.spawnT = 5 + Math.random() * 9;
        if (queued < 2 + Math.floor(Math.random() * 3)) {
          const f = this.spawnFig(z.entry.x + Math.random() * 6, z.entry.z + (Math.random() - 0.5) * 3);
          f.mode = 'toQueue';
          const slot = z.queue[Math.min(queued, z.queue.length - 1)];
          f.tx = slot.x + (Math.random() - 0.5) * 0.3; f.tz = slot.z;
          z.figures.push(f);
        }
      }
      for (let i = z.figures.length - 1; i >= 0; i--) {
        const f = z.figures[i], m = f.mesh;
        const dx = f.tx - m.position.x, dz = f.tz - m.position.z, d = Math.hypot(dx, dz);
        if (d > 0.15) {
          const step = Math.min(f.speed * dt, d);
          m.position.x += dx / d * step; m.position.z += dz / d * step;
          m.rotation.y = Math.atan2(dx, dz);
          m.position.y = Math.abs(Math.sin((m.position.x + m.position.z) * 4)) * 0.03;
        } else {
          m.position.y = 0;
          if (f.mode === 'toQueue') f.mode = 'queue';
          else if (f.mode === 'toDoor') { this.figRoot.remove(m); z.figures.splice(i, 1); continue; }
          else if (f.mode === 'toKerbside') {
            f.mode = 'leave';
            f.tx = z.entry.x + (Math.random() - 0.5) * 10;
            f.tz = z.entry.z + (Math.random() - 0.5) * 4;
          } else if (f.mode === 'leave') {
            this.figRoot.remove(m); z.figures.splice(i, 1); continue;
          }
        }
      }
    }

    // ---- player boarding ---------------------------------------------------
    // near = a dwelling bus whose front door is in reach at street level;
    // aboard = carrying the camera in a front seat until they alight
    this.near = null;
    if (rig) {
      // teleporting or leaving walk mode drops the ride, wherever it went
      if (this.aboard && (rig.mode !== 'walk' || rig._fly)) this.aboard = null;
      if (this.aboard) {
        const b = this.aboard;
        b.g.updateMatrixWorld();
        rig.camera.position.copy(b.g.localToWorld(this._seat.set(1.8, 2.24, -0.82)));
        rig.feetY = 1.12; rig._vx = rig._vz = 0; rig.vy = 0;
      } else if (rig.mode === 'walk' && !rig._aboard && !rig._inLift && Math.abs(rig.feetY) < 2) {
        const p = rig.camera.position;
        for (const b of this.buses) {
          if (b.state !== 'dwell' || !b.stop) continue;
          if (Math.hypot(b.stop.door.x - p.x, b.stop.door.z - p.z) < 3.2) { this.near = b; break; }
        }
      }
      rig.nearBus = this.near;
      rig.aboardBus = this.aboard;
    }
  }
}
