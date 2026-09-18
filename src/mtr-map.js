// MTR system map — bottom-right mini-map for station-to-station
// navigation. Layout follows the official 港鐵路綫圖 (routemap.pdf):
// HK Island spine at the bottom, Kowloon above the harbour, New
// Territories on top, Lantau at the left. Built (constructed) stations
// are clickable; every other stop renders grey and inert.
//
// Stop entries may carry a per-line rail offset ('ID:dx:dy') so shared
// corridors (Central–Admiralty, PRE–MOK–YMT, NOP–QUB, YAT–TKL,
// KOW–TSY) draw as parallel rails like the official map.

// id: [x, y, 中文, English]
const ST = {
  // ── Island Line — HK Island spine, bottom ────────────────────────
  KET: [212, 545, '堅尼地城', 'Kennedy Town'], HKU: [258, 545, '香港大學', 'HKU'],
  SYP: [304, 545, '西營盤', 'Sai Ying Pun'],  SHW: [350, 545, '上環', 'Sheung Wan'],
  CEN: [396, 545, '中環', 'Central'],          ADM: [442, 545, '金鐘', 'Admiralty'],
  WAC: [488, 545, '灣仔', 'Wan Chai'],          CAB: [532, 545, '銅鑼灣', 'Causeway Bay'],
  TIH: [575, 545, '天后', 'Tin Hau'],           FOH: [618, 545, '炮台山', 'Fortress Hill'],
  NOP: [661, 545, '北角', 'North Point'],       QUB: [704, 545, '鰂魚涌', 'Quarry Bay'],
  TAK: [747, 545, '太古', 'Tai Koo'],           SWH: [790, 545, '西灣河', 'Sai Wan Ho'],
  SKW: [832, 558, '筲箕灣', 'Shau Kei Wan'],    HFC: [866, 586, '杏花邨', 'Heng Fa Chuen'],
  CHW: [888, 612, '柴灣', 'Chai Wan'],
  HOK: [398, 498, '香港', 'Hong Kong'],
  // South Island Line — dips below the island
  OCP: [470, 584, '海洋公園', 'Ocean Park'],    WCH: [434, 620, '黃竹坑', 'Wong Chuk Hang'],
  LET: [390, 612, '利東', 'Lei Tung'],          SOH: [352, 622, '海怡半島', 'South Horizons'],

  // ── Tsuen Wan Line — east-west through Kowloon, then south ───────
  TSW: [170, 414, '荃灣', 'Tsuen Wan'],         TWH: [208, 414, '大窩口', 'Tai Wo Hau'],
  KWH: [246, 414, '葵興', 'Kwai Hing'],         KWF: [284, 414, '葵芳', 'Kwai Fong'],
  LAK: [322, 414, '荔景', 'Lai King'],          MEF: [360, 414, '美孚', 'Mei Foo'],
  LCK: [398, 414, '荔枝角', 'Lai Chi Kok'],     CSW: [436, 414, '長沙灣', 'Cheung Sha Wan'],
  SSP: [470, 414, '深水埗', 'Sham Shui Po'],    PRE: [502, 414, '太子', 'Prince Edward'],
  MOK: [502, 452, '旺角', 'Mong Kok'],          YMT: [502, 488, '油麻地', 'Yau Ma Tei'],
  JOR: [502, 514, '佐敦', 'Jordan'],            TST: [502, 536, '尖沙咀', 'Tsim Sha Tsui'],

  // ── Kwun Tong Line ───────────────────────────────────────────────
  WHA: [575, 505, '黃埔', 'Whampoa'],           HOM: [552, 468, '何文田', 'Ho Man Tin'],
  SKM: [540, 406, '石硤尾', 'Shek Kip Mei'],    KOT: [577, 398, '九龍塘', 'Kowloon Tong'],
  LOF: [614, 396, '樂富', 'Lok Fu'],            WTS: [650, 396, '黃大仙', 'Wong Tai Sin'],
  DIH: [687, 398, '鑽石山', 'Diamond Hill'],    CHH: [722, 408, '彩虹', 'Choi Hung'],
  KOB: [756, 422, '九龍灣', 'Kowloon Bay'],     NTK: [786, 434, '牛頭角', 'Ngau Tau Kok'],
  KWT: [812, 446, '觀塘', 'Kwun Tong'],         LAT: [838, 456, '藍田', 'Lam Tin'],
  YAT: [862, 468, '油塘', 'Yau Tong'],          TKL: [886, 482, '調景嶺', 'Tiu Keng Leng'],

  // ── Tseung Kwan O Line ───────────────────────────────────────────
  TKW: [930, 470, '將軍澳', 'Tseung Kwan O'],   HAH: [952, 430, '坑口', 'Hang Hau'],
  POL: [968, 395, '寶琳', 'Po Lam'],            LHP: [920, 540, '康城', 'LOHAS Park'],

  // ── East Rail Line — north corridor into the harbour crossing ────
  LMC: [408, 84, '落馬洲', 'Lok Ma Chau'],      LOW: [455, 54, '羅湖', 'Lo Wu'],
  SHU: [478, 82, '上水', 'Sheung Shui'],        FAN: [534, 94, '粉嶺', 'Fanling'],
  TAO: [580, 94, '太和', 'Tai Wo'],             TPM: [628, 94, '大埔墟', 'Tai Po Market'],
  UNI: [680, 94, '大學', 'University'],         FOT: [720, 140, '火炭', 'Fo Tan'],
  RAC: [748, 158, '馬場', 'Racecourse'],        SHS: [732, 188, '沙田', 'Sha Tin'],
  TAW: [742, 244, '大圍', 'Tai Wai'],           MKE: [562, 450, '旺角東', 'Mong Kok East'],
  HUH: [546, 500, '紅磡', 'Hung Hom'],          EXC: [478, 530, '會展', 'Exhibition Centre'],

  // ── Tuen Ma Line — west loop, Kowloon arc, Ma On Shan tail ───────
  TUM: [92, 336, '屯門', 'Tuen Mun'],           SIH: [92, 268, '兆康', 'Siu Hong'],
  TIS: [118, 142, '天水圍', 'Tin Shui Wai'],    LOP: [146, 200, '朗屏', 'Long Ping'],
  YUL: [172, 252, '元朗', 'Yuen Long'],         KSR: [204, 306, '錦上路', 'Kam Sheung Road'],
  TWW: [242, 366, '荃灣西', 'Tsuen Wan West'],  NAC: [348, 442, '南昌', 'Nam Cheong'],
  AUS: [452, 486, '柯士甸', 'Austin'],          ETS: [514, 512, '尖東', 'East Tsim Sha Tsui'],
  TOS: [612, 442, '土瓜灣', 'To Kwa Wan'],      SUW: [656, 426, '宋皇臺', 'Sung Wong Toi'],
  KAT: [706, 414, '啟德', 'Kai Tak'],           HIK: [737, 314, '顯徑', 'Hin Keng'],
  CKT: [782, 168, '車公廟', 'Che Kung Temple'], STW: [820, 124, '沙田圍', 'Sha Tin Wai'],
  CIO: [856, 104, '第一城', 'City One'],        SHM: [890, 98, '石門', 'Shek Mun'],
  TSH: [922, 95, '大水坑', 'Tai Shui Hang'],    HEO: [950, 93, '恆安', 'Heng On'],
  MOS: [976, 91, '馬鞍山', 'Ma On Shan'],       WKS: [1000, 89, '烏溪沙', 'Wu Kai Sha'],

  // ── Tung Chung Line + Airport Express + Disneyland Resort ────────
  KOW: [296, 470, '九龍', 'Kowloon'],           OLY: [322, 446, '奧運', 'Olympic'],
  TSY: [262, 352, '青衣', 'Tsing Yi'],          SUN: [168, 452, '欣澳', 'Sunny Bay'],
  TUC: [66, 538, '東涌', 'Tung Chung'],         AIR: [108, 500, '機場', 'Airport'],
  AWE: [62, 572, '博覽館', 'AsiaWorld-Expo'],   DIS: [228, 505, '迪士尼', 'Disneyland'],
};

