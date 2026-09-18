// Kwai Hing Station 葵興 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/kwh.pdf) + Wikipedia. Second of
// the TWL's three elevated stations, structurally a twin of Kwai Fong
// (twlViaduct recipe): opposed side platforms on the U1 viaduct deck over
// a concourse building at grade — each side has its own escalator bank
// and riders come back down through the concourse to change direction.
// Exits A–D are street doors in the ground concourse; E is the footbridge
// off P1's north edge to Kowloon Commerce Centre (deck + stair stub built
// in builders/link.js). Through station on the TWL corridor.
// Livery: bright yellow.
// Exits (5): A Kwai Hing Estate, B Kwai Hing Government Offices,
// C Kwai Hong Court, D Sun Kwai Hing Gardens, E Kowloon Commerce Centre
// footbridge.

import { twlViaduct } from './template.js';

export const KWH = twlViaduct({
  id: 'KWH', zh: '葵興', en: 'Kwai Hing',
  livery: '#eab308',   // KWH's bright yellow
  cz: -2200,

  exits: [
    { id: 'A',  x: -50, side: -1, door: true, box: 'kwhConc', zh: '葵興邨',           en: 'Kwai Hing Estate' },
    { id: 'B',  x:  40, side: -1, door: true, box: 'kwhConc', zh: '葵興政府合署',      en: 'Kwai Hing Govt Offices' },
    { id: 'C',  x: -40, side:  1, door: true, box: 'kwhConc', zh: '葵康苑',           en: 'Kwai Hong Court' },
    { id: 'D',  x:  50, side:  1, door: true, box: 'kwhConc', zh: '新葵興花園',        en: 'Sun Kwai Hing Gardens' },
    { id: 'E',  x:  94, side: -1, door: true, box: 'kwhPlat', zh: '九龍貿易中心',      en: 'Kowloon Commerce Centre' },
  ],

  people: { G: 24, GC: 40, U1: 36 },
});
