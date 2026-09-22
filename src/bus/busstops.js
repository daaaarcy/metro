// ---- Citybus stop furniture -------------------------------------------------
// Per stop: yellow pole + route flag (makeSign), a small shelter + bench, and
// a live ETA board (canvas redrawn on every BusTimes refresh). Crowd anchor
// points (queue slots / door target / entry walk-in) are derived here so the
// sim in buses.js stays geometry-free.
import * as THREE from 'three';
import { makeSign } from '../builders/signage.js';
import { solid } from '../registry.js';
import { BUS_ROUTE, resolveStops } from './bus-data.js';

const POLE_M   = new THREE.MeshStandardMaterial({ color: 0xe8a700, roughness: 0.45, metalness: 0.35 });
const SHELTER_M = new THREE.MeshStandardMaterial({ color: 0x27455e, roughness: 0.55, metalness: 0.2 });
const ROOF_M   = new THREE.MeshStandardMaterial({ color: 0xd8202f, roughness: 0.5 });
const BENCH_M  = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.8 });
const FRAME_M  = new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.6, metalness: 0.3 });

function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

// live ETA plate — redrawn whenever BusTimes lands fresh data
function etaBoard() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 148;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = (stop, etas, live) => {
    ctx.fillStyle = '#101c26'; ctx.fillRect(0, 0, 256, 148);
    ctx.fillStyle = '#c8102e'; ctx.fillRect(0, 0, 256, 34);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd23c';
    ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${BUS_ROUTE.id} ${stop.zh}`, 10, 18);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(live ? 'LIVE' : '--:--', 246, 18);
    ctx.textAlign = 'left';
    for (let i = 0; i < 3; i++) {
      const e = etas[i];
      const y = 56 + i * 32;
      ctx.fillStyle = '#1d2f3d'; ctx.fillRect(8, y - 13, 240, 26);
      if (!e) continue;
      const d = new Date(e.t);
      const mins = Math.max(0, Math.round((e.t - Date.now()) / 60000));
      ctx.fillStyle = e.live ? '#7ee2a0' : '#9fb3c2';
      ctx.font = '600 15px sans-serif';
      ctx.fillText(mins <= 0 ? '即將到站 Due' : `${mins} 分鐘 min`, 16, y + 1);
      ctx.textAlign = 'right'; ctx.fillStyle = '#c8d4de';
      ctx.font = '400 13px sans-serif';
      ctx.fillText(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, 240, y + 1);
      ctx.textAlign = 'left';
    }
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

export function buildBusStops(times) {
  const root = new THREE.Group();
  const stops = resolveStops().map(st => {
    const side = st.dir === 'EB' ? -1 : 1;         // furniture toward the station
    const fz = st.kerbZ + side * 1.2;              // furniture line, just off the kerb
    const g = new THREE.Group();

    // pole + route flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.9, 6), POLE_M);
    pole.position.set(st.x, 1.45, fz);
    g.add(pole);
    const flag = makeSign({
      zh: `${st.zh}`, en: st.en,
      chips: [{ text: BUS_ROUTE.id, color: '#c8102e' }],
      w: 3.4, h: 0.85,
    });
    flag.position.set(st.x, 2.55, fz);
    flag.rotation.y = st.dir === 'EB' ? 0 : Math.PI;   // plate faces the road
    g.add(flag);

    // small shelter + bench beside the pole
    const sx = st.x + 4.2;
    const back = box(4.6, 2.1, 0.09, SHELTER_M);
    back.position.set(sx, 1.1, fz + side * 0.85);
    solid(back);
    const roof = box(4.9, 0.09, 1.9, ROOF_M);
    roof.position.set(sx, 2.35, fz + side * 0.15);
    const bench = box(3.6, 0.1, 0.42, BENCH_M);
    bench.position.set(sx, 0.55, fz + side * 0.55);
    for (const lx of [-2.1, 2.1]) {
      const leg = box(0.09, 2.3, 0.09, FRAME_M);
      leg.position.set(sx + lx, 1.15, fz + side * -0.55);
      g.add(leg);
    }
    g.add(back, roof, bench);

    // ETA board at the shelter's roadside end, facing the queue
    const { tex, draw } = etaBoard();
    const ex = sx + 2.45;
    const etaMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.88),
      new THREE.MeshBasicMaterial({ map: tex }));
    etaMesh.position.set(ex, 1.72, fz + side * 0.45);
    etaMesh.rotation.y = st.dir === 'EB' ? Math.PI : 0;   // face the kerb/queue
    const etaFrame = box(1.6, 1.0, 0.06, FRAME_M);
    etaFrame.position.set(ex, 1.72, fz + side * 0.38);
    const etaBack = etaMesh.clone();
    etaBack.rotation.y += Math.PI;
    etaBack.position.z = fz + side * 0.34;
    g.add(etaMesh, etaFrame, etaBack);

    root.add(g);
    // crowd anchors: queue runs along the kerb, door target sits on the lane,
    // walk-ins arrive from the apron side
    const queue = [0, 1, 2, 3].map(i => ({ x: st.x - 0.9 - i * 0.75, z: fz + side * 0.9 }));
    const stop = {
      ...st, side, fz, queue,
      door: { x: st.x + 2.8, z: st.laneZ },                    // bus front-door halt point
      entry: { x: st.x - 14, z: fz + side * 4 },               // walk-in origin
      figures: [], spawnT: Math.random() * 6, boardT: 0,
      etaDraw: etas => draw(st, etas, times.live),
    };
    stop.etaDraw(times.nextEtas(st.stopId));
    return stop;
  });

  times.onchange = () => { for (const s of stops) s.etaDraw(times.nextEtas(s.stopId)); };
  return { root, stops };
}
