import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FITTINGS, PSD_BAYS } from '../registry.js';
import { TRAIN_SPEC, LINES, BOXES, levelById, boxToWorld } from '../station-data.js';
import { BAY } from '../builders/platforms.js';
import { M } from '../builders/materials.js';
import { box } from '../builders/structure.js';
import { canvasTex } from '../builders/decor.js';
import { Timetable } from './timetable.js';

const DOOR_T = 0.7;                       // door slide time
const ARR_T = 12, DEP_T = 10;             // platform run-in / run-out
const easeOut = p => 1 - Math.pow(1 - p, 3);
const easeIn = p => p * p * p;

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc9ced4, roughness: 0.35, metalness: 0.6 });
const winMat  = new THREE.MeshStandardMaterial({ color: 0x18222e, roughness: 0.2, metalness: 0.3 });
const doorMat = new THREE.MeshStandardMaterial({ color: 0xb4bac2, roughness: 0.4, metalness: 0.5 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0xd6dade, roughness: 0.55, metalness: 0.15, side: THREE.BackSide, emissive: 0x3a3f46, emissiveIntensity: 1 });
const headMat = new THREE.MeshStandardMaterial({ color: 0xfff6cc, emissive: 0xffedb0, emissiveIntensity: 2.2 });
// cabin furniture is vertex-coloured; a small emissive stands in for the
// car's own interior lighting so the cabin doesn't read as a cave inside
// the closed body shell
const innerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.1, emissive: 0x34383e, emissiveIntensity: 1 });

// M-Train door positions per car: 5 pairs per side (fractions of car length).
// AEL stock has only 2 pairs per side near the car ends (its baggage K car
// keeps the full 5). Doors are REAL: PSD bays open only where a consist
// actually has a door leaf, so platform bays between doors stay sealed.
const CAR_GAP = 0.55;
const DOOR_FR = [-0.4, -0.2, 0, 0.2, 0.4];
const DOOR_FR_AEX = [-0.36, 0.36];
const doorFrForCar = (line, c, cars) =>
  line === 'AEX' ? (c === cars - 1 ? DOOR_FR : DOOR_FR_AEX) : DOOR_FR;
// door leaf x positions in the berthed door-set's frame
function doorXsFor(spec, line, tx) {
  const out = [], pitch = spec.carLen + CAR_GAP;
  for (let c = 0; c < spec.cars; c++) {
    const cx = tx + (c - (spec.cars - 1) / 2) * pitch;
    for (const f of doorFrForCar(line, c, spec.cars)) out.push(cx + f * spec.carLen);
  }
  return out;
}

// ---------------------------------------------------------------- geometry
// vertex-coloured box added to the merged interior geometry
function cbox(parts, w, h, d, hex, x, y, z, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  parts.push(g);
}

