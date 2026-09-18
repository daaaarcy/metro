// Live next-train times for Admiralty (ADM) from data.gov.hk / MTR Open Data.
// https://data.gov.hk — GET /v1/transport/mtr/getSchedule.php?line=X&sta=ADM
// Returns UP/DOWN arrays of {seq,dest,plat,time,ttnt,valid,timeType}:
//   plat   — MTR platform number, matches our PLATFORMS faces (1-8)
//   time   — arrival time; for terminus services it's the DEPARTURE (timeType:'D')
// Falls back silently to the synthetic headways whenever the API is unreachable.
const API = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php';
// (line, station) pairs the live feed can serve — the API only knows real
// stations, and each returns UP/DOWN arrays keyed by platform number
const FEEDS = [
  ['TWL', 'ADM'], ['ISL', 'ADM'], ['EAL', 'ADM'], ['SIL', 'ADM'],
  ['TWL', 'CEN'], ['ISL', 'CEN'],
  ['TCL', 'HOK'], ['AEX', 'HOK'],
  ['ISL', 'WAC'], ['ISL', 'CAB'], ['ISL', 'SHW'], ['ISL', 'SYP'], ['ISL', 'HKU'], ['ISL', 'KET'],
  ['ISL', 'TIH'], ['ISL', 'FOH'], ['ISL', 'NOP'], ['TKO', 'NOP'],
  ['ISL', 'QUB'], ['TKO', 'QUB'], ['ISL', 'TAK'], ['ISL', 'SWH'], ['ISL', 'SKW'], ['ISL', 'HFC'],
  ['ISL', 'CHW'],
  ['TWL', 'TST'],
  ['TWL', 'JOR'],
  ['TWL', 'YMT'], ['KTL', 'YMT'],
  ['TWL', 'MOK'], ['KTL', 'MOK'],
  ['TWL', 'PRE'], ['KTL', 'PRE'],
  ['TWL', 'SSP'],
  ['TWL', 'CSW'],
  ['TWL', 'LCK'],
  ['TWL', 'MEF'], ['TML', 'MEF'],
  ['TWL', 'LAK'], ['TCL', 'LAK'],
  ['TWL', 'KWF'],
  ['TWL', 'KWH'],
  ['TWL', 'TWH'],
  ['TWL', 'TSW'],
  ['TCL', 'KOW'], ['AEX', 'KOW'],
  ['TCL', 'OLY'],
  ['SIL', 'OCP'],
  ['SIL', 'WCH'],
  ['SIL', 'LET'],
  ['SIL', 'SOH'],
  ['EAL', 'EXC'],
  ['EAL', 'HUH'],
  ['EAL', 'MKE'],
  ['EAL', 'KOT'],
  ['EAL', 'TAW'],
];
const POLL_S = 45;

export class Timetable {
  constructor() {
    this.byPlat = {};   // 'ADM:1'..'HOK:4' -> sorted [epochMs]
    this.live = false;
    this.timer = 2;     // first fetch shortly after load
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = POLL_S; this.refresh(); }
  }

  async refresh() {
    const out = {};
    await Promise.all(FEEDS.map(async ([line, stn]) => {
      try {
        const r = await fetch(`${API}?line=${line}&sta=${stn}`);
        if (!r.ok) return;
        const d = (await r.json()).data?.[`${line}-${stn}`];
        for (const dir of ['UP', 'DOWN']) {
          for (const e of d?.[dir] || []) {
            if (e.valid !== 'Y') continue;
            const t = new Date(e.time.replace(' ', 'T') + '+08:00').getTime();
            if (Number.isFinite(t)) (out[`${stn}:${e.plat}`] ??= []).push(t);
          }
        }
      } catch { /* offline / blocked — keep whatever we already had */ }
    }));
    const now = Date.now();
    for (const k of Object.keys(out)) {
      out[k] = out[k].filter(t => t > now - 20000).sort((a, b) => a - b);
      if (!out[k].length) delete out[k];
    }
    if (Object.keys(out).length) { this.byPlat = out; this.live = true; }
  }

  // next scheduled event (arrival, or departure for termini) for a platform,
  // skipping anything already consumed (`after`) or too far in the past.
  // Stations/lines the feed doesn't cover get null → synthetic headways.
  next(stn, plat, after = 0) {
    const min = Math.max(Date.now() - 20000, after);
    return (this.byPlat[`${stn}:${plat}`] || []).find(t => t > min) ?? null;
  }
}
