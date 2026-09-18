// Sham Shui Po Station 深水埗 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/ssp.pdf) +
// Wikipedia. Under Cheung Sha Wan Rd at the Kweilin/Pei Ho junction —
// the market district: Apliu St electronics, Fuk Wa St stalls, the Pei
// Ho St municipal services building. Standard island platform
// (template.js recipe). Livery: dark green.
// Exits per the street map (8, all within the Kweilin/Pei Ho/Fuk
// Wa/Apliu quadrant): A1/A2 Kweilin St side, B1/B2 Pei Ho St market
// side, C1/C2 Apliu St side, D1/D2 Fuk Wa St side.

import { twlIsland } from './template.js';

export const SSP = twlIsland({
  id: 'SSP', zh: '深水埗', en: 'Sham Shui Po',
  livery: '#14532d',   // SSP's dark bottle-green mosaic
  cz: -1480,

  // the 8-exit fan — north (-z) side reaches Kweilin St / Pei Ho St
  // market; south (+z) side reaches Apliu St / Fuk Wa St / the bazaar
  exits: [
    { id: 'A1', x: -78, side: -1, zh: '桂林街・北河街',        en: 'Kweilin St · Pei Ho St' },
    { id: 'A2', x: -50, side: -1, zh: '桂林街',              en: 'Kweilin Street' },
    { id: 'B1', x: -16, side: -1, zh: '北河街市政大廈',        en: 'Pei Ho St MSB' },
    { id: 'B2', x:  14, side: -1, zh: '北河街街市',           en: 'Pei Ho Street Market' },
    { id: 'C1', x: -60, side: 1,  zh: '鴨寮街',              en: 'Apliu Street' },
    { id: 'C2', x: -30, side: 1,  zh: '鴨寮街電子市集',        en: 'Apliu St Electronics' },
    { id: 'D1', x:  30, side: 1,  zh: '福華街',              en: 'Fuk Wa Street' },
    { id: 'D2', x:  66, side: 1,  zh: '福華街・欽州街',        en: 'Fuk Wa St · Yen Chow St' },
  ],

  people: { G: 20, L1: 54, L2: 40 },
});
