// AsiaWorld-Expo Station 博覽館 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/awe.pdf) +
// Wikipedia. The AEX terminus at grade beside the expo halls — the real
// station is a single side platform; condensed to the side-platform +
// gallery terminus form. Both faces use the east portal, overrun west.
// Livery: dark blue.
// Exits (per Wikipedia, condensed): A AsiaWorld-Expo halls, B Skycity.

import { atGradeSide } from './template.js';

export const AWE = atGradeSide({
  id: 'AWE', zh: '博覽館', en: 'AsiaWorld-Expo',
  livery: '#3a5a8c',
  cx: -3300, cz: -1650,
  platZh: '月台・機場快綫', platEn: 'Airport Express Platforms',

  terminus: true, tail: -1,  // dead end west — trains reverse at the east portal
  faces: [
    { num: 1, line: 'AEX', side: -1, dir: 1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'AEX', side: 1,  dir: 1, to: { zh: '往香港',   en: 'to Hong Kong' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '亞洲國際博覽館', en: 'AsiaWorld-Expo Halls' },
    { id: 'B', x:  40, side: 1,  zh: '航天城・酒店',   en: 'Skycity · Hotels' },
  ],

  people: { U1: 30, G: 12, P: 34 },
});
