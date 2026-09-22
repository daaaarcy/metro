// ---- Citybus corridor data -------------------------------------------------
// Schematic mapping: real CTB stop ids hang off the model's two E-W road
// bands (south band = eastbound, north band = westbound — a one-way couplet
// like Des Voeux Rd / Connaught Rd). Gaps between site road rects get
// staircase connectors so a straight-diagonal lane path stays on pavement.

const LANE_IN = 2.5;      // lane offset toward the station-side kerb
const ROAD_H = 16;        // connector strip height (covers lane +-8)

// corridor sites west -> east: road x extents + [z0,z1] per band
export const CORRIDOR = [
  { stn: 'KET', x0: -4355, x1: -4145, s: [40, 52],   n: [-64, -52] },
  { stn: 'HKU', x0: -3655, x1: -3445, s: [40, 52],   n: [-64, -52] },
  { stn: 'SYP', x0: -2955, x1: -2745, s: [40, 52],   n: [-64, -52] },
  { stn: 'SHW', x0: -2160, x1: -1940, s: [40, 52],   n: [-64, -52] },
  { stn: 'HOK', x0: -1610, x1: -1350, s: [70, 82],   n: [-79, -67] },
  { stn: 'CEN', x0: -1145, x1: -955,  s: [60, 72],   n: [-69, -57] },
  { stn: 'ADM', x0: -95,   x1: 95,    s: [44, 56],   n: [-64, -52] },
  { stn: 'WAC', x0: 790,   x1: 970,   s: [36, 47],   n: [-47, -36] },
  { stn: 'CAB', x0: 1582,  x1: 1818,  s: [36, 47],   n: [-47, -36] },
];

const laneS = s => (s.s[0] + s.s[1]) / 2 - LANE_IN;
const laneN = s => (s.n[0] + s.n[1]) / 2 + LANE_IN;

// ---- connector road strips (emitted by buildCity) --------------------------
// gap i -> i+1 on a band: staircase of N rects at lerped z centres so a
// diagonal lane path never leaves pavement.
export const CONNECTORS = [];

function gapConnectors(a, b, laneA, laneB) {
  const x0 = a.x1, x1 = b.x0, dz = laneB - laneA;
  const n = Math.max(1, Math.round(Math.abs(dz) / 10) + 1);
  for (let k = 0; k < n; k++) {
    const sx0 = x0 + (x1 - x0) * (k / n);
    const sx1 = x0 + (x1 - x0) * ((k + 1) / n);
    const c = laneA + dz * ((k + 0.5) / n);
    CONNECTORS.push([sx0, c - ROAD_H / 2, sx1, c + ROAD_H / 2]);
  }
}

// EXC dig (x 478..722, z -94..-6) blocks the westbound band between ADM and
// WAC — buses detour down its existing flanking N-S strips onto Gloucester Rd.
export const EXC_DETOUR = {
  eastStripX: 728,          // existing road [722,-94,734,14]
  westStripX: 472,          // existing road [466,-94,478,14]
  gloucesterZ: 8,           // existing road [470,2,730,14]
};

{
  // eastbound (south band) gaps — all straight connectors
  for (let i = 0; i < CORRIDOR.length - 1; i++)
    gapConnectors(CORRIDOR[i], CORRIDOR[i + 1], laneS(CORRIDOR[i]), laneS(CORRIDOR[i + 1]));

  // westbound (north band) gaps — skip WAC->ADM (the detour handles it)
  for (let i = CORRIDOR.length - 1; i > 0; i--) {
    const a = CORRIDOR[i], b = CORRIDOR[i - 1];
    if (a.stn === 'WAC' && b.stn === 'ADM') continue;
    gapConnectors(b, a, laneN(b), laneN(a));
  }
  // westbound detour pieces: WAC north road -> EXC east strip, and
  // EXC west strip -> ADM north road
  CONNECTORS.push([734, -48, 790, -34]);               // WAC road -> east strip
  CONNECTORS.push([160, -64, 466, -44]);               // west strip -> ADM road
  // terminus aprons
  // CAB east: extend both bands to x=1838, then a U-turn apron east of the
  // dig (CAB hole ends x=1822; east NS road [1826,-34,1838,34] tiles mid)
  CONNECTORS.push([1818, 34, 1838, 50]);
  CONNECTORS.push([1818, -50, 1838, -34]);
  CONNECTORS.push([1838, -52, 1862, 52]);
  // KET west: extend both bands to x=-4380; apron west of the hole (x0=-4366)
  CONNECTORS.push([-4380, 39, -4355, 53]);
  CONNECTORS.push([-4380, -66, -4355, -50]);
  CONNECTORS.push([-4435, -62, -4380, 48]);
}

