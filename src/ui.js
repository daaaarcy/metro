import * as THREE from 'three';
import { LEVELS, LINES, STATIONS, BOXES, PLATFORMS, boxToWorld, SIDE_TRACK_Z, BED_HALF } from './station-data.js';
import { resolveRoutes, zonesWithRoutes } from './bus/bus-data.js';
import { buildMiniMap } from './mtr-map.js';

// Per-level interior viewpoints (world space) — a standing-height spot near
// one end of each box looking down its length. Single-track platform levels
// put the camera on the platform side, not over the trough. Bridges bespoke.
// Candidate spots are probed with floorAt so 'go' never drops the player
// into a track trough or an escalator well — falls back to the nominal
// spot when nothing probes clean.
function viewpoints(floorAt, free) {
  const eye = 1.7;
  const v = {};
  // first candidate whose floor is at (not far under) the level's slab
  // and whose body capsule doesn't intersect a solid
  const pick = (bx, cands, y) => {
    for (const [lx, lz] of cands) {
      const w = boxToWorld(bx, lx, lz);
      const fl = floorAt?.(w.x, w.z, y + eye);
      if (!fl || fl.y <= y - 0.55 || fl.y >= y + 1.6) continue;
      if (free && !free(w.x, w.z, fl.y)) continue;
      return { w, lz };
    }
    const [lx, lz] = cands[0];
    return { w: boxToWorld(bx, lx, lz), lz };
  };
  for (const lvl of LEVELS) {
    if (lvl.type === 'bridge') {
      v[lvl.uid] = { pos: new THREE.Vector3(-70, 9.6, -36), look: new THREE.Vector3(60, 8, -36) };
      continue;
    }
    const bx = BOXES[lvl.box];
    // street levels (G — ground or check-in hall): stand at the centroid
    // of the exit fan, looking toward its denser half
    const exs = lvl.id === 'G' && STATIONS[lvl.uid.split(':')[0]]?.exits;
    if (exs?.length) {
      const zr = STATIONS[lvl.uid.split(':')[0]].exitZ || 15;
      const cx = exs.reduce((s, e) => s + e.x, 0) / exs.length;
      const cz = exs.reduce((s, e) => s + e.side, 0) / exs.length * zr * 0.5;
      const east = exs.filter(e => e.x > cx), west = exs.filter(e => e.x <= cx);
      const far = east.length >= west.length ? east : west;
      const lx = far.reduce((s, e) => s + e.x, 0) / far.length;
      const lz = far.reduce((s, e) => s + e.side, 0) / far.length * zr * 0.8;
      const e = pick(bx, [
        [cx, cz],
        ...[0.45, 1, 1.5].flatMap(k => [[cx, cz + zr * k], [cx, cz - zr * k]]),
        ...[20, -20, 40, -40, 60, -60].flatMap(dx => [[cx + dx, cz], [cx + dx, cz + zr], [cx + dx, cz - zr]]),
      ], lvl.y);
      const t0 = boxToWorld(bx, lx, lz);
      v[lvl.uid] = {
        pos: new THREE.Vector3(e.w.x, lvl.y + eye, e.w.z),
        look: new THREE.Vector3(t0.x, lvl.y + 0.6, t0.z),
      };
      continue;
    }
    const spec = PLATFORMS[lvl.uid];
    // stand ON a platform: islands/singles sit mid-box, side platforms hug
    // the walls — the centreline there is the track trough
    const mid = (bx.wid / 2 + SIDE_TRACK_Z + BED_HALF) / 2;
    const zTry = spec?.kind === 'side'
      ? [(spec.faces?.[0]?.side ?? -1) * mid, (spec.faces?.[0]?.side ?? -1) * -mid]
      : spec?.kind === 'single'
        ? [spec.single.side * bx.wid / 5, spec.single.side * bx.wid * 0.45, -spec.single.side * mid]
        : [-bx.wid / 5, bx.wid / 5, 0];
    const xTry = [bx.len / 2 - 16, bx.len / 4, 0, -bx.len / 4, -bx.len / 2 + 16];
    const e = pick(bx, xTry.flatMap(x => zTry.map(z => [x, z])), lvl.y);
    const t = boxToWorld(bx, -bx.len / 3, e.lz * 0.8);
    v[lvl.uid] = { pos: new THREE.Vector3(e.w.x, lvl.y + eye, e.w.z), look: new THREE.Vector3(t.x, lvl.y - 0.5, t.z) };
  }
  return v;
}

