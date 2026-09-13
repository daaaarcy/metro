// Live next-train times for Admiralty (ADM) from data.gov.hk / MTR Open Data.
// https://data.gov.hk — GET /v1/transport/mtr/getSchedule.php?line=X&sta=ADM
// Returns UP/DOWN arrays of {seq,dest,plat,time,ttnt,valid,timeType}:
//   plat   — MTR platform number, matches our PLATFORMS faces (1-8)
//   time   — arrival time; for terminus services it's the DEPARTURE (timeType:'D')
// Falls back silently to the synthetic headways whenever the API is unreachable.
const API = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php';
const LINES_API = ['TWL', 'ISL', 'EAL', 'SIL'];
const POLL_S = 45;

export class Timetable {
  constructor() {
    this.byPlat = {};   // '1'..'8' -> sorted [epochMs]
    this.live = false;
    this.timer = 2;     // first fetch shortly after load
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = POLL_S; this.refresh(); }
  }

  async refresh() {
    const out = {};
    await Promise.all(LINES_API.map(async line => {
      try {
        const r = await fetch(`${API}?line=${line}&sta=ADM`);
        if (!r.ok) return;
        const d = (await r.json()).data?.[`${line}-ADM`];
        for (const dir of ['UP', 'DOWN']) {
          for (const e of d?.[dir] || []) {
            if (e.valid !== 'Y') continue;
            const t = new Date(e.time.replace(' ', 'T') + '+08:00').getTime();
            if (Number.isFinite(t)) (out[e.plat] ??= []).push(t);
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
  // skipping anything already consumed (`after`) or too far in the past
  next(plat, after = 0) {
    const min = Math.max(Date.now() - 20000, after);
    return (this.byPlat[String(plat)] || []).find(t => t > min) ?? null;
  }
}
