// ---- Citybus network data ----------------------------------------------------
// Schematic mapping of real CTB routes (route/stop ids from the data.gov.hk
// Citybus API) onto the modelled road network:
//   * Island corridor couplet: eastbound runs the south road band, westbound
//     the north band (like Des Voeux Rd / Connaught Rd), KET -> CHW.
//   * East of Shau Kei Wan the north band doesn't exist — the south road runs
//     two-way (like King's Rd / Chai Wan Rd), rejoining the couplet through
//     the SKW junction strip.
//   * Southern network: a north-south link at x~982 drops from the Wan Chai
//     gap to Wong Chuk Hang Rd, passing under the east ridge as the Aberdeen
//     Tunnel; a bridge over the Aberdeen Channel (x 375..435) ties in the
//     Lei Tung estate drives and South Horizons.

const LANE_IN = 2.5;
const ROAD_H = 16;

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
  { stn: 'TIH', x0: 2295,  x1: 2505,  s: [40, 52],   n: [-64, -52] },
  { stn: 'FOH', x0: 2795,  x1: 3005,  s: [40, 52],   n: [-64, -52] },
  { stn: 'NOP', x0: 3495,  x1: 3705,  s: [40, 52],   n: [-64, -52] },
  { stn: 'QUB', x0: 4095,  x1: 4305,  s: [40, 52],   n: [-64, -52] },
  { stn: 'TAK', x0: 4690,  x1: 4910,  s: [40, 52],   n: [-64, -52] },
  { stn: 'SWH', x0: 5295,  x1: 5505,  s: [40, 52],   n: [-64, -52] },
  { stn: 'SKW', x0: 5890,  x1: 6110,  s: [40, 52],   n: [-64, -52] },
  // east of SKW the south road carries both directions (two-way lanes)
  { stn: 'HFC', x0: 6480,  x1: 6720,  s: [44, 56],   n: [44, 56] },
  { stn: 'CHW', x0: 7285,  x1: 7515,  s: [44, 56],   n: [44, 56] },
];

// east Kowloon spine for route 790 (KOT -> POL), west -> east; s = south road
// (westbound lane), n = north road (eastbound lane)
export const EKL = [
  { stn: 'KOT', x0: 470,  x1: 730,  s: [-1376, -1364], n: [-1476, -1464] },
  { stn: 'SKM', x0: 820,  x1: 1080, s: [-1500, -1488], n: [-1392, -1380] },
  { stn: 'LOF', x0: 1120, x1: 1380, s: [-1520, -1508], n: [-1412, -1400] },
  { stn: 'WTS', x0: 1410, x1: 1670, s: [-1500, -1488], n: [-1392, -1380] },
  { stn: 'DIH', x0: 1700, x1: 1960, s: [-1500, -1488], n: [-1392, -1380] },
  { stn: 'CHH', x0: 2030, x1: 2290, s: [-1680, -1668], n: [-1572, -1560] },
  { stn: 'KOB', x0: 2300, x1: 2580, s: [-1748, -1736], n: [-1624, -1612] },
  { stn: 'NTK', x0: 2580, x1: 2860, s: [-1808, -1796], n: [-1684, -1672] },
  { stn: 'KWT', x0: 2860, x1: 3140, s: [-1868, -1856], n: [-1744, -1732] },
  { stn: 'LAT', x0: 3130, x1: 3390, s: [-1940, -1928], n: [-1832, -1820] },
  { stn: 'YAT', x0: 3390, x1: 3650, s: [-2020, -2008], n: [-1912, -1900] },
  { stn: 'TKL', x0: 3650, x1: 3910, s: [-2100, -2088], n: [-1992, -1980] },
  { stn: 'TKW', x0: 4170, x1: 4430, s: [-2240, -2228], n: [-2132, -2120] },
  { stn: 'HAH', x0: 4570, x1: 4830, s: [-2340, -2328], n: [-2232, -2220] },
  { stn: 'POL', x0: 4950, x1: 5210, s: [-2440, -2428], n: [-2332, -2320] },
];
const eklS = c => (c.s[0] + c.s[1]) / 2 + LANE_IN;   // WB lane on the south road
const eklN = c => (c.n[0] + c.n[1]) / 2 - LANE_IN;   // EB lane on the north road

const laneS = c => (c.s[0] + c.s[1]) / 2 - LANE_IN;
const laneN = c => (c.n[0] + c.n[1]) / 2 + LANE_IN;
const kerbS = c => c.s[0];
const kerbN = c => c.n[1];

// ---- connector road strips (emitted by buildCity) ----------------------------
export const CONNECTORS = [];

function gapSteps(x0, x1, laneA, laneB) {
  // staircase slabs ~9m deep in z, tiled edge-to-edge so nothing double-paves
  const dz = laneB - laneA, n = Math.max(1, Math.round(Math.abs(dz) / 9));
  const half = n > 1 ? Math.abs(dz) / (2 * n) : ROAD_H / 2;
  for (let k = 0; k < n; k++) {
    const sx0 = x0 + (x1 - x0) * (k / n), sx1 = x0 + (x1 - x0) * ((k + 1) / n);
    const c = laneA + dz * ((k + 0.5) / n);
    CONNECTORS.push([sx0, c - half, sx1, c + half]);
  }
}

// EXC dig (x 478..722, z -94..-6) blocks the WB band ADM<->WAC — buses detour
// down its flanking N-S strips onto Gloucester Rd.
export const EXC_DETOUR = { eastStripX: 728, westStripX: 472, gloucesterZ: 8 };

