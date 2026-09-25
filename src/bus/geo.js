// ---- lat/long -> world warp --------------------------------------------------
// The schematic world isn't an affine image of reality (the island corridor is
// straightened, the harbour compressed), so a plain projection can't place
// API stops. Instead: a least-squares affine base gives the right overall
// scale/orientation, and an inverse-distance-weighted displacement field over
// the hand-placed stop anchors corrects it locally — exact at every anchored
// kerb, smooth between them, and a coherent offset beyond the anchor hull.
const LA0 = 22.3, LO0 = 114.17;                    // pseudo-metre origin
const KX = 111320 * Math.cos(LA0 * Math.PI / 180), KY = 111320;
const mx = lo => (lo - LO0) * KX, my = la => (la - LA0) * KY;

// plausible HK service area — drops the handful of junk-coord records
export const inHK = (la, lo) => la > 22.14 && la < 22.6 && lo > 113.8 && lo < 114.55;

function lstsq(P, y) {
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  for (let i = 0; i < P.length; i++) for (let a = 0; a < 3; a++) {
    for (let c = 0; c < 3; c++) M[a][c] += P[i][a] * P[i][c];
    b[a] += P[i][a] * y[i];
  }
  const G = M.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(G[r][c]) > Math.abs(G[p][c])) p = r;
    [G[c], G[p]] = [G[p], G[c]];
    for (let r = 0; r < 3; r++) if (r !== c) {
      const k = G[r][c] / G[c][c];
      for (let j = c; j < 4; j++) G[r][j] -= k * G[c][j];
    }
  }
  return G.map((r, i) => r[3] / r[i]);
}

// anchors: [{la, lo, x, z}] — real stop coords pinned to kerb world positions
export function makeWarp(anchors) {
  const P = anchors.map(a => [a.u = mx(a.lo), a.v = my(a.la), 1]);
  const cx = lstsq(P, anchors.map(a => a.x)), cz = lstsq(P, anchors.map(a => a.z));
  const base = (u, v) => [cx[0] * u + cx[1] * v + cx[2], cz[0] * u + cz[1] * v + cz[2]];
  for (const a of anchors) { const [px, pz] = base(a.u, a.v); a.dx = a.x - px; a.dz = a.z - pz; }
  const K = 12, SM = 250;                          // nearest anchors, metres
  return (la, lo) => {
    const u = mx(lo), v = my(la), [bx, bz] = base(u, v);
    let wx = 0, wz = 0, ws = 0, n = 0;
    const ds = anchors.map(a => Math.hypot(u - a.u, v - a.v));
    const order = ds.map((d, i) => [d, i]).sort((a, b) => a[0] - b[0]);
    if (order[0][0] < 1) { const a = anchors[order[0][1]]; return [a.x, a.z]; }
    for (const [d, i] of order.slice(0, K)) {
      const w = 1 / (d * d + SM * SM), a = anchors[i];
      wx += w * a.dx; wz += w * a.dz; ws += w; n++;
    }
    return [bx + wx / ws, bz + wz / ws];
  };
}