// ---- route paths ------------------------------------------------------------
// eastbound: KET -> CAB along the south band (z drifts per site)
function buildEastbound() {
  const pts = [];
  const k = CORRIDOR[0];
  pts.push([-4380, laneS(k)], [k.x0, laneS(k)]);
  for (let i = 0; i < CORRIDOR.length - 1; i++) {
    const a = CORRIDOR[i], b = CORRIDOR[i + 1];
    pts.push([a.x1, laneS(a)]);
    if (Math.abs(laneS(b) - laneS(a)) > 1) pts.push([(a.x1 + b.x0) / 2, (laneS(a) + laneS(b)) / 2]);
    pts.push([b.x0, laneS(b)]);
  }
  const last = CORRIDOR[CORRIDOR.length - 1];
  pts.push([last.x1, laneS(last)]);
  return pts;
}

// westbound: CAB -> KET along the north band, EXC detour spliced in
function buildWestbound() {
  const pts = [];
  const cab = CORRIDOR[CORRIDOR.length - 1];
  pts.push([cab.x1, laneN(cab)]);
  for (let i = CORRIDOR.length - 1; i > 0; i--) {
    const a = CORRIDOR[i], b = CORRIDOR[i - 1];
    pts.push([a.x0, laneN(a)]);
    if (a.stn === 'WAC' && b.stn === 'ADM') {
      const D = EXC_DETOUR, lz = laneN(b);
      // off the band, down the east strip, along Gloucester, up the west strip
      pts.push([734, laneN(a)], [D.eastStripX, laneN(a)], [D.eastStripX, D.gloucesterZ],
               [D.westStripX, D.gloucesterZ], [D.westStripX, lz + 2], [466, lz + 2],
               [466, lz], [b.x1, lz]);
    } else {
      if (Math.abs(laneN(b) - laneN(a)) > 1) pts.push([(a.x0 + b.x1) / 2, (laneN(a) + laneN(b)) / 2]);
      pts.push([b.x1, laneN(b)]);
    }
  }
  const k = CORRIDOR[0];
  pts.push([k.x0, laneN(k)], [-4380, laneN(k)]);
  return pts;
}

export const EB_PATH = buildEastbound();
export const WB_PATH = buildWestbound();

// closed loop: EB + east U-turn arc + WB + west U-turn arc
export const LOOP_PTS = (() => {
  const cab = CORRIDOR[CORRIDOR.length - 1], ket = CORRIDOR[0];
  const pts = [...EB_PATH];
  // east U-turn: (cab.x1, zS) -> (cab.x1, zN) bulging east onto the apron
  {
    const zA = laneS(cab), zB = laneN(cab), cz = (zA + zB) / 2, r = (zA - zB) / 2;
    for (let i = 1; i <= 8; i++) {
      const a = Math.PI / 2 - Math.PI * i / 8;   // +90deg -> -90deg
      pts.push([cab.x1 + r * Math.cos(a), cz + r * Math.sin(a)]);
    }
  }
  pts.push(...WB_PATH.slice(1));                 // arc already ends at WB_PATH[0]
  // west U-turn: (-4380, zN) -> (-4380, zS) bulging west onto the apron
  {
    const zA = laneN(ket), zB = laneS(ket), cz = (zA + zB) / 2, r = (zB - zA) / 2;
    for (let i = 1; i <= 7; i++) {
      const a = -Math.PI / 2 + Math.PI * i / 8;  // -90deg -> +90deg
      pts.push([-4380 - r * Math.cos(a), cz + r * Math.sin(a)]);
    }
  }
  return pts;                                    // wraps back to EB_PATH[0]
})();

