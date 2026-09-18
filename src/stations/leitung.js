// Lei Tung Station 利東 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/let.pdf) + Wikipedia.
// The SIL's deep station — an island cavern bored into Ap Lei Chau's
// hill (the line dives off the WCH viaduct under the Aberdeen Channel
// and up again to South Horizons). Standard underground island form:
// G apron, L1 concourse, L2 island. Livery: burnt orange.
// Exits (per Wikipedia, condensed): A1/A2 Lei Tung Estate, B Ap Lei Chau
// Bridge Rd.

import { twlIsland } from './template.js';

export const LET = twlIsland({
  id: 'LET', zh: '利東', en: 'Lei Tung',
  livery: '#d2681e',   // Lei Tung's orange cavern walls
  cx: 240, cz: 660,
  platZh: '月台・南港島綫', platEn: 'South Island Line Platform',

  faces: [
    { num: 1, line: 'SIL', side: -1, dir: -1, to: { zh: '往海怡半島', en: 'to South Horizons' } },
    { num: 2, line: 'SIL', side: 1,  dir: 1,  to: { zh: '往金鐘',     en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A1', x: -60, side: -1, zh: '利東邨東邨',          en: 'Lei Tung Estate East' },
    { id: 'A2', x:  30, side: -1, zh: '利東邨・商場',        en: 'Lei Tung Estate · Shopping Centre' },
    { id: 'B',  x:  60, side: 1,  zh: '鴨脷洲橋道',          en: 'Ap Lei Chau Bridge Road' },
  ],

  kioskXs:  [-44, 8, 58],
  kioskXsS: [-24, 40, 78],

  people: { G: 12, L1: 40, L2: 44 },
});