{
  const ix = Object.fromEntries(CORRIDOR.map((c, i) => [c.stn, i]));
  // eastbound (south band) gaps — everything except the two-way east end,
  // where one wide connector covers both lanes
  for (let i = 0; i < CORRIDOR.length - 1; i++) {
    const a = CORRIDOR[i], b = CORRIDOR[i + 1];
    if (a.stn === 'SKW' || a.stn === 'HFC') continue;    // wide rect below
    gapSteps(a.x1, b.stn === 'CEN' ? -1220 : b.x0, laneS(a), laneS(b));
  }
  // westbound (north band) gaps — SKW..KET, skipping WAC->ADM (detour)
  for (let i = ix.SKW; i > 0; i--) {
    const a = CORRIDOR[i], b = CORRIDOR[i - 1];
    if (a.stn === 'WAC' && b.stn === 'ADM') continue;
    gapSteps(b.x1, a.stn === 'CEN' ? -1220 : a.x0, laneN(b), laneN(a));
  }
  // two-way section connectors (cover EB lane ~47.5 and WB lane ~52.5)
  CONNECTORS.push([6110, 38, 6480, 58]);                 // SKW -> HFC
  CONNECTORS.push([6720, 38, 7285, 58]);                 // HFC -> CHW
  // SKW junction-strip extenders (WB lane <-> north band over the dig)
  CONNECTORS.push([5994, -52, 6006, -36]);
  CONNECTORS.push([5994, 36, 6006, 40]);
  CONNECTORS.push([-962, -64, -955, -56]);               // CEN WB band stub (ends -962)
  // EXC detour fillers
  CONNECTORS.push([734, -48, 790, -34]);                 // WAC band -> east strip
  CONNECTORS.push([160, -64, 466, -44]);                 // west strip -> ADM band
  // terminus aprons (bulge room for the U-turn arcs) — z-ranges butt against
  // the gap-connector steps so nothing double-paves
  CONNECTORS.push([1818, -38.96, 1862, 33.25]);          // CAB east slab
  CONNECTORS.push([-4380, 39, -4355, 53]);               // KET west
  CONNECTORS.push([-4380, -66, -4355, -50]);
  CONNECTORS.push([-4435, -62, -4380, 48]);
  CONNECTORS.push([-2225, -47.5, -2160, 35.5]);          // SHW west
  CONNECTORS.push([-1220, -68, -1145, 70]);              // CEN west apron (gap steps end at -1220)
  CONNECTORS.push([3705, -47.5, 3770, 35.5]);            // NOP east
  CONNECTORS.push([5505, -47.5, 5565, 35.5]);            // SWH east
  CONNECTORS.push([2505, -47.5, 2568, 35.5]);            // TIH east (5X)
  CONNECTORS.push([7515, 36, 7588, 58]);                 // CHW east (two-way teardrop)
  CONNECTORS.push([3495, -52, 3520, 40]);                // NOP terminus J-hook deck
  // south link: x 976..988 threads the Wan Chai tower slot, tunnels under the
  // east ridge (z 235..365) — the schematic Aberdeen Tunnel. The WAC->CAB
  // staircase steps already pave z -47..-31 / 31..47 across the link.
  CONNECTORS.push([976, -31, 988, 31]);                  // link, between the bands
  CONNECTORS.push([976, 47, 988, 536]);                  // link, south of EB band
  CONNECTORS.push([970, 47, 976, 58]);                   // EB band junction filler
  CONNECTORS.push([960, 536, 990, 548]);                 // WCH Rd east to the link
  CONNECTORS.push([960, 548, 994, 562]);                 // junction pad south of it
  CONNECTORS.push([44, 536, 400, 548]);                  // WCH Rd west to the rim
  CONNECTORS.push([44, 548, 104, 560]);                  // bridge junction pad
  CONNECTORS.push([438, 548, 454, 716]);                 // WCH west rim link
  CONNECTORS.push([352, 716, 380, 728]);                 // Aberdeen Channel bridge
  CONNECTORS.push([380, 716, 454, 728]);                 // bridge junction pad (rim link)
  CONNECTORS.push([330, 512, 404, 536]);                 // WCH west turnback apron
  // ---- south coast: Stanley Rd off WCH Rd + terminus apron ----------------
  // (rects butt edge-to-edge — same-height slabs must never overlap)
  CONNECTORS.push([850, 584, 870, 858]);                 // Stanley Rd N-S
  CONNECTORS.push([844, 536, 884, 584]);                 // WCH Rd junction pad
  CONNECTORS.push([844, 858, 1130, 905]);                // Stanley terminus apron
  // ---- Aberdeen waterfront: WCH Rd west + Wah Fu leg ----------------------
  CONNECTORS.push([-240, 536, 44, 548]);                 // WCH Rd west ext
  CONNECTORS.push([-240, 548, -224, 712]);               // Aberdeen leg N-S
  CONNECTORS.push([-252, 712, -150, 766]);               // Wah Fu terminus apron
  CONNECTORS.push([80, 716, 116, 752]);                  // promenade -> LET drive
  // ---- Western Harbour Crossing: SHW east strip -> Kowloon ----------------
  CONNECTORS.push([-1972, -925, -1960, -56]);            // WHC link
  CONNECTORS.push([-1990, -56, -1960, -26]);             // WB band turn pad
  CONNECTORS.push([-1972, 34, -1940, 56]);               // EB band turn pad
  CONNECTORS.push([-2762, -937, -1698, -925]);           // KOW south road west ext
  CONNECTORS.push([-1960, -925, -1930, -896]);           // link/KOW corner pad
  CONNECTORS.push([-1992, -925, -1972, -900]);           // link west corner pad
  CONNECTORS.push([-1280, -937, 470, -925]);             // West Kowloon corridor
  CONNECTORS.push([552, -845, 650, -790]);               // TST east terminus apron
  // ---- airport causeway: KOW ext -> AIR ring ------------------------------
  CONNECTORS.push([-2762, -1446, -2740, -937]);          // south leg
  // ---- route 790: TKO -> east Kowloon chain -> TST ------------------------
  CONNECTORS.push([162, -1376, 460, -1364]);             // KOT west ext
  CONNECTORS.push([144, -1404, 162, -937]);              // south leg, below corridor
  CONNECTORS.push([144, -925, 162, -812]);               // south leg, above corridor
  CONNECTORS.push([138, -812, 170, -794]);               // TST Rd south turn pad
  CONNECTORS.push([460, -1380, 485, -1360]);             // KOT w strip junction pad
  // east-Kowloon chain joins: one pad spanning both lanes' z sweeps across real
  // gaps (per-band staircases would overlap where the sweeps cross); a N-S strip
  // per band where consecutive sites' road x-ranges already overlap
  for (let i = 0; i < EKL.length - 1; i++) {
    const a = EKL[i], b = EKL[i + 1];
    if (b.x0 - a.x1 >= 14) {
      const lo = Math.min(eklS(a), eklS(b), eklN(a), eklN(b));
      const hi = Math.max(eklS(a), eklS(b), eklN(a), eklN(b));
      CONNECTORS.push([a.x1 - 4, lo - 6, b.x0 + 4, hi + 6]);
    } else {
      for (const band of ['s', 'n'])
        CONNECTORS.push([a.x1 - 6, Math.min(a[band][0], b[band][0]) - 2,
                         b.x0 + 6, Math.max(a[band][1], b[band][1]) + 2]);
    }
  }
}

// ---- corridor polylines ------------------------------------------------------
function corridorEB() {
  const pts = [[-4380, laneS(CORRIDOR[0])], [CORRIDOR[0].x0, laneS(CORRIDOR[0])]];
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

function corridorWB() {
  const pts = [];
  // CHW -> SKW on the two-way north lane, then up the junction strip
  pts.push([7515, 52.5], [7285, 52.5], [6720, 52.5], [6480, 52.5],
           [6110, 51.5], [6005, 51], [5997, 44], [5997, 36], [5997, -36],
           [5997, -50], [5997, -55.5], [5988, -55.5]);
  // SKW -> KET on the north band, EXC detour spliced at WAC -> ADM
  const ix = Object.fromEntries(CORRIDOR.map((c, i) => [c.stn, i]));
  for (let i = ix.SKW; i > 0; i--) {
    const a = CORRIDOR[i], b = CORRIDOR[i - 1];
    pts.push([a.x0, laneN(a)]);
    if (a.stn === 'WAC' && b.stn === 'ADM') {
      const lz = laneN(b);
      pts.push([734, laneN(a)], [EXC_DETOUR.eastStripX, laneN(a)],
               [EXC_DETOUR.eastStripX, EXC_DETOUR.gloucesterZ],
               [EXC_DETOUR.westStripX, EXC_DETOUR.gloucesterZ],
               [EXC_DETOUR.westStripX, lz + 2], [466, lz + 2], [466, lz], [b.x1, lz]);
    } else {
      if (Math.abs(laneN(b) - laneN(a)) > 1) pts.push([(a.x0 + b.x1) / 2, (laneN(a) + laneN(b)) / 2]);
      pts.push([b.x1, laneN(b)]);
    }
  }
  pts.push([CORRIDOR[0].x0, laneN(CORRIDOR[0])], [-4380, laneN(CORRIDOR[0])]);
  return pts;
}

const EB_FULL = corridorEB();
const WB_FULL = corridorWB();

// sub-polyline of a monotonic-x path clipped to [xa, xb]
function sliceX(pts, xa, xb) {
  const lo = Math.min(xa, xb), hi = Math.max(xa, xb), out = [];
  const at = (a, b, x) => [x, a[1] + (b[1] - a[1]) * ((x - a[0]) / (b[0] - a[0] || 1))];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const ia = a[0] >= lo && a[0] <= hi, ib = b[0] >= lo && b[0] <= hi;
    if (ia && ib) { if (!out.length) out.push(a); out.push(b); }
    else if (ia) { out.push(a); out.push(at(a, b, b[0] > hi ? hi : lo)); }
    else if (ib) out.push(at(a, b, a[0] > hi ? hi : lo), b);
    else if ((a[0] < lo && b[0] > hi) || (a[0] > hi && b[0] < lo))
      out.push(at(a, b, a[0] < b[0] ? lo : hi), at(a, b, a[0] < b[0] ? hi : lo));
  }
  return out;
}

const EB = (x0, x1) => sliceX(EB_FULL, x0, x1);   // x0 < x1
const WB = (x0, x1) => sliceX(WB_FULL, x0, x1);   // x0 > x1 (heading west)

// U-turn arcs between the two bands, bulging past the turn point
const arcE = (x, zA, zB, n = 8) => {   // arrive heading +x at zA, leave -x at zB
  const cz = (zA + zB) / 2, r = (zA - zB) / 2, pts = [];
  for (let i = 1; i <= n; i++) { const a = Math.PI / 2 - Math.PI * i / n; pts.push([x + r * Math.cos(a), cz + r * Math.sin(a)]); }
  return pts;
};
const arcW = (x, zA, zB, n = 7) => {   // arrive heading -x at zA, leave +x at zB
  const cz = (zA + zB) / 2, r = (zB - zA) / 2, pts = [];
  for (let i = 1; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; pts.push([x - r * Math.cos(a), cz + r * Math.sin(a)]); }
  return pts;
};

// ---- southern lane constants --------------------------------------------------
// south link x 976..988: SB lane kerb 988, NB kerb 976
const LN_SB = 985.5, LN_NB = 980.5;
// WCH Rd z 536..548: EB kerb 536, WB kerb 548
const WCH_EB = 539.5, WCH_WB = 545.5;
// west rim link x 438..454: SB kerb 454, NB kerb 438
const RIM_SB = 451, RIM_NB = 441.5;
// LET south drive + channel bridge z 716..728: EB kerb 716, WB kerb 728
const DRV_EB = 719, DRV_WB = 725;
// Ap Lei Chau bridge road x 40..104: SB kerb 104, NB kerb 40
const BR_SB = 100, BR_NB = 44.5;
// South Horizon Dr z 604..616: EB kerb 604, WB kerb 616
const SOH_EB = 607, SOH_WB = 613;