export function buildUI({ onMode, onClip, onGoto, onLabels, onAudio, onPeople, onSpeed, floorAt, capsuleFree }) {
  const vp = viewpoints(floorAt, capsuleFree);

  // language toggle — flips the UI chrome between English-only and 繁中-only.
  // Pure CSS (data-lang on <html> hides the other side's spans); in-world
  // signage/labels keep both languages regardless.
  const LANG_KEY = 'adm-lang';
  const langBtns = document.querySelectorAll('#lang-toggle button');
  const search = document.getElementById('stn-search');
  const setLang = l => {
    document.documentElement.dataset.lang = l;
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === l));
    search.placeholder = l === 'zh' ? search.dataset.phZh : search.dataset.phEn;
    try { localStorage.setItem(LANG_KEY, l); } catch { /* private mode */ }
  };
  let initial = 'en';
  try {
    initial = localStorage.getItem(LANG_KEY)
      || (navigator.language?.startsWith('zh') ? 'zh' : 'en');
  } catch { /* private mode */ }
  setLang(initial);
  langBtns.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  // mode buttons
  const modeBtns = document.querySelectorAll('#mode-buttons button');
  modeBtns.forEach(b => b.addEventListener('click', () => {
    modeBtns.forEach(x => x.classList.toggle('active', x === b));
    onMode(b.dataset.mode);
  }));

  // clip axis buttons + slider — cuts only exist in the orbit view, so any
  // section interaction from walk mode switches there first
  const clipBtns = document.querySelectorAll('#clip-buttons button');
  const slider = document.getElementById('clip-slider');
  const ensureOrbit = () => {
    if (document.querySelector('#mode-buttons button.active')?.dataset.mode !== 'orbit')
      document.querySelector('#mode-buttons button[data-mode=orbit]').click();
  };
  clipBtns.forEach(b => b.addEventListener('click', () => {
    clipBtns.forEach(x => x.classList.toggle('active', x === b));
    const axis = b.dataset.clip;
    slider.disabled = axis === 'none';
    if (axis === 'none') { onClip('none', 1); return; }
    ensureOrbit();
    // a freshly-picked cut should actually cut: slider max means "full", so
    // drop it to a mid sweep; a mid-drag position is kept across axes
    if (parseFloat(slider.value) >= 1) slider.value = 0.5;
    onClip(axis, parseFloat(slider.value));
  }));
  slider.addEventListener('input', () => {
    const axis = document.querySelector('#clip-buttons button.active')?.dataset.clip;
    if (axis && axis !== 'none') { ensureOrbit(); onClip(axis, parseFloat(slider.value)); }
  });

  // level list grouped by station, alphabetically by English name — each
  // group collapses on its header, jump-to viewpoint per level. Open/closed
  // state persists. The search box filters the groups (and force-opens
  // matches) — keystrokes there must not reach the walk keys.
  const list = document.getElementById('level-list');
  list.replaceChildren();   // rebuild cleanly if buildUI ever re-runs
  const OPEN_KEY = 'adm-lvl-open';
  let savedOpen = null;
  try { savedOpen = JSON.parse(localStorage.getItem(OPEN_KEY) || 'null'); } catch { /* bad JSON */ }
  const openSet = new Set(savedOpen ?? Object.keys(STATIONS));   // default: all open
  const saveOpen = () => {
    try { localStorage.setItem(OPEN_KEY, JSON.stringify([...openSet])); } catch { /* private mode */ }
  };
  const bindGroup = (grp, key, set, save) => {
    const apply = () => grp.classList.toggle('closed', !set.has(key));
    grp.querySelector('.lvl-stn').addEventListener('click', () => {
      set.has(key) ? set.delete(key) : set.add(key);
      save(); apply();
    });
    apply();
  };
  const sorted = Object.entries(STATIONS).sort((a, b) => a[1].en.localeCompare(b[1].en));
  for (const [sid, stn] of sorted) {
    const grp = document.createElement('div');
    grp.className = 'lvl-group';
    grp.dataset.sid = sid;
    const head = document.createElement('div');
    head.className = 'lvl-stn';
    head.innerHTML = `<span class="lvl-chev">▾</span><span class="zh">${stn.zh}</span> <span class="en">${stn.en}</span>`;
    const rowsEl = document.createElement('div');
    rowsEl.className = 'lvl-rows';
    grp.append(head, rowsEl);
    list.appendChild(grp);
    bindGroup(grp, sid, openSet, saveOpen);
    for (const lvl of LEVELS.filter(l => l.station === sid)) {
      const row = document.createElement('div');
      row.className = 'lvl-row';
      row.innerHTML = `
        <span class="lvl-id">${lvl.id}</span>
        <span class="lvl-name"><span class="zh">${lvl.zh}</span> <span class="en">${lvl.en}</span></span>
        <button class="go" data-id="${lvl.uid}">go</button>`;
      rowsEl.appendChild(row);
      row.querySelector('.go').addEventListener('click', () => onGoto(lvl.uid, vp[lvl.uid]));
    }
  }

  // bus navigator — same group behaviour, one group per Citybus route with
  // its stops in calling order. 'go' lands the player on the pavement beside
  // the flag, facing the road. Groups start closed (26 routes is a wall of
  // text); open state persists separately from the metro list.
  const busList = document.getElementById('bus-list');
  const zoneById = Object.fromEntries(zonesWithRoutes().map(z => [z.id, z]));
  const BUS_OPEN_KEY = 'adm-bus-open';
  let savedBus = null;
  try { savedBus = JSON.parse(localStorage.getItem(BUS_OPEN_KEY) || 'null'); } catch { /* bad JSON */ }
  const busOpen = new Set(savedBus ?? []);   // default: all closed
  const saveBus = () => {
    try { localStorage.setItem(BUS_OPEN_KEY, JSON.stringify([...busOpen])); } catch { /* private mode */ }
  };
  const busVp = z => {
    const [kx, kz] = z.kerb, [nx, nz] = z.nv;
    return {
      pos: new THREE.Vector3(kx + nx * 3, 1.62, kz + nz * 3),
      look: new THREE.Vector3(kx + nx * 0.5, 1.35, kz + nz * 0.5),
    };
  };
  for (const r of resolveRoutes()) {
    const grp = document.createElement('div');
    grp.className = 'lvl-group';
    grp.dataset.rid = r.id;
    grp.dataset.hay = `${r.id} ${r.destA.join(' ')} ${r.destB.join(' ')}`.toLowerCase();
    const head = document.createElement('div');
    head.className = 'lvl-stn';
    head.innerHTML = `<span class="lvl-chev">▾</span><span class="bus-chip">${r.id}</span><span class="zh">${r.destA[0]} ↔ ${r.destB[0]}</span> <span class="en">${r.destA[1]} ↔ ${r.destB[1]}</span>`;
    const rowsEl = document.createElement('div');
    rowsEl.className = 'lvl-rows';
    grp.append(head, rowsEl);
    busList.appendChild(grp);
    bindGroup(grp, r.id, busOpen, saveBus);
    for (const s of r.stops) {
      const z = zoneById[s.zone];
      if (!z) continue;
      const row = document.createElement('div');
      row.className = 'lvl-row';
      row.dataset.hay = `${z.zh} ${z.en}`.toLowerCase();
      row.innerHTML = `
        <span class="lvl-id bus-dir">${s.leg === 'A' ? '▸' : '◂'}</span>
        <span class="lvl-name"><span class="zh">${z.zh}</span> <span class="en">${z.en}</span></span>
        <button class="go">go</button>`;
      rowsEl.appendChild(row);
      row.querySelector('.go').addEventListener('click', () => onGoto(s.zone, busVp(z)));
    }
  }

  // metro/bus toggle — one search box filters whichever list is showing
  const navBtns = document.querySelectorAll('#nav-mode button');
  let navMode = 'mtr';
  try { navMode = localStorage.getItem('adm-nav') || 'mtr'; } catch { /* private mode */ }
  const applySearch = () => {
    const q = search.value.trim().toLowerCase();
    if (navMode === 'bus') {
      for (const grp of busList.children) {
        const gMatch = !q || grp.dataset.hay.includes(q);
        let any = gMatch;
        for (const row of grp.querySelectorAll('.lvl-row')) {
          const m = gMatch || row.dataset.hay.includes(q);
          row.style.display = q && !m ? 'none' : '';
          any ||= m;
        }
        grp.style.display = any ? '' : 'none';
        grp.classList.toggle('closed', q ? !any : !busOpen.has(grp.dataset.rid));
      }
      return;
    }
    for (const grp of list.children) {
      const sid = grp.dataset.sid, stn = STATIONS[sid];
      const match = !q || sid.toLowerCase().includes(q)
        || stn.en.toLowerCase().includes(q) || stn.zh.includes(q);
      grp.style.display = match ? '' : 'none';
      grp.classList.toggle('closed', q ? !match : !openSet.has(sid));
    }
  };
  const setNav = m => {
    navMode = m;
    navBtns.forEach(x => x.classList.toggle('active', x.dataset.nav === m));
    list.style.display = m === 'mtr' ? '' : 'none';
    busList.style.display = m === 'bus' ? '' : 'none';
    search.dataset.phEn = m === 'bus' ? 'Search routes or stops…' : 'Search stations…';
    search.dataset.phZh = m === 'bus' ? '搜尋路綫或巴士站…' : '搜尋車站…';
    search.placeholder = document.documentElement.dataset.lang === 'zh' ? search.dataset.phZh : search.dataset.phEn;
    applySearch();
    try { localStorage.setItem('adm-nav', m); } catch { /* private mode */ }
  };
  navBtns.forEach(b => b.addEventListener('click', () => setNav(b.dataset.nav)));
  setNav(navMode);
  search.addEventListener('input', applySearch);

  // station mini-map — expandable MTR schematic; lit (built) stations
  // navigate straight to that station's concourse. Grey stops are inert.
  const mapPanel = document.getElementById('map-panel');
  const mapToggle = document.getElementById('map-toggle');
  const mapSvg = buildMiniMap({ onGoto: uid => { onGoto(uid, vp[uid]); setMap(false); } });
  document.getElementById('map-body').replaceChildren(mapSvg);
  // chip thumbnail — <use> re-renders the same #mtr-net group, so the
  // map exists once in the DOM rather than as a cloned duplicate
  const NS = 'http://www.w3.org/2000/svg';
  const thumb = document.createElementNS(NS, 'svg');
  thumb.setAttribute('viewBox', '0 0 1020 680');
  thumb.classList.add('thumb');
  thumb.style.pointerEvents = 'none';   // clicks belong to the chip button
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', '#mtr-net');
  thumb.appendChild(use);
  mapToggle.querySelector('.thumb')?.remove();
  mapToggle.appendChild(thumb);
  const setMap = show => mapPanel.classList.toggle('show', show);
  mapToggle.addEventListener('click', () => setMap(!mapPanel.classList.contains('show')));
  document.getElementById('map-close').addEventListener('click', () => setMap(false));

  // line legend
  const legend = document.getElementById('legend');
  legend.replaceChildren();
  for (const l of Object.values(LINES)) {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `<span class="legend-swatch" style="background:${l.color}"></span><span class="zh">${l.zh}</span> <span class="en">${l.en}</span>`;
    legend.appendChild(row);
  }

  document.getElementById('toggle-labels').addEventListener('change', e => onLabels(e.target.checked));
  document.getElementById('toggle-audio').addEventListener('change', e => onAudio(e.target.checked));
  document.getElementById('toggle-people').addEventListener('change', e => onPeople(e.target.checked));

  // simulation speed: 1x follows real Hong Kong time; 2/4/8 fast-forward
  const speedBtns = document.querySelectorAll('#speed-buttons button');
  speedBtns.forEach(b => b.addEventListener('click', () => {
    speedBtns.forEach(x => x.classList.toggle('active', x === b));
    onSpeed(parseFloat(b.dataset.speed));
  }));

  // collapsible sections — the h2 folds everything beneath it into a
  // .sec-body wrapper; closed state persists. Sections that are reference
  // material (section cuts, line legend) start folded.
  const SEC_KEY = 'adm-sec-closed';
  let savedSecs = null;
  try { savedSecs = JSON.parse(localStorage.getItem(SEC_KEY) || 'null'); } catch { /* bad JSON */ }
  const secClosed = new Set(savedSecs ?? ['clip-sec', 'legend-sec']);
  const saveSecs = () => {
    try { localStorage.setItem(SEC_KEY, JSON.stringify([...secClosed])); } catch { /* private mode */ }
  };
  document.querySelectorAll('#panel > section[id]').forEach(sec => {
    const h2 = sec.querySelector('h2');
    if (!h2) return;
    const body = document.createElement('div');
    body.className = 'sec-body';
    while (h2.nextSibling) body.appendChild(h2.nextSibling);
    sec.appendChild(body);
    h2.classList.add('sec-head');
    h2.insertAdjacentHTML('beforeend', '<span class="sec-chev">▾</span>');
    const apply = () => sec.classList.toggle('closed', secClosed.has(sec.id));
    h2.addEventListener('click', () => {
      secClosed.has(sec.id) ? secClosed.delete(sec.id) : secClosed.add(sec.id);
      saveSecs(); apply();
    });
    apply();
  });

  // panel collapse — the × button, the ☰ chip, or the H key
  const panel = document.getElementById('panel');
  const chip = document.getElementById('panel-open');
  const setPanel = show => {
    panel.classList.toggle('hidden', !show);
    chip.classList.toggle('show', !show);
  };
  document.getElementById('panel-close').addEventListener('click', () => setPanel(false));
  chip.addEventListener('click', () => setPanel(true));
  window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLInputElement) return;   // typing in the search box
    if (e.code === 'KeyH' && !e.repeat) setPanel(panel.classList.contains('hidden'));
  });
}