// ---- bus stops ---------------------------------------------------------------
export const BUS_ROUTE = {
  id: '5B', co: 'CTB',
  ebDestZh: '銅鑼灣（香港大球場）', ebDestEn: 'Causeway Bay (HK Stadium)',
  wbDestZh: '堅尼地城',           wbDestEn: 'Kennedy Town',
};

// {dir, stn, x, stopId, zh, en} — x is where the bus halts; furniture sits on
// the station-side kerb derived from the band.
export const BUS_STOPS = [
  // eastbound — real CTB 5B outbound stop ids
  { dir: 'EB', stn: 'KET', x: -4270, stopId: '001152', zh: '堅尼地城',          en: 'Kennedy Town' },
  { dir: 'EB', stn: 'HKU', x: -3570, stopId: '001080', zh: '卑路乍灣公園',       en: 'Belcher Bay Park' },
  { dir: 'EB', stn: 'SYP', x: -2870, stopId: '001062', zh: '西區警署',          en: 'Western Police Station' },
  { dir: 'EB', stn: 'SHW', x: -2070, stopId: '001187', zh: '永安中心',          en: 'Wing On Centre' },
  { dir: 'EB', stn: 'CEN', x: -1070, stopId: '001025', zh: '皇后像廣場',         en: 'Statue Square' },
  { dir: 'EB', stn: 'ADM', x: -20,   stopId: '003845', zh: '金鐘－金鐘廊',       en: 'Admiralty - Queensway Plaza' },
  { dir: 'EB', stn: 'WAC', x: 860,   stopId: '002435', zh: '杜老誌道',          en: 'Tonnochy Road' },
  { dir: 'EB', stn: 'CAB', x: 1700,  stopId: '002438', zh: '崇光百貨',          en: 'Sogo Department Store' },
  // westbound — real CTB 5B inbound stop ids
  { dir: 'WB', stn: 'CAB', x: 1740,  stopId: '002439', zh: '銅鑼灣－希慎廣場',   en: 'Causeway Bay - Hysan Place' },
  { dir: 'WB', stn: 'WAC', x: 900,   stopId: '002446', zh: '修頓球場',          en: 'Southorn Playground' },
  { dir: 'WB', stn: 'ADM', x: 40,    stopId: '001140', zh: '金鐘－太古廣場',     en: 'Admiralty - Pacific Place' },
  { dir: 'WB', stn: 'CEN', x: -1030, stopId: '001054', zh: '置地廣場',          en: 'The Landmark' },
  { dir: 'WB', stn: 'SHW', x: -2030, stopId: '001040', zh: '西港城',            en: 'Western Market' },
  { dir: 'WB', stn: 'SYP', x: -2830, stopId: '001068', zh: '正街',              en: 'Centre Street' },
  { dir: 'WB', stn: 'HKU', x: -3530, stopId: '001070', zh: '山道',              en: 'Hill Road' },
  { dir: 'WB', stn: 'KET', x: -4230, stopId: '001152', zh: '堅尼地城',          en: 'Kennedy Town' },
];

// resolve each stop to world coords + kerb side from the corridor bands
export function resolveStops() {
  const byStn = Object.fromEntries(CORRIDOR.map(s => [s.stn, s]));
  return BUS_STOPS.map(st => {
    const s = byStn[st.stn];
    const band = st.dir === 'EB' ? s.s : s.n;
    const laneZ = st.dir === 'EB' ? laneS(s) : laneN(s);
    // station-side kerb: south band -> north edge; north band -> south edge
    const kerbZ = st.dir === 'EB' ? band[0] : band[1];
    return { ...st, laneZ, kerbZ };
  });
}
