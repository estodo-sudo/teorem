/**
 * Generates the app's original, royalty-free cue tones (soft sine tones with
 * smooth envelopes) into assets/sounds/*.wav. Run: node scripts/generate-tones.js
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;

function tone(segments) {
  // segments: [{ freq, ms, gain, gapMs }]
  const samples = [];
  for (const s of segments) {
    const n = Math.round((s.ms / 1000) * RATE);
    const attack = Math.min(n / 4, RATE * 0.015);
    const release = Math.min(n / 2, RATE * 0.12);
    for (let i = 0; i < n; i++) {
      let env = 1;
      if (i < attack) env = i / attack;
      else if (i > n - release) env = (n - i) / release;
      const t = i / RATE;
      const v =
        Math.sin(2 * Math.PI * s.freq * t) * 0.8 + Math.sin(2 * Math.PI * s.freq * 2 * t) * 0.12;
      samples.push(v * env * (s.gain ?? 0.5));
    }
    const gap = Math.round(((s.gapMs ?? 0) / 1000) * RATE);
    for (let i = 0; i < gap; i++) samples.push(0);
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, i * 2));
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

const out = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(out, { recursive: true });
const files = {
  contract: tone([{ freq: 660, ms: 260, gain: 0.55 }]),
  relax: tone([
    { freq: 440, ms: 120, gain: 0.4, gapMs: 70 },
    { freq: 440, ms: 120, gain: 0.4 },
  ]),
  done: tone([
    { freq: 523, ms: 140, gain: 0.45, gapMs: 30 },
    { freq: 659, ms: 140, gain: 0.45, gapMs: 30 },
    { freq: 784, ms: 320, gain: 0.5 },
  ]),
  breathe: tone([{ freq: 330, ms: 500, gain: 0.35 }]),
};
for (const [name, s] of Object.entries(files)) {
  fs.writeFileSync(path.join(out, `${name}.wav`), wav(s));
  console.log(`assets/sounds/${name}.wav`);
}
