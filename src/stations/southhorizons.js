// South Horizons Station 海怡半島 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/soh.pdf) + Wikipedia.
// The SIL's west terminus on the Ap Lei Chau viaduct: opposed side decks
// over a grade concourse, buffers overrun west of the platforms. Both
// faces board back to Admiralty (dir +1 = east portal out). Livery:
// apple green.
// Exits (per Wikipedia, condensed): A South Horizons podium, B Lee Nam
// Rd / Ap Lei Chau west, C Marina / Promenade.

import { twlViaduct } from './template.js';

export const SOH = twlViaduct({
  id: 'SOH', zh: '海怡半島', en: 'South Horizons',
  livery: '#8cc63f',   // South Horizons' apple-green mosaic
  cx: -80, cz: 680,
  platZh: '月台・南港島綫', platEn: 'South Island Line Platform',

  // terminus — trains arrive from Lei Tung through the east portal and
  // turn back; the physical tail overruns west (tail: -1) toward the
  // water past Lee Nam Rd.
  terminus: true, tail: -1,
  faces: [
    { num: 1, line: 'SIL', side: -1, dir: 1, to: { zh: '往金鐘', en: 'to Admiralty' } },
    { num: 2, line: 'SIL', side: 1,  dir: 1, to: { zh: '往金鐘', en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -55, side: -1, door: true, box: 'sohConc', zh: '海怡半島・商場',      en: 'South Horizons · Mall' },
    { id: 'B', x:  30, side: -1, door: true, box: 'sohConc', zh: '利南道・鴨脷洲西',     en: 'Lee Nam Rd · Ap Lei Chau West' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'sohConc', zh: '海怡路・海濱長廊',     en: 'South Horizon Dr · Promenade' },
  ],

  kioskXs:  [-34, 8, 48],
  kioskXsS: [-48, -8, 30],

  people: { G: 16, GC: 38, U1: 46 },
});