// shared leg pieces — junction turns kept inside paved junction squares
const LINK_DN = [          // corridor EB band -> link -> WCH Rd westbound lane
  [975, 41], [LN_SB, 50], [LN_SB, 505], [LN_SB, 528], [987, 537], [982, 543], [968, WCH_WB],
];
const WCH_TO_SOH = [       // WCH Rd WB -> rim link -> channel bridge -> Ap Lei Chau
  [455, WCH_WB], [RIM_SB, 544], [RIM_SB, 552], [RIM_SB, 706], [449, 716],
  [440, DRV_WB], [380, DRV_WB], [110, DRV_WB], [BR_SB + 4, 719], [BR_SB, 706],
  [BR_SB, 660], [BR_SB, 622], [92, 614], [76, SOH_WB],
];
const SOH_LOOP = [         // teardrop inside the west end of South Horizon Dr
  [-196, SOH_WB], [-228, 614], [-239, 610], [-228, 606], [-196, SOH_EB],
];
const SOH_TO_WCH = [       // SOH EB -> bridge NB -> drive EB -> rim link -> WCH Rd EB
  [-60, SOH_EB], [60, SOH_EB], [56, 601], [BR_NB + 2, 596], [BR_NB, 585],
  [BR_NB, 660], [BR_NB, 700], [50, 712], [62, 717], [78, DRV_EB],
  [380, DRV_EB], [436, DRV_EB], [444, 714], [RIM_NB, 706],
  [RIM_NB, 556], [RIM_NB, 546], [448, WCH_EB], [465, WCH_EB],
];
const WCH_TO_CITY = [      // WCH Rd EB -> link -> corridor WB band
  [970, WCH_EB], [978, 534], [LN_NB, 524], [LN_NB, 492], [LN_NB, 60],
  [LN_NB, -30], [981, -37], [972, laneN(CORRIDOR[7])],
];
const CITY_TO_592 = [      // corridor WB band -> link southbound -> WCH Rd WB
  [985, -36], [LN_SB, -33], [LN_SB, -16], [LN_SB, 60], [LN_SB, 492],
  [LN_SB, 505], [LN_SB, 528], [987, 537], [982, 543], [968, WCH_WB],
];
const WCH70_LOOP = [       // turnback on the west apron, off WCH Rd WB lane
  [402, WCH_WB], [388, 542], [368, 533], [356, 524], [368, 517], [388, 521], [404, WCH_EB - 2],
];
const LET_LOOP = [         // terminus turnback inside the bridge road south end
  [BR_SB, 700], [BR_SB, 720], [94, 732], [76, 738], [56, 734], [46, 726],
];
const CHW_LOOP = [         // teardrop on the east apron, two-way lanes 47.5/52.5
  [7515, 47.5], [7532, 41], [7562, 43], [7575, 49], [7562, 55], [7532, 57], [7515, 52.5],
];

// ---- south coast / harbour / airport lane constants -------------------------
// Stanley Rd x 850..870: SB lane east (866), NB west (854)
const STN_SB = 866, STN_NB = 854;
// Aberdeen leg x -240..-224: SB lane east (-228), NB west (-236)
const WAF_SB = -228, WAF_NB = -236;
// promenade z 740..752: EB lane north (743), WB south (749)
const ABD_EB = 743, ABD_WB = 749;
// WHC link x -1972..-1960 (continues the SHW east strip): NB -1969, SB -1963
const WHC_NB = -1969, WHC_SB = -1963;
// KOW rd / West Kowloon corridor z -937..-925: EB -934, WB -928
const KLN_EB = -934, KLN_WB = -928;
// TST Rd z -830..-812: EB -823.5, WB -818.5; TST strip x 456..470: NB 460, SB 466
const TST_EB = -823.5, TST_WB = -818.5, TST_NB = 460, TST_SB = 466;
// airport ring: n road z -1452..-1440, s road z -1560..-1548, strips x -2926/-2674
const AIR_NEB = -1448.5, AIR_NWB = -1443.5, AIR_SWB = -1551.5;
const AIR_ESB = -2671, AIR_WNB = -2929;
// airport causeway leg x -2762..-2740: SB -2748, NB -2754
const ALG_SB = -2748, ALG_NB = -2754;

