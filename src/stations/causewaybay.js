// Causeway Bay Station 銅鑼灣 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/cab.pdf).
// Sits ~820 m east of Wan Chai along the harbour-front axis (+X).
// Like Central/Wan Chai the Island Line platforms are stacked side
// platforms: L2 = platform 1 to Chai Wan (eastbound), L3 = platform 2 to
// Kennedy Town (westbound). The official plan splits the concourse into
// East (exits D/E/F) and West (B/C + the Times Square subway to exit A)
// lobes — here one long concourse carries the same exit fan, with the
// unpaid band wrapping the paid core's ends.

export const CAB = {
  id: 'CAB', zh: '銅鑼灣', en: 'Causeway Bay',
  livery: '#8a5aa8',   // Causeway Bay's purple mosaic tile livery

  boxes: {
    cabSite: { cx: 1700, cz: 0, len: 240, wid: 64, rot: 0 },  // G ground slab
    cabConc: { cx: 1700, cz: 0, len: 230, wid: 40, rot: 0 },  // L1 concourse
    cabP2:   { cx: 1700, cz: 0, len: 190, wid: 18, rot: 0 },  // L2 ISL side platform (1)
    cabP3:   { cx: 1700, cz: 0, len: 190, wid: 18, rot: 0 },  // L3 ISL side platform (2)
  },

  levels: [
    { id: 'G',  y: 0,   box: 'cabSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'cabConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'cabP2',   zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
    { id: 'L3', y: -21, box: 'cabP3',   zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
  ],

  platforms: {
    L2: {
      kind: 'single', single: { track: -1, side: 1 },
      faces: [
        { num: 1, line: 'ISL', side: 1, dir: 1, to: { zh: '往柴灣', en: 'to Chai Wan' } },
      ],
    },
    L3: {
      kind: 'single', single: { track: -1, side: 1 },
      faces: [
        { num: 2, line: 'ISL', side: 1, dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
      ],
    },
  },

  // The plan drops escalator shafts at both ends of the platform stack —
  // banks here cascade concourse -> L2 -> L3, descending toward the ends.
  escalators: [
    { from: 'L1', to: 'L2', frame: 'cabP2', cx: -60, cz: 3, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'cabP2', cx:  60, cz: 3, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'cabP3', cx: -80, cz: 3, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'cabP3', cx:  80, cz: 3, dir: [ 1, 0], n: 2 },
  ],

  // Exit fan per Wikipedia/MTR: A (Times Square) alone on the south spur,
  // B (Causeway Bay Plaza) + C (Sino Plaza) at the west concourse, and the
  // east concourse fan D1–D4 (all SOGO basement), E (Victoria Park),
  // F1 (Jardine's Crescent), F2 (Hysan Place). There is no plain D or F.
  // Shafts stay clear of the escalator wells (x∈±[52.8,67.2]) so their
  // balustrades don't wall off the mouths; D1 sits by the east street lift
  // (it carries the wheelchair symbol on the real plan).
  exits: [
    { id: 'A',  x: -95,  side: 1,  zh: '時代廣場',     en: 'Times Square' },
    { id: 'B',  x: -80,  side: 1,  zh: '銅鑼灣廣場一期', en: 'Causeway Bay Plaza 1' },
    { id: 'C',  x: -88,  side: -1, zh: '信和廣場',     en: 'Sino Plaza' },
    { id: 'D1', x: 82,   side: -1, zh: '崇光百貨',     en: 'SOGO' },
    { id: 'D2', x: 44,   side: -1, zh: '崇光百貨',     en: 'SOGO' },
    { id: 'D3', x: 74,   side: 1,  zh: '崇光百貨',     en: 'SOGO' },
    { id: 'D4', x: 86,   side: 1,  zh: '崇光百貨',     en: 'SOGO' },
    { id: 'E',  x: 100,  side: -1, zh: '維多利亞公園', en: 'Victoria Park' },
    { id: 'F1', x: 94,   side: 1,  zh: '渣甸坊',       en: "Jardine's Crescent" },
    { id: 'F2', x: 110,  side: 1,  zh: '希慎廣場',     en: 'Hysan Place' },
  ],
  exitZ: 9,
  exitLetters: ['A', 'B', 'C', 'D', 'E', 'F'],

  lifts: [
    { frame: 'cabConc', x: 45,  z: 2,    levels: ['L1', 'L2', 'L3'] },  // paid lift, east half
    { frame: 'cabConc', x: -88, z: 14.5, levels: ['G', 'L1'] },          // street lift — Times Square side
    { frame: 'cabConc', x: 88,  z: -14.5, levels: ['G', 'L1'] },         // street lift — east end
  ],

  // Gate banks on the paid/unpaid boundary; the band wraps the strip's
  // ends like the plan's yellow ring around each paid blob.
  gateRows: [
    { z: -8, x0: -68, x1: -24 },
    { z: -8, x0: 24,  x1: 68 },
    { z: 8,  x0: -68, x1: -24 },
    { z: 8,  x0: 24,  x1: 68 },
  ],
  gateEnds: { x0: -74, x1: 74 },

  // kiosk spots dodging the exit stair shafts that descend into the bands
  kioskXs: [-40, -5, 60],      // north band
  kioskXsS: [-50, -10, 38],    // south band

  walkRects: {
    G:  [{ x0: -112, z0: -28, x1: 112, z1: 28 }],
    L1: [{ x0: -108, z0: -17, x1: 108, z1: 17 }],
    L2: [{ x0: -88, z0: -0.6, x1: 88, z1: 6.6 }],
    L3: [{ x0: -88, z0: -0.6, x1: 88, z1: 6.6 }],
  },

  people: { G: 18, L1: 50, L2: 26, L3: 26 },
};