// per-line route-map strip above each door (shared texture per line)
const routeMapMats = {};
function routeMapMat(line) {
  if (!routeMapMats[line]) {
    const c = LINES[line].color;
    routeMapMats[line] = new THREE.MeshBasicMaterial({
      map: canvasTex(512, 72, (ctx, w, h) => {
        ctx.fillStyle = '#f4f5f2'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = c; ctx.fillRect(0, h * 0.30, w, h * 0.34);
        ctx.fillStyle = '#fff';
        for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.arc(i * w / 10, h * 0.47, h * 0.11, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#222';
        ctx.font = '600 22px "PingFang HK",sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(LINES[line].zh + ' ' + LINES[line].en, w / 2, h * 0.24);
      }),
    });
  }
  return routeMapMats[line];
}
const ledMat = new THREE.MeshBasicMaterial({
  map: canvasTex(256, 36, (ctx, w, h) => {
    ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff9a1f'; ctx.font = '700 22px "PingFang HK",monospace'; ctx.textAlign = 'center';
    ctx.fillText('下一站 Next Station', w / 2, h * 0.72);
  }),
});

// interior shell + furniture for one consist — opaque parts merge to one
// vertex-coloured mesh, glass (draught screens / SIL cab front) to another.
// Metro stock (M/R/S/A-train): longitudinal scalloped benches between the
// doorways, glass draught screens at each seat end, yellow grab poles,
// centre strap rail for standees, Newsline panels, wheelchair bay, cab-end
// partitions. AEL stock: 2+2 transverse seats, door + overhead luggage
// racks, cabin TVs, indigo carpet — and a windowless baggage K car.
function buildInterior(line, cars, carLen, W, H, gap) {
  const parts = [], glassParts = [], emitParts = [];
  const floorY = 0.72, winLo = 2.42, winHi = 3.32;
  const aex = line === 'AEX';
  const seat = { EAL: 0x4a6474, TCL: 0x8fa4b2, SIL: 0x9aa8b2 }[line] ?? 0x9fb6c4;
  const seatBk = { EAL: 0x3d5563, TCL: 0x7d93a1, SIL: 0x8997a1 }[line] ?? 0x88a2b0;
  const POLE = 0xd8b93a;
  // scalloped longitudinal bench: segmented cushions + backrest read as
  // individual seats (M-train benches are moulded per-passenger divisions)
  const bench = (x0, bx, s, pri) => {
    const len = carLen * 0.155, cx = x0 + bx * carLen, seg = len / 5;
    const pad = pri ? 0xc0463e : seat, back = pri ? 0xa83c36 : seatBk;
    for (let i = 0; i < 5; i++) {
      const sx = cx - len / 2 + seg * (i + 0.5);
      cbox(parts, seg - 0.045, 0.14, 0.46, pad, sx, floorY + 0.38, s * (W / 2 - 0.34));
      cbox(parts, seg - 0.045, 0.5, 0.1, back, sx, floorY + 0.68, s * (W / 2 - 0.1));
    }
    cbox(parts, len, 0.32, 0.4, 0x7a848c, cx, floorY + 0.17, s * (W / 2 - 0.32));  // seat plinth
  };
  // AEL transverse seat: cushion + back + headrest, faces dir (+x/-x)
  const aexSeat = (x, z, dir, shade) => {
    const back = shade === 0x35648c ? 0x42719b : 0x46a0b2;
    cbox(parts, 0.44, 0.34, 0.44, 0xaab0b6, x + dir * 0.02, floorY + 0.17, z);     // base plinth
    cbox(parts, 0.46, 0.12, 0.5, shade, x, floorY + 0.4, z);
    cbox(parts, 0.1, 0.62, 0.5, back, x - dir * 0.24, floorY + 0.78, z);
    cbox(parts, 0.08, 0.14, 0.3, back, x - dir * 0.25, floorY + 1.14, z);          // headrest
  };
  for (let c = 0; c < cars; c++) {
    const x0 = (c - (cars - 1) / 2) * (carLen + gap);
    const frs = doorFrForCar(line, c, cars);
    const baggage = aex && c === cars - 1;
    // floor + ceiling + below-window side walls (drawn inside-out via wallMat)
    cbox(parts, carLen - 0.2, 0.08, W - 0.3, aex ? 0x46536e : 0x848b91, x0, floorY - 0.04, 0);
    for (const s of [-1, 1]) {
      const zw = s * (W / 2 - 0.06);
      cbox(parts, carLen - 0.2, winLo - floorY, 0.06, 0xe8eaec, x0, (winLo + floorY) / 2, zw);   // wall below glass
      cbox(parts, carLen - 0.2, 0.9, 0.07, 0x22262c, x0, (winLo + winHi) / 2, zw);               // window band from inside
      cbox(parts, carLen - 0.2, H - winHi + 0.4, 0.06, 0xdfe2e5, x0, (H + winHi) / 2 - 0.1, zw); // above window
      // window mullions: a post at every door edge + mid-bay breaks the band
      for (const f of frs) {
        for (const e of [-0.85, 0.85]) {
          cbox(parts, 0.09, 0.9, 0.09, 0xdfe2e5, x0 + f * carLen + e, (winLo + winHi) / 2, zw);
        }
      }
      for (const bx of [-0.3, -0.1, 0.1, 0.3]) {
        cbox(parts, 0.09, 0.9, 0.09, 0xdfe2e5, x0 + bx * carLen, (winLo + winHi) / 2, zw);
      }
      if (!aex) {
        // longitudinal benches between the doorways; car-1 north bay of the
        // second car is the wheelchair space instead (fold-up pad + grab bar)
        for (const bx of [-0.3, -0.1, 0.1, 0.3]) {
          const pri = c === 0 && bx === -0.3 || c === cars - 1 && bx === 0.3;
          if (c === 1 && bx === -0.1 && s === 1) {
            cbox(parts, 0.6, 0.5, 0.09, 0x7a848c, x0 + bx * carLen, floorY + 0.62, s * (W / 2 - 0.13)); // tip-up pad
            cbox(parts, 1.0, 0.05, 0.05, POLE, x0 + bx * carLen, floorY + 0.95, s * (W / 2 - 0.2));    // grab bar
            continue;
          }
          bench(x0, bx, s, pri);
        }
        // glass draught screens flank every doorway at the seat ends,
        // with the grab pole at the screen's free edge
        for (const f of frs) {
          for (const e of [-0.85, 0.85]) {
            const sx = x0 + f * carLen + e;
            const g = new THREE.BoxGeometry(0.05, 1.85, 0.6);
            g.translate(sx, floorY + 0.925, s * (W / 2 - 0.35));
            glassParts.push(g);
            cbox(parts, 0.045, 1.9, 0.045, POLE, sx, floorY + 0.95, s * (W / 2 - 0.6));
          }
        }
        // overhead rail + hanging straps over the benches
        cbox(parts, carLen - 0.6, 0.05, 0.05, 0xc9ced4, x0, floorY + 1.92, s * (W / 2 - 0.55));
        for (let i = 0; i < 9; i++) {
          cbox(parts, 0.05, 0.22, 0.02, 0xe8e2d2, x0 - carLen / 2 + 1.4 + i * (carLen - 2.8) / 8, floorY + 1.78, s * (W / 2 - 0.55));
          cbox(parts, 0.05, 0.09, 0.09, 0xe8e2d2, x0 - carLen / 2 + 1.4 + i * (carLen - 2.8) / 8, floorY + 1.62, s * (W / 2 - 0.55));
        }
      } else {
        // AEL: vestibule grab poles at each door edge + luggage rack towers
        for (const f of frs) {
          for (const e of [-0.9, 0.9]) {
            cbox(parts, 0.045, 1.9, 0.045, POLE, x0 + f * carLen + e, floorY + 0.95, s * (W / 2 - 0.6));
          }
          for (const e of [-1.35, 1.35]) {
            const rx = x0 + f * carLen + e;
            for (const ry of [0.45, 0.95, 1.45]) {
              cbox(parts, 0.7, 0.04, 0.5, 0x8a9298, rx, floorY + ry, s * (W / 2 - 0.4));
            }
            for (const dz of [-0.22, 0.22]) {
              cbox(parts, 0.7, 1.55, 0.04, 0x6a7076, rx, floorY + 0.85, s * (W / 2 - 0.4) + dz);
            }
          }
        }
      }
      // door threshold warning strips on the floor
      for (const f of frs) {
        cbox(parts, 1.7, 0.015, 0.5, 0x3a3e44, x0 + f * carLen, floorY + 0.012, s * (W / 2 - 0.28));
        cbox(parts, 1.7, 0.02, 0.07, 0xd8b400, x0 + f * carLen, floorY + 0.015, s * (W / 2 - 0.55));
      }
    }
    // ceiling + light band + A/C vent strip — the band is a real emissive
    // panel so the cabin reads as lit from inside
    cbox(parts, carLen - 0.2, 0.06, W - 0.4, 0xeef0f1, x0, H + 0.02, 0);
    cbox(emitParts, carLen - 1.2, 0.05, 0.5, 0xffffff, x0, H - 0.04, 0);
    cbox(parts, carLen - 1.4, 0.04, 0.24, 0xb9bec4, x0, H - 0.05, W / 4);
    cbox(parts, carLen - 1.4, 0.04, 0.24, 0xb9bec4, x0, H - 0.05, -W / 4);
    if (!aex) {
      // centre strap rail + grab handles down the aisle for standees
      cbox(parts, carLen - 1.5, 0.05, 0.05, 0xc9ced4, x0, floorY + 1.98, 0);
      for (let i = 0; i < 7; i++) {
        const sx = x0 - carLen / 2 + 2.2 + i * (carLen - 4.4) / 6;
        cbox(parts, 0.045, 0.2, 0.045, 0xe8e2d2, sx, floorY + 1.86, 0);
        cbox(parts, 0.16, 0.1, 0.04, 0xe8e2d2, sx, floorY + 1.72, 0);
      }
      // centre ceiling poles near mid-car
      for (const f of [-0.12, 0.12]) cbox(parts, 0.045, 1.75, 0.045, POLE, x0 + f * carLen, floorY + 0.9, 0);
      // Newsline panels at the ceiling edge above the windows
      for (const s of [-1, 1]) for (const f of [-0.3, -0.1, 0.1, 0.3]) {
        cbox(parts, 0.62, 0.38, 0.05, 0x14181d, x0 + f * carLen, floorY + 2.06, s * (W / 2 - 0.42));
      }
    } else if (!baggage) {
      // AEL seating bay: 2+2 transverse seats in the mid-car section
      const xA = x0 - carLen * 0.28, xB = x0 + carLen * 0.28;
      let row = 0;
      for (let x = xA; x <= xB; x += 0.92, row++) {
        const dir = row % 4 < 2 ? 1 : -1;                 // facing fours like the real AEL
        const shade = row % 4 < 2 ? 0x35648c : 0x3a8fa0;  // blue / aquamarine mix
        for (const z of [-1.16, -0.6, 0.6, 1.16]) aexSeat(x, z, dir, shade);
      }
      // overhead luggage racks above the window seats
      for (const s of [-1, 1]) {
        cbox(parts, carLen * 0.58, 0.05, 0.52, 0x9aa0a6, x0, floorY + 1.6, s * 1.14);
        cbox(parts, carLen * 0.58, 0.09, 0.05, 0x6a7076, x0, floorY + 1.55, s * 0.88);
      }
      // cabin TVs at ceiling centre, alternating facing
      for (const f of [-0.3, -0.1, 0.1, 0.3]) {
        cbox(parts, 0.9, 0.5, 0.07, 0x14181d, x0 + f * carLen, H - 0.5, 0);
      }
    } else {
      // baggage K car: continuous 3-tier racks along both walls, open floor
      for (const s of [-1, 1]) for (const ry of [0.45, 0.95, 1.45]) {
        cbox(parts, carLen * 0.8, 0.04, 0.5, 0x8a9298, x0, floorY + ry, s * (W / 2 - 0.4));
      }
      for (const f of [-0.3, 0, 0.3]) {
        cbox(parts, 1.1, 0.6, 0.5, 0x6a5540, x0 + f * carLen, floorY + 0.78, 0.9);
        cbox(parts, 0.9, 0.5, 0.45, 0x54606e, x0 + f * carLen + 0.6, floorY + 1.25, -1.0);
      }
    }
    // car-end partition walls with the gangway opening
    for (const s of [-1, 1]) {
      const ex = x0 + s * (carLen / 2 - 0.05);
      cbox(parts, 0.12, 1.15, 0.5, 0xd0d4d8, ex, floorY + 0.6, s * 0);            // stub wall
      for (const zs of [-1, 1]) cbox(parts, 0.1, 1.6, W / 2 - 0.5, 0xd0d4d8, ex, floorY + 0.8, zs * (W / 4 + 0.22));
    }
    // door leaves recess + headers get route-map strips (real MTR look)
    for (const f of frs) for (const s of [-1, 1]) {
      cbox(parts, 1.9, 0.42, 0.08, 0xf0f2f4, x0 + f * carLen, floorY + 1.98, s * (W / 2 - 0.1));
    }
    // gangway bellows between cars — open passage with dark rubber frame
    if (c < cars - 1) {
      const gx = x0 + carLen / 2 + gap / 2;
      cbox(parts, gap + 0.1, 0.08, 1.15, 0x5a5e63, gx, floorY - 0.02, 0);          // gangway floor
      for (const zs of [-1, 1]) cbox(parts, gap + 0.1, 1.95, 0.1, 0x3a3e44, gx, floorY + 0.98, zs * 0.62);
      cbox(parts, gap + 0.1, 0.25, 1.3, 0x3a3e44, gx, floorY + 2.0, 0);            // bellows header
    }
  }
  // consist ends: close the gangway opening with the cab wall — a panel with
  // door + cab window; SIL is driverless, so its end is a full glass screen
  // riders can see the tunnel through
  for (const end of [0, cars - 1]) {
    const s = end === 0 ? -1 : 1;
    const ex = (end - (cars - 1) / 2) * (carLen + gap) + s * (carLen / 2 - 0.05);
    if (line === 'SIL') {
      const g = new THREE.BoxGeometry(0.06, 1.7, 1.0);
      g.translate(ex, floorY + 1.0, 0);
      glassParts.push(g);
      cbox(parts, 0.09, 0.3, 1.0, 0xd0d4d8, ex, floorY + 1.95, 0);
    } else {
      cbox(parts, 0.12, 1.6, 0.96, 0xd0d4d8, ex, floorY + 1.0, 0);                // cab wall fill
      cbox(parts, 0.14, 1.55, 0.55, 0x9aa0a8, ex - s * 0.02, floorY + 0.98, -0.14); // cab door
      cbox(parts, 0.15, 0.4, 0.3, 0x22262c, ex - s * 0.04, floorY + 1.45, -0.14);   // door window
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), innerMat);
  mesh.castShadow = mesh.receiveShadow = false;
  const extras = new THREE.Group();
  if (glassParts.length) {
    const g = new THREE.Mesh(mergeGeometries(glassParts), M.glass);
    g.castShadow = g.receiveShadow = false;
    extras.add(g);
  }
  const emit = new THREE.Mesh(mergeGeometries(emitParts), M.lightStrip);
  emit.castShadow = emit.receiveShadow = false;
  extras.add(emit);
  // route-map strips + LED panels above each door — merged to two draw calls
  const mapGeos = [], ledGeos = [];
  for (let c = 0; c < cars; c++) {
    const x0 = (c - (cars - 1) / 2) * (carLen + gap);
    for (const f of doorFrForCar(line, c, cars)) for (const s of [-1, 1]) {
      const mg = new THREE.PlaneGeometry(1.7, 0.26);
      if (s > 0) mg.rotateY(Math.PI);
      mg.translate(x0 + f * carLen, floorY + 2.02, s * (W / 2 - 0.14));
      mapGeos.push(mg);
      const lg = new THREE.PlaneGeometry(1.15, 0.18);
      if (s > 0) lg.rotateY(Math.PI);
      lg.translate(x0 + f * carLen + 1.15, floorY + 2.02, s * (W / 2 - 0.14));
      ledGeos.push(lg);
    }
  }
  extras.add(new THREE.Mesh(mergeGeometries(mapGeos), routeMapMat(line)));
  extras.add(new THREE.Mesh(mergeGeometries(ledGeos), ledMat));
  return { mesh, extras };
}

function buildTrain(line, cars, carLen) {
  const g = new THREE.Group();
  const W = 3.0, H = 3.3, gap = CAR_GAP;
  const stripe = new THREE.MeshStandardMaterial({ color: new THREE.Color(LINES[line].color), roughness: 0.5 });
  // car shells merged per material — one draw call each
  const geos = { body: [], win: [], str: [], inner: [] };
  const leafSpecs = [];                       // {x, z, s, side} per leaf
  const leafGeo = new THREE.BoxGeometry(0.85, 2.05, 0.07);
  for (let c = 0; c < cars; c++) {
    const x0 = (c - (cars - 1) / 2) * (carLen + gap);
    const bg = new THREE.BoxGeometry(carLen, H, W); bg.translate(x0, 2.1, 0); geos.body.push(bg);
    const wg = new THREE.BoxGeometry(carLen - 0.5, 0.9, W + 0.04); wg.translate(x0, 2.85, 0); geos.win.push(wg);
    // livery stripe as two side plates — a full-width solid band would
    // poke through the cabin as a coloured slab at seat height
    for (const ss of [-1, 1]) {
      const sg = new THREE.BoxGeometry(carLen, 0.28, 0.04);
      sg.translate(x0, 1.45, ss * (W / 2 + 0.03)); geos.str.push(sg);
    }
    const ig = new THREE.BoxGeometry(carLen - 0.7, H - 0.55, W - 0.55); ig.translate(x0, 2.02, 0); geos.inner.push(ig);
    // door pairs at the real stock positions — 5/car on metro lines,
    // 2/car near the ends on AEL stock (5 on its baggage car)
    for (const f of doorFrForCar(line, c, cars)) for (const side of [-1, 1]) for (const s of [-1, 1]) {
      leafSpecs.push({ x: x0 + f * carLen + s * 0.44, z: side * (W / 2 + 0.02), s, side });
    }
  }
  const half = (cars * (carLen + gap) - gap) / 2;
  for (const s of [-1, 1]) {
    const cg = new THREE.BoxGeometry(0.5, H * 0.9, W * 0.96); cg.translate(s * (half + 0.2), 2.05, 0); geos.win.push(cg);
    const lg = new THREE.BoxGeometry(0.15, 0.3, 1.9); lg.translate(s * (half + 0.5), 1.35, 0);
    const light = new THREE.Mesh(lg, headMat); g.add(light);
  }
  g.add(new THREE.Mesh(mergeGeometries(geos.body), bodyMat));
  g.add(new THREE.Mesh(mergeGeometries(geos.win), winMat));
  g.add(new THREE.Mesh(mergeGeometries(geos.str), stripe));
  // interior shell — light walls visible through windows and from aboard
  g.add(new THREE.Mesh(mergeGeometries(geos.inner), wallMat));
  // door leaves: one InstancedMesh, matrices slide on open/close
  const leafIM = new THREE.InstancedMesh(leafGeo, doorMat, leafSpecs.length);
  const _m = new THREE.Matrix4();
  leafSpecs.forEach((sp, i) => leafIM.setMatrixAt(i, _m.makeTranslation(sp.x, 2.05, sp.z)));
  leafIM.instanceMatrix.needsUpdate = true;
  leafIM.frustumCulled = false;
  g.add(leafIM);
  const leaves = { im: leafIM, specs: leafSpecs };
  const interior = buildInterior(line, cars, carLen, W, H, gap);
  g.add(interior.mesh, interior.extras);
  return { group: g, leaves, len: cars * (carLen + gap) - gap };
}

// ------------------------------------------------------------- route model
// A stop = one platform face (resolved to its PSD door set).
class Stop {
  constructor(ds, spec) {
    this.ds = ds;
    this.face = ds.face;
    this.line = ds.face.line;
    this.spec = TRAIN_SPEC[this.line];
    this.bx = BOXES[levelById(ds.level).box];
    this.levelY = levelById(ds.level).y;
    this.zc = (ds.track.z0 + ds.track.z1) / 2;
    this.doorSide = ds.kind === 'island' ? -ds.face.side : ds.face.side;
    this.tr = ds.track;
    this.stopX = (ds.track.x0 + ds.track.x1) / 2;
    this.terminus = !!ds.terminus;
    this.dwell = spec?.dwell ?? this.spec.dwell;
    this.uid = ds.level;
    this.stn = ds.level.split(':')[0];
    this.plat = ds.face.num;
    // portal the train exits toward after departing (local x end)
    this.outEnd = ds.face.dir > 0 ? 'x1' : 'x0';
  }
  portalX(end, halfLen) {
    return end === 'x1' ? this.tr.x1 + halfLen + 4 : this.tr.x0 - halfLen - 4;
  }
  worldOf(lx) { return boxToWorld(this.bx, lx, this.zc); }
  pos() { const w = this.worldOf(this.stopX); return { x: w.x, y: this.levelY, z: w.z }; }
}

// legs[i] runs from stops[i] to stops[(i+1)%n]:
//  'tunnel' — visible run between stations, trapezoid speed profile
//  'off'    — leave the map via one portal, reappear at the next stop's portal
function resolveRoute(routeDef, doorSets) {
  const stops = routeDef.stops.map(sd => {
    const ds = doorSets.find(d => d.level === sd.uid && d.face.num === sd.num);
    if (!ds) throw new Error(`route ${routeDef.line}: no door set ${sd.uid} P${sd.num}`);
    return new Stop(ds, sd);
  });
  const legs = routeDef.legs.map((via, i) => {
    const A = stops[i], B = stops[(i + 1) % stops.length];
    // portal B's consist enters through: termini take the same portal they
    // depart from, through services enter opposite the travel direction
    const inEnd = B.terminus ? B.outEnd : (B.face.dir > 0 ? 'x0' : 'x1');
    if (via === 'tunnel') {
      const wA = A.worldOf(A.stopX), wB = B.worldOf(B.stopX);
      const dist = Math.hypot(wB.x - wA.x, wB.z - wA.z);
      const dir = Math.sign(wB.x - wA.x) || 1;          // plan travel direction
      return { via, A, B, dist, travel: routeDef.travel ?? Math.max(40, dist / 13),
               dir, yA: A.levelY, yB: B.levelY, inEnd };
    }
    // off-map leg: depart A through its dir portal; re-enter B through inEnd
    return { via, A, B, inEnd, travel: routeDef.travel ?? 30 };
  });
  return { stops, legs, line: routeDef.line, startIdx: routeDef.startIdx };
}

// -------------------------------------------------------------- the consist
class Consist {
  constructor(scene, route, idx, total) {
    this.route = route;
    this.stops = route.stops;
    this.legs = route.legs;
    this.spec = TRAIN_SPEC[route.line];
    const t = buildTrain(route.line, this.spec.cars, this.spec.carLen);
    this.train = t.group;
    this.leafSets = t.leaves;
    this.trainLen = t.len;
    scene.add(this.train);

    // stagger the consist along the route — two consists must not start
    // berthed at the same face (they'd render inside each other)
    this.i = (route.startIdx ?? idx) % this.stops.length;
    this.leg = this.legs[this.i];     // current leg — valid before first _beginRun
    this.ds = null;                   // door set when berthed (null mid-run)
    this.bx = { cx: 0, cz: 0, rot: 0 }; // live frame for the player constraint
    this.tx = 0; this.zc = 0;
    this.doorSide = 1;
    this.floorY = -14;
    this.dwx = 0; this.dwz = 0;         // world displacement this frame (carry)
    this.drot = 0;                      // frame yaw delta this frame (carry)
    this.hasRider = false;              // set from the main loop each frame
    this.open = 0;
    this.nextAt = null;
    this.events = [];
    this._m4 = new THREE.Matrix4();

    // stagger consists along the route; start parked at a stop
    this.state = 'dwell';
    this.t = (idx * 0.5 + Math.random() * 0.4) * this.spec.headway / total + 4;
    this._berth(this.stops[this.i], true);
    this._pw = { x: this.train.position.x, z: this.train.position.z };
    this._prot = this.bx ? this.bx.rot : 0;
  }

  get color() { return LINES[this.route.line].color; }

  // park the consist at a stop: frame = the stop's box, tx = stop centre
  _berth(stop, snap = false) {
    this.ds = stop.ds;
    stop.ds.openSvc = this;               // this consist owns the bays now
    this.stop = stop;
    this.bx = stop.bx;
    this.zc = stop.zc;
    this.doorSide = stop.doorSide;
    this.tx = snap ? stop.stopX : this.tx;
    this.floorY = stop.levelY + 0.08;   // car floor = platform height
    this._place(stop.stopX, stop);
    // real door positions in this door set's frame — PSD bays open only
    // where a car door actually is (AEL has 2 pairs/car, metro stock 5)
    this._doorXs = doorXsFor(this.spec, this.route.line, this.tx);
  }

  _place(tx, stop) {
    const w = boxToWorld(stop.bx, tx, stop.zc);
    this.tx = tx;
    // the frame the player constraint resolves against must follow the
    // consist — off-legs re-place into the NEXT stop's box, so bx/zc/etc
    // have to move too or a rider's local coords resolve in the old frame
    this.bx = stop.bx;
    this.zc = stop.zc;
    this.doorSide = stop.doorSide;
    this.floorY = stop.levelY + 0.08;
    this.train.position.set(w.x, stop.levelY - 0.62, w.z);
    this.train.rotation.y = stop.bx.rot;
  }

  // free-running position along a leg (world point + yaw), sets bx frame
  _runPlace(x, z, yaw, y) {
    this.train.position.set(x, y - 0.62, z);
    this.train.rotation.y = -yaw;
    // the live frame the constraint pass resolves the player against
    this.bx = { cx: x, cz: z, rot: -yaw };
    this.tx = 0; this.zc = 0;
    this.floorY = y + 0.08;             // car floor tracks the running height
  }

  setDoors(open, dt) {
    this.open = THREE.MathUtils.clamp(this.open + (open ? dt : -dt) / DOOR_T, 0, 1);
    const o = this.open;
    const { im, specs } = this.leafSets;
    for (let i = 0; i < specs.length; i++) {
      const sp = specs[i];
      const slide = (sp.side === this.doorSide ? o : 0) * 0.78;
      this._m4.makeTranslation(sp.x + sp.s * slide, 2.05, sp.z);
      im.setMatrixAt(i, this._m4);
    }
    im.instanceMatrix.needsUpdate = true;
    // PSD leaves: slide open with the train doors while berthed — and keep
    // driving the LAST door set shut after departure so bays never gape.
    const ds = this.ds;
    if (ds) this._lastDs = ds;
    else if (this._lastDs?.openSvc) this._lastDs = null;  // another consist owns it now
    const d = ds || this._lastDs;
    if (d) {
      if (!d._slides) d._slides = new Float32Array(d.leafX.length).fill(d._slide ?? 0);
      let moving = false;
      for (let i = 0; i < d.leafX.length; i++) {
        // leaf pairs share a bay centre; bays the consist doesn't cover
        // (screen longer than the train) stay shut — bare track behind them
        const bayX = d.leafX[i] - d.leafDir[i] * (BAY / 4);
        const target = ds && bayOpen(bayX, this) ? o * 0.9 : 0;
        const cur = d._slides[i];
        if (Math.abs(cur - target) > 0.001) {
          d._slides[i] = cur + Math.sign(target - cur) * Math.min(Math.abs(target - cur), dt * 1.4);
          moving = true;
        }
        this._m4.makeTranslation(d.leafX[i] + d.leafDir[i] * d._slides[i], d.y, d.z);
        d.doors.setMatrixAt(i, this._m4);
      }
      if (moving) d.doors.instanceMatrix.needsUpdate = true;
      else if (!ds) this._lastDs = null;   // fully shut — release the set
    }
  }

  _beginRun(audio) {
    const leg = this.legs[this.i];
    if (this.ds) this.ds.openSvc = null;  // bays become barriers again
    this.ds = null;
    this.state = leg.via === 'tunnel' ? 'run' : 'offOut';
    this.leg = leg;
    this.t = leg.via === 'tunnel' ? leg.travel : DEP_T;
    this.s = 0;
    this.events.push({ type: 'depart', face: this.stop.face, level: this.stop.uid, service: this });
    audio?.announceDepart(this.stop.face, this.stop.pos());
  }

  update(dt, audio, tt, simNow, speed) {
    this.t -= dt;
    switch (this.state) {
      case 'dwell': {
        const closing = this.t < 1.6;
        this.setDoors(!closing, dt);
        if (!this._dwelled && this.t < this.stop.dwell * 0.55) {
          this._dwelled = true;
          audio?.announceDwell(this.stop.face, this.stop.pos());
        }
        if (closing && !this._chimed) { this._chimed = true; audio?.doorChime(this.stop.pos()); }
        if (this.t <= 0) {
          this._chimed = false; this._dwelled = false;
          this._beginRun(audio);
        }
        break;
      }
      case 'run': {   // visible inter-station tunnel leg
        this.setDoors(false, dt);
        const leg = this.leg;
        const A = leg.A, B = leg.B;
        const p = 1 - Math.max(this.t, 0) / leg.travel;
        // trapezoid-ish profile: smooth accelerate then brake
        const k = p < 0.35 ? easeOut(p / 0.35) * 0.5
                 : p < 0.65 ? 0.5 + (p - 0.35) / 0.3 * 0.28
                 : 0.78 + easeIn((p - 0.65) / 0.35) * 0.22;
        // path: departure portal -> B's arrival portal -> berth. The final
        // segment runs along B's track axis, so non-collinear legs (the
        // harbour crossing) still glide in through the portal aligned.
        // For collinear legs the waypoint lies on the axis — same path.
        if (!leg._path) {
          const pts = [
            A.worldOf(A.portalX(A.outEnd, this.trainLen / 2)),
            B.worldOf(B.portalX(leg.inEnd, this.trainLen / 2)),
            B.worldOf(B.stopX),
          ];
          const segs = [];
          let total = 0;
          for (let i = 0; i < pts.length - 1; i++) {
            const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z);
            segs.push({ a: pts[i], b: pts[i + 1], len, acc: total });
            total += len;
          }
          leg._path = { segs, total };
        }
        const d = k * leg._path.total;
        const s = leg._path.segs.find(sg => d <= sg.acc + sg.len) || leg._path.segs.at(-1);
        const f = s.len ? Math.min(1, (d - s.acc) / s.len) : 0;
        const x = THREE.MathUtils.lerp(s.a.x, s.b.x, f);
        const z = THREE.MathUtils.lerp(s.a.z, s.b.z, f);
        const y = THREE.MathUtils.lerp(A.levelY, B.levelY, k);
        const yaw = Math.atan2(s.b.z - s.a.z, s.b.x - s.a.x);
        this._runPlace(x, z, yaw, y);
        if (p > 0.82 && !this._ann) {
          this._ann = true;
          this.events.push({ type: 'arrive', face: B.face, level: B.uid });
          audio?.announceArrive(B.face, B.pos());
        }
        if (this.t <= 0) {
          this._ann = false;
          this.i = (this.i + 1) % this.stops.length;
          this._berth(this.stops[this.i]);
          this.state = 'dwell'; this.t = this.stop.dwell;
          this.events.push({ type: 'dwell', face: this.stop.face, level: this.stop.uid, service: this });
        }
        break;
      }
      case 'offOut': {   // slide out the departure portal, then vanish
        this.setDoors(false, dt);
        const A = this.leg.A;
        const p = 1 - Math.max(this.t, 0) / DEP_T;
        const outX = A.portalX(A.outEnd, this.trainLen / 2);
        this._place(THREE.MathUtils.lerp(this.stop.stopX, outX, easeIn(p)), A);
        if (this.t <= 0) {
          this.state = 'offWait';
          this.t = this._offWait(tt, simNow, speed);
          // a rider aboard shouldn't sit in the void through a full
          // layover — turn the consist around quickly and keep it visible
          if (this.hasRider) this.t = Math.min(this.t, 9);
          this.train.visible = !this.hasRider;
        }
        break;
      }
      case 'offWait': {
        this.nextAt = null;
        if (this.t <= 0) { this.state = 'offIn'; this.t = ARR_T; this.train.visible = true; this._ann = false; }
        break;
      }
      case 'offIn': {    // re-enter the next stop's portal to the berth
        this.setDoors(false, dt);
        const leg = this.leg, B = leg.B;
        const p = 1 - Math.max(this.t, 0) / ARR_T;
        const inX = B.portalX(leg.inEnd, this.trainLen / 2);
        this._place(THREE.MathUtils.lerp(inX, B.stopX, easeOut(p)), B);
        // point the consist at this stop for boarding constraints
        this.ds = null;
        if (p > 0.6 && !this._ann) {
          this._ann = true;
          this.events.push({ type: 'arrive', face: B.face, level: B.uid });
          audio?.announceArrive(B.face, B.pos());
        }
        if (this.t <= 0) {
          this.i = (this.i + 1) % this.stops.length;
          this._berth(this.stops[this.i]);
          this.state = 'dwell'; this.t = this.stop.dwell;
          this.events.push({ type: 'dwell', face: this.stop.face, level: this.stop.uid, service: this });
        }
        break;
      }
    }
    // world displacement for carrying a standing player — translation of
    // the consist plus rotation of its constraint frame (run-frames yaw
    // through tunnel curves)
    this.dwx = this.train.position.x - this._pw.x;
    this.dwz = this.train.position.z - this._pw.z;
    this.drot = this.bx.rot - this._prot;
    this._prot = this.bx.rot;
    this._pw.x = this.train.position.x; this._pw.z = this.train.position.z;
  }

  // how long to hide off-map: live schedule when the feed's up at 1x speed,
  // otherwise a synthetic layover inside the headway
  _offWait(tt, simNow, speed) {
    const B = this.leg.B;
    if (speed === 1 && tt?.live) {
      const sched = tt.next(B.stn, B.plat, this._consumed ?? 0);
      if (sched != null) {
        this._consumed = sched;
        const wait = Math.max((sched - simNow()) / 1000 - ARR_T, 4);
        this.nextAt = sched;
        return wait;
      }
    }
    this.nextAt = null;
    return Math.max(this.spec.headway - this.stop.dwell - ARR_T - DEP_T, 8);
  }

  // world positions of a few PSD door bays (only valid while berthed)
  doorWorld(n = 5, off = 0.9) {
    const ds = this.ds;
    if (!ds) return [];
    const out = [];
    const xs = this._doorXs?.length ? this._doorXs : ds.xs;
    const step = Math.max(1, Math.floor(xs.length / n));
    for (let i = 0; i < xs.length; i += step) {
      const w = boxToWorld(this.bx, xs[i], ds.z + this.doorSide * off);
      out.push({ x: w.x, z: w.z });
    }
    return out;
  }
}