// ---- shared leg pieces for the new segments ---------------------------------
const LINK_TO_EB = [       // link NB -> corridor EB band (same swing as 592)
  [LN_NB, 60], [LN_NB, 48], [986, 44], [996, 41],
];
const STAN_LOOP = [        // terminus teardrop on the Stanley apron
  [STN_SB, 862], [872, 870], [910, 880], [980, 887], [1060, 888], [1100, 884],
  [1108, 876], [1090, 868], [1040, 864], [960, 862], [880, 861], [862, 861],
  [856, 852], [STN_NB, 844],
];
const STN_DOWN = [         // WCH Rd WB -> Stanley Rd SB
  [884, WCH_WB], [870, 544], [STN_SB, 552], [STN_SB, 600],
];
const STN_UP = [           // Stanley Rd NB -> WCH Rd EB
  [STN_NB, 600], [STN_NB, 556], [852, 548], [858, 541], [870, WCH_EB],
];
const WAF_LOOP = [         // terminus loop on the Wah Fu apron (leg in, leg out)
  [WAF_SB, 700], [WAF_SB, 720], [-220, 734], [-204, 741], [-190, 738],
  [-184, 730], [-190, 722], [-206, 717], [-224, 712], [-234, 706], [WAF_NB, 700],
];
const WAF_TO_CITY = [      // leg NB -> WCH Rd EB
  [WAF_NB, 620], [WAF_NB, 556], [-232, 548], [-226, 542], [-214, WCH_EB],
];
const CITY_TO_WAF = [      // WCH Rd WB -> leg SB -> apron loop
  [-160, WCH_WB], [-208, WCH_WB], [-224, 548], [WAF_SB, 554], [WAF_SB, 620],
];
const CYB_LOOP = [         // prom WB -> apron teardrop -> prom EB (Cyberport)
  [-140, ABD_WB], [-160, 750], [-168, 748], [-184, 743], [-200, 736],
  [-214, 724], [-226, 718], [-236, 720], [-240, 730], [-234, 740],
  [-220, 745], [-200, 747], [-176, 746], [-150, 744], [-120, ABD_EB],
];
const PROM_TO_DRV = [      // promenade EB -> junction -> LET drive EB
  [-60, ABD_EB], [60, ABD_EB], [88, 736], [100, 722], [120, DRV_EB],
];
const DRV_TO_PROM = [      // LET drive WB -> junction -> promenade WB
  [120, DRV_WB], [100, 728], [92, 740], [84, 748], [60, ABD_WB], [-140, ABD_WB],
];
const DRV_TO_WCH = [       // drive EB -> rim link NB -> WCH Rd EB (SOH_TO_WCH tail)
  [380, DRV_EB], [436, DRV_EB], [444, 714], [RIM_NB, 706],
  [RIM_NB, 556], [RIM_NB, 546], [448, WCH_EB], [465, WCH_EB],
];
const WCH_TO_DRV = [       // WCH Rd WB -> rim link SB -> drive WB
  [455, WCH_WB], [RIM_SB, 544], [RIM_SB, 552], [RIM_SB, 706], [449, 716], [440, DRV_WB],
];
const WHC_OUT = [          // corridor WB lane -> WHC link NB
  [-2020, -55.5], [-1992, -55.5], [-1978, -52], [WHC_NB, -45], [WHC_NB, -30],
  [WHC_NB, -300], [WHC_NB, -700], [WHC_NB, -905],
];
const WHC_N_TO_E = [[WHC_NB, -910], [-1967, -918], [-1960, -928], [-1930, KLN_EB]];
const WHC_N_TO_W = [[WHC_NB, -910], [-1970, -916], [-1974, -922], [-1984, -926], [-2000, KLN_WB]];
const KLN_W_TO_WHC = [[-2000, KLN_WB], [-1978, -930], [-1969, -934], [WHC_SB, -932], [WHC_SB, -926]];
const KLN_E_TO_WHC = [[-1990, KLN_EB], [-1972, -932], [WHC_SB, -926]];
const WHC_IN = [           // WHC link SB -> corridor EB band
  [WHC_SB, -905], [WHC_SB, -700], [WHC_SB, -300], [WHC_SB, -60], [WHC_SB, -30],
  [WHC_SB, 20], [WHC_SB, 40], [-1958, 44], [-1930, 46],
];
const KLN_TO_TST = [       // KOW rd EB -> corridor -> TST strip -> TST Rd EB
  [-1920, KLN_EB], [-1280, KLN_EB], [470, KLN_EB], [TST_SB, -930],
  [TST_SB, -880], [TST_SB, -826], [470, -822], [480, TST_EB],
];
const TST_TO_KLN = [       // TST Rd WB -> TST strip NB -> corridor WB -> KOW
  [445, TST_WB], [458, -821], [TST_NB, -826], [TST_NB, -880], [TST_NB, -926],
  [452, -930], [430, KLN_WB], [-1280, KLN_WB], [-1955, KLN_WB],
];
const TST_LOOP = [         // teardrop on the TST east apron
  [556, TST_EB], [575, -822], [622, -809], [646, -802], [642, -796],
  [590, -797], [560, -806], [552, -814], [556, TST_WB],
];
const AIR_S_LEG = [        // west ext WB -> airport leg SB -> ring EB -> AIR_S halt
  [-2740, KLN_WB], [-2758, -929], [-2752, -938], [ALG_SB, -950],
  [ALG_SB, -1400], [ALG_SB, -1443], [-2742, -1447],
  [-2700, AIR_NEB], [-2680, AIR_NEB], [AIR_ESB, -1450], [AIR_ESB, -1500],
  [AIR_ESB, -1548], [-2682, -1552], [-2700, AIR_SWB], [-2800, AIR_SWB],
];
const AIR_N_LEG = [        // AIR_S -> ring -> leg NB -> ext EB
  [-2915, AIR_SWB], [-2924, -1550], [AIR_WNB, -1540], [AIR_WNB, -1450],
  [-2927, -1446], [-2920, -1444], [-2760, AIR_NWB], [-2758, -1438],
  [ALG_NB, -1428], [ALG_NB, -1200], [ALG_NB, -942], [-2746, -933], [-2700, KLN_EB],
];
// east-Kowloon chain polylines (joins handled by the connector generator)
function chainS() {        // POL -> KOT along the south roads' WB lanes
  const pts = [];
  for (let i = EKL.length - 1; i >= 0; i--) {
    const a = EKL[i], b = EKL[i - 1];
    pts.push([a.x0, eklS(a)]);
    if (!b) break;
    if (a.x0 - b.x1 >= 14) pts.push([(a.x0 + b.x1) / 2, (eklS(a) + eklS(b)) / 2], [b.x1, eklS(b)]);
    else { const x = (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2; pts.push([x, eklS(a)], [x, eklS(b)]); }
  }
  return pts;
}
function chainN(from) {    // `from` site -> POL along the north roads' EB lanes
  const i0 = EKL.findIndex(c => c.stn === from);
  const pts = [[EKL[i0].x0, eklN(EKL[i0])]];
  for (let i = i0; i < EKL.length; i++) {
    const a = EKL[i], b = EKL[i + 1];
    pts.push([a.x1, eklN(a)]);
    if (!b) break;
    if (b.x0 - a.x1 >= 14) pts.push([(a.x1 + b.x0) / 2, (eklN(a) + eklN(b)) / 2], [b.x0, eklN(b)]);
    else { const x = (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2; pts.push([x, eklN(a)], [x, eklN(b)]); }
  }
  return pts;
}
const KLN_TO_TKO = [       // KOT s rd -> west ext -> south leg -> TST Rd EB
  [EKL[0].x0, eklS(EKL[0])], [400, -1367.5], [170, -1367.5], [162, -1370],
  [158.5, -1378], [159, -1400], [159, -900], [159, -815], [162, -820],
  [170, -823], [200, TST_EB],
];
const TST_TO_TKO = [       // TST Rd WB -> south leg NB -> west ext -> KOT ring -> SKM
  [400, TST_WB], [160, TST_WB], [150, -814], [147, -800], [147, -900],
  [147, -1360], [152, -1372], [160, -1372.5], [400, -1372.5], [462, -1372],
  [469, -1378], [469, -1460], [476, -1470], [490, -1472.5], [700, -1472.5],
  [722, -1470], [730, -1472.5], [775, -1430.5], [820, -1388.5],
];
const POL_LOOP = [         // POL n rd EB -> e strip SB -> s rd WB (terminus)
  [5207, -2360], [5206, -2420], [5196, -2430],
  [5170, eklS(EKL[14])], [5050, eklS(EKL[14])],
];

// ---- stop zones --------------------------------------------------------------
// Physical kerb locations shared by every route that calls. halt = where the
// bus centre stops; kerb = kerbside point; nv = unit normal toward furniture;
// qv = direction the queue runs along the kerb.
export const ZONES = {};

// corridor zones: EB stops west of site centre, WB east (real staggered pairs)
const ZONE_NAMES = {
  KET: ['堅尼地城', 'Kennedy Town', '堅尼地城', 'Kennedy Town'],
  HKU: ['卑路乍灣公園', 'Belcher Bay Park', '山道', 'Hill Road'],
  SYP: ['西區警署', 'Western Police Station', '正街', 'Centre Street'],
  SHW: ['永安中心', 'Wing On Centre', '西港城', 'Western Market'],
  HOK: ['中環街市', 'Central Market', '中環街市', 'Central Market'],
  CEN: ['皇后像廣場', 'Statue Square', '置地廣場', 'The Landmark'],
  ADM: ['金鐘廊', 'Queensway Plaza', '太古廣場', 'Pacific Place'],
  WAC: ['史釗域道', 'Stewart Road', '修頓球場', 'Southorn Playground'],
  CAB: ['崇光百貨', 'Sogo', '希慎廣場', 'Hysan Place'],
  TIH: ['維多利亞公園', 'Victoria Park', '皇仁書院', "Queen's College"],
  FOH: ['電廠街', 'Tin Chong Street', '長康街', 'Cheung Hong Street'],
  NOP: ['港運城', 'Island Place', '北角碼頭', 'North Point Ferry Pier'],
  QUB: ['模範邨', 'Model Housing Estate', '健康村', 'Healthy Village'],
  TAK: ['鰂魚涌街', 'Quarry Bay Street', '惠安苑', 'Westlands Gardens'],
  SWH: ['康怡廣場', 'Kornhill Plaza', '太古城中心', 'Cityplaza'],
  SKW: ['海晏街', 'Hoi An Street', '海晏街', 'Hoi An Street'],
  HFC: ['阿公岩道', 'A Kung Ngam Road', '明華大廈', 'Ming Wah Dai Ha'],
  CHW: ['海星天主堂', 'Star of the Sea Church', '高威閣', 'Koway Court'],
};
for (const c of CORRIDOR) {
  const cx = (c.x0 + c.x1) / 2, [ze, ee, zw, ew] = ZONE_NAMES[c.stn];
  ZONES[c.stn + '_E'] = { halt: [cx - 20, laneS(c)], kerb: [cx - 20, kerbS(c)], nv: [0, -1], qv: [-1, 0], zh: ze, en: ee };
  ZONES[c.stn + '_W'] = { halt: [cx + 20, laneN(c)], kerb: [cx + 20, kerbN(c)], nv: [0, 1], qv: [1, 0], zh: zw, en: ew };
}
// SKW's westbound stop sits on the two-way south road (the WB path rejoins the
// couplet via the junction strip, so the north-band kerb is unreachable there)
ZONES.SKW_W = { halt: [6020, 51], kerb: [6020, 52], nv: [0, 1], qv: [1, 0], zh: '海晏街', en: 'Hoi An Street' };
// southern zones on the N-S link / WCH Rd / bridge / estate drives
Object.assign(ZONES, {
  ABTS: { halt: [LN_SB, 495],  kerb: [988, 495],  nv: [1, 0],  qv: [0, -1], zh: '香港仔隧道巴士轉乘站', en: 'Aberdeen Tunnel BBI' },
  ABTN: { halt: [LN_NB, 478],  kerb: [976, 478],  nv: [-1, 0], qv: [0, 1],  zh: '香港仔隧道巴士轉乘站', en: 'Aberdeen Tunnel BBI' },
  WCHW: { halt: [560, WCH_WB], kerb: [560, 548],  nv: [0, 1],  qv: [1, 0],  zh: '勝利工廠大廈', en: 'Victory Factory Bldg' },
  WCHE: { halt: [560, WCH_EB], kerb: [560, 536],  nv: [0, -1], qv: [-1, 0], zh: '黃竹坑遊樂場', en: 'Wong Chuk Hang Recreation Ground' },
  // east WCH Rd pair beside the Stanley Rd junction — tunnel/Stanley routes
  // turn here, so they can't reach the x=560 station stops
  WC2W: { halt: [905, WCH_WB], kerb: [905, 548],  nv: [0, 1],  qv: [1, 0],  zh: '南朗山道', en: 'Nam Long Shan Rd' },
  WC2E: { halt: [920, WCH_EB], kerb: [920, 536],  nv: [0, -1], qv: [-1, 0], zh: '南朗山道', en: 'Nam Long Shan Rd' },
  LETS: { halt: [200, DRV_WB], kerb: [200, 728],  nv: [0, 1],  qv: [1, 0],  zh: '利東邨', en: 'Lei Tung Estate' },
  LETN: { halt: [220, DRV_EB], kerb: [220, 716],  nv: [0, -1], qv: [-1, 0], zh: '利東邨', en: 'Lei Tung Estate' },
  SOHW: { halt: [-120, SOH_WB], kerb: [-120, 616], nv: [0, 1],  qv: [1, 0],  zh: '海怡半島', en: 'South Horizons' },
  SOHE: { halt: [-80, SOH_EB],  kerb: [-80, 604],  nv: [0, -1], qv: [-1, 0], zh: '海怡半島', en: 'South Horizons' },
});
// south coast: Stanley Rd kerbs, Stanley + Wah Fu/Cyberport termini, promenade
Object.assign(ZONES, {
  DWB_S: { halt: [STN_SB, 645], kerb: [872, 645], nv: [1, 0],  qv: [0, -1], zh: '深水灣', en: 'Deep Water Bay' },
  DWB_N: { halt: [STN_NB, 652], kerb: [848, 652], nv: [-1, 0], qv: [0, 1],  zh: '深水灣', en: 'Deep Water Bay' },
  RPB_S: { halt: [STN_SB, 742], kerb: [872, 742], nv: [1, 0],  qv: [0, -1], zh: '淺水灣海灘', en: 'Repulse Bay Beach' },
  RPB_N: { halt: [STN_NB, 748], kerb: [848, 748], nv: [-1, 0], qv: [0, 1],  zh: '淺水灣海灘', en: 'Repulse Bay Beach' },
  // area = the terminus apron rect — anywhere on it counts as "at the stop"
  STY_T: { halt: [1060, 888],   kerb: [1060, 898], nv: [0, 1], qv: [1, 0],  zh: '赤柱村', en: 'Stanley Village', area: [844, 858, 1130, 905] },
  WAF_T: { halt: [-190, 722],   kerb: [-190, 712], nv: [0, -1], qv: [1, 0], zh: '華富邨', en: 'Wah Fu Estate', area: [-252, 712, -150, 766] },
  CYB_T: { halt: [-168, 748],   kerb: [-168, 758], nv: [0, 1],  qv: [-1, 0], zh: '數碼港', en: 'Cyberport', area: [-252, 712, -150, 766] },
  ABD_E: { halt: [0, ABD_EB],   kerb: [0, 738],  nv: [0, -1], qv: [-1, 0], zh: '香港仔海濱公園', en: 'Aberdeen Promenade' },
  ABD_W: { halt: [10, ABD_WB],  kerb: [10, 754], nv: [0, 1],  qv: [1, 0],  zh: '香港仔魚類批發市場', en: 'Aberdeen Wholesale Fish Market' },
});
// harbour crossing + Kowloon + TST + airport + east-Kowloon chain
Object.assign(ZONES, {
  WHCN: { halt: [WHC_NB, -500], kerb: [-1974, -500], nv: [-1, 0], qv: [0, 1],  zh: '西區海底隧道巴士轉乘站', en: 'Western Harbour Crossing BBI' },
  WHCS: { halt: [WHC_SB, -470], kerb: [-1956, -470], nv: [1, 0],  qv: [0, -1], zh: '西區海底隧道巴士轉乘站', en: 'Western Harbour Crossing BBI' },
  KOWE: { halt: [-1500, KLN_EB], kerb: [-1500, -939], nv: [0, -1], qv: [1, 0], zh: '西九文化區', en: 'West Kowloon Cultural District' },
  KOWW: { halt: [-1520, KLN_WB], kerb: [-1520, -923], nv: [0, 1],  qv: [-1, 0], zh: '西九文化區', en: 'West Kowloon Cultural District' },
  TST_E: { halt: [500, TST_EB], kerb: [500, -832], nv: [0, -1], qv: [1, 0],  zh: '尖東站', en: 'East Tsim Sha Tsui Station' },
  TST_W: { halt: [480, TST_WB], kerb: [480, -810], nv: [0, 1],  qv: [-1, 0], zh: '尖沙咀（麼地道）', en: 'Tsim Sha Tsui (Mody Rd)' },
  TST_T: { halt: [622, -809],   kerb: [622, -795], nv: [0, 1],  qv: [1, 0],  zh: '尖沙咀（麼地道）', en: 'Tsim Sha Tsui (Mody Rd)', area: [552, -845, 650, -790] },
  LTLE: { halt: [-2350, KLN_EB], kerb: [-2350, -939], nv: [0, -1], qv: [1, 0], zh: '青嶼幹線巴士轉乘站', en: 'Lantau Link BBI' },
  LTLW: { halt: [-2380, KLN_WB], kerb: [-2380, -923], nv: [0, 1],  qv: [-1, 0], zh: '青嶼幹線巴士轉乘站', en: 'Lantau Link BBI' },
  AIR_T: { halt: [-2800, AIR_SWB], kerb: [-2800, -1544], nv: [0, 1], qv: [-1, 0], zh: '機場（地面運輸中心）', en: 'Airport (GTC)', area: [-2940, -1565, -2660, -1440] },
});
{
  // east-Kowloon chain kerbs: WB stops on the s roads, EB on the n roads
  const ZN = {
    KOT: ['九龍塘站', 'Kowloon Tong Station'],
    SKM: ['石硤尾邨', 'Shek Kip Mei Estate'], LOF: ['樂富邨', 'Lok Fu Estate'],
    WTS: ['黃大仙廟', 'Wong Tai Sin Temple'], DIH: ['鑽石山站', 'Diamond Hill Station'],
    CHH: ['彩虹邨', 'Choi Hung Estate'], KOB: ['九龍灣站', 'Kowloon Bay Station'],
    NTK: ['牛頭角下邨', 'Lower Ngau Tau Kok Estate'], KWT: ['觀塘市中心', 'Kwun Tong Town Centre'],
    LAT: ['藍田交匯處', 'Lam Tin Interchange'], YAT: ['油塘邨', 'Yau Tong Estate'],
    TKL: ['調景嶺站', 'Tiu Keng Leng Station'], TKW: ['將軍澳市中心', 'Tseung Kwan O Town Centre'],
    HAH: ['坑口', 'Hang Hau'], POL: ['清水灣半島', 'Oscar By The Sea'],
  };
  for (const c of EKL) {
    const cx = (c.x0 + c.x1) / 2, [zh, en] = ZN[c.stn];
    ZONES[c.stn + '_S'] = { halt: [cx, eklS(c)], kerb: [cx, c.s[1] + 2], nv: [0, 1],  qv: [-1, 0], zh, en };
    ZONES[c.stn + '_N'] = { halt: [cx, eklN(c)], kerb: [cx, c.n[0] - 2], nv: [0, -1], qv: [1, 0],  zh, en };
  }
}

// ---- routes ------------------------------------------------------------------
// legs build the closed loop; stops are [zone, real CTB stopId] per leg.
// legA = "outbound" half of the loop, legB = return.
export const ROUTES = [
  { id: '5B', fleet: 5, headway: 12,
    destA: ['銅鑼灣（香港大球場）', 'Causeway Bay (HK Stadium)'], destB: ['堅尼地城', 'Kennedy Town'],
    legs: () => [...EB(-4380, 1818), ...arcE(1818, laneS(CORRIDOR[8]), laneN(CORRIDOR[8])),
                 ...WB(1818, -4380), ...arcW(-4380, laneN(CORRIDOR[0]), laneS(CORRIDOR[0]))],
    stops: {
      A: [['KET_E','001152'],['HKU_E','001080'],['SYP_E','001062'],['SHW_E','001187'],['CEN_E','001025'],['ADM_E','003845'],['WAC_E','002435'],['CAB_E','002438']],
      B: [['CAB_W','002439'],['WAC_W','002446'],['ADM_W','001140'],['CEN_W','001054'],['SHW_W','001040'],['SYP_W','001068'],['HKU_W','001070'],['KET_W','001152']],
    } },
  { id: '5X', fleet: 4, headway: 15,
    destA: ['銅鑼灣（威非路道）', 'Causeway Bay (Whitfield Rd)'], destB: ['堅尼地城', 'Kennedy Town'],
    legs: () => [...EB(-4380, 2510), ...arcE(2510, laneS(CORRIDOR[9]), laneN(CORRIDOR[9])),
                 ...WB(2510, -4380), ...arcW(-4380, laneN(CORRIDOR[0]), laneS(CORRIDOR[0]))],
    stops: {
      A: [['KET_E','001080'],['HKU_E','001061'],['SYP_E','002678'],['CEN_E','001180'],['ADM_E','002430'],['WAC_E','002434'],['CAB_E','002438'],['TIH_E','001342']],
      B: [['TIH_W','001342'],['CAB_W','002554'],['WAC_W','002443'],['ADM_W','002449'],['CEN_W','001122'],['SYP_W','001068'],['HKU_W','001070'],['KET_W','001003']],
    } },
  { id: '10', fleet: 5, headway: 12,
    destA: ['北角碼頭', 'North Point Ferry Pier'], destB: ['堅尼地城', 'Kennedy Town'],
    legs: () => [...EB(-4380, 3710), ...arcE(3710, laneS(CORRIDOR[11]), laneN(CORRIDOR[11])),
                 ...WB(3710, -4380), ...arcW(-4380, laneN(CORRIDOR[0]), laneS(CORRIDOR[0]))],
    stops: {
      A: [['KET_E','001080'],['HKU_E','001061'],['SYP_E','001063'],['HOK_E','001173'],['CEN_E','001050'],['ADM_E','002479'],['WAC_E','002484'],['CAB_E','002456'],['TIH_E','001213'],['FOH_E','001261'],['NOP_E','001249']],
      B: [['NOP_W','001249'],['FOH_W','001364'],['TIH_W','001214'],['CAB_W','002550'],['WAC_W','002487'],['ADM_W','002489'],['CEN_W','001054'],['HOK_W','001121'],['SHW_W','001127'],['SYP_W','001130'],['HKU_W','001133'],['KET_W','001003']],
    } },
  { id: '18X', fleet: 5, headway: 15,
    destA: ['柴灣站', 'Chai Wan Station'], destB: ['堅尼地城（卑路乍灣）', 'Kennedy Town (Belcher Bay)'],
    legs: () => [...EB(-4380, 7515), ...CHW_LOOP, ...WB(7515, -4380), ...arcW(-4380, laneN(CORRIDOR[0]), laneS(CORRIDOR[0]))],
    stops: {
      A: [['KET_E','001177'],['HKU_E','001061'],['SYP_E','002678'],['SHW_E','001027'],['NOP_E','001256'],['QUB_E','001265'],['TAK_E','001269'],['SWH_E','001270'],['SKW_E','001297'],['HFC_E','001207'],['CHW_E','001292']],
      B: [['CHW_W','001292'],['HFC_W','001207'],['SKW_W','001302'],['SWH_W','001288'],['TAK_W','001272'],['QUB_W','001275'],['NOP_W','001279'],['CEN_W','001033'],['SYP_W','001191'],['HKU_W','001070'],['KET_W','001083']],
    } },
  { id: 'N8X', fleet: 3, headway: 30,
    destA: ['小西灣（藍灣半島）', 'Siu Sai Wan (Island Resort)'], destB: ['堅尼地城', 'Kennedy Town'],
    legs: () => [...EB(-4380, 7515), ...CHW_LOOP, ...WB(7515, -4380), ...arcW(-4380, laneN(CORRIDOR[0]), laneS(CORRIDOR[0]))],
    stops: {
      A: [['KET_E','001080'],['HKU_E','001061'],['SYP_E','001063'],['SHW_E','001028'],['HOK_E','001046'],['CEN_E','001051'],['ADM_E','002427'],['WAC_E','002434'],['CAB_E','002438'],['TIH_E','001213'],['FOH_E','001261'],['NOP_E','001373'],['QUB_E','001265'],['TAK_E','001269'],['SWH_E','001287'],['SKW_E','001297'],['HFC_E','001216'],['CHW_E','001220']],
      B: [['CHW_W','001229'],['HFC_W','001233'],['SKW_W','001302'],['SWH_W','001288'],['TAK_W','001272'],['QUB_W','001275'],['NOP_W','001278'],['FOH_W','001282'],['TIH_W','001215'],['CAB_W','002439'],['WAC_W','002443'],['ADM_W','002448'],['CEN_W','001054'],['HOK_W','001056'],['SHW_W','001040'],['SYP_W','001068'],['HKU_W','001070'],['KET_W','001083']],
    } },
  { id: '2', fleet: 4, headway: 12,
    destA: ['西灣河（嘉亨灣）', 'Sai Wan Ho (Grand Promenade)'], destB: ['中環（港澳碼頭）', 'Central (Macau Ferry)'],
    legs: () => [...EB(-2160, 5510), ...arcE(5510, laneS(CORRIDOR[14]), laneN(CORRIDOR[14])),
                 ...WB(5510, -2160), ...arcW(-2160, laneN(CORRIDOR[3]), laneS(CORRIDOR[3]))],
    stops: {
      A: [['SHW_E','001027'],['HOK_E','001107'],['CEN_E','001195'],['ADM_E','002967'],['TIH_E','001213'],['FOH_E','001261'],['NOP_E','001373'],['QUB_E','001265'],['TAK_E','001269'],['SWH_E','001270']],
      B: [['SWH_W','001288'],['TAK_W','001272'],['QUB_W','001275'],['NOP_W','001278'],['FOH_W','001364'],['TIH_W','001251'],['CAB_W','002568'],['WAC_W','002416'],['ADM_W','002420'],['CEN_W','001054'],['HOK_W','001056'],['SHW_W','001027']],
    } },
  { id: '720', fleet: 4, headway: 15,
    destA: ['西灣河（嘉亨灣）', 'Sai Wan Ho (Grand Promenade)'], destB: ['中環（港澳碼頭）', 'Central (Macau Ferry)'],
    legs: () => [...EB(-2160, 5510), ...arcE(5510, laneS(CORRIDOR[14]), laneN(CORRIDOR[14])),
                 ...WB(5510, -2160), ...arcW(-2160, laneN(CORRIDOR[3]), laneS(CORRIDOR[3]))],
    stops: {
      A: [['SHW_E','001027'],['HOK_E','001185'],['CEN_E','001030'],['ADM_E','002422'],['WAC_E','002559'],['SWH_E','001378']],
      B: [['SWH_W','002791'],['WAC_W','002417'],['ADM_W','002421'],['CEN_W','001033'],['HOK_W','001185'],['SHW_W','001027']],
    } },
  { id: '82', fleet: 4, headway: 15,
    destA: ['小西灣（藍灣半島）', 'Siu Sai Wan (Island Resort)'], destB: ['北角碼頭', 'North Point Ferry Pier'],
    legs: () => [...EB(3514, 7515), ...CHW_LOOP, ...WB(7515, 3510),
                 // J-hook around the west end of the NOP deck back to the EB lane
                 [3502, -56], [3496, -46], [3496, -36], [3496, 30], [3500, 42], [3508, 44], [3514, 43.5]],
    stops: {
      A: [['NOP_E','001249'],['QUB_E','001265'],['TAK_E','001269'],['SWH_E','001270'],['SKW_E','001297'],['HFC_E','002770'],['CHW_E','001220']],
      B: [['CHW_W','001229'],['HFC_W','001233'],['SKW_W','001302'],['SWH_W','001288'],['TAK_W','001272'],['QUB_W','001275'],['NOP_W','001249']],
    } },
  { id: '788', fleet: 4, headway: 15,
    destA: ['小西灣（藍灣半島）', 'Siu Sai Wan (Island Resort)'], destB: ['中環（港澳碼頭）', 'Central (Macau Ferry)'],
    legs: () => [...EB(-2160, 7515), ...CHW_LOOP, ...WB(7515, -2160), ...arcW(-2160, laneN(CORRIDOR[3]), laneS(CORRIDOR[3]))],
    stops: {
      A: [['SHW_E','001027'],['HOK_E','001044'],['CEN_E','001030'],['ADM_E','002422'],['WAC_E','002559'],['SKW_E','001297'],['HFC_E','001207'],['CHW_E','001292']],
      B: [['CHW_W','001229'],['SKW_W','001302'],['SWH_W','001288'],['WAC_W','002417'],['ADM_W','002421'],['CEN_W','001033'],['HOK_W','001185'],['SHW_W','001027']],
    } },
  { id: '70', fleet: 3, headway: 18,
    destA: ['黃竹坑', 'Wong Chuk Hang'], destB: ['中環（交易廣場）', 'Central (Exchange Square)'],
    legs: () => [...EB(-1145, 982), ...LINK_DN, ...WCH70_LOOP,
                 [465, WCH_EB], [560, WCH_EB], ...WCH_TO_CITY,
                 ...WB(968, -1145), ...arcW(-1145, laneN(CORRIDOR[5]), laneS(CORRIDOR[5]))],
    stops: {
      A: [['CEN_E','001032'],['ADM_E','001138'],['WAC_E','002423'],['ABTS','003968'],['WCHW','002358']],
      B: [['WCHE','002345'],['ABTN','003969'],['WAC_W','002446'],['ADM_W','001140'],['CEN_W','001032']],
    } },
  { id: '90', fleet: 4, headway: 15,
    destA: ['鴨脷洲邨', 'Ap Lei Chau Estate'], destB: ['中環（交易廣場）', 'Central (Exchange Square)'],
    legs: () => [...EB(-1145, 982), ...LINK_DN, ...WCH_TO_SOH, ...SOH_LOOP, ...SOH_TO_WCH,
                 ...WCH_TO_CITY, ...WB(968, -1145), ...arcW(-1145, laneN(CORRIDOR[5]), laneS(CORRIDOR[5]))],
    stops: {
      A: [['CEN_E','001032'],['ADM_E','001138'],['WAC_E','002423'],['ABTS','003968'],['WCHW','002358'],['LETS','002213'],['SOHW','002166']],
      B: [['SOHE','002172'],['LETN','002210'],['WCHE','002355'],['ABTN','003969'],['WAC_W','002444'],['ADM_W','001140'],['CEN_W','001032']],
    } },
  { id: '97', fleet: 3, headway: 18,
    destA: ['利東邨', 'Lei Tung Estate'], destB: ['中環（交易廣場）', 'Central (Exchange Square)'],
    legs: () => [...EB(-1145, 982), ...LINK_DN,
                 [455, WCH_WB], [RIM_SB, 544], [RIM_SB, 552], [RIM_SB, 706], [449, 716],
                 [440, DRV_WB], [380, DRV_WB], [110, DRV_WB],          // past LETS
                 [104, 722], [BR_SB, 714], ...LET_LOOP,               // bridge-road turnback
                 [54, DRV_EB], [104, DRV_EB], [380, DRV_EB],           // past LETN
                 [436, DRV_EB], [444, 714], [RIM_NB, 706],
                 [RIM_NB, 556], [RIM_NB, 546], [448, WCH_EB], [465, WCH_EB], [560, WCH_EB],
                 ...WCH_TO_CITY, ...WB(968, -1145), ...arcW(-1145, laneN(CORRIDOR[5]), laneS(CORRIDOR[5]))],
    stops: {
      A: [['CEN_E','001032'],['ADM_E','001138'],['WAC_E','002423'],['ABTS','003968'],['WCHW','002358'],['LETS','002213']],
      B: [['LETN','002211'],['WCHE','002355'],['ABTN','003969'],['WAC_W','002444'],['ADM_W','001140'],['CEN_W','001032']],
    } },
  { id: '592', fleet: 4, headway: 12,
    destA: ['銅鑼灣（摩頓台）', 'Causeway Bay (Moreton Terrace)'], destB: ['海怡半島', 'South Horizons'],
    legs: () => [...SOH_LOOP, ...SOH_TO_WCH,   // SOH -> WCH Rd EB
                 [970, WCH_EB], [978, 534], [LN_NB, 524], [LN_NB, 492], [LN_NB, 60],
                 [LN_NB, 48], [986, 44], [996, 41],   // swing east onto the EB band
                 ...EB(996, 1818), ...arcE(1818, laneS(CORRIDOR[8]), laneN(CORRIDOR[8])),
                 ...WB(1818, 990),             // CAB -> west on the WB band
                 ...CITY_TO_592,
                 ...WCH_TO_SOH],
    stops: {
      A: [['SOHE','002262'],['LETN','002173'],['WCHE','002345'],['ABTN','003969'],['CAB_E','002555']],
      B: [['CAB_W','002439'],['ABTS','003968'],['WCHW','002358'],['LETS','002167'],['SOHW','002364']],
    } },
  // ---- south coast: Stanley / Repulse Bay ---------------------------------
  { id: '6X', fleet: 3, headway: 15,
    destA: ['赤柱市場', 'Stanley Market'], destB: ['中環（交易廣場）', 'Central (Exchange Square)'],
    legs: () => [...EB(-1145, 975), ...LINK_DN, [960, WCH_WB], [884, WCH_WB],
                 [870, 544], [STN_SB, 552], [STN_SB, 640], ...STAN_LOOP, ...STN_UP,
                 [960, WCH_EB], ...WCH_TO_CITY, ...WB(968, -1145), ...arcW(-1145, laneN(CORRIDOR[5]), laneS(CORRIDOR[5]))],
    stops: {
      A: [['CEN_E','001032'],['ADM_E','001136'],['WAC_E','002484'],['ABTS','003968'],['WC2W','002351'],['DWB_S','002247'],['RPB_S','002252'],['STY_T','002277']],
      B: [['RPB_N','002241'],['DWB_N','002197'],['WC2E','002349'],['ABTN','003969'],['WAC_W','002487'],['ADM_W','001140'],['CEN_W','001032']],
    } },
  { id: '6A', fleet: 2, headway: 20,
    destA: ['赤柱炮台', 'Stanley Fort'], destB: ['中環（交易廣場）', 'Central (Exchange Square)'],
    legs: () => [...EB(-1145, 975), ...LINK_DN, [960, WCH_WB], [884, WCH_WB],
                 [870, 544], [STN_SB, 552], [STN_SB, 640], ...STAN_LOOP, ...STN_UP,
                 [960, WCH_EB], ...WCH_TO_CITY, ...WB(968, -1145), ...arcW(-1145, laneN(CORRIDOR[5]), laneS(CORRIDOR[5]))],
    stops: {
      A: [['CEN_E','001032'],['ADM_E','001136'],['WAC_E','002481'],['ABTS','003968'],['WC2W','002351'],['RPB_S','002252'],['STY_T','002400']],
      B: [['RPB_N','002241'],['DWB_N','002197'],['WC2E','002349'],['ABTN','003969'],['WAC_W','002487'],['ADM_W','001140'],['CEN_W','001032']],
    } },
  { id: '260', fleet: 3, headway: 20,
    destA: ['赤柱市場', 'Stanley Market'], destB: ['中環（交易廣場）', 'Central (Exchange Square)'],
    legs: () => [...EB(-1145, 975), ...LINK_DN, [960, WCH_WB], [884, WCH_WB],
                 [870, 544], [STN_SB, 552], [STN_SB, 640], ...STAN_LOOP, ...STN_UP,
                 [960, WCH_EB], ...WCH_TO_CITY, ...WB(968, -1145), ...arcW(-1145, laneN(CORRIDOR[5]), laneS(CORRIDOR[5]))],
    stops: {
      A: [['CEN_E','001032'],['ADM_E','001136'],['ABTS','003968'],['DWB_S','002247'],['RPB_S','002252'],['STY_T','002277']],
      B: [['RPB_N','002251'],['WC2E','002353'],['ABTN','003969'],['WAC_W','002417'],['ADM_W','002421'],['CEN_W','001033']],
    } },
  { id: '6', fleet: 3, headway: 12,
    destA: ['赤柱監獄', 'Stanley Prison'], destB: ['中環（交易廣場）', 'Central (Exchange Square)'],
    legs: () => [...EB(-1145, 975), ...LINK_DN, [960, WCH_WB], [884, WCH_WB],
                 [870, 544], [STN_SB, 552], [STN_SB, 640], ...STAN_LOOP, ...STN_UP,
                 [960, WCH_EB], ...WCH_TO_CITY, ...WB(968, -1145), ...arcW(-1145, laneN(CORRIDOR[5]), laneS(CORRIDOR[5]))],
    stops: {
      A: [['CEN_E','001032'],['ADM_E','001136'],['WAC_E','002480'],['ABTS','003968'],['WC2W','002351'],['DWB_S','002247'],['RPB_S','002252'],['STY_T','002305']],
      B: [['RPB_N','002241'],['DWB_N','002197'],['WC2E','002349'],['ABTN','003969'],['WAC_W','002487'],['ADM_W','001140'],['CEN_W','001032']],
    } },
  { id: '63', fleet: 3, headway: 20,
    destA: ['赤柱市場', 'Stanley Market'], destB: ['北角碼頭', 'North Point Ferry Pier'],
    legs: () => [...WB(3710, 985), ...CITY_TO_592, [900, WCH_WB], [884, WCH_WB],
                 [870, 544], [STN_SB, 552], [STN_SB, 640], ...STAN_LOOP, ...STN_UP,
                 [960, WCH_EB], [970, WCH_EB], [978, 534], [LN_NB, 524], [LN_NB, 60],
                 ...LINK_TO_EB, ...EB(996, 3710), ...arcE(3710, laneS(CORRIDOR[11]), laneN(CORRIDOR[11]))],
    stops: {
      A: [['NOP_W','001249'],['FOH_W','001280'],['TIH_W','001283'],['CAB_W','002535'],['ABTS','002543'],['WC2W','002243'],['DWB_S','002247'],['RPB_S','002252'],['STY_T','002277']],
      B: [['RPB_N','002241'],['DWB_N','002197'],['WC2E','002349'],['ABTN','002370'],['CAB_E','002573'],['TIH_E','001213'],['FOH_E','001261'],['NOP_E','001249']],
    } },
  { id: '65', fleet: 3, headway: 15,
    destA: ['赤柱市場', 'Stanley Market'], destB: ['北角碼頭', 'North Point Ferry Pier'],
    legs: () => [...WB(3710, 985), ...CITY_TO_592, [900, WCH_WB], [884, WCH_WB],
                 [870, 544], [STN_SB, 552], [STN_SB, 640], ...STAN_LOOP, ...STN_UP,
                 [960, WCH_EB], [970, WCH_EB], [978, 534], [LN_NB, 524], [LN_NB, 60],
                 ...LINK_TO_EB, ...EB(996, 3710), ...arcE(3710, laneS(CORRIDOR[11]), laneN(CORRIDOR[11]))],
    stops: {
      A: [['NOP_W','001249'],['FOH_W','001280'],['TIH_W','001286'],['CAB_W','002439'],['ABTS','003968'],['WC2W','002351'],['DWB_S','002247'],['RPB_S','002252'],['STY_T','002277']],
      B: [['RPB_N','002241'],['DWB_N','002197'],['WC2E','002349'],['ABTN','003969'],['CAB_E','002438'],['TIH_E','001213'],['FOH_E','001261'],['NOP_E','001249']],
    } },
  // ---- Aberdeen waterfront --------------------------------------------------
  { id: '73', fleet: 3, headway: 15,
    destA: ['赤柱市場', 'Stanley Market'], destB: ['數碼港', 'Cyberport'],
    legs: () => [...CYB_LOOP, ...PROM_TO_DRV, ...DRV_TO_WCH, [560, WCH_EB], [840, WCH_EB],
                 [860, 541], [STN_SB, 549], [STN_SB, 640], ...STAN_LOOP,
                 [STN_NB, 600], [STN_NB, 556], [851, 549], [844, 545], [830, WCH_WB],
                 [560, WCH_WB], ...WCH_TO_DRV, ...DRV_TO_PROM],
    stops: {
      A: [['CYB_T','002392'],['ABD_E','002161'],['WCHE','002345'],['DWB_S','002247'],['RPB_S','002252'],['STY_T','002277']],
      B: [['RPB_N','002241'],['DWB_N','002197'],['WCHW','002358'],['ABD_W','002162'],['CYB_T','002392']],
    } },
  { id: '72', fleet: 3, headway: 15,
    destA: ['銅鑼灣（摩頓台）', 'Causeway Bay (Moreton Terrace)'], destB: ['華貴邨', 'Wah Kwai Estate'],
    legs: () => [...WAF_TO_CITY, [465, WCH_EB], [560, WCH_EB], [970, WCH_EB], [978, 534],
                 [LN_NB, 524], [LN_NB, 60], ...LINK_TO_EB, ...EB(996, 1818),
                 ...arcE(1818, laneS(CORRIDOR[8]), laneN(CORRIDOR[8])), ...WB(1818, 985),
                 ...CITY_TO_592, [700, WCH_WB], [400, WCH_WB], ...CITY_TO_WAF, ...WAF_LOOP],
    stops: {
      A: [['WAF_T','002372'],['WCHE','002345'],['ABTN','003969'],['CAB_E','002536']],
      B: [['CAB_W','002535'],['ABTS','003968'],['WCHW','002358'],['WAF_T','002372']],
    } },
  { id: '42', fleet: 3, headway: 15,
    destA: ['北角碼頭', 'North Point Ferry Pier'], destB: ['華富（南）', 'Wah Fu (South)'],
    legs: () => [...WAF_TO_CITY, [465, WCH_EB], [560, WCH_EB], [970, WCH_EB], [978, 534],
                 [LN_NB, 524], [LN_NB, 60], ...LINK_TO_EB, ...EB(996, 3710),
                 ...arcE(3710, laneS(CORRIDOR[11]), laneN(CORRIDOR[11])), ...WB(3710, 985),
                 ...CITY_TO_592, [700, WCH_WB], [400, WCH_WB], ...CITY_TO_WAF, ...WAF_LOOP],
    stops: {
      A: [['WAF_T','002341'],['WCHE','002344'],['ABTN','003969'],['CAB_E','002438'],['TIH_E','001213'],['FOH_E','001261'],['NOP_E','001249']],
      B: [['NOP_W','001249'],['FOH_W','001282'],['TIH_W','001215'],['CAB_W','002439'],['ABTS','003968'],['WCHW','002358'],['WAF_T','002341']],
    } },
  // ---- Western Harbour Crossing: Stanley -> TST ------------------------------
  { id: '973', fleet: 4, headway: 15,
    destA: ['尖沙咀（麼地道）', 'Tsim Sha Tsui (Mody Rd)'], destB: ['赤柱市場', 'Stanley Market'],
    legs: () => [...STN_UP.slice(3), [960, WCH_EB], ...WCH_TO_CITY, ...WB(968, -2020),
                 ...WHC_OUT, ...WHC_N_TO_E, ...KLN_TO_TST, ...TST_LOOP, ...TST_TO_KLN,
                 ...KLN_W_TO_WHC, ...WHC_IN, ...EB(-1930, 975), ...LINK_DN,
                 [960, WCH_WB], [884, WCH_WB], [870, 544], [STN_SB, 552], [STN_SB, 640], ...STAN_LOOP],
    stops: {
      A: [['STY_T','002277'],['RPB_N','002241'],['DWB_N','002197'],['WC2E','002355'],['ABTN','002225'],
          ['WAC_W','002226'],['ADM_W','002231'],['CEN_W','002227'],['HOK_W','002234'],['WHCN','001628'],['KOWE','003762'],['TST_E','001587'],['TST_T','001540']],
      B: [['TST_W','001540'],['KOWW','003763'],['WHCS','001629'],['HOK_E','001119'],['CEN_E','002236'],['ADM_E','002240'],['WAC_E','002260'],
          ['ABTS','002225'],['WC2W','002345'],['DWB_S','002267'],['RPB_S','002252'],['STY_T','002277']],
    } },
  // ---- airport ---------------------------------------------------------
  { id: 'A11', fleet: 3, headway: 20,
    destA: ['機場', 'Airport'], destB: ['北角碼頭', 'North Point Ferry Pier'],
    legs: () => [...WB(3710, -2020), ...WHC_OUT, ...WHC_N_TO_W, ...AIR_S_LEG,
                 ...AIR_N_LEG, [-2400, KLN_EB], ...KLN_E_TO_WHC, ...WHC_IN,
                 ...EB(-1930, 3710), ...arcE(3710, laneS(CORRIDOR[11]), laneN(CORRIDOR[11]))],
    stops: {
      A: [['NOP_W','001249'],['FOH_W','001285'],['TIH_W','001334'],['CAB_W','002568'],['WAC_W','002416'],['ADM_W','002420'],['CEN_W','001033'],['HOK_W','001036'],['WHCN','001628'],['LTLW','001853'],['AIR_T','001837']],
      B: [['AIR_T','001837'],['LTLE','001854'],['WHCS','001629'],['HOK_E','001059'],['CEN_E','001031'],['ADM_E','001136'],['WAC_E','002417'],['CAB_E','002437'],['TIH_E','001213'],['NOP_E','001249']],
    } },
  { id: 'A10', fleet: 3, headway: 25,
    destA: ['機場', 'Airport'], destB: ['鴨脷洲（利樂街）', 'Ap Lei Chau (Lee Lok St)'],
    legs: () => [...SOH_TO_WCH, [560, WCH_EB], [970, WCH_EB], ...WCH_TO_CITY.slice(1),
                 ...WB(968, -2020), ...WHC_OUT, ...WHC_N_TO_W, ...AIR_S_LEG,
                 ...AIR_N_LEG, [-2400, KLN_EB], ...KLN_E_TO_WHC, ...WHC_IN,
                 ...EB(-1930, 975), ...LINK_DN, [960, WCH_WB], [560, WCH_WB],
                 ...WCH_TO_SOH, ...SOH_LOOP],
    stops: {
      A: [['SOHE','002262'],['LETN','002173'],['WCHE','002357'],['ABTN','002338'],['WAC_W','002328'],['ADM_W','002231'],['CEN_W','002228'],['HOK_W','002683'],['WHCN','001628'],['LTLW','001853'],['AIR_T','001837']],
      B: [['AIR_T','001837'],['LTLE','001854'],['WHCS','001629'],['HOK_E','001060'],['CEN_E','001059'],['ADM_E','001060'],['WAC_E','002363'],['ABTS','002349'],['WCHW','002358'],['LETS','002213'],['SOHW','002202']],
    } },
  // ---- route 790: TKO -> east Kowloon -> TST ------------------------------
  { id: '790', fleet: 3, headway: 20,
    destA: ['尖沙咀（麼地道）', 'Tsim Sha Tsui (Mody Rd)'], destB: ['清水灣半島', 'Oscar By The Sea'],
    legs: () => [[5050, eklS(EKL[14])], ...chainS(), ...KLN_TO_TKO, [400, TST_EB], ...TST_LOOP,
                 ...TST_TO_TKO, ...chainN('SKM'), ...POL_LOOP],
    stops: {
      A: [['POL_S','003783'],['HAH_S','003329'],['TKW_S','002919'],['TKL_S','003785'],['KWT_S','003787'],['NTK_S','003826'],['CHH_S','003146'],['DIH_S','001412'],['SKM_S','001471'],['TST_E','001571'],['TST_T','001540']],
      B: [['TST_W','003150'],['SKM_N','001412'],['DIH_N','003365'],['CHH_N','001606'],['KOB_N','003786'],['KWT_N','003787'],['TKL_N','002928'],['TKW_N','002929'],['HAH_N','003329'],['POL_N','003783']],
    } },
];

// resolve a route's legs into one closed point loop + resolved stop records
export function resolveRoutes() {
  return ROUTES.map(r => ({
    ...r,
    pts: r.legs(),
    stops: Object.entries(r.stops).flatMap(([leg, list]) =>
      list.map(([zone, stopId]) => ({ zone, stopId, leg, ...ZONES[zone] }))),
  }));
}

// furniture zones with the set of routes serving each
export function zonesWithRoutes() {
  const out = {};
  for (const r of ROUTES)
    for (const list of Object.values(r.stops))
      for (const [zone] of list) {
        const z = out[zone] ??= { ...ZONES[zone], routes: [], stopIds: [] };
        if (!z.routes.includes(r.id)) z.routes.push(r.id);
      }
  // per-route real stop ids for the ETA poller
  for (const r of ROUTES)
    for (const list of Object.values(r.stops))
      for (const [zone, stopId] of list) {
        const z = out[zone];
        if (!z.stopIds.some(s => s.route === r.id)) z.stopIds.push({ route: r.id, stopId });
      }
  return Object.entries(out).map(([id, z]) => ({ id, ...z }));
}
