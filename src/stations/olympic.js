// Olympic Station 奧運 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/oly.pdf) + Wikipedia.
// Tung Chung Line through station on the West Kowloon reclamation:
// side platforms at grade under the elevated concourse (the atGradeSide
// form — same as Tsuen Wan, minus the terminus buffers). AEX/TCL track
// pair shares the corridor; only the TCL faces here (AEX runs express
// off-map). Sits between Kowloon (the Elements/ICC dig) and Lai King.
// Livery: duck-egg blue.
// Exits (per Wikipedia): A1 Olympian City 1, A2 Lin Cheung Rd, B Island
// Harbourview, C1 Sham Mong Rd, C2 Cherry St Park, D1 Cherry St,
// D2 Anchor St Playground, D3 Tai Kok Tsui Rd, E HSBC Centre.

import { atGradeSide } from './template.js';

export const OLY = atGradeSide({
  id: 'OLY', zh: '奧運', en: 'Olympic',
  livery: '#4e90b6',   // Olympic's duck-egg blue mosaic
  cx: -800, cz: -1450,
  platZh: '月台・東涌綫', platEn: 'Tung Chung Line Platform',

  // TCL through faces — P3 out to Tung Chung (via Lai King), P4 back to
  // Hong Kong (via Kowloon). TCL numbering: 3 outbound / 4 inbound, like
  // LAK's stacked islands and HOK's L4.
  faces: [
    { num: 3, line: 'TCL', side: -1, dir: 1,  to: { zh: '往東涌', en: 'to Tung Chung' } },
    { num: 4, line: 'TCL', side: 1,  dir: -1, to: { zh: '往香港', en: 'to Hong Kong' } },
  ],

  // exit fan drops off the gallery edges — Olympian City mall to the
  // north-west, Cherry St/Tai Kok Tsui to the south
  exits: [
    { id: 'A1', x: -45, side: -1, zh: '奧海城一期',          en: 'Olympian City 1' },
    { id: 'A2', x:  45, side: -1, zh: '連翔道・大角咀道',     en: 'Lin Cheung Rd · Tai Kok Tsui Rd' },
    { id: 'B',  x: -70, side: -1, zh: '維港灣・深旺道',       en: 'Island Harbourview · Sham Mong Rd' },
    { id: 'C1', x: -45, side: 1,  zh: '深旺道・櫻桃街公園',    en: 'Sham Mong Rd · Cherry St Park' },
    { id: 'D1', x:  20, side: 1,  zh: '櫻桃街',              en: 'Cherry Street' },
    { id: 'D2', x:  45, side: 1,  zh: '晏架街遊樂場',         en: 'Anchor St Playground' },
    { id: 'D3', x:  70, side: 1,  zh: '大角咀道',            en: 'Tai Kok Tsui Road' },
    { id: 'E',  x:  90, side: 1,  zh: '滙豐中心',            en: 'HSBC Centre' },
  ],

  kioskXs:  [-15, 15, 62],
  kioskXsS: [-62, -15, 15],

  people: { G: 18, U1: 50, P: 48 },
});
