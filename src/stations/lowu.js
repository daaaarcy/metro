// Lo Wu Station 羅湖 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/low.pdf) + Wikipedia. The EAL
// boundary terminus at grade inside the frontier restricted zone —
// border crossing hall, Shenzhen beyond the fence. Trains reverse on
// the off-map wrap; both faces use the west portal. Livery: green.
// Exits (per Wikipedia, condensed): A Lo Wu border crossing hall, B
// restricted zone / Shenzhen footbridge.

import { atGradeSide } from './template.js';

export const LOW = atGradeSide({
  id: 'LOW', zh: '羅湖', en: 'Lo Wu',
  livery: '#3f8f5f',
  cx: 3920, cz: -3280,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  terminus: true, tail: 1,   // dead end east — buffers at the boundary
  faces: [
    { num: 1, line: 'EAL', side: -1, dir: -1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',   en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '羅湖邊境管制站',   en: 'Lo Wu Control Point' },
    { id: 'B', x:  40, side: 1,  zh: '禁區・深圳河',     en: 'Frontier Zone · Shenzhen R.' },
  ],

  people: { U1: 40, G: 14, P: 44 },
});
