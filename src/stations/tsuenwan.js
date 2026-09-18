// Tsuen Wan Station 荃灣 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tsw.pdf) + Wikipedia.
// The TWL's north-western terminus and its ONLY at-grade station: two
// side platforms flank the track pair at ground level under an elevated
// gallery concourse (U1) spanning the tracks — the same form as Heng Fa
// Chuen (atGradeSide recipe). P1 is the alighting platform; the overrun
// tail continues past the east throat toward Tsuen Wan Depot's sidings.
// Exits D/E are street doors straight off P1 (the "leave without going
// up" exits). Livery: dark red.
// Exits (per Wikipedia): A1 Luk Yeung/Bus Terminus, A2 Nan Fung Centre/
// Town Hall, B Panda Hotel/Chung On St, C Discovery Park/Govt Offices
// (all off the U1 gallery); D minibus stops + E Sam Tung Uk Museum at
// platform level on P1's north edge.

import { atGradeSide } from './template.js';

export const TSW = atGradeSide({
  id: 'TSW', zh: '荃灣', en: 'Tsuen Wan',
  livery: '#7f1d1d',   // Tsuen Wan's dark red mosaic
  cz: -2440,
  terminus: true,      // TWL north end — tail overrun to the depot sidings
  platZh: '月台・荃灣綫', platEn: 'Tsuen Wan Line Platform',
  roadSide: 1,         // town-centre forecourt on the south apron

  // P1 northbound face berths arrivals (alighting only) then slides out
  // the east portal into the overrun; P2 re-enters and dispatches south.
  faces: [
    { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
  ],

  // exits drop off the gallery deck edges to the street apron (up-shafts,
  // same geometry as HFC); D/E are street doors in P1's north wall so
  // alighting passengers leave without climbing to the concourse.
  exits: [
    { id: 'A1', x: -45, side: -1, zh: '綠楊新邨・巴士總站',   en: 'Luk Yeung Est · Bus Terminus' },
    { id: 'A2', x:  45, side: -1, zh: '南豐中心・荃灣大會堂', en: 'Nan Fung Centre · Town Hall' },
    { id: 'B',  x: -45, side: 1,  zh: '悅來酒店・眾安街',     en: 'Panda Hotel · Chung On St' },
    { id: 'C',  x:  45, side: 1,  zh: '愉景新城・政府合署',   en: 'Discovery Park · Govt Offices' },
    { id: 'D',  x: -60, side: -1, door: true, box: 'tswPlat', zh: '專綫小巴・古屋里', en: 'Minibus · Kwu Uk Lane' },
    { id: 'E',  x:  60, side: -1, door: true, box: 'tswPlat', zh: '三棟屋博物館',    en: 'Sam Tung Uk Museum' },
  ],

  kioskXs:  [-15, 15, 62],     // north unpaid band (dodges A shafts at ±45)
  kioskXsS: [-62, -15, 15],    // south unpaid band (dodges B/C at ∓45)

  people: { G: 16, U1: 46, P: 44 },
});
