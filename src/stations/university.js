// University Station 大學 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/uni.pdf) + Wikipedia.
// EAL through-stop at grade on the CUHK waterfront — the campus climbs
// the hill behind, Science Park across the cove. Livery: light green.
// Exits (per Wikipedia, condensed): A CUHK campus, B Science Park /
// waterfront, C Chung Chi College, D Ma Liu Shui ferry pier.

import { atGradeSide } from './template.js';

export const UNI = atGradeSide({
  id: 'UNI', zh: '大學', en: 'University',
  livery: '#7fae5a',
  cx: 1950, cz: -2920,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '中文大學・崇基',   en: 'CUHK · Chung Chi' },
    { id: 'B', x:  15, side: -1, zh: '科學園・海濱',     en: 'Science Park · Waterfront' },
    { id: 'C', x:  60, side: 1,  zh: '大學行政樓',       en: 'University Admin Bldg' },
    { id: 'D', x: -15, side: 1,  zh: '馬料水碼頭',       en: 'Ma Liu Shui Pier' },
  ],

  people: { U1: 36, G: 14, P: 38 },
});