export function showInfo(html) {
  const el = document.getElementById('info');
  if (!html) { el.classList.remove('show'); return; }
  el.innerHTML = html;
  el.classList.add('show');
}

let _promptHtml = null;
export function showPrompt(html) {
  const el = document.getElementById('prompt');
  if (html === _promptHtml) return;   // called every frame — don't churn the DOM
  _promptHtml = html;
  if (!html) { el.classList.remove('show'); return; }
  el.innerHTML = html;
  el.classList.add('show');
}

// Citybus stop chip in the masthead — logo + bilingual name + route chips,
// shown while the player stands at a stop's kerb
let _busstopId = undefined;
export function showBusStop(zone) {
  const id = zone?.id ?? null;
  if (id === _busstopId) return;      // same stop (or none) — skip DOM churn
  _busstopId = id;
  const el = document.getElementById('busstop');
  if (!zone) { el.classList.remove('show'); return; }
  el.querySelector('.bs-name').innerHTML =
    `<span class="zh">${zone.zh}</span><span class="en">${zone.en}</span>`;
  const routes = zone.routes ?? [];
  el.querySelector('.bs-routes').innerHTML =
    routes.slice(0, 5).map(r => `<span class="bs-route">${r}</span>`).join('') +
    (routes.length > 5 ? `<span class="bs-route more">+${routes.length - 5}</span>` : '');
  el.classList.add('show');
}

