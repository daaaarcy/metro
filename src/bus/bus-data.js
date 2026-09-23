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

const laneS = c => (c.s[0] + c.s[1]) / 2 - LANE_IN;
const laneN = c => (c.n[0] + c.n[1]) / 2 + LANE_IN;
const kerbS = c => c.s[0];
const kerbN = c => c.n[1];

// ---- connector road strips (emitted by buildCity) ----------------------------
export const CONNECTORS = [];

function gapSteps(x0, x1, laneA, laneB) {
  const dz = laneB - laneA, n = Math.max(1, Math.round(Math.abs(dz) / 10) + 1);
  for (let k = 0; k < n; k++) {
    const sx0 = x0 + (x1 - x0) * (k / n), sx1 = x0 + (x1 - x0) * ((k + 1) / n);
    const c = laneA + dz * ((k + 0.5) / n);
    CONNECTORS.push([sx0, c - ROAD_H / 2, sx1, c + ROAD_H / 2]);
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
    gapSteps(a.x1, b.x0, laneS(a), laneS(b));
  }
  // westbound (north band) gaps — SKW..KET, skipping WAC->ADM (detour)
  for (let i = ix.SKW; i > 0; i--) {
    const a = CORRIDOR[i], b = CORRIDOR[i - 1];
    if (a.stn === 'WAC' && b.stn === 'ADM') continue;
    gapSteps(b.x1, a.x0, laneN(b), laneN(a));
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
  CONNECTORS.push([1818, -33.75, 1862, 33.25]);          // CAB east slab
  CONNECTORS.push([-4380, 39, -4355, 53]);               // KET west
  CONNECTORS.push([-4380, -66, -4355, -50]);
  CONNECTORS.push([-4435, -62, -4380, 48]);
  CONNECTORS.push([-2225, -47.5, -2160, 35.5]);          // SHW west
  CONNECTORS.push([-1215, -55, -1145, 58]);              // CEN west
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
  const cx = (c.x0 + c.x1) / 2, [ze, zw, ee, ew] = ZONE_NAMES[c.stn];
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
  LETS: { halt: [200, DRV_WB], kerb: [200, 728],  nv: [0, 1],  qv: [1, 0],  zh: '利東邨', en: 'Lei Tung Estate' },
  LETN: { halt: [220, DRV_EB], kerb: [220, 716],  nv: [0, -1], qv: [-1, 0], zh: '利東邨', en: 'Lei Tung Estate' },
  SOHW: { halt: [-120, SOH_WB], kerb: [-120, 616], nv: [0, 1],  qv: [1, 0],  zh: '海怡半島', en: 'South Horizons' },
  SOHE: { halt: [-80, SOH_EB],  kerb: [-80, 604],  nv: [0, -1], qv: [-1, 0], zh: '海怡半島', en: 'South Horizons' },
});

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
