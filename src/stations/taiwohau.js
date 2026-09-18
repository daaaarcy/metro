// Tai Wo Hau Station 大窩口 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/twh.pdf) + Wikipedia.
// Under Castle Peak Rd at Kwok Shui Rd, back underground after the
// Kwai Fong / Kwai Hing viaduct — the line dives into the hillside here.
// Serves Tai Wo Hau Estate / Kwai Yin Court and the resited villages
// (Kwan Mun Hau Tsuen, Hoi Pa San Tsuen). Standard island platform
// (template.js recipe). Livery: lime green.
// Exits (2): A Kwok Shui Rd / Hoi Pa San Tsuen / Primrose Hill (north),
// B Castle Peak Rd / Kwai Yin Court / Tai Wo Hau Estate (south, lift).

import { twlIsland } from './template.js';

export const TWH = twlIsland({
  id: 'TWH', zh: '大窩口', en: 'Tai Wo Hau',
  livery: '#84cc16',   // TWH's lime green mosaic
  cz: -2320,           // through station — Tsuen Wan is the terminus

  // only two exits — A north to the villages up Kwok Shui Rd, B south
  // to Castle Peak Rd and the estate blocks
  exits: [
    { id: 'A', x: -40, side: -1, zh: '國瑞路・河背村',       en: 'Kwok Shui Rd · Hoi Pa Tsuen' },
    { id: 'B', x:  40, side: 1,  zh: '青山公路・大窩口邨',    en: 'Castle Peak Rd · Tai Wo Hau Est' },
  ],

  // a quieter station — smaller crowd than the market district stops
  people: { G: 14, L1: 38, L2: 30 },
});
