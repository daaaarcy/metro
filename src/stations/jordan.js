// Jordan Station 佐敦 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/jor.pdf).
// One stop up Nathan Road from Tsim Sha Tsui — island platform (L2)
// under a concourse (L1) with exits fanned along both sides of the
// corridor: A Yue Hwa Emporium; B1 Eaton/Novotel, B2 Diocesan Girls'/
// Queen Elizabeth Hospital; C1 Austin Rd/Kowloon Park, C2 Bowring St/
// Xiqu Centre; D Austin Rd/Observatory; E Prudential Centre (Wikipedia).
// Livery: dark green / light green mosaic.

export const JOR = {
  id: 'JOR', zh: '佐敦', en: 'Jordan',
  livery: '#5b7f3c',   // Jordan's green mosaic (dark + light bands)

  boxes: {
    jorSite: { cx: 320, cz: -1000, len: 240, wid: 84, rot: 0 }, // G apron
    jorConc: { cx: 320, cz: -1000, len: 190, wid: 44, rot: 0 }, // L1 concourse
    jorPlat: { cx: 320, cz: -1000, len: 200, wid: 24, rot: 0 }, // L2 island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'jorSite', zh: '地面',       en: 'Ground',   type: 'ground'   },
    { id: 'L1', y: -7,  box: 'jorConc', zh: '大堂',       en: 'Concourse', type: 'concourse'},
    { id: 'L2', y: -14, box: 'jorPlat', zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform' },
  ],

  // Island platform. Temporary TWL north end — both faces dispatch to
  // Central and reverse at the west portal, same-portal scissors like
  // TST/CHW. When Yau Ma Tei lands, face 1 becomes 'to Tsuen Wan'
  // (dir +1) and terminus clears; the arrival portal stays x0 either way.
  platforms: {
    L2: {
      kind: 'island', terminus: true,
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: -1, to: { zh: '往中環', en: 'to Central' } },
        { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
      ],
    },
  },

  escalators: [
    { from: 'L1', to: 'L2', frame: 'jorPlat', cx: -58, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'jorPlat', cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // exit fan along the Nathan Road corridor — north (-z) side reaches
  // Jordan Rd / Eaton hotel / the hospital; south (+z) side reaches
  // Bowring St / Austin Rd / Prudential
  exits: [
    { id: 'A',  x: -60, side: -1, zh: '裕華國貨',              en: 'Yue Hwa Emporium' },
    { id: 'B1', x: -20, side: -1, zh: '伊敦酒店・諾富特',       en: 'Eaton · Novotel' },
    { id: 'B2', x:  30, side: -1, zh: '拔萃女書院・伊利沙伯醫院', en: 'Diocesan Girls\' · QE Hospital' },
    { id: 'C1', x: -50, side: 1,  zh: '柯士甸道・九龍公園',     en: 'Austin Road · Kowloon Park' },
    { id: 'C2', x: -10, side: 1,  zh: '寶靈街・戲曲中心',       en: 'Bowring Street · Xiqu Centre' },
    { id: 'D',  x:  40, side: 1,  zh: '柯士甸道・香港天文台',   en: 'Austin Road · Observatory' },
    { id: 'E',  x:  75, side: 1,  zh: '恒豐中心・恒豐酒店',     en: 'Prudential Centre · Hotel' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'jorPlat', x: 0,   z: 0,   levels: ['L1', 'L2'] },         // paid lift
    { frame: 'jorConc', x: -86, z: -18, levels: ['G', 'L1'] },          // street lift — hospital side
    { frame: 'jorConc', x: 86,  z: 18,  levels: ['G', 'L1'] },          // street lift — Austin Rd side
  ],

  gateRows: [
    { z: -9, x0: -62, x1: -24 },
    { z: -9, x0: 24,  x1: 62 },
    { z: 9,  x0: -62, x1: -24 },
    { z: 9,  x0: 24,  x1: 62 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  // kiosks dodge the exit stair shafts
  kioskXs:  [-44, 8, 58],
  kioskXsS: [-32, 20, 58],

  walkRects: {
    G:  [{ x0: -112, z0: -38, x1: 112, z1: 38 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 18, L1: 48, L2: 38 },
};