// lines: real MTR colours; each `run` is one drawn path in the line's
// colour so branches (Lok Ma Chau, LOHAS Park, Racecourse) don't need
// fake line ids. Entries 'ID:dx:dy' offset that rail's point.
const LN = [
  { id: 'TWL', color: '#e2231a', runs: [['TSW', 'TWH', 'KWH', 'KWF', 'LAK', 'MEF', 'LCK', 'CSW', 'SSP', 'PRE', 'MOK', 'YMT', 'JOR', 'TST:0:-3.5', 'ADM:0:-3.5', 'CEN:0:-3.5']] },
  { id: 'KTL', color: '#00ab4e', runs: [['WHA', 'HOM', 'YMT:3:0', 'MOK:3:0', 'PRE:3:0', 'SKM', 'KOT', 'LOF', 'WTS', 'DIH', 'CHH', 'KOB', 'NTK', 'KWT', 'LAT', 'YAT', 'TKL']] },
  { id: 'ISL', color: '#0071ce', runs: [['KET', 'HKU', 'SYP', 'SHW', 'CEN', 'ADM', 'WAC', 'CAB', 'TIH', 'FOH', 'NOP', 'QUB', 'TAK', 'SWH', 'SKW', 'HFC', 'CHW']] },
  { id: 'SIL', color: '#a2c614', runs: [['ADM', 'OCP', 'WCH', 'LET', 'SOH']] },
  { id: 'TKO', color: '#7d499d', runs: [
    ['NOP:0:-3.5', 'QUB:0:-3.5', 'YAT:-3:-3', 'TKL:-3:-3', 'TKW', 'HAH', 'POL'],
    ['TKL:-3:-3', 'LHP'],
  ] },
  { id: 'EAL', color: '#5eb6e4', runs: [
    ['LOW', 'SHU', 'FAN', 'TAO', 'TPM', 'UNI', 'FOT', 'SHS', 'TAW', 'KOT', 'MKE', 'HUH', 'EXC', 'ADM'],
    ['SHU', 'LMC'],
    ['FOT', 'RAC'],
  ] },
  { id: 'TML', color: '#9a3b26', runs: [['TUM', 'SIH', 'TIS', 'LOP', 'YUL', 'KSR', 'TWW', 'MEF', 'NAC', 'AUS', 'ETS', 'HUH', 'HOM', 'TOS', 'SUW', 'KAT', 'DIH', 'HIK', 'TAW', 'CKT', 'STW', 'CIO', 'SHM', 'TSH', 'HEO', 'MOS', 'WKS']] },
  { id: 'TCL', color: '#f7943e', runs: [['HOK', 'KOW', 'OLY', 'NAC', 'LAK', 'TSY', 'SUN', 'TUC']] },
  { id: 'AEX', color: '#00888a', runs: [['HOK:-3:3', 'KOW:-3:3', 'TSY:-3:3', 'AIR', 'AWE']] },
  { id: 'DRL', color: '#f550a6', runs: [['SUN', 'DIS']] },
];

