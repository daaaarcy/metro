// Live Hong Kong weather for the above-ground scene.
// Polls the HKO open-data API (CORS-open) and drives sky/fog colour, the
// sun/moon, ground wetness, a rain particle system and lightning flashes.
// Day/night follows real Hong Kong time (UTC+8), not the user's clock.
import * as THREE from 'three';
import { updateWeatherChip } from './ui.js';

const API = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en';
const POLL_MS = 5 * 60 * 1000;
const HK_MS = 8 * 3600e3;

// HKO icon codes → [kind, zh, en]
const ICONS = {
  50: ['clear', '天晴', 'Sunny'],
  51: ['clear', '間晴', 'Sunny periods'],
  52: ['clear', '部分多雲', 'Sunny intervals'],
  53: ['drizzle', '間晴驟雨', 'Few showers'],
  54: ['rain', '間中驟雨', 'Showers'],
  60: ['cloudy', '多雲', 'Cloudy'],
  61: ['overcast', '陰天', 'Overcast'],
  62: ['drizzle', '微雨', 'Light rain'],
  63: ['rain', '有雨', 'Rain'],
  64: ['storm', '大雨', 'Heavy rain'],
  65: ['storm', '雷暴', 'Thunderstorms'],
};

// sky/fog colours per kind, [day, night]
const SKY = {
  clear:    [0x6f9cc4, 0x0a1018],
  cloudy:   [0x5f6b78, 0x0a0d14],
  overcast: [0x535d68, 0x090c11],
  drizzle:  [0x4e5964, 0x090c11],
  rain:     [0x46505b, 0x080a0f],
  storm:    [0x3a434e, 0x07090c],
};
// how much of the sun gets through
const DIM = { clear: 1, cloudy: 0.7, overcast: 0.52, drizzle: 0.46, rain: 0.38, storm: 0.3 };
// rain particle count fraction per kind
const RAIN_N = { drizzle: 0.3, rain: 0.65, storm: 1 };

