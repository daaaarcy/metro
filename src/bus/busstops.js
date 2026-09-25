// ---- Citybus stop furniture ---------------------------------------------------
// One shared furniture set per kerb zone, however many routes call. Yellow pole
// + route flag with a chip per route, shelter + bench, and a live ETA board
// merging every route's feed (redrawn on each BusTimes refresh). nv points from
// the kerb toward the furniture side; qv is the queue direction along the kerb.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeSign } from '../builders/signage.js';
import { solid } from '../registry.js';
import { zonesWithRoutes } from './bus-data.js';

const POLE_M   = new THREE.MeshStandardMaterial({ color: 0xe8a700, roughness: 0.45, metalness: 0.35 });
const SHELTER_M = new THREE.MeshStandardMaterial({ color: 0x27455e, roughness: 0.55, metalness: 0.2 });
const ROOF_M   = new THREE.MeshStandardMaterial({ color: 0xd8202f, roughness: 0.5 });
const BENCH_M  = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.8 });
const FRAME_M  = new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.6, metalness: 0.3 });

function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

// live ETA plate — rows show the route chip + countdown, merged across routes
function etaBoard() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 148;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = (zone, etas, live) => {
    ctx.fillStyle = '#101c26'; ctx.fillRect(0, 0, 256, 148);
    ctx.fillStyle = '#c8102e'; ctx.fillRect(0, 0, 256, 34);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd23c';
    ctx.font = 'bold 20px "PingFang HK","PingFang SC",sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(zone.zh, 10, 18, 176);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(live ? 'LIVE' : '--:--', 246, 18);
    ctx.textAlign = 'left';
    for (let i = 0; i < 3; i++) {
      const e = etas[i];
      const y = 56 + i * 32;
      ctx.fillStyle = '#1d2f3d'; ctx.fillRect(8, y - 13, 240, 26);
      if (!e) continue;
      const mins = Math.max(0, Math.round((e.t - Date.now()) / 60000));
      ctx.fillStyle = '#c8102e'; ctx.fillRect(12, y - 10, 44, 20);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
      ctx.fillText(e.route, 34, y + 1); ctx.textAlign = 'left';
      ctx.fillStyle = e.live ? '#7ee2a0' : '#9fb3c2';
      ctx.font = '600 15px sans-serif';
      ctx.fillText(mins <= 0 ? '即將到站 Due' : `${mins} 分鐘 min`, 66, y + 1);
      ctx.textAlign = 'right'; ctx.fillStyle = '#c8d4de';
      ctx.font = '400 13px sans-serif';
      const d = new Date(e.t);
      ctx.fillText(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, 240, y + 1);
      ctx.textAlign = 'left';
    }
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

// lite generated stops share one instanced flag: pole + blank plate
function flagGeo() {
  const pole = new THREE.CylinderGeometry(0.05, 0.06, 2.6, 6);
  pole.translate(0, 1.3, 0);
  const plate = new THREE.BoxGeometry(0.7, 0.42, 0.05);
  plate.translate(0, 2.35, 0);
  return mergeGeometries([pole, plate]);
}

export function buildBusStops(times) {
  const root = new THREE.Group();
  const zones = zonesWithRoutes();
  // lite stops: instanced flag at each kerb, minimal crowd anchors
  const lite = zones.filter(z => z.lite);
  if (lite.length) {
    const flags = new THREE.InstancedMesh(flagGeo(), POLE_M, lite.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    lite.forEach((z, i) => {
      p.set(z.kerb[0] + z.nv[0] * 1.1, 0, z.kerb[1] + z.nv[1] * 1.1);
      e.set(0, Math.atan2(z.nv[0], z.nv[1]), 0);
      flags.setMatrixAt(i, m.compose(p, q.setFromEuler(e), s));
    });
    root.add(flags);
  }
  const liteStops = lite.map(z => ({
    ...z, fx: z.kerb[0], fz: z.kerb[1],
    queue: [],
    entry: { x: z.kerb[0] + z.nv[0] * 5, z: z.kerb[1] + z.nv[1] * 5 },
    kerbside: () => ({
      x: z.kerb[0] + z.qv[0] * (Math.random() - 0.5) * 10 + z.nv[0] * (1.8 + Math.random() * 2),
      z: z.kerb[1] + z.qv[1] * (Math.random() - 0.5) * 10 + z.nv[1] * (1.8 + Math.random() * 2),
    }),
    figures: [], spawnT: Infinity, boardT: 0, etaDraw: () => {},
  }));
  const stops = zones.filter(z => !z.lite).map(z => {
    const [hx, hz] = z.halt, [kx, kz] = z.kerb, [nx, nz] = z.nv, [qx, qz] = z.qv;
    // furniture line just off the kerb; u along kerb (qv), v toward furniture (nv)
    const fx = kx + nx * 1.2, fz = kz + nz * 1.2;
    const yaw = Math.atan2(-qz, qx);            // local +x -> qv, local +z -> nv
    const g = new THREE.Group();
    g.position.set(fx, 0, fz);
    g.rotation.y = yaw;

    // pole + route flag (chips for every route calling here)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.9, 6), POLE_M);
    pole.position.set(0, 1.45, 0);
    g.add(pole);
    const chips = z.routes.slice(0, 4).map(r => ({ text: r, color: '#c8102e' }));
    if (z.routes.length > 4) chips.push({ text: `+${z.routes.length - 4}`, color: '#27455e' });
    const flag = makeSign({ zh: z.zh, en: z.en, chips, w: 3.4, h: 0.85 });
    flag.position.set(0, 2.55, 0);
    flag.rotation.y = Math.PI;                  // plate faces the road
    g.add(flag);

    // shelter + bench beside the pole (local +x runs along the kerb)
    const back = box(4.6, 2.1, 0.09, SHELTER_M);
    back.position.set(-4.2, 1.1, 0.85);
    solid(back);
    const roof = box(4.9, 0.09, 1.9, ROOF_M);
    roof.position.set(-4.2, 2.35, 0.15);
    const bench = box(3.6, 0.1, 0.42, BENCH_M);
    bench.position.set(-4.2, 0.55, 0.55);
    for (const lx of [-2.1, 2.1]) {
      const leg = box(0.09, 2.3, 0.09, FRAME_M);
      leg.position.set(-4.2 + lx, 1.15, -0.55);
      g.add(leg);
    }
    g.add(back, roof, bench);

    // ETA board at the shelter's roadside end, facing the queue
    const { tex, draw } = etaBoard();
    const etaMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.88),
      new THREE.MeshBasicMaterial({ map: tex }));
    etaMesh.position.set(-6.65, 1.72, -0.45);
    etaMesh.rotation.y = Math.PI;               // face the road/queue
    const etaFrame = box(1.6, 1.0, 0.06, FRAME_M);
    etaFrame.position.set(-6.65, 1.72, -0.38);
    const etaBack = etaMesh.clone();
    etaBack.rotation.y = 0;
    etaBack.position.z = -0.34;
    g.add(etaMesh, etaFrame, etaBack);

    root.add(g);
    // crowd anchors in world space: queue along qv behind the pole, door on the
    // lane at the halt, walk-ins arrive from the furniture side
    const queue = [0, 1, 2, 3].map(i => ({
      x: kx + qx * (0.9 + i * 0.75) + nx * 2.1,
      z: kz + qz * (0.9 + i * 0.75) + nz * 2.1,
    }));
    const stop = {
      ...z, fx, fz,
      queue,
      entry: { x: kx + qx * 14 + nx * 5.2, z: kz + qz * 14 + nz * 5.2 },
      // random kerbside point for alighters to stroll toward
      kerbside: () => ({
        x: kx + qx * (Math.random() - 0.5) * 14 + nx * (2.7 + Math.random() * 2),
        z: kz + qz * (Math.random() - 0.5) * 14 + nz * (2.7 + Math.random() * 2),
      }),
      figures: [], spawnT: Math.random() * 6, boardT: 0,
      etaDraw: () => draw(z, times.nextEtas(z), times.live),
    };
    stop.etaDraw();
    return stop;
  });

  times.onchange = () => { for (const s of stops) s.etaDraw(); };
  return { root, stops: [...stops, ...liteStops] };
}
