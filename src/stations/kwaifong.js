// Kwai Fong Station 葵芳 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/kwf.pdf) + Wikipedia. One of the
// TWL's three elevated stations (twlViaduct recipe): opposed side
// platforms on the U1 viaduct deck over a concourse building at grade —
// the two platforms are split by the track pair, so each side has its
// own escalator bank and riders must come back down through the
// concourse to change direction. Exits A–D are street doors in the
// ground concourse; E is the footbridge off P1's north edge to
// Metroplaza (deck + stair stub built in builders/link.js).
// Livery: dark emerald green.
// Exits (5): A Kwai Fong Estate, B New Kwai Fong Gardens, C Kwai Tsing
// Theatre, D Kwai Chung Plaza, E Metroplaza footbridge.

import { twlViaduct } from './template.js';

export const KWF = twlViaduct({
  id: 'KWF', zh: '葵芳', en: 'Kwai Fong',
  livery: '#166534',   // KWF's dark emerald green
  cz: -2080,

  exits: [
    { id: 'A',  x: -50, side: -1, door: true, box: 'kwfConc', zh: '葵芳邨',           en: 'Kwai Fong Estate' },
    { id: 'B',  x:  40, side: -1, door: true, box: 'kwfConc', zh: '新葵芳花園',        en: 'New Kwai Fong Gardens' },
    { id: 'C',  x: -40, side:  1, door: true, box: 'kwfConc', zh: '葵青劇院',          en: 'Kwai Tsing Theatre' },
    { id: 'D',  x:  50, side:  1, door: true, box: 'kwfConc', zh: '葵涌廣場',          en: 'Kwai Chung Plaza' },
    { id: 'E',  x:  94, side: -1, door: true, box: 'kwfPlat', zh: '新都會廣場',        en: 'Metroplaza' },
  ],

  people: { G: 26, GC: 44, U1: 40 },
});
