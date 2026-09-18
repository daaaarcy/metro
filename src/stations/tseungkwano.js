// Tseung Kwan O Station 將軍澳 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/tkw.pdf) +
// Wikipedia. TKO line underground island in the new-town centre —
// PopCorn mall and Park Central slabs above. Livery: red.
// Exits (per Wikipedia, condensed): A Park Central, B PopCorn /
// TKO Plaza, C Sheung Tak Estate.

import { twlIsland } from './template.js';

export const TKW = twlIsland({
  id: 'TKW', zh: '將軍澳', en: 'Tseung Kwan O',
  livery: '#d93f3f',
  cx: 4300, cz: -2180,
  platZh: '月台・將軍澳綫', platEn: 'Tseung Kwan O Line Platform',

  faces: [
    { num: 1, line: 'TKO', side: -1, dir: 1,  to: { zh: '往寶琳/康城', en: 'to Po Lam/LOHAS Park' } },
    { num: 2, line: 'TKO', side: 1,  dir: -1, to: { zh: '往北角',     en: 'to North Point' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '將軍澳中心・尚德',   en: 'Park Central · Sheung Tak' },
    { id: 'B', x:  10, side: -1, zh: 'PopCorn・將軍澳廣場', en: 'PopCorn · TKO Plaza' },
    { id: 'C', x:  60, side: 1,  zh: '尚德邨・唐明街',     en: 'Sheung Tak Estate · Tong Ming St' },
  ],

  people: { G: 16, L1: 42, L2: 44 },
});