// runs drawn dashed on the official map
const DASH = { RAC: 1 };

// paid-area walkway links (dotted)
const LINKS = [['CEN', 'HOK'], ['TST', 'ETS'], ['KOW', 'AUS']];

// stations constructed in the viewer -> goto target level
const BUILT = { ADM: 'ADM:L1', CEN: 'CEN:L1', HOK: 'HOK:L1', WAC: 'WAC:L1', CAB: 'CAB:L1', SHW: 'SHW:L1', SYP: 'SYP:L1', HKU: 'HKU:L1', KET: 'KET:L1', TIH: 'TIH:L1', FOH: 'FOH:L1', NOP: 'NOP:L1', QUB: 'QUB:L1', TAK: 'TAK:L1', SWH: 'SWH:L1', SKW: 'SKW:L1', HFC: 'HFC:U1', CHW: 'CHW:U1', TST: 'TST:L1', JOR: 'JOR:L1', YMT: 'YMT:L1', MOK: 'MOK:L1', PRE: 'PRE:L1', SSP: 'SSP:L1', CSW: 'CSW:L1', LCK: 'LCK:L1', MEF: 'MEF:L1', LAK: 'LAK:L1', KWF: 'KWF:GC', KWH: 'KWH:GC', TWH: 'TWH:L1', TSW: 'TSW:U1', KOW: 'KOW:L1', OLY: 'OLY:U1', OCP: 'OCP:GC', WCH: 'WCH:GC', LET: 'LET:L1', SOH: 'SOH:GC', EXC: 'EXC:L1', HUH: 'HUH:U1', MKE: 'MKE:U1', KOT: 'KOT:U1', TAW: 'TAW:GC', SKM: 'SKM:L1', LOF: 'LOF:L1', WTS: 'WTS:L1', DIH: 'DIH:L1', CHH: 'CHH:L1', KOB: 'KOB:GC', NTK: 'NTK:GC', KWT: 'KWT:GC', LAT: 'LAT:U1', YAT: 'YAT:U1', TKL: 'TKL:U1', HOM: 'HOM:L1', WHA: 'WHA:U1', TKW: 'TKW:L1', HAH: 'HAH:L1', POL: 'POL:L1', LHP: 'LHP:U1',
  SHS: 'SHS:U1', FOT: 'FOT:U1', UNI: 'UNI:U1', TPM: 'TPM:U1', TAO: 'TAO:GC', FAN: 'FAN:U1', SHU: 'SHU:U1', LOW: 'LOW:U1', LMC: 'LMC:U1',
  TSY: 'TSY:U1', SUN: 'SUN:U1', TUC: 'TUC:L1', AIR: 'AIR:U1', AWE: 'AWE:U1', DIS: 'DIS:U1',
  TUM: 'TUM:GC', SIH: 'SIH:GC', TIS: 'TIS:GC', LOP: 'LOP:GC', YUL: 'YUL:GC', KSR: 'KSR:GC',
  TWW: 'TWW:L1', NAC: 'NAC:U1', AUS: 'AUS:L1', ETS: 'ETS:L1', TOS: 'TOS:L1', SUW: 'SUW:L1',
  KAT: 'KAT:L1', HIK: 'HIK:L1', CKT: 'CKT:GC', STW: 'STW:GC', CIO: 'CIO:GC', SHM: 'SHM:GC',
  TSH: 'TSH:GC', HEO: 'HEO:GC', MOS: 'MOS:GC', WKS: 'WKS:U1' };

