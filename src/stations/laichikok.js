// Lai Chi Kok Station 荔枝角 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/lck.pdf) +
// Wikipedia. Under Cheung Sha Wan Rd by Cheung Sha Wan Plaza — the
// garment-district showrooms turned D2 Place creative quarter, with
// the sports ground east and Hoi Lai Estate / the wholesale market
// west. Standard island platform (template.js recipe). Livery:
// orange-red (the lychee's skin).
// Exits (8): A Cheung Sha Wan Plaza / sports ground, B1/B2 Tai Nam
// West St, C Tung Chau West St, D1/D2 D2 Place / police station,
// D3 Liberte, D4 Lai Chi Kok Rd / Hoi Lai Estate.

import { twlIsland } from './template.js';

export const LCK = twlIsland({
  id: 'LCK', zh: '荔枝角', en: 'Lai Chi Kok',
  livery: '#c2410c',   // LCK's orange-red mosaic
  cz: -1720,

  // exits — north (-z) side reaches CSW Rd / Tai Nam West St / the
  // sports ground; south (+z) side reaches D2 Place / Liberte / Lai
  // Chi Kok Rd
  exits: [
    { id: 'A',  x: -72, side: -1, zh: '長沙灣廣場・體育館',     en: 'CSW Plaza · Sports Ground' },
    { id: 'B1', x: -44, side: -1, zh: '大南西街',              en: 'Tai Nam West Street' },
    { id: 'B2', x: -16, side: -1, zh: '長沙灣道',              en: 'Cheung Sha Wan Road' },
    { id: 'C',  x:  20, side: -1, zh: '通州西街',              en: 'Tung Chau West Street' },
    { id: 'D1', x: -50, side: 1,  zh: 'D2 Place',            en: 'D2 Place' },
    { id: 'D2', x: -18, side: 1,  zh: 'D2 Place・警署',       en: 'D2 Place · Police Stn' },
    { id: 'D3', x:  26, side: 1,  zh: '昇悅居',               en: 'Liberte' },
    { id: 'D4', x:  62, side: 1,  zh: '荔枝角道・海麗邨',      en: 'Lai Chi Kok Rd · Hoi Lai' },
  ],

  people: { G: 20, L1: 54, L2: 40 },
});
