// Airport Station 機場 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/air.pdf) + Wikipedia. AEX
// through-stop at grade beside the terminal — the real platforms plug
// straight into the departures hall; condensed to the side-platform +
// gallery form. Livery: silver-blue.
// Exits (per Wikipedia, condensed): A Terminal 1 departures, B Terminal
// 2 / SkyPier.

import { atGradeSide } from './template.js';

export const AIR = atGradeSide({
  id: 'AIR', zh: '機場', en: 'Airport',
  livery: '#8aa8b8',
  cx: -2800, cz: -1500,
  platZh: '月台・機場快綫', platEn: 'Airport Express Platforms',

  faces: [
    { num: 1, line: 'AEX', side: -1, dir: -1, to: { zh: '往博覽館', en: 'to AsiaWorld-Expo' } },
    { num: 2, line: 'AEX', side: 1,  dir: 1,  to: { zh: '往香港',   en: 'to Hong Kong' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '一號客運大樓・離港', en: 'Terminal 1 · Departures' },
    { id: 'B', x:  40, side: 1,  zh: '二號客運大樓・海天', en: 'Terminal 2 · SkyPier' },
  ],

  people: { U1: 36, G: 14, P: 40 },
});
