// Kennedy Town Station 堅尼地城 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/ket.pdf).
// Western terminus of the Island Line (West Island Line, Dec 2014) —
// trains reverse in the overrun tunnel toward Mount Davis. Island
// platform under a single concourse; only three exits, the east one (B)
// reached by a long corridor ending in lift towers under Rock Hill St.
// Exits per Wikipedia: A Smithfield, B Rock Hill/North St, C Forbes St.
// Built on the islIsland() recipe.

import { islIsland } from './template.js';

export const KET = islIsland({
  id: 'KET', zh: '堅尼地城', en: 'Kennedy Town',
  livery: '#6fb2bc',   // Kennedy Town's pale turquoise mosaic tile
  cx: -4250, siteLen: 220,
  westLabel: { zh: '終點站', en: 'Terminus' },   // P2 is the arrival face

  // Exit fan per Wikipedia — C west by the playground, A mid on
  // Smithfield, B east where the corridor climbs to Rock Hill St.
  exits: [
    { id: 'C',  x: -92, side: 1,  zh: '科士街・堅尼地城遊樂場', en: 'Forbes St · Kennedy Town Playground' },
    { id: 'A',  x: 10,  side: 1,  zh: '士美菲路',               en: 'Smithfield' },
    { id: 'B',  x: 80,  side: -1, zh: '石山街・北街',           en: 'Rock Hill St · North St' },
  ],

  lifts: [
    { frame: 'ketConc', x: -8,  z: 0,   levels: ['L1', 'L2'] },   // paid lift onto the island
    { frame: 'ketConc', x: 91,  z: -15, levels: ['G', 'L1'] },    // B corridor lift towers
    { frame: 'ketConc', x: -97, z: 15,  levels: ['G', 'L1'] },    // C street lift
  ],

  kioskXs:  [-46, -4, 38],     // north band, dodging the exit shafts
  kioskXsS: [-36, -60, 44],    // south band — clear of C (-92) and A (10)

  walkRects: {
    G:  [{ x0: -102, z0: -28, x1: 102, z1: 28 }],
    L1: [{ x0: -98,  z0: -19, x1: 98,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
  },

  people: { G: 16, L1: 44, L2: 36 },
});
