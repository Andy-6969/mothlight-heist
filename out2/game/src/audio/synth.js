// Every sound is synthesised with Web Audio: a low canal-night pulse that tightens with the
// alarm, and short cues for steps, picks, bells, smoke, loot, alerts and the getaway.

let ctx = null;
let master = null;
let music = null;

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  startMusic();
}

function tone(freq, dur, { type = 'sine', vol = 0.2, slide = 0, delay = 0 } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const gn = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  gn.gain.setValueAtTime(0.0001, t0);
  gn.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol = 0.2, cutoff = 1800) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const gn = ctx.createGain();
  gn.gain.value = vol;
  src.connect(f).connect(gn).connect(master);
  src.start();
}

const CUES = {
  step: () => noiseBurst(0.05, 0.05, 600),
  tick: () => tone(1800, 0.03, { type: 'square', vol: 0.04 }),
  unlock: () => { tone(900, 0.06, { type: 'square', vol: 0.08 }); tone(1350, 0.1, { type: 'square', vol: 0.06, delay: 0.07 }); },
  bell: () => { tone(1320, 0.9, { vol: 0.15 }); tone(1980, 0.6, { vol: 0.06 }); },
  smoke: () => noiseBurst(0.7, 0.18, 900),
  loop: () => tone(400, 0.25, { type: 'sawtooth', vol: 0.06, slide: 400 }),
  loot: () => { tone(988, 0.08, { type: 'triangle', vol: 0.15 }); tone(1319, 0.16, { type: 'triangle', vol: 0.12, delay: 0.08 }); },
  target: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.14, delay: i * 0.09 })),
  smash: () => { noiseBurst(0.4, 0.35, 5000); tone(2400, 0.2, { vol: 0.05, slide: -1200 }); },
  laser: () => tone(1500, 0.5, { type: 'sawtooth', vol: 0.1, slide: -900 }),
  alert: () => { tone(660, 0.12, { type: 'square', vol: 0.12 }); tone(880, 0.18, { type: 'square', vol: 0.12, delay: 0.12 }); },
  caught: () => [440, 370, 311, 220].forEach((f, i) => tone(f, 0.3, { type: 'sawtooth', vol: 0.1, delay: i * 0.12 })),
  lockdown: () => [300, 300, 300].forEach((f, i) => tone(f, 0.25, { type: 'square', vol: 0.12, delay: i * 0.3 })),
  escaped: () => [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.4, { type: 'triangle', vol: 0.14, delay: i * 0.1 })),
  deny: () => tone(160, 0.15, { type: 'square', vol: 0.08 }),
  ui: () => tone(700, 0.05, { type: 'triangle', vol: 0.08 }),
};

export function playCue(name) {
  if (CUES[name]) CUES[name]();
}

/** The music: a plucked bass walk and a ticking hat; tension 0..1 speeds and darkens it. */
function startMusic() {
  music = { tension: 0, next: ctx.currentTime + 0.1, step: 0 };
  const bass = [55, 55, 65.4, 49, 55, 73.4, 65.4, 49];
  const tick = () => {
    if (!ctx) return;
    while (music.next < ctx.currentTime + 0.2) {
      const beat = 0.42 - music.tension * 0.16;
      const s = music.step++;
      const f = bass[s % bass.length] * (music.tension > 0.66 ? 1.06 : 1);
      if (s % 2 === 0) tone(f, beat * 1.6, { type: 'triangle', vol: 0.09, delay: music.next - ctx.currentTime });
      if (music.tension > 0.3 || s % 4 === 3) tone(6000, 0.02, { type: 'square', vol: 0.015 + music.tension * 0.02, delay: music.next - ctx.currentTime });
      if (s % 16 === 0) tone(f * 4, beat * 6, { vol: 0.025, delay: music.next - ctx.currentTime });
      music.next += beat / 2;
    }
  };
  setInterval(tick, 60);
}

export function setTension(t) {
  if (music) music.tension = Math.max(0, Math.min(1, t));
}