// ------------------------------------------------------------ route table
// legs[i] runs after stops[i]. 'tunnel' = visible run between stations;
// 'off' = off-map loop (through services re-enter the far portal, termini
// reverse from the same portal). Travel times ≈ the real inter-station runs.
export const ROUTES = [
  // Tsuen Wan Line: Central terminus <-> Admiralty -> harbour crossing ->
  // Tsim Sha Tsui, the line's north end for now. Both termini reverse at
  // the portal their services depart through (CEN east / TST west — the
  // harbour-side crossover box). The crossing legs dive under the sea:
  // the path machinery routes them through each destination's arrival
  // portal so the consist glides in aligned with the platform axis.
  // Lai Chi Kok is the temporary north end — TWL berths the L2
  // northbound face (P1), wraps off-map and re-enters the southbound
  // face (P2) to head back south. MOK/PRE interleave TWL/KTL
  // crosswise: MOK pairs by direction (north upstairs), PRE mirrors it
  // (the KTL dives between the levels in the tunnel between them).
  { line: 'TWL', travel: 75, legs: ['tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'off', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'off'], consists: 2,
    stops: [{ uid: 'LCK:L2', num: 2 },
            { uid: 'CSW:L2', num: 2 },
            { uid: 'SSP:L2', num: 2 },
            { uid: 'PRE:L3', num: 4 },
            { uid: 'MOK:L3', num: 2 },
            { uid: 'YMT:L2', num: 2 },
            { uid: 'JOR:L2', num: 2 },
            { uid: 'TST:L2', num: 2 },
            { uid: 'ADM:L2', num: 4 },
            { uid: 'CEN:L3', num: 1, dwell: 55 },
            { uid: 'CEN:L3', num: 2 },
            { uid: 'ADM:L3', num: 1 },
            { uid: 'TST:L2', num: 1 },
            { uid: 'JOR:L2', num: 1 },
            { uid: 'YMT:L2', num: 1 },
            { uid: 'MOK:L2', num: 1 },
            { uid: 'PRE:L2', num: 1 },
            { uid: 'SSP:L2', num: 1 },
            { uid: 'CSW:L2', num: 1 },
            { uid: 'LCK:L2', num: 1, dwell: 55 }] },
  // Kwun Tong Line — Yau Ma Tei ↔ Mong Kok ↔ Prince Edward. Both ends
  // are termini for now: PRE reverses between its L3 northbound face
  // (P3) and L2 southbound face (P2); YMT reverses between its L3
  // island's faces at the east portal.
  { line: 'KTL', travel: 75, legs: ['tunnel', 'tunnel', 'off', 'tunnel', 'tunnel', 'off'], consists: 2,
    stops: [{ uid: 'YMT:L3', num: 3 },
            { uid: 'MOK:L2', num: 3 },
            { uid: 'PRE:L3', num: 3, dwell: 40 },
            { uid: 'PRE:L2', num: 2, dwell: 40 },
            { uid: 'MOK:L3', num: 4 },
            { uid: 'YMT:L3', num: 4, dwell: 40 }] },
  // Island Line through service: Kennedy Town is the west terminus —
  // consists reverse off-map in the Mount Davis overrun tunnel and head
  // east through Causeway Bay, Tin Hau, Fortress Hill, North Point and the
  // eastern arm past at-grade Heng Fa Chuen to Chai Wan — the elevated
  // terminus, where the consist departs the west portal (scissors
  // crossover) and re-enters onto the other face before running back west.
  // At NOP the eastbound face (P1) sits on the lower island and the
  // westbound face (P2) on the upper island — the cross-platform pair is
  // split by direction.
  { line: 'ISL', travel: 80, legs: ['tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'off', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'tunnel', 'off'], consists: 4,
    stops: [{ uid: 'KET:L2', num: 1 }, { uid: 'HKU:L2', num: 1 },
            { uid: 'SYP:L2', num: 1 },
            { uid: 'SHW:L2', num: 1 }, { uid: 'CEN:L2', num: 3 },
            { uid: 'ADM:L2', num: 3 }, { uid: 'WAC:L2', num: 1 },
            { uid: 'CAB:L2', num: 1 }, { uid: 'TIH:L2', num: 1 },
            { uid: 'FOH:L2', num: 1 }, { uid: 'NOP:L3', num: 1 },
            { uid: 'QUB:L2', num: 1 }, { uid: 'TAK:L2', num: 1 },
            { uid: 'SWH:L2', num: 1 }, { uid: 'SKW:L2', num: 1 },
            { uid: 'HFC:P', num: 1 }, { uid: 'CHW:U2', num: 1 },
            { uid: 'CHW:U2', num: 2 },
            { uid: 'HFC:P', num: 2 }, { uid: 'SKW:L2', num: 2 }, { uid: 'SWH:L2', num: 2 },
            { uid: 'TAK:L2', num: 2 }, { uid: 'QUB:L2', num: 2 },
            { uid: 'NOP:L2', num: 2 }, { uid: 'FOH:L3', num: 2 },
            { uid: 'TIH:L3', num: 2 }, { uid: 'CAB:L3', num: 2 },
            { uid: 'WAC:L3', num: 2 }, { uid: 'ADM:L3', num: 2 },
            { uid: 'CEN:L4', num: 4 }, { uid: 'SHW:L2', num: 2 },
            { uid: 'SYP:L2', num: 2 }, { uid: 'HKU:L2', num: 2 },
            { uid: 'KET:L2', num: 2 }] },
  // Tseung Kwan O Line terminates at North Point: consists berth at P4
  // on the upper island (cross-platform with westbound ISL), reverse
  // off-map in the tail tunnel, then re-enter at P3 on the lower island
  // for the eastbound departure to Po Lam/LOHAS Park.
  { line: 'TKO', travel: 75, legs: ['off', 'tunnel', 'off', 'tunnel'], consists: 2,
    stops: [{ uid: 'NOP:L2', num: 4 }, { uid: 'NOP:L3', num: 3 },
            { uid: 'QUB:L3', num: 3 }, { uid: 'QUB:L3', num: 4 }] },
  // terminus reversals: each line's island has two faces — a consist
  // departs one face through its portal and re-enters berthing at the
  // other (a rider gets carried across to the opposite platform edge)
  { line: 'EAL', legs: ['off', 'off'], consists: 2,
    stops: [{ uid: 'ADM:L5', num: 7 }, { uid: 'ADM:L5', num: 8 }] },
  { line: 'SIL', legs: ['off', 'off'], consists: 2,
    stops: [{ uid: 'ADM:L6', num: 5 }, { uid: 'ADM:L6', num: 6 }] },
  { line: 'TCL', legs: ['off', 'off'], consists: 2,
    stops: [{ uid: 'HOK:L4', num: 3 }, { uid: 'HOK:L4', num: 4 }] },
  { line: 'AEX', legs: ['off'], consists: 1, stops: [{ uid: 'HOK:L2', num: 1 }] },
];

// a PSD bay is a solid barrier unless the consist berthed there is dwelling
// with its doors open (ds.openSvc is set at _berth and cleared at _beginRun)
// AND the consist fully covers the bay — screens run the full platform
// length but trains can be shorter, so outboard bays open onto bare track.
// The whole opening must sit inside the car: a bay whose edge hangs past
// the car end would open onto the gap between cars.
const bayCovered = (x, s) => Math.abs(x - s.tx) < s.trainLen / 2 - 0.45 - BAY / 2;
// a bay only opens where the consist really has a door — screen bays are
// spaced finer than car doors, so positions between doors stay sealed
const bayOpen = (x, s) => bayCovered(x, s) && s._doorXs?.some(d => Math.abs(x - d) < 1.3);
export function psdBlocked(bay) {
  const s = bay.ds.openSvc;
  if (!(s && s.state === 'dwell' && s.open > 0.55)) return true;
  return !bayOpen(bay.x, s);
}

export class TrainSim {
  constructor(scene) {
    const doorSets = [];
    for (const lvl of Object.keys(FITTINGS)) {
      for (const ds of FITTINGS[lvl].doorSets) doorSets.push(ds);
    }
    // every door bay registers as a dynamic barrier in world space so the
    // platform edge stays sealed whenever no consist has its doors open there.
    // OBB form so rotated level boxes (ADM L5/L6) get correctly angled walls.
    for (const ds of doorSets) {
      const lvl = levelById(ds.level), bx = BOXES[lvl.box];
      for (const x of ds.xs) {
        const w = boxToWorld(bx, x, ds.z);
        PSD_BAYS.push({
          level: ds.level, ds, x,
          cx: w.x, cz: w.z, hx: BAY / 2, hz: 0.12,
          cos: Math.cos(bx.rot), sin: Math.sin(bx.rot),
          y0: lvl.y - 0.5, y1: lvl.y + 3,
        });
      }
    }
    this.services = [];
    for (const rd of ROUTES) {
      const route = resolveRoute(rd, doorSets);
      for (let i = 0; i < rd.consists; i++) {
        this.services.push(new Consist(scene, route, i, rd.consists));
      }
    }
    this.tt = new Timetable();
  }

  update(dt, audio, simNow, speed = 1) {
    this.tt.update(dt);
    const events = [];
    for (const s of this.services) {
      s.update(dt, audio, this.tt, simNow, speed);
      if (s.events.length) { events.push(...s.events); s.events.length = 0; }
    }
    return events;
  }

  // faces currently dwelling with doors open — used by passengers + the rig
  dwelling() {
    return this.services.filter(s => s.state === 'dwell' && s.open > 0.8);
  }

  // ticker rows: one per door set — the berthed consist's state, else the ETA
  // of the next consist heading here
  board() {
    const rows = [];
    for (const lvl of Object.keys(FITTINGS)) {
      for (const ds of FITTINGS[lvl].doorSets) {
        const berthed = this.services.find(s => s.ds === ds);
        if (berthed) {
          rows.push({ ds, face: ds.face, state: berthed.state === 'dwell' ? 'dwell' : 'depart',
                      color: berthed.color, nextAt: null, terminus: ds.terminus });
          continue;
        }
        // next consist whose route will berth here
        let best = null;
        for (const s of this.services) {
          const nextStop = s.route.stops[(s.i + (s.state === 'dwell' ? 1 : 0)) % s.route.stops.length];
          const coming = s.state === 'offIn' || s.state === 'run' ? s.leg.B : nextStop;
          if (coming.ds !== ds) continue;
          const eta = s.state === 'run' ? s.t
            : s.state === 'offIn' ? s.t
            : s.state === 'offWait' ? s.t + ARR_T
            : s.state === 'dwell' ? s.t + (s.leg?.travel ?? 20)
            : s.t;
          if (!best || eta < best.eta) best = { s, eta };
        }
        rows.push({ ds, face: ds.face, state: 'away',
                    color: LINES[ds.face.line].color,
                    nextAt: best?.s.nextAt ?? null, eta: best?.eta ?? null,
                    terminus: ds.terminus });
      }
    }
    return rows;
  }
}
