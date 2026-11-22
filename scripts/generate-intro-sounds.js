/**
 * Generates the original, royalty-free sounds of the "Pelvik taban kasın nerede?" animation into
 * assets/sounds/intro/*.wav (22.05 kHz, mono, 16 bit). Run: node scripts/generate-intro-sounds.js
 *
 * - ambient: a soft, slowly breathing pad (A major), 10 s, loops without a seam.
 * (Contraction, hold and release have no sound: tones there read as an alarm, filtered noise as a broom.)
 * - tick: a short soft click for each cross in scene 7 (not an alarm).
 * - chime: a small bell when the closing button appears.
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const TAU = 2 * Math.PI;
const n = (ms) => Math.round((ms / 1000) * RATE);
/** Short fade at both ends so no sound starts or stops with a click. */
function edges(s, ms = 25) {
  const k = Math.min(n(ms), Math.floor(s.length / 2));
  for (let i = 0; i < k; i++) {
    s[i] *= i / k;
    s[s.length - 1 - i] *= i / k;
  }
  return s;
}

function ambient() {
  // Every frequency makes a whole number of cycles in 10 s, so the loop point is seamless.
  const ms = 10000;
  const len = n(ms);
  const out = new Float32Array(len);
  const notes = [
    [110, 0.34],
    [165, 0.22],
    [220, 0.2],
    [277, 0.12],
    [330, 0.08],
  ];
  for (let i = 0; i < len; i++) {
    const s = i / RATE;
    let v = 0;
    notes.forEach(([f, g], k) => {
      // each note breathes on its own slow cycle (0.1 / 0.2 / 0.3 Hz)
      const lfo = 0.65 + 0.35 * Math.sin(TAU * 0.1 * (1 + (k % 3)) * s + k);
      v += Math.sin(TAU * f * s) * g * lfo;
    });
    out[i] = v * 0.16;
  }
  return out;
}

const sounds = {
  ambient: ambient(),
  tick: (() => {
    const len = n(90);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const s = i / RATE;
      out[i] = (Math.sin(TAU * 1250 * s) * 0.7 + Math.sin(TAU * 2500 * s) * 0.3) * Math.exp(-s * 55) * 0.28;
    }
    return edges(out, 3);
  })(),
  chime: (() => {
    const len = n(1800);
    const out = new Float32Array(len);
    const partials = [
      [784, 1, 2.6],
      [1176, 0.45, 3.4],
      [1568, 0.25, 4.5],
      [2352, 0.1, 6],
    ];
    for (let i = 0; i < len; i++) {
      const s = i / RATE;
      let v = 0;
      for (const [f, g, d] of partials) v += Math.sin(TAU * f * s) * g * Math.exp(-s * d);
      out[i] = v * 0.17;
    }
    return edges(out, 4);
  })(),
};

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

/** Loudness (RMS) of a stretch of samples. */
function rms(s, from = 0, to = s.length) {
  let sum = 0;
  for (let i = from; i < to; i++) sum += s[i] * s[i];
  return Math.sqrt(sum / Math.max(1, to - from));
}

const out = path.join(__dirname, '..', 'assets', 'sounds', 'intro');
fs.mkdirSync(out, { recursive: true });
for (const [name, s] of Object.entries(sounds)) {
  let peak = 0;
  for (const v of s) peak = Math.max(peak, Math.abs(v));
  fs.writeFileSync(path.join(out, `${name}.wav`), wav(s));
  console.log(`assets/sounds/intro/${name}.wav  ${(s.length / RATE).toFixed(2)} s  peak ${peak.toFixed(2)}  rms ${rms(s).toFixed(3)}  start ${rms(s, 0, Math.min(s.length, n(300))).toFixed(3)}  end ${rms(s, Math.max(0, s.length - n(300))).toFixed(3)}`);
}
