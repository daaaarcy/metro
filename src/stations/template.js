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
    exitLetters: o.exitLetters ?? [...new Set(o.exits.map(e => e.id[0]))].sort(),

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

// islIsland(): the standard Island Line in-town form — G apron, L1
// concourse, L2 island platform. SHW/TAK/SKW (site len 230) and
// SYP/HKU/KET (220) share it; street-lift positions, the exit fan and
// gate bands stay per-station.
//
// Options: id/zh/en/livery/cx (cz is always 0 on the harbour axis),
// siteLen (230 | 220), exits, lifts, gateRows/gateEnds (defaults are the
// ±66/±28 + ±72 pattern), kioskXs/kioskXsS, westLabel (P2's destination
// sign — KET reads 'Terminus'), people.
export function islIsland(o) {
  const p = o.id.toLowerCase();
  const site = `${p}Site`, conc = `${p}Conc`, plat = `${p}P`;
  const siteLen = o.siteLen ?? 230, concLen = siteLen - 10;
  const gHalf = siteLen / 2 - 7, cHalf = concLen / 2 - 8;
  return {
    id: o.id, zh: o.zh, en: o.en,
    livery: o.livery,

    boxes: {
      [site]: { cx: o.cx, cz: 0, len: siteLen, wid: 64, rot: 0 }, // G ground slab
      [conc]: { cx: o.cx, cz: 0, len: concLen, wid: 44, rot: 0 }, // L1 concourse
      [plat]: { cx: o.cx, cz: 0, len: 200,     wid: 24, rot: 0 }, // L2 ISL island
    },

    levels: [
      { id: 'G',  y: 0,   box: site, zh: '地面',        en: 'Ground',              type: 'ground'    },
      { id: 'L1', y: -7,  box: conc, zh: '大堂',        en: 'Concourse',           type: 'concourse' },
      { id: 'L2', y: -14, box: plat, zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform'  },
    ],

    // P1 (north face) eastbound to Chai Wan, P2 westbound to Kennedy Town
    platforms: {
      L2: {
        kind: 'island',
        faces: [
          { num: 1, line: 'ISL', side: -1, dir: 1,  to: { zh: '往柴灣', en: 'to Chai Wan' } },
          { num: 2, line: 'ISL', side: 1,  dir: -1, to: o.westLabel ?? { zh: '往堅尼地城', en: 'to Kennedy Town' } },
        ],
      },
    },

    escalators: o.escalators ?? [
      { from: 'L1', to: 'L2', frame: plat, cx: -62, cz: 0, dir: [-1, 0], n: 3 },
      { from: 'L1', to: 'L2', frame: plat, cx:  62, cz: 0, dir: [ 1, 0], n: 3 },
    ],

    exits: o.exits,
    exitZ: 9.5,
    exitLetters: o.exitLetters ?? [...new Set(o.exits.map(e => e.id[0]))].sort(),

    lifts: o.lifts,

    gateRows: o.gateRows ?? [
      { z: -9, x0: -66, x1: -28 },
      { z: -9, x0:  28, x1:  66 },
      { z:  9, x0: -66, x1: -28 },
      { z:  9, x0:  28, x1:  66 },
    ],
    gateEnds: o.gateEnds ?? { x0: -72, x1: 72 },

    kioskXs:  o.kioskXs,
    kioskXsS: o.kioskXsS,

    walkRects: o.walkRects ?? {
      G:  [{ x0: -gHalf, z0: -28, x1: gHalf, z1: 28 }],
      L1: [{ x0: -cHalf, z0: -19, x1: cHalf, z1: 19 }],
      L2: [{ x0: -92,    z0: -4.9, x1: 92,   z1: 4.9 }],
    },

    people: o.people,
  };
}

// twlViaduct(): the elevated twin — opposed side platforms on the U1
// viaduct deck over a concourse building at grade. Riders can't cross
// the tracks, so each platform gets its own escalator bank and the way
// back is through the concourse. KWF/KWH share it.
//
// Exits A–D are street doors in the ground-concourse walls; E is the
// footbridge doorway off P1's north edge (deck + stair stub in
// builders/link.js).
export function twlViaduct(o) {
  const p = o.id.toLowerCase();
  const site = `${p}Site`, conc = `${p}Conc`, plat = `${p}Plat`;
  return {
    id: o.id, zh: o.zh, en: o.en,
    livery: o.livery,

    boxes: {
      [site]: { cx: 320, cz: o.cz, len: 240, wid: 96, rot: 0 }, // G apron
      [conc]: { cx: 320, cz: o.cz, len: 150, wid: 30, rot: 0 }, // G concourse at grade
      [plat]: { cx: 320, cz: o.cz, len: 200, wid: 24, rot: 0 }, // U1 side platforms on the viaduct
    },

    levels: [
      { id: 'G',  y: 0, box: site, zh: '地面',        en: 'Ground',                type: 'ground'    },
      { id: 'GC', y: 0, box: conc, zh: '大堂',        en: 'Concourse',             type: 'concourse' },
      { id: 'U1', y: 8, box: plat, zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform'  },
    ],

    // P1 northbound to Tsuen Wan, P2 southbound to Central
    platforms: {
      U1: {
        kind: 'side',
        faces: [
          { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
          { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
        ],
      },
    },

    // concourse footprint cut from the apron slab (the building sits in
    // the dig like HFC's platform box)
    slabCuts: { G: [{ x0: -76, z0: -15.5, x1: 76, z1: 15.5 }] },

    escalators: o.escalators ?? [
      { from: 'GC', to: 'U1', frame: plat, cx: -30, cz: -9.2, dir: [-1, 0], n: 2 },  // west bank → P1
      { from: 'GC', to: 'U1', frame: plat, cx:  30, cz:  9.2, dir: [ 1, 0], n: 2 },  // east bank → P2
    ],

    exits: o.exits,
    exitZ: 9.5,
    exitLetters: o.exitLetters ?? [...new Set(o.exits.map(e => e.id[0]))].sort(),

    lifts: o.lifts ?? [
      { frame: plat, x: 50, z: -9.4, levels: ['GC', 'U1'] },  // paid lift onto P1
    ],

    // gate line splits the grade concourse — unpaid edge bands carry the
    // street doors
    gateRows: o.gateRows ?? [
      { z: -8, x0: -58, x1: -20 },
      { z: -8, x0:  20, x1:  58 },
      { z:  8, x0: -58, x1: -20 },
      { z:  8, x0:  20, x1:  58 },
    ],
    gateEnds: o.gateEnds ?? { x0: 'wall', x1: 66 },

    kioskXs:  o.kioskXs  ?? [-34, 6, 58],
    kioskXsS: o.kioskXsS ?? [-50, -6, 34],

    walkRects: o.walkRects ?? {
      G:  [{ x0: -112, z0: -46, x1: 112, z1: -16 },
           { x0: -112, z0: 16,  x1: 112, z1: 46 },
           { x0: -112, z0: -16, x1: -78, z1: 16 },
           { x0: 78,   z0: -16, x1: 112, z1: 16 }],
      GC: [{ x0: -71, z0: -12.5, x1: 71, z1: 12.5 }],
      U1: [{ x0: -92, z0: -11.3, x1: 92, z1: -7.4 },
           { x0: -92, z0: 7.4,   x1: 92, z1: 11.3 }],
    },

    people: o.people,
  };
}

// atGradeSide(): the open-air terminus form — two side platforms flank
// the track pair at ground level under an elevated gallery concourse
// (U1) spanning the tracks, like HFC. TSW runs it as the TWL terminus
// (terminus + tail overrun); OLY is the same form without the buffers.
// Exits drop off the gallery edges to the street apron; `door` exits on
// the platform box are street doors straight off a face.
//
// Options: id/zh/en/livery/cz, faces (platform face specs — line +
//   numbering differ per line), exits, exitZ (default 20), roadSide,
//   lifts, gateRows/gateEnds, kiosks, walkRects, people, terminus.
export function atGradeSide(o) {
  const p = o.id.toLowerCase();
  const site = `${p}Site`, conc = `${p}Conc`, plat = `${p}Plat`;
  return {
    id: o.id, zh: o.zh, en: o.en,
    livery: o.livery,

    boxes: {
      [site]: { cx: o.cx ?? 320, cz: o.cz, len: 240, wid: 84, rot: 0 }, // G apron
      [conc]: { cx: o.cx ?? 320, cz: o.cz, len: 150, wid: 36, rot: 0 }, // U1 gallery concourse
      [plat]: { cx: o.cx ?? 320, cz: o.cz, len: 200, wid: 24, rot: 0 }, // G side platforms
    },

    levels: [
      { id: 'U1', y: 8, box: conc, zh: '大堂',          en: 'Concourse',  type: 'concourse' },
      { id: 'G',  y: 0, box: site, zh: '地面',          en: 'Ground',     type: 'ground'    },
      { id: 'P',  y: 0, box: plat, zh: o.platZh ?? '月台', en: o.platEn ?? 'Platforms', type: 'platform' },
    ],

    // the platform box stands at grade inside the site — cut its
    // footprint out of the apron slab so the hall reads through
    slabCuts: { G: [{ x0: -100, z0: -12, x1: 100, z1: 12 }] },

    platforms: {
      P: {
        kind: 'side',
        ...(o.terminus ? { terminus: true, tail: 1 } : {}),
        faces: o.faces,
      },
    },

    // gallery deck -> each side platform strip
    escalators: o.escalators ?? [
      { from: 'U1', to: 'P', frame: plat, cx: -30, cz: -8.6, dir: [-1, 0], n: 2 },
      { from: 'U1', to: 'P', frame: plat, cx:  30, cz:  8.6, dir: [ 1, 0], n: 2 },
    ],

    exits: o.exits,
    exitZ: o.exitZ ?? 20,
    roadSide: o.roadSide,
    exitLetters: o.exitLetters ?? [...new Set(o.exits.map(e => e.id[0]))].sort(),

    lifts: o.lifts ?? [
      { frame: plat, x: 0,   z: -9.5, levels: ['U1', 'P'] },  // paid lift — north face
      { frame: plat, x: 0,   z:  9.5, levels: ['U1', 'P'] },  // paid lift — south face
      { frame: site, x: -70, z:  15,  levels: ['U1', 'G'] },  // street lift — south
      { frame: site, x: 70,  z: -15,  levels: ['U1', 'G'] },  // street lift — north
    ],

    // paid gallery core between the two platform wells; unpaid edge
    // bands feed the exit stairs + street lifts
    gateRows: o.gateRows ?? [
      { z: -11.5, x0: -62, x1: -26 },
      { z: -11.5, x0: 26,  x1: 62 },
      { z: 11.5,  x0: -62, x1: -26 },
      { z: 11.5,  x0: 26,  x1: 62 },
    ],
    gateEnds: o.gateEnds ?? { x0: -68, x1: 68 },

    kioskXs:  o.kioskXs,
    kioskXsS: o.kioskXsS,

    walkRects: o.walkRects ?? {
      U1: [{ x0: -70, z0: -16, x1: 70, z1: 16 }],
      G:  [{ x0: -112, z0: 13,  x1: 112,  z1: 40 },
           { x0: -112, z0: -40, x1: 112,  z1: -13 },
           { x0: -112, z0: -40, x1: -101, z1: 40 },
           { x0: 101,  z0: -40, x1: 112,  z1: 40 }],
      P:  [{ x0: -92, z0: 7.2,   x1: 92, z1: 11.4 },
           { x0: -92, z0: -11.4, x1: 92, z1: -7.2 }],
    },

    people: o.people,
  };
}