// label placement — [dx, dy, anchor] for the zh line; en stacks +8px
// below it. Dense corridors alternate above/below like the official map;
// termini label outward.
const LAB = {
  // Island Line — alternate above/below
  KET: [-8, 0, 'end'],   HKU: [0, -9, 'middle'], SYP: [0, 14, 'middle'],
  SHW: [0, -9, 'middle'], CEN: [-6, 14, 'end'],  ADM: [10, 16, 'middle'],
  WAC: [0, -9, 'middle'], CAB: [4, 14, 'middle'], TIH: [0, -9, 'middle'],
  FOH: [0, 14, 'middle'], NOP: [0, -11, 'middle'], QUB: [0, 14, 'middle'],
  TAK: [0, -9, 'middle'], SWH: [0, 14, 'middle'], SKW: [0, -10, 'middle'],
  HFC: [9, 0, 'start'],  CHW: [0, 14, 'middle'],
  HOK: [0, -9, 'middle'],
  // South Island
  OCP: [9, 2, 'start'],  WCH: [0, -9, 'middle'], LET: [0, 14, 'middle'],
  SOH: [-8, 0, 'end'],
  // Tsuen Wan — alternate
  TSW: [-8, 0, 'end'],   TWH: [0, 14, 'middle'], KWH: [0, -9, 'middle'],
  KWF: [0, 14, 'middle'], LAK: [0, -10, 'middle'], MEF: [0, 14, 'middle'],
  LCK: [0, -9, 'middle'], CSW: [0, 14, 'middle'], SSP: [0, -9, 'middle'],
  PRE: [0, 14, 'middle'], MOK: [9, -2, 'start'], YMT: [-9, 0, 'end'],
  JOR: [-9, 0, 'end'],   TST: [-4, 14, 'end'],
  // Kwun Tong — alternate
  WHA: [0, 14, 'middle'], HOM: [-9, -4, 'end'],  SKM: [0, -9, 'middle'],
  KOT: [0, 14, 'middle'], LOF: [0, -9, 'middle'], WTS: [0, 14, 'middle'],
  DIH: [0, -10, 'middle'], CHH: [0, 14, 'middle'], KOB: [0, -9, 'middle'],
  NTK: [0, 14, 'middle'], KWT: [0, -9, 'middle'], LAT: [0, 14, 'middle'],
  YAT: [-9, -6, 'end'],  TKL: [0, 15, 'middle'],
  // TKO
  TKW: [9, 0, 'start'],  HAH: [0, -9, 'middle'], POL: [0, -9, 'middle'],
  LHP: [9, 2, 'start'],
  // East Rail
  LOW: [0, -9, 'middle'], LMC: [-8, 0, 'end'],
  FAN: [0, -9, 'middle'], TAO: [0, 14, 'middle'], TPM: [0, -9, 'middle'],
  UNI: [0, -9, 'middle'], FOT: [-8, 0, 'end'],   RAC: [9, 0, 'start'],
  SHS: [9, 0, 'start'],  SHU: [0, 14, 'middle'], TAW: [9, -4, 'start'],  MKE: [9, -2, 'start'],
  HUH: [9, 4, 'start'],  EXC: [-8, -6, 'end'],
  // Tuen Ma — west loop
  TUM: [9, 0, 'start'],  SIH: [-9, 0, 'end'],    TIS: [0, -9, 'middle'],
  LOP: [9, 0, 'start'],  YUL: [-9, 0, 'end'],    KSR: [9, 0, 'start'],
  TWW: [0, 14, 'middle'], NAC: [0, 15, 'middle'], AUS: [0, 14, 'middle'],
  ETS: [0, -9, 'middle'], TOS: [0, -9, 'middle'], SUW: [0, 14, 'middle'],
  KAT: [0, -9, 'middle'], HIK: [-9, 0, 'end'],   CKT: [9, 0, 'start'],
  // Ma On Shan tail — alternate
  STW: [0, -9, 'middle'], CIO: [0, 14, 'middle'], SHM: [0, -9, 'middle'],
  TSH: [0, 14, 'middle'], HEO: [0, -9, 'middle'], MOS: [0, 14, 'middle'],
  WKS: [0, -9, 'middle'],
  // TCL / AEX / DRL
  KOW: [-9, -4, 'end'],  OLY: [-8, -4, 'end'],   TSY: [0, -10, 'middle'],
  SUN: [0, -9, 'middle'], TUC: [9, -2, 'start'], AIR: [9, 0, 'start'],
  AWE: [9, -2, 'start'], DIS: [9, 0, 'start'],
};

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

