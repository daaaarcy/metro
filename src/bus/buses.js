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
      DARK = 0x171c22, SILVER = 0x9aa4ac;
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

// forward = +X, doors on local -Z (left side in HK traffic)
function busMesh() {
  const parts = [
    part(new THREE.BoxGeometry(BUS_L, 2.6, BUS_W), YEL, 0, 1.75, 0),                    // body shell
    part(new THREE.BoxGeometry(BUS_L + 0.06, 1.0, BUS_W + 0.06), GLASS, -0.1, 2.35, 0), // window band
    part(new THREE.BoxGeometry(BUS_L + 0.06, 0.42, BUS_W + 0.05), RED, 0, 0.62, 0),     // red skirt
    part(new THREE.BoxGeometry(0.5, 0.5, BUS_W - 0.2), DARK, BUS_L / 2 - 0.1, 0.55, 0), // bumpers
    part(new THREE.BoxGeometry(0.5, 0.5, BUS_W - 0.2), DARK, -BUS_L / 2 + 0.1, 0.55, 0),
    part(new THREE.BoxGeometry(BUS_L + 0.06, 0.14, BUS_W + 0.06), BLU, 0, 0.9, 0),      // blue pinstripe
    part(new THREE.BoxGeometry(BUS_L - 0.3, 0.28, BUS_W - 0.15), YEL, 0, 3.18, 0),      // roof cap
    part(new THREE.BoxGeometry(0.95, 1.9, 0.06), GLASS, 3.1, 1.5, -BUS_W / 2 - 0.02),   // front door glass
    part(new THREE.BoxGeometry(0.95, 1.9, 0.06), GLASS, 1.0, 1.5, -BUS_W / 2 - 0.02),   // rear door glass
    part(new THREE.BoxGeometry(0.9, 0.65, 0.05), DARK, BUS_L / 2 - 0.02, 2.78, 0),      // dest recess
    part(new THREE.BoxGeometry(0.12, 0.4, 0.3), SILVER, BUS_L / 2 - 0.05, 2.1, -BUS_W / 2 - 0.1), // mirrors
    part(new THREE.BoxGeometry(0.12, 0.4, 0.3), SILVER, BUS_L / 2 - 0.05, 2.1, BUS_W / 2 + 0.1),
  ];
  for (const wx of [3.6, -3.2]) for (const wz of [-1.15, 1.15])
    parts.push(part(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 10), DARK, wx, 0.46, wz, Math.PI / 2));
  const mesh = new THREE.Mesh(mergeGeometries(parts, false), busMat);
  mesh.castShadow = true;
  return mesh;
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
      r.destA_tex = destTex(r.id, r.destA[0]);
      r.destB_tex = destTex(r.id, r.destB[0]);
      // arc-position each stop on this route's loop + a kerbside door point
      const tmp = {};
      for (const st of r.stops) {
        const { s } = r.path.find(st.halt[0], st.halt[1], tmp);
        st.s = s;
        st.zoneObj = this.zoneById[st.zone];
        r.path.at(s, tmp);
        st.door = { x: tmp.x + tmp.dx * 2.8, z: tmp.z + tmp.dz * 2.8 };
      }
      r.stopsByS = [...r.stops].sort((a, b) => a.s - b.s);
      for (let i = 0; i < r.fleet; i++) {
        const g = new THREE.Group();
        g.add(busMesh());
        const dest = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.42),
          new THREE.MeshBasicMaterial({ map: r.destA_tex }));
        dest.position.set(BUS_L / 2 + 0.045, 2.78, 0);
        dest.rotation.y = Math.PI / 2;
        g.add(dest);
        this.root.add(g);
        this.buses.push({
          g, dest, route: r, destFor: null,
          s: (r.path.L * i / r.fleet + Math.random() * 300) % r.path.L,
          v: 5 + Math.random() * 4, state: 'drive', dwellT: 0, stop: null,
          pax: 4 + Math.floor(Math.random() * 18),
        });
      }
    }

    this.figRoot = new THREE.Group();
    this.root.add(this.figRoot);
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

  update(dt) {
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
      // destination blind follows the leg of the next stop
      const { stop } = this.nextStop(b);
      const leg = stop?.leg ?? 'A';
      if (leg !== b.destFor) {
        b.destFor = leg;
        b.dest.material.map = leg === 'A' ? b.route.destA_tex : b.route.destB_tex;
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
  }
}
