// Ocean Park Station 海洋公園 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/ocp.pdf) + Wikipedia.
// South Island Line elevated stop on the coast-side viaduct south of the
// hills: opposed side platforms on the U1 deck over a grade concourse —
// the twlViaduct form with SIL faces/livery. Exits feed the park entrance
// forecourt and the Wong Chuk Hang Rd bus stops. Livery: aqua.
// Exits (per Wikipedia, condensed): A Ocean Park, B Police College Rd /
// bus terminus, C Marina/press area side.

import { twlViaduct } from './template.js';

export const OCP = twlViaduct({
  id: 'OCP', zh: '海洋公園', en: 'Ocean Park',
  livery: '#00a8b0',   // Ocean Park's aqua wave mosaic
  cx: 800, cz: 480,
  platZh: '月台・南港島綫', platEn: 'South Island Line Platform',

  // SIL faces — P1 southbound to South Horizons, P2 back to Admiralty
  faces: [
    { num: 1, line: 'SIL', side: -1, dir: 1,  to: { zh: '往海怡半島', en: 'to South Horizons' } },
    { num: 2, line: 'SIL', side: 1,  dir: -1, to: { zh: '往金鐘',     en: 'to Admiralty' } },
  ],

  // park entrance north side; the bus terminus + Police College south —
  // street doors in the grade concourse walls, like KWF/KWH
  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'ocpConc', zh: '海洋公園',            en: 'Ocean Park' },
    { id: 'B', x:  30, side: -1, door: true, box: 'ocpConc', zh: '海洋公園巴士總站',     en: 'Ocean Park Bus Terminus' },
    { id: 'C', x: -30, side: 1,  door: true, box: 'ocpConc', zh: '警察學院・黃竹坑道',   en: 'Police College · Wong Chuk Hang Rd' },
  ],

  kioskXs:  [-30, 10, 50],
  kioskXsS: [-54, -10, 34],

  people: { G: 22, GC: 34, U1: 40 },
});
