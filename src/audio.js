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
  }

  // k = rain intensity 0..1 (call each frame; no-op until audio is enabled)
  setRain(k) {
    if (this._rain) this._rain.gain.value = k * 0.055;
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

  octopusBeep() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._tone(1250, t, 0.07, 'square', 0.12);
    this._tone(1680, t + 0.09, 0.09, 'square', 0.12);
  }

  doorChime() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      this._tone(880, t + i * 0.22, 0.16, 'sine', 0.14);
      this._tone(660, t + i * 0.22 + 0.02, 0.16, 'sine', 0.1);
    }
  }

  _speak(text, lang) {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = this.voices.find(v => v.lang === lang) ||
              this.voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
              this.voices.find(v => v.lang.startsWith('zh'));
    if (v) u.voice = v;
    u.rate = lang.startsWith('zh') ? 1.05 : 1.0;
    u.volume = 0.9;
    speechSynthesis.speak(u);
  }

  announce(zh, en) {
    if (!this.enabled) return;
    // drop the PA rather than let several platforms' messages pile up
    if (speechSynthesis.pending) return;
    this._speak(zh, 'zh-HK');
    this._speak(en, 'en-HK');
  }

  // Per-platform PA keyed to the service's route + platform number, with a
  // few phrasings so consecutive trains don't sound identical.
  announceArrive(face) {
    if (Math.random() < 0.15) return;
    const dZh = face.to.zh.replace(/^往/, ''), dEn = face.to.en.replace(/^to /, '');
    const ln = LINES[face.line];
    this.announce(...pick([
      [`前往${dZh}的列車即將到達`, `The train to ${dEn} is arriving`],
      [`往${dZh}列車即將進入${face.num}號月台`, `The train to ${dEn} is approaching platform ${face.num}`],
      [`${ln.zh}往${dZh}方向的列車即將到站`, `A ${ln.en} train bound for ${dEn} is now arriving`],
    ]));
  }

  // mid-dwell: alighting / mind-the-gap messages, line-specific terminus flavour
  announceDwell(face) {
    if (Math.random() < 0.45) return;
    const dZh = face.to.zh.replace(/^往/, ''), dEn = face.to.en.replace(/^to /, '');
    this.announce(...pick([
      ['請先讓乘客落車', 'Please let passengers alight first'],
      ['請小心月台與車廂之間的空隙', 'Please mind the gap between the train and the platform'],
      [`本班列車前往${dZh}，請先落後上`, `This train is for ${dEn}. Please let passengers exit before boarding`],
    ]));
  }

  announceDepart(face) {
    const dZh = face.to.zh.replace(/^往/, ''), dEn = face.to.en.replace(/^to /, '');
    this.announce(...pick([
      ['請勿靠近車門', 'Please stand back from the train doors'],
      [`往${dZh}列車即將開出，請勿靠近車門`, `The train to ${dEn} is about to depart. Please stand back from the doors`],
      ['車門即將關閉', 'The train doors are closing'],
    ]));
  }
}