// parse 'ID' or 'ID:dx:dy' → [id, dx, dy]
const pt = s => { const [id, dx = 0, dy = 0] = s.split(':'); return [id, +dx, +dy]; };

// harbour + surrounding sea — soft shapes behind the rails (dark theme)
function water(g) {
  const sea = 'rgba(94,182,228,0.07)';
  // Victoria Harbour: the strait between the peninsula south shore and
  // the island north shore, widening east past Tseung Kwan O
  g.appendChild(el('path', {
    d: 'M185 498 L540 492 L630 475 L855 452 L910 460 L910 545 L185 545 Z',
    fill: sea,
  }));
  // west sea around Lantau
  g.appendChild(el('path', {
    d: 'M0 330 L200 360 L245 400 L245 680 L0 680 Z', fill: sea,
  }));
  // northeast waters
  g.appendChild(el('path', {
    d: 'M760 0 L1020 0 L1020 190 Q900 170 860 120 Z', fill: sea,
  }));
  // ghost region names, official-style
  const regions = [
    [330, 38, '深圳 Shenzhen'], [470, 170, '新界 New Territories'],
    [760, 330, '九龍 Kowloon'], [600, 600, '港島 Hong Kong Island'],
    [55, 630, '大嶼山 Lantau Island'],
  ];
  for (const [x, y, t] of regions) {
    g.appendChild(el('text', { x, y, class: 'mregion' })).textContent = t;
  }
}

