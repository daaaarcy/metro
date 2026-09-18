// Station recipes — the repeated TWL in-town forms as factories, so a new
// station is its livery, site position, exit fan and crowd count instead of
// a page of shared boilerplate. The result is a plain station object —
// bespoke fields (slabCuts, restaurants, extra lifts…) still set on top.
//
// twlIsland(): the standard underground island — G apron, L1 concourse,
// L2 island platform. SSP/CSW/LCK/JOR/TWH all follow it.

export function twlIsland(o) {
  const p = o.id.toLowerCase();
  const site = `${p}Site`, conc = `${p}Conc`, plat = `${p}Plat`;
  return {
    id: o.id, zh: o.zh, en: o.en,
    livery: o.livery,

    boxes: {
      [site]: { cx: 320, cz: o.cz, len: 240, wid: 84, rot: 0 }, // G apron
      [conc]: { cx: 320, cz: o.cz, len: 190, wid: 44, rot: 0 }, // L1 concourse
      [plat]: { cx: 320, cz: o.cz, len: 200, wid: 24, rot: 0 }, // L2 island
    },

    levels: [
      { id: 'G',  y: 0,   box: site, zh: '地面',         en: 'Ground',                type: 'ground'    },
      { id: 'L1', y: -7,  box: conc, zh: '大堂',         en: 'Concourse',             type: 'concourse' },
      { id: 'L2', y: -14, box: plat, zh: '月台・荃灣綫',  en: 'Tsuen Wan Line Platform', type: 'platform'  },
    ],

    // P1 northbound to Tsuen Wan, P2 southbound to Central
    platforms: {
      L2: {
        kind: 'island',
        ...(o.terminus ? { terminus: true } : {}),
        faces: [
          { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
          { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
        ],
      },
    },

    escalators: o.escalators ?? [
      { from: 'L1', to: 'L2', frame: plat, cx: -58, cz: 0, dir: [-1, 0], n: 3 },
      { from: 'L1', to: 'L2', frame: plat, cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
    ],

    exits: o.exits,
    exitZ: 9.5,
    exitLetters: o.exitLetters ?? [...new Set(o.exits.map(e => e.id[0]))],

    lifts: o.lifts ?? [
      { frame: plat, x: 0,   z: 0,   levels: ['L1', 'L2'] },   // paid lift
      { frame: conc, x: -86, z: -18, levels: ['G', 'L1'] },    // street lift, -z side
      { frame: conc, x: 86,  z: 18,  levels: ['G', 'L1'] },    // street lift, +z side
    ],

    gateRows: o.gateRows ?? [
      { z: -9, x0: -62, x1: -24 },
      { z: -9, x0:  24, x1:  62 },
      { z:  9, x0: -62, x1: -24 },
      { z:  9, x0:  24, x1:  62 },
    ],
    gateEnds: o.gateEnds ?? { x0: -72, x1: 72 },

    kioskXs:  o.kioskXs  ?? [-44, 8, 58],
    kioskXsS: o.kioskXsS ?? [-24, 40, 78],

    walkRects: o.walkRects ?? {
      G:  [{ x0: -112, z0: -38, x1: 112, z1: 38 }],
      L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
      L2: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
    },

    people: o.people,
  };
}