// Hong Kong sim clock — renders the sim-time epoch in Asia/Hong_Kong so the
// station clock always reads HKT regardless of the browser's timezone, and
// fast-forwards under speed multipliers
const hktFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
const hktDay = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Hong_Kong', weekday: 'short', day: '2-digit', month: 'short',
});
export function updateClock(epochMs, speed) {
  document.getElementById('clock-time').textContent = hktFmt.format(epochMs);
  document.getElementById('clock-date').innerHTML =
    `${hktDay.format(epochMs)} · <span class="zh">香港時間</span><span class="en">HKT</span>${speed !== 1 ? ` ×${speed}` : ''}`;
}

// live departures board, top-right — real next-train countdowns when the
// data.gov.hk feed is up, sim ETAs otherwise. One row per platform face.
export function updateTicker(rows, live, simNow) {
  const el = document.getElementById('ticker');
  const pair = (zh, en) => `<span class="zh">${zh}</span><span class="en">${en}</span>`;
  const label = { away: '—', arrive: pair('進站', 'arriving'), dwell: pair('上落客', 'boarding'), depart: pair('離站', 'departing') };
  const due = pair('即將', 'due');
  let html = live
    ? `<div class="t-row t-live"><span class="live-dot"></span>${pair('實時到站 · data.gov.hk', 'LIVE · data.gov.hk')}</div>`
    : '';
  for (const r of rows) {
    const f = r.face;
    const stn = STATIONS[r.ds.level.split(':')[0]];
    let state = label[r.state];
    if (r.state === 'away') {
      if (r.nextAt) {
        const m = Math.round((r.nextAt - Date.now()) / 60000);
        state = m <= 0 ? due : r.terminus ? pair(`開出 ${m} 分`, `dep ${m} min`) : pair(`${m} 分`, `${m} min`);
      } else if (r.eta != null) {
        const m = Math.max(1, Math.round(r.eta / 60));
        state = r.eta < 45 ? due : pair(`~${m} 分`, `~${m} min`);
      }
    }
    html += `<div class="t-row"><span class="t-stn">${stn.id}</span>` +
            `<span class="t-plat" style="color:${r.color}">${f.num}</span>` +
            `<span class="t-dest"><span class="zh">${f.to.zh}</span> <span class="en">${f.to.en}</span></span>` +
            `<span class="t-state">${state}</span></div>`;
  }
  el.innerHTML = html;
}

// live Hong Kong weather chip under the ticker (HKO open data)
export function updateWeatherChip(w) {
  const el = document.getElementById('weather');
  if (!el) return;
  if (!w?.live) {
    el.innerHTML = `<span class="w-off"><span class="zh">香港天氣 離線</span><span class="en">HK weather offline</span></span>`;
    return;
  }
  const bits = [
    w.tempC != null ? `${Math.round(w.tempC)}°C` : null,
    w.rh != null ? `${Math.round(w.rh)}%` : null,
    `<span class="zh">${w.zh}</span><span class="en">${w.en}</span>`,
  ].filter(Boolean);
  el.innerHTML = `<span class="w-dot ${w.kind}"></span><span class="zh">香港</span><span class="en">HK</span> ${bits.join(' · ')}`;
}
