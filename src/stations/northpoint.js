// North Point Station 北角 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/nop.pdf).
// ~700 m east of Fortress Hill under King's Road — the northernmost
// Island Line station. Cross-platform interchange with the Tseung Kwan
// O line, which terminates here: two stacked island platforms, four
// faces. Unlike most interchanges the pairing splits by direction —
//   L2 upper island: P2 ISL -> Kennedy Town + P4 TKO terminus arrivals
//   L3 lower island: P1 ISL -> Chai Wan    + P3 TKO -> Po Lam/LOHAS Park
// TKO consists berth at P4, reverse off-map in the tail tunnel west of
// the station, then re-enter eastbound at P3 to depart for Po Lam.
// Exits per Wikipedia: A1 Java Rd, A2 Marble Rd, A3 Odeon Plaza,
// A4 Shu Kuk St (west cluster); B1–B3 King's Rd, B4 Tsat Tsz Mui Rd
// (east cluster).

export const NOP = {
  id: 'NOP', zh: '北角', en: 'North Point',
  livery: '#e8683a',   // North Point's tomato-orange mosaic tile livery

  boxes: {
    nopSite: { cx: 3600, cz: 0, len: 220, wid: 64, rot: 0 },  // G ground slab
    nopConc: { cx: 3600, cz: 0, len: 210, wid: 44, rot: 0 },  // L1 concourse
    nopP2:   { cx: 3600, cz: 0, len: 200, wid: 24, rot: 0 },  // L2 upper island (ISL P2 / TKO P4)
    nopP3:   { cx: 3600, cz: 0, len: 200, wid: 24, rot: 0 },  // L3 lower island (ISL P1 / TKO P3)
  },

  levels: [
    { id: 'G',  y: 0,   box: 'nopSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'nopConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'nopP2',   zh: '月台・港島綫・將軍澳綫', en: 'Upper Platforms', type: 'platform' },
    { id: 'L3', y: -21, box: 'nopP3',   zh: '月台・港島綫・將軍澳綫', en: 'Lower Platforms', type: 'platform' },
  ],

  // Two stacked islands; each carries one ISL face (north track) and one
  // TKO face (south track) — the cross-platform transfer pairs by
  // direction: westbound ISL + TKO arrivals up top, eastbound ISL + TKO
  // departures below.
  platforms: {
    L2: {
      kind: 'island',
      faces: [
        { num: 2, line: 'ISL', side: -1, dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
        { num: 4, line: 'TKO', side: 1,  dir: -1, to: { zh: '將軍澳綫・終點站', en: 'TKO Line terminus' } },
      ],
    },
    L3: {
      kind: 'island',
      faces: [
        { num: 1, line: 'ISL', side: -1, dir: 1, to: { zh: '往柴灣',     en: 'to Chai Wan' } },
        { num: 3, line: 'TKO', side: 1,  dir: 1, to: { zh: '往寶琳/康城', en: 'to Po Lam/LOHAS Park' } },
      ],
    },
  },

  // Twin 3-lane banks from the concourse ends onto the upper island
  // centre, then 2-lane cascades L2 -> L3 landing on the lower island.
  escalators: [
    { from: 'L1', to: 'L2', frame: 'nopP2', cx: -62, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'nopP2', cx:  62, cz: 0, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'nopP3', cx: -82, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'nopP3', cx:  82, cz: 0, dir: [ 1, 0], n: 2 },
  ],

  // Exit fan per Wikipedia — west cluster A1–A4 (Java Rd / Marble Rd /
  // Odeon Plaza / Shu Kuk St), east cluster B1–B4 (King's Rd / Tsat Tsz
  // Mui Rd). Shafts clear the escalator wells (x∈±[54.8,69.2] upper,
  // ±[74.8,89.2] lower).
  exits: [
    { id: 'A1', x: -94, side: -1, zh: '渣華道',        en: 'Java Road' },
    { id: 'A2', x: -80, side: 1,  zh: '馬寶道',        en: 'Marble Road' },
    { id: 'A3', x: -68, side: -1, zh: '國賓廣場',      en: 'Odeon Plaza' },
    { id: 'A4', x: -52, side: 1,  zh: '書局街',        en: 'Shu Kuk Street' },
    { id: 'B1', x: 52,  side: -1, zh: '英皇道',        en: "King's Road" },
    { id: 'B2', x: 66,  side: 1,  zh: '英皇道',        en: "King's Road" },
    { id: 'B3', x: 80,  side: -1, zh: '英皇道',        en: "King's Road" },
    { id: 'B4', x: 94,  side: 1,  zh: '七姊妹道',      en: 'Tsat Tsz Mui Road' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B'],

  lifts: [
    { frame: 'nopConc', x: 0,   z: 0,   levels: ['L1', 'L2', 'L3'] },  // paid lift between the islands
    { frame: 'nopConc', x: -88, z: 15,  levels: ['G', 'L1'] },          // street lift — A2/A4 side
    { frame: 'nopConc', x: 88,  z: -15, levels: ['G', 'L1'] },          // street lift — B1/B3 side
  ],

  gateRows: [
    { z: -9, x0: -68, x1: -26 },
    { z: -9, x0: 26,  x1: 68 },
    { z: 9,  x0: -68, x1: -26 },
    { z: 9,  x0: 26,  x1: 68 },
  ],
  gateEnds: { x0: -74, x1: 74 },

  kioskXs:  [-44, -8, 34],
  kioskXsS: [-38, 8, 42],

  walkRects: {
    G:  [{ x0: -102, z0: -28, x1: 102, z1: 28 }],
    L1: [{ x0: -98,  z0: -19, x1: 98,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
    L3: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
  },

  people: { G: 12, L1: 46, L2: 38, L3: 38 },
};
