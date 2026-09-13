import * as THREE from 'three';
import { LEVELS, LINES, BOXES, boxToWorld } from './station-data.js';

// Per-level interior viewpoints (world space).
function viewpoints() {
  const eye = 1.7;
  const ext = BOXES.ext;
  const v = {
    U1: { pos: new THREE.Vector3(-70, 9.6, -36), look: new THREE.Vector3(60, 8, -36) },
    G:  { pos: new THREE.Vector3(-30, 1.8, 26),  look: new THREE.Vector3(0, 2, -14) },
    L1: { pos: new THREE.Vector3(-21, -7 + eye, -12.3), look: new THREE.Vector3(-14, -6.6, -9.4) },
    L2: { pos: new THREE.Vector3(-70, -14 + eye, 0), look: new THREE.Vector3(60, -14.5, 0) },
    L3: { pos: new THREE.Vector3(70, -21 + eye, 0),  look: new THREE.Vector3(-60, -21.5, 0) },
    L4: { pos: new THREE.Vector3(-5, -28 + eye, 16), look: new THREE.Vector3(60, -30, 28) },
    L5: { pos: null, look: null },
    L6: { pos: null, look: null },
  };
  const e1 = boxToWorld(ext, 44, 0), t1 = boxToWorld(ext, -55, 0);
  v.L5 = { pos: new THREE.Vector3(e1.x, -35 + eye, e1.z), look: new THREE.Vector3(t1.x, -35.5, t1.z) };
  const e2 = boxToWorld(ext, -58, 10), t2 = boxToWorld(ext, 55, 6);
  v.L6 = { pos: new THREE.Vector3(e2.x, -42 + eye, e2.z), look: new THREE.Vector3(t2.x, -42.5, t2.z) };
  return v;
}

export function buildUI({ onMode, onClip, onGoto, onLabels, onAudio, onPeople }) {
  const vp = viewpoints();

  // mode buttons
  const modeBtns = document.querySelectorAll('#mode-buttons button');
  modeBtns.forEach(b => b.addEventListener('click', () => {
    modeBtns.forEach(x => x.classList.toggle('active', x === b));
    onMode(b.dataset.mode);
  }));

  // clip axis buttons + slider
  const clipBtns = document.querySelectorAll('#clip-buttons button');
  const slider = document.getElementById('clip-slider');
  clipBtns.forEach(b => b.addEventListener('click', () => {
    clipBtns.forEach(x => x.classList.toggle('active', x === b));
    const axis = b.dataset.clip;
    slider.disabled = axis === 'none';
    slider.value = 1;
    onClip(axis, 1);
  }));
  slider.addEventListener('input', () => {
    const axis = document.querySelector('#clip-buttons button.active')?.dataset.clip;
    if (axis && axis !== 'none') onClip(axis, parseFloat(slider.value));
  });

  // level list: label + jump-to viewpoint (all levels are always shown)
  const list = document.getElementById('level-list');
  for (const lvl of LEVELS) {
    const row = document.createElement('div');
    row.className = 'lvl-row';
    row.innerHTML = `
      <span class="lvl-id">${lvl.id}</span>
      <span class="lvl-name">${lvl.zh} ${lvl.en}</span>
      <button class="go" data-id="${lvl.id}">go</button>`;
    list.appendChild(row);
    row.querySelector('.go').addEventListener('click', () => onGoto(lvl.id, vp[lvl.id]));
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

// live departures board, top-right — real next-train countdowns when the
// data.gov.hk feed is up, generic states otherwise
export function updateTicker(services, live) {
  const el = document.getElementById('ticker');
  const label = { away: '—', arrive: '進站 arriving', dwell: '上落客 boarding', depart: '離站 departing' };
  let html = live
    ? `<div class="t-row t-live"><span class="live-dot"></span>實時到站 LIVE · data.gov.hk</div>`
    : '';
  for (const s of services) {
    const f = s.ds.face;
    let state = label[s.state];
    if (s.state === 'away' && s.nextAt) {
      const m = Math.round((s.nextAt - Date.now()) / 60000);
      state = m <= 0 ? '即將 due' : s.terminus ? `開出 dep ${m} min` : `${m} min`;
    }
    html += `<div class="t-row"><span class="t-plat" style="color:${s.color}">${f.num}</span>` +
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