export class Weather {
  constructor(scene, sun, hemi, ambient, ground) {
    this.scene = scene;
    this.sun = sun; this.hemi = hemi; this.ambient = ambient;
    this.ground = ground;
    this.kind = 'clear';
    this.tempC = null; this.rh = null; this.rainMm = 0;
    this.zh = ''; this.en = '';
    this.rainAmt = 0;
    this.flash = 0;
    this._sky = new THREE.Color();
    this._c1 = new THREE.Color(); this._c2 = new THREE.Color();
    this._groundDry = ground.material.color.clone();
    this._groundWet = new THREE.Color(0x0d1117);

    // rain streaks — LineSegments, two verts per drop (head + short tail)
    const N = this.N = 2600;
    this._dropY = new Float32Array(N);
    const pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const x = (Math.random() * 2 - 1) * 170;
      const y = Math.random() * 55 + 0.5;
      const z = (Math.random() * 2 - 1) * 170;
      this._dropY[i] = y;
      pos.set([x, y, z, x, y + 1.1, z], i * 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: 0xaac4dd, transparent: true, opacity: 0, depthWrite: false,
    }));
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    scene.add(this.rain);

    this.poll();
    this._iv = setInterval(() => this.poll(), POLL_MS);
  }

  hkHour() {
    const d = new Date(Date.now() + HK_MS);   // read wall-clock fields as UTC
    return d.getUTCHours() + d.getUTCMinutes() / 60;
  }

  async poll() {
    try {
      const d = await (await fetch(API, { cache: 'no-store' })).json();
      const icon = (d.icon || [])[0] ?? 50;
      // Admiralty sits between Wan Chai and Central — take the worst of the
      // harbour-side districts so drizzle anywhere nearby still reads
      const near = ['Wan Chai', 'Central & Western District', 'Eastern District', 'Southern District'];
      this.rainMm = Math.max(0, ...(d.rainfall?.data || [])
        .filter(r => near.includes(r.place)).map(r => r.max || 0));
      const t = (d.temperature?.data || []).find(r => r.place === 'Hong Kong Observatory')
        || (d.temperature?.data || [])[0];
      this.tempC = t?.value ?? null;
      this.rh = d.humidity?.data?.[0]?.value ?? null;
      const rec = ICONS[icon] || (icon >= 80 ? ['overcast', '有霧', 'Misty'] : ['cloudy', '—', '—']);
      let kind = rec[0];
      if (this.rainMm >= 2) kind = 'storm';
      else if (this.rainMm > 0.05 && !RAIN_N[kind]) kind = 'rain';
      this.kind = kind;
      this.zh = rec[1]; this.en = rec[2];
      this.icon = icon;
      this.live = true;
      updateWeatherChip(this);
    } catch {
      this.live = false;
      updateWeatherChip(this);
    }
  }

  update(dt, t) {
    const h = this.hkHour();
    // schematic solar path: rise 06:00, set ~19:12 (HK average)
    const az = Math.PI * (h - 6) / 13.2;
    const dayK = THREE.MathUtils.clamp(Math.sin(az), 0, 1);
    const dim = DIM[this.kind] || 0.7;
    const dusk = 1 - THREE.MathUtils.clamp(Math.sin(az) / 0.35, 0, 1); // 1 near rise/set

    // sky + fog
    const [cd, cn] = SKY[this.kind] || SKY.clear;
    this._sky.set(cn).lerp(this._c1.set(cd), dayK);
    this.scene.background.copy(this._sky);
    this.scene.fog.color.copy(this._sky);

    // sun rides the sky dome by day; a dim bluish "moon" by night
    if (dayK > 0.02) {
      this.sun.position.set(-Math.cos(az) * 170, Math.sin(az) * 180 + 20, Math.sin(az) * 70 + 40);
      this.sun.intensity = 1.75 * dayK * dim + this.flash * 4;
      this._c1.set(0xffc890); this._c2.set(0xfff3e2);   // warm low sun → white noon
      this.sun.color.copy(this._c2).lerp(this._c1, dusk * 0.85);
    } else {
      this.sun.position.set(70, 150, -90);
      this.sun.intensity = (this.kind === 'clear' ? 0.14 : 0.07) + this.flash * 4;
      this.sun.color.set(0x8ea4c8);
    }
    this.hemi.intensity = 0.7 + 0.85 * dayK * dim;
    this.ambient.intensity = 0.85 + 0.2 * dayK * dim;

    // thunderstorm lightning: occasional flash on the sun light
    if (this.kind === 'storm' && Math.random() < dt * 0.12) this.flash = 1;
    this.flash = Math.max(0, this.flash - dt * 5);

    // rain particles — eased in/out so drizzle doesn't pop
    const target = RAIN_N[this.kind] || 0;
    this.rainAmt += (target - this.rainAmt) * Math.min(1, dt / 3);
    const on = this.rainAmt > 0.02;
    this.rain.visible = on;
    if (on) {
      const a = this.rain.geometry.attributes.position.array;
      const fall = (14 + 14 * this.rainAmt) * dt;
      const drift = dt * 1.6;                    // slight breeze
      const tail = 0.9 + this.rainAmt * 0.9;     // heavier rain → longer streaks
      for (let i = 0; i < this.N; i++) {
        let y = this._dropY[i] - fall;
        let x = a[i * 6] + drift;
        let z = a[i * 6 + 2];
        if (y < 0) {
          y = 52 + Math.random() * 6;
          x = (Math.random() * 2 - 1) * 170;
          z = (Math.random() * 2 - 1) * 170;
        }
        if (x > 170) x -= 340;
        this._dropY[i] = y;
        a[i * 6] = x; a[i * 6 + 1] = y; a[i * 6 + 2] = z;
        a[i * 6 + 3] = x; a[i * 6 + 4] = y + tail; a[i * 6 + 5] = z;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
      this.rain.geometry.setDrawRange(0, Math.floor(this.N * this.rainAmt) * 2);
      this.rain.material.opacity = 0.55;
    }

    // wet pavement — darker + glossier as rain builds
    const wet = Math.min(1, this.rainAmt * 1.4);
    this.ground.material.color.copy(this._groundDry).lerp(this._groundWet, wet);
    this.ground.material.roughness = 1 - wet * 0.55;
    this.ground.material.metalness = wet * 0.18;
  }
}