// Build the schematic SVG. onGoto(uid) fires when a built station is
// clicked. All content lives in <g id="mtr-net"> so the chip thumbnail
// can <use> it — one DOM tree instead of a cloned duplicate.
export function buildMiniMap({ onGoto }) {
  const svg = el('svg', { viewBox: '0 0 1020 680', class: 'mtr-svg', role: 'img' });
  const net = el('g', { id: 'mtr-net' });
  svg.appendChild(net);

  water(net);

  // station -> line ids serving it (interchange detection; same line's
  // branch runs don't count twice)
  const used = {};
  for (const l of LN) for (const run of l.runs) {
    for (const s of run) {
      const [id] = pt(s);
      if (!(used[id] ??= []).includes(l.id)) used[id].push(l.id);
    }
  }

  // walkways behind the rails
  for (const [a, b] of LINKS) {
    const A = ST[a], B = ST[b];
    net.appendChild(el('line', {
      x1: A[0], y1: A[1], x2: B[0], y2: B[1],
      class: 'mlink',
    }));
  }

  // light rail ghost loop around Tin Shui Wai (official shows it)
  net.appendChild(el('rect', {
    x: 96, y: 96, width: 74, height: 58, rx: 8,
    class: 'mlrt',
  }));

  // line rails — each run one polyline
  for (const l of LN) {
    for (const run of l.runs) {
      const pts = run.map(s => {
        const [id, dx, dy] = pt(s);
        return `${ST[id][0] + dx},${ST[id][1] + dy}`;
      }).join(' ');
      const attrs = {
        points: pts, fill: 'none', stroke: l.color, 'stroke-width': 4,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      };
      if (run.some(s => DASH[pt(s)[0]])) {
        attrs['stroke-dasharray'] = '5 4';
        attrs.stroke = l.color;
        attrs.opacity = 0.75;
      }
      net.appendChild(el('polyline', attrs));
    }
  }

  // direction of a line at a stop (unit vector between neighbours)
  const dirAt = (l, id) => {
    for (const run of l.runs) {
      const i = run.findIndex(s => pt(s)[0] === id);
      if (i < 0) continue;
      const a = pt(run[Math.max(0, i - 1)]), b = pt(run[Math.min(run.length - 1, i + 1)]);
      const ax = ST[a[0]][0] + a[1], ay = ST[a[0]][1] + a[2];
      const bx = ST[b[0]][0] + b[1], by = ST[b[0]][1] + b[2];
      const m = Math.hypot(bx - ax, by - ay) || 1;
      return [(bx - ax) / m, (by - ay) / m];
    }
    return [1, 0];
  };

  // which line entries touch this station (for rail-offset points)
  const linesAt = id => LN.filter(l => l.runs.some(r => r.some(s => pt(s)[0] === id)));
  const offsetPt = (l, id) => {
    for (const run of l.runs) for (const s of run) {
      const [sid, dx, dy] = pt(s);
      if (sid === id) return [ST[id][0] + dx, ST[id][1] + dy];
    }
    return [ST[id][0], ST[id][1]];
  };

  // stations on top — interchange capsules cover the parallel rails
  for (const [id, [x, y, zh, en]] of Object.entries(ST)) {
    const built = BUILT[id];
    const lines = linesAt(id);
    const inter = lines.length > 1;
    const g = el('g', { class: built ? 'mst go' : 'mst' });

    if (inter) {
      // capsule through the lines' rail points (perpendicular across
      // shared corridors), or along the bisector for same-point crosses
      const p0 = offsetPt(lines[0], id), p1 = offsetPt(lines[1], id);
      let [cx, cy, ang, len] = [x, y, 0, 11];
      const ddx = p1[0] - p0[0], ddy = p1[1] - p0[1];
      if (Math.hypot(ddx, ddy) > 0.5) {
        cx = (p0[0] + p1[0]) / 2; cy = (p0[1] + p1[1]) / 2;
        ang = Math.atan2(ddy, ddx) * 180 / Math.PI;
        len = Math.hypot(ddx, ddy) + 6;
      } else {
        const u = dirAt(lines[0], id), v = dirAt(lines[1], id);
        let ax = u[0] + v[0], ay = u[1] + v[1];
        if (Math.hypot(ax, ay) < 0.3) { ax = -u[1]; ay = u[0]; }   // parallel → across
        ang = Math.atan2(ay, ax) * 180 / Math.PI;
      }
      g.appendChild(el('rect', {
        x: cx - len / 2, y: cy - 3.2, width: len, height: 6.4, rx: 3.2,
        class: 'mcap' + (built ? ' built' : ''),
        transform: `rotate(${ang.toFixed(1)} ${cx} ${cy})`,
      }));
    } else {
      g.appendChild(el('circle', {
        cx: x, cy: y, r: 3.1, class: 'mdot' + (built ? ' built' : ''),
      }));
    }
    if (built) g.appendChild(el('circle', { cx: x, cy: y, r: 8.5, class: 'pulse' }));

    const lab = LAB[id];
    if (lab) {
      const cls = built ? 'mlab built' : 'mlab';
      g.appendChild(el('text', {
        x: x + lab[0], y: y + lab[1], 'text-anchor': lab[2], class: cls + ' zh',
      })).textContent = zh;
      g.appendChild(el('text', {
        x: x + lab[0], y: y + lab[1] + 8, 'text-anchor': lab[2], class: cls + ' en',
      })).textContent = en;
    }
    g.appendChild(el('title')).textContent = built ? `${zh} ${en} — click to go` : `${zh} ${en}`;
    if (built) {
      g.style.cursor = 'pointer';
      g.addEventListener('click', e => { e.stopPropagation(); onGoto(BUILT[id]); });
    }
    net.appendChild(g);
  }
  return svg;
}
