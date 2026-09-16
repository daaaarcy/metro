// Station audio: generated WebAudio FX + speechSynthesis announcements.
// Everything is gated behind `enabled` — browsers require a user gesture first.
import { LINES } from './station-data.js';

const pick = arr => arr[(Math.random() * arr.length) | 0];

export class StationAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.voices = [];
    this._amb = null;
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => { this.voices = speechSynthesis.getVoices(); };
      this.voices = speechSynthesis.getVoices();
    }
  }

  enable() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._startAmbience();
    }
    this.ctx.resume();
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.ctx?.suspend();
    speechSynthesis?.cancel();
  }

  _startAmbience() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {           // brown-ish noise → HVAC rumble
      last = (last + (Math.random() * 2 - 1) * 0.04) * 0.985;
      d[i] = last * 3;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 240;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    src.connect(lp).connect(gain).connect(ctx.destination);
    src.start();
    this._amb = gain;

    // rain hiss — white noise through a bandpass, gain driven by live weather
    const buf2 = ctx.createBuffer(1, len, ctx.sampleRate);
    const d2 = buf2.getChannelData(0);
    for (let i = 0; i < len; i++) d2[i] = Math.random() * 2 - 1;
    const rsrc = ctx.createBufferSource();
    rsrc.buffer = buf2; rsrc.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.35;
    const rg = ctx.createGain();
    rg.gain.value = 0;
    rsrc.connect(bp).connect(rg).connect(ctx.destination);
    rsrc.start();
    this._rain = rg;
    this._startCrowd();
  }

  // crowd murmur — bandpassed noise beds whose gains wobble at speech-ish
  // rates, so a group of passengers reads as indistinct chatter
  _startCrowd() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    this._crowd = ctx.createGain();
    this._crowd.gain.value = 0;
    for (const [f, lfo] of [[390, 2.3], [640, 3.7], [980, 5.3]]) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.2;
      const g = ctx.createGain(); g.gain.value = 0.22;
      const osc = ctx.createOscillator();
      osc.frequency.value = lfo;
      const og = ctx.createGain(); og.gain.value = 0.16;
      osc.connect(og).connect(g.gain);
      src.connect(bp).connect(g).connect(this._crowd);
      osc.start();
    }
    this._crowd.connect(ctx.destination);
    src.start();
  }

  // k = crowd density 0..1 near the listener (call each frame)
  setCrowd(k) {
    if (this._crowd) this._crowd.gain.value = k * 0.05;
  }

  // k = rain intensity 0..1 (call each frame; no-op until audio is enabled)
  setRain(k) {
    if (this._rain) this._rain.gain.value = k * 0.055;
  }

  // the player's ear — call each frame with a world position
  setListener(pos) { this._lis = pos; }

  // Volume factor for a sound emitted at world `pos`: full within 15 m,
  // fading to a murmur at 60 m, inaudible beyond (another station's PA
  // never reaches you). pos.y may be omitted → treated as same height.
  _audible(pos) {
    if (!pos || !this._lis) return 1;
    const d = Math.hypot(pos.x - this._lis.x, (pos.y ?? this._lis.y) - this._lis.y, pos.z - this._lis.z);
    if (d > 60) return -1;
    return d < 15 ? 1 : 1 - (d - 15) / 45 * 0.85;
  }

  _tone(freq, t0, dur, type = 'sine', vol = 0.18) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  octopusBeep(pos) {
    if (!this.enabled || !this.ctx) return;
    const v = this._audible(pos);
    if (v < 0) return;
    const t = this.ctx.currentTime;
    this._tone(1250, t, 0.07, 'square', 0.12 * v);
    this._tone(1680, t + 0.09, 0.09, 'square', 0.12 * v);
  }

  doorChime(pos) {
    if (!this.enabled || !this.ctx) return;
    const v = this._audible(pos);
    if (v < 0) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      this._tone(880, t + i * 0.22, 0.16, 'sine', 0.14 * v);
      this._tone(660, t + i * 0.22 + 0.02, 0.16, 'sine', 0.1 * v);
    }
  }

  _speak(text, lang, vol = 1) {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = this.voices.find(v => v.lang === lang) ||
              this.voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
              this.voices.find(v => v.lang.startsWith('zh'));
    if (v) u.voice = v;
    u.rate = lang.startsWith('zh') ? 1.05 : 1.0;
    u.volume = 0.9 * vol;
    speechSynthesis.speak(u);
  }

  announce(zh, en, cmn, pos) {
    if (!this.enabled) return;
    const vol = this._audible(pos);
    if (vol < 0) return;
    // drop the PA rather than let several platforms' messages pile up —
    // but Chrome can wedge `pending` true forever; clear it if it's stuck
    if (speechSynthesis.pending) {
      if (this._pendingSince && performance.now() - this._pendingSince > 6000) {
        speechSynthesis.cancel();
        this._pendingSince = 0;
      } else {
        this._pendingSince ??= performance.now();
        return;
      }
    } else this._pendingSince = 0;
    this._speak(zh, 'zh-HK', vol);
    this._speak(en, 'en-HK', vol);
    if (cmn) this._speak(cmn, 'zh-CN', vol);   // MTR order: Cantonese, English, Mandarin
  }

  // Per-platform PA keyed to the service's route + platform number, with a
  // few phrasings so consecutive trains don't sound identical.
  announceArrive(face, pos) {
    if (Math.random() < 0.15) return;
    const dZh = face.to.zh.replace(/^往/, ''), dEn = face.to.en.replace(/^to /, '');
    const ln = LINES[face.line];
    this.announce(...pick([
      [`前往${dZh}的列車即將到達`, `The train to ${dEn} is arriving`, `前往${dZh}的列车即将到达`],
      [`往${dZh}列車即將進入${face.num}號月台`, `The train to ${dEn} is approaching platform ${face.num}`, `开往${dZh}的列车即将进入${face.num}号月台`],
      [`${ln.zh}往${dZh}方向的列車即將到站`, `A ${ln.en} train bound for ${dEn} is now arriving`, `${ln.zh}开往${dZh}方向的列车即将到站`],
    ]), pos);
  }

  // mid-dwell: alighting / mind-the-gap messages, line-specific terminus flavour
  announceDwell(face, pos) {
    if (Math.random() < 0.45) return;
    const dZh = face.to.zh.replace(/^往/, ''), dEn = face.to.en.replace(/^to /, '');
    this.announce(...pick([
      ['請先讓乘客落車', 'Please let passengers alight first', '请让乘客先下车'],
      ['請小心月台與車廂之間的空隙', 'Please mind the gap between the train and the platform', '请小心月台与车厢之间的空隙'],
      [`本班列車前往${dZh}，請先落後上`, `This train is for ${dEn}. Please let passengers exit before boarding`, `本班列车前往${dZh}，请先下后上`],
    ]), pos);
  }

  announceDepart(face, pos) {
    const dZh = face.to.zh.replace(/^往/, ''), dEn = face.to.en.replace(/^to /, '');
    this.announce(...pick([
      ['請勿靠近車門', 'Please stand back from the train doors', '请勿靠近车门'],
      [`往${dZh}列車即將開出，請勿靠近車門`, `The train to ${dEn} is about to depart. Please stand back from the doors`, `开往${dZh}的列车即将开出，请勿靠近车门`],
      ['車門即將關閉', 'The train doors are closing', '车门即将关闭'],
    ]), pos);
  }
}
