import * as THREE from 'three';
import { LEVELS, LINES, STATIONS, BOXES, PLATFORMS, boxToWorld } from './station-data.js';

// Per-level interior viewpoints (world space) — a standing-height spot near
// one end of each box looking down its length. Single-track platform levels
// put the camera on the platform side, not over the trough. Bridges bespoke.
function viewpoints() {
  const eye = 1.7;
  const v = {};
  for (const lvl of LEVELS) {
    if (lvl.type === 'bridge') {
      v[lvl.uid] = { pos: new THREE.Vector3(-70, 9.6, -36), look: new THREE.Vector3(60, 8, -36) };
      continue;
    }
    const bx = BOXES[lvl.box];
    const spec = PLATFORMS[lvl.uid];
    const zs = spec?.kind === 'single' ? spec.single.side : -1;
    const e = boxToWorld(bx, bx.len / 2 - 16, zs * bx.wid / 5);
    const t = boxToWorld(bx, -bx.len / 3, zs * bx.wid / 7);
    v[lvl.uid] = { pos: new THREE.Vector3(e.x, lvl.y + eye, e.z), look: new THREE.Vector3(t.x, lvl.y - 0.5, t.z) };
  }
  return v;
}

export function buildUI({ onMode, onClip, onGoto, onLabels, onAudio, onPeople, onSpeed }) {
  const vp = viewpoints();

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

  // level list grouped by station, jump-to viewpoint per level
  const list = document.getElementById('level-list');
  let lastStn = null;
  for (const lvl of LEVELS) {
    if (lvl.station !== lastStn) {
      lastStn = lvl.station;
      const stn = STATIONS[lastStn];
      const head = document.createElement('div');
      head.className = 'lvl-stn';
      head.textContent = `${stn.zh} ${stn.en}`;
      list.appendChild(head);
    }
    const row = document.createElement('div');
    row.className = 'lvl-row';
    row.innerHTML = `
      <span class="lvl-id">${lvl.id}</span>
      <span class="lvl-name">${lvl.zh} ${lvl.en}</span>
      <button class="go" data-id="${lvl.uid}">go</button>`;
    list.appendChild(row);
    row.querySelector('.go').addEventListener('click', () => onGoto(lvl.uid, vp[lvl.uid]));
  }

  // line legend
  const legend = document.getElementById('legend');
  for (const l of Object.values(LINES)) {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `<span class="legend-swatch" style="background:${l.color}"></span>${l.zh} ${l.en}`;
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
    if (e.code === 'KeyH' && !e.repeat) setPanel(panel.classList.contains('hidden'));
  });
}

export function showInfo(html) {
  const el = document.getElementById('info');
  if (!html) { el.classList.remove('show'); return; }
  el.innerHTML = html;
  el.classList.add('show');
}

export function showPrompt(html) {
  const el = document.getElementById('prompt');
  if (!html) { el.classList.remove('show'); return; }
  el.innerHTML = html;
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
  document.getElementById('clock-date').textContent =
    `${hktDay.format(epochMs)} · HKT 香港時間${speed !== 1 ? ` ×${speed}` : ''}`;
}

// live departures board, top-right — real next-train countdowns when the
// data.gov.hk feed is up, sim ETAs otherwise. One row per platform face.
export function updateTicker(rows, live, simNow) {
  const el = document.getElementById('ticker');
  const label = { away: '—', arrive: '進站 arriving', dwell: '上落客 boarding', depart: '離站 departing' };
  let html = live
    ? `<div class="t-row t-live"><span class="live-dot"></span>實時到站 LIVE · data.gov.hk</div>`
    : '';
  for (const r of rows) {
    const f = r.face;
    const stn = STATIONS[r.ds.level.split(':')[0]];
    let state = label[r.state];
    if (r.state === 'away') {
      if (r.nextAt) {
        const m = Math.round((r.nextAt - Date.now()) / 60000);
        state = m <= 0 ? '即將 due' : r.terminus ? `開出 dep ${m} min` : `${m} min`;
      } else if (r.eta != null) {
        const m = Math.max(1, Math.round(r.eta / 60));
        state = r.eta < 45 ? '即將 due' : `~${m} min`;
      }
    }
    html += `<div class="t-row"><span class="t-stn">${stn.id}</span>` +
            `<span class="t-plat" style="color:${r.color}">${f.num}</span>` +
            `<span class="t-dest">${f.to.zh} ${f.to.en}</span>` +
            `<span class="t-state">${state}</span></div>`;
  }
  el.innerHTML = html;
}

// live Hong Kong weather chip under the ticker (HKO open data)
export function updateWeatherChip(w) {
  const el = document.getElementById('weather');
  if (!el) return;
  if (!w?.live) {
    el.innerHTML = `<span class="w-off">香港天氣 offline</span>`;
    return;
  }
  const bits = [
    w.tempC != null ? `${Math.round(w.tempC)}°C` : null,
    w.rh != null ? `${Math.round(w.rh)}%` : null,
    `${w.zh} ${w.en}`,
  ].filter(Boolean);
  el.innerHTML = `<span class="w-dot ${w.kind}"></span>香港 ${bits.join(' · ')}`;
}
