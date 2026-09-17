// Sheung Wan Station 上環 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/shw.pdf).
// ~1.0 km west of Central along the harbour-front axis (-X).
// Island Line's western terminus 1986–2014 — trains still reverse in
// the overrun tunnel west of the station, which the ISL route reuses.
// One island platform serves both directions (P1 Chai Wan / P2 Kennedy
// Town); the official plan's two concourses (central Hillier St, east
// Rumsey St/Infinitus Plaza) merge into one L1 concourse here. The
// walled-off Rumsey Street ghost platforms east of L2 are omitted.

export const SHW = {
  id: 'SHW', zh: '上環', en: 'Sheung Wan',
  livery: '#8f7a5e',   // Sheung Wan's khaki/light-brown mosaic tile

  boxes: {
    shwSite: { cx: -2050, cz: 0, len: 230, wid: 64, rot: 0 },  // G ground slab
    shwConc: { cx: -2050, cz: 0, len: 220, wid: 44, rot: 0 },  // L1 concourse
    shwP:    { cx: -2050, cz: 0, len: 200, wid: 24, rot: 0 },  // L2 ISL island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'shwSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'shwConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'shwP',    zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
  ],

  // Island platform: P1 (north face) eastbound to Chai Wan, P2 (south
  // face) westbound to Kennedy Town.
  platforms: {
    L2: {
      kind: 'island',
      faces: [
        { num: 1, line: 'ISL', side: -1, dir: 1,  to: { zh: '往柴灣',     en: 'to Chai Wan' } },
        { num: 2, line: 'ISL', side: 1,  dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
      ],
    },
  },

  // Two 3-lane banks drop from the concourse ends onto the island
  // platform centre, like the plan's twin escalator clusters.
  escalators: [
    { from: 'L1', to: 'L2', frame: 'shwP', cx: -62, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'shwP', cx:  62, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // Exit fan per Wikipedia/MTR — west cluster (central concourse):
  // D Shun Tak Centre/Macau Ferry, A1 Des Voeux Rd, A2 Wing Lok St,
  // B Hillier St/Western Market, C Connaught Rd; east cluster (east
  // concourse): E1/E2 Rumsey St, E3 Wing On Centre, E4/E5 Infinitus
  // Plaza. Shafts keep clear of the escalator wells (x∈±[55,69]).
  exits: [
    { id: 'D',  x: -100, side: -1, zh: '信德中心・港澳碼頭',    en: 'Shun Tak Centre · Macau Ferry' },
    { id: 'A1', x: -88,  side: -1, zh: '德輔道中',            en: 'Des Voeux Road Central' },
    { id: 'A2', x: -88,  side: 1,  zh: '永樂街・文咸東街',     en: 'Wing Lok St · Bonham Strand' },
    { id: 'B',  x: -74,  side: 1,  zh: '禧利街・西港城',       en: 'Hillier St · Western Market' },
    { id: 'C',  x: -50,  side: -1, zh: '干諾道中',            en: 'Connaught Road Central' },
    { id: 'E1', x: 50,   side: -1, zh: '林士街',              en: 'Rumsey Street' },
    { id: 'E2', x: 50,   side: 1,  zh: '林士街',              en: 'Rumsey Street' },
    { id: 'E4', x: 76,   side: -1, zh: '無限極廣場',          en: 'Infinitus Plaza' },
    { id: 'E5', x: 90,   side: -1, zh: '無限極廣場',          en: 'Infinitus Plaza' },
    { id: 'E3', x: 88,   side: 1,  zh: '永安中心',            en: 'Wing On Centre' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'shwConc', x: -8,  z: 0,   levels: ['L1', 'L2'] },   // paid lift onto the island
    { frame: 'shwConc', x: -80, z: -15, levels: ['G', 'L1'] },    // street lift — Des Voeux/A1 side
    { frame: 'shwConc', x: 96,  z: 15,  levels: ['G', 'L1'] },    // street lift — E3 wheelchair side
  ],

  // Octopus gate lanes on the paid core; the unpaid band wraps the ends
  // like the plan's yellow ring around each concourse blob.
  gateRows: [
    { z: -9, x0: -66, x1: -28 },
    { z: -9, x0: 28,  x1: 66 },
    { z: 9,  x0: -66, x1: -28 },
    { z: 9,  x0: 28,  x1: 66 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  kioskXs:  [-32, 0, 34],     // north band, dodging the exit shafts
  kioskXsS: [-36, -4, 30],    // south band

  walkRects: {
    G:  [{ x0: -108, z0: -28, x1: 108, z1: 28 }],
    L1: [{ x0: -102, z0: -19, x1: 102, z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
  },

  people: { G: 14, L1: 42, L2: 34 },
};
