// Disneyland Resort Station 迪士尼 — schematic data based on the
// official MTR layout (mtr.com.hk/archive/ch/services/layouts/dis.pdf)
// + Wikipedia. The DRL terminus at grade — the real station is a
// Victorian-park fantasy shed with one platform; condensed to the
// side-platform + gallery terminus form. Both faces use the west
// portal, overrun east toward the resort entrance. Livery: pink-green.
// Exits (condensed): A Disneyland park entrance, B Inspiration Lake / hotels,
// C Magic Rd, D Disneyland International Piers / Disneyland Hotel.

import { atGradeSide } from './template.js';

export const DIS = atGradeSide({
  id: 'DIS', zh: '迪士尼', en: 'Disneyland Resort',
  livery: '#c87a9a',
  cx: -2300, cz: -2400,
  platZh: '月台・迪士尼綫', platEn: 'Disneyland Resort Line Platforms',

  terminus: true, tail: 1,   // dead end east — the resort entrance
  faces: [
    { num: 1, line: 'DRL', side: -1, dir: -1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'DRL', side: 1,  dir: -1, to: { zh: '往欣澳',   en: 'to Sunny Bay' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '迪士尼樂園・正門', en: 'Disneyland Park Entrance' },
    { id: 'B', x:  40, side: 1,  zh: '迪欣湖・酒店',     en: 'Inspiration Lake · Hotels' },
    { id: 'C', x:  40, side: -1, zh: '神奇道',          en: 'Magic Rd' },
    { id: 'D', x: -40, side: 1,  zh: '迪士尼國際碼頭・迪士尼酒店', en: 'Disneyland International Piers · Disneyland Hotel' },
  ],

  people: { U1: 34, G: 14, P: 40 },
});
