// Tai Wai Station 大圍 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/taw.pdf) + Wikipedia.
// Elevated stop in the Shing Mun valley north of the Lion Rock tunnel —
// the viaduct form (grade concourse under opposed side decks), with the
// line continuing off-map to Sha Tin and the New Territories. The real
// station interchanges with the Tuen Ma Line; condensed to EAL faces.
// Livery: navy.
// Exits (per Wikipedia, condensed): A Tai Wai village, B Festival City,
// C Che Kung Temple, D Hin Keng.

import { twlViaduct } from './template.js';

export const TAW = twlViaduct({
  id: 'TAW', zh: '大圍', en: 'Tai Wai',
  livery: '#1f4a8c',   // Tai Wai's navy mosaic
  cx: 640, cz: -2140,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platform',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, door: true, box: 'tawConc', zh: '大圍村・積福街',     en: 'Tai Wai Village · Chik Fuk St' },
    { id: 'B', x:  10, side: -1, door: true, box: 'tawConc', zh: '名城・車公廟路',     en: 'Festival City · Che Kung Miu Rd' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'tawConc', zh: '車公廟・海福花園',   en: 'Che Kung Temple · Holford Gdns' },
    { id: 'D', x: -20, side: 1,  door: true, box: 'tawConc', zh: '顯徑・美田路',       en: 'Hin Keng · Mei Tin Rd' },
  ],

  kioskXs:  [-34, 8, 48],
  kioskXsS: [-48, -8, 30],

  people: { G: 18, GC: 40, U1: 44 },
});
