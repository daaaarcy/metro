// Kowloon Tong Station 九龍塘 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/kot.pdf) + Wikipedia.
// The EAL's surface stop where the line leaves the urban corridor for
// the Lion Rock tunnel — at-grade side platforms under a gallery, with
// the (unbuilt) KTL interchange beneath. Livery: light blue.
// Exits (per Wikipedia, condensed): A Festival Walk / KTL link, B
// Suffolk Rd, C Baptist University, E Broadcast Drive.

import { atGradeSide } from './template.js';

export const KOT = atGradeSide({
  id: 'KOT', zh: '九龍塘', en: 'Kowloon Tong',
  livery: '#6ea4d4',   // Kowloon Tong's light blue
  cx: 600, cz: -1420,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '又一城・觀塘綫',       en: 'Festival Walk · Kwun Tong Line' },
    { id: 'B', x:  20, side: -1, zh: '沙福道・九龍塘',       en: 'Suffolk Rd · Kowloon Tong' },
    { id: 'C', x:  60, side: 1,  zh: '浸會大學・城市大學',   en: 'Baptist U · City U' },
    { id: 'E', x: -20, side: 1,  zh: '廣播道',               en: 'Broadcast Drive' },
  ],

  people: { U1: 44, G: 18, P: 42 },
});
