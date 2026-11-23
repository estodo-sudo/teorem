import type { ExerciseType, HapticStrength } from '@/types';

/**
 * Titreşim Dili v2 (SPEC_KEGEL_V2 §7.4) — pure, platform-neutral haptic events plus the converters for
 * each platform. Kept free of native imports so it can be tested.
 *
 *  squeezeStart    300 ms rising ramp 0.3 → 1.0             "pull up"
 *  holdTick        light tick (0.25) every second            count without looking
 *  holdTickFinal   stronger ticks (0.5) in the last 3 s      sense the end
 *  releaseStart    500 ms falling ramp 0.6 → 0 + soft double "let go", clearly unlike squeeze
 *  quickFlick      one sharp pulse                            rhythm
 *  elevatorFloor   1 / 2 / 3 rising pulses for floor 1 / 2 / 3
 *  knackCough      sharp double pulse                         timing
 *  blockChange     long – short                               new block
 *  sessionEnd      three rising pulses                        reward
 */
export type Cue =
  | 'squeezeStart'
  | 'holdTick'
  | 'holdTickFinal'
  | 'releaseStart'
  | 'quickFlick'
  | 'elevatorFloor1'
  | 'elevatorFloor2'
  | 'elevatorFloor3'
  | 'elevatorDown'
  | 'knackCough'
  | 'blockChange'
  | 'breatheIn'
  | 'breatheOut'
  | 'countdownTick'
  | 'sessionEnd'
  | 'tap'
  | 'slowSqueeze'
  | 'slowRelease'
  // v1 names still used by other parts of the app (fitness, mind, campuses): they keep their old feel.
  | 'contractStart'
  | 'contractTick'
  | 'relaxStart'
  | 'releaseStage'
  | 'exerciseEnd';

/** One haptic event. Times in ms; intensity and sharpness 0..1. A continuous event ramps to `intensityEnd`. */
export type HapticEvent = { type: 'transient'; time: number; intensity: number; sharpness: number } | { type: 'continuous'; time: number; duration: number; intensity: number; intensityEnd: number; sharpness: number };

const tr = (time: number, intensity: number, sharpness = 0.5): HapticEvent => ({ type: 'transient', time, intensity, sharpness });
const ramp = (time: number, duration: number, from: number, to: number, sharpness = 0.4): HapticEvent => ({ type: 'continuous', time, duration, intensity: from, intensityEnd: to, sharpness });

/** The language itself, at full strength. */
const LANGUAGE: Record<Cue, HapticEvent[]> = {
  squeezeStart: [ramp(0, 300, 0.3, 1, 0.5)],
  holdTick: [tr(0, 0.25, 0.3)],
  holdTickFinal: [tr(0, 0.5, 0.5)],
  // Slow squeeze / slow release: long, gentle ramps (clearly unlike the 300 ms squeeze).
  slowSqueeze: [ramp(0, 1200, 0.2, 1, 0.4)],
  slowRelease: [ramp(0, 1500, 0.9, 0, 0.2), tr(1600, 0.3, 0.1)],
  releaseStart: [ramp(0, 500, 0.6, 0, 0.2), tr(560, 0.3, 0.1), tr(700, 0.3, 0.1)],
  quickFlick: [tr(0, 1, 1)],
  elevatorFloor1: [tr(0, 0.6, 0.6)],
  elevatorFloor2: [tr(0, 0.7, 0.6), tr(120, 0.7, 0.6)],
  elevatorFloor3: [tr(0, 0.8, 0.6), tr(120, 0.8, 0.6), tr(240, 0.8, 0.6)],
  elevatorDown: [tr(0, 0.35, 0.2)],
  knackCough: [tr(0, 0.95, 1), tr(110, 0.95, 1)],
  blockChange: [ramp(0, 380, 0.7, 0.7, 0.4), tr(500, 0.7, 0.6)],
  breatheIn: [ramp(0, 500, 0.05, 0.3, 0.1)],
  breatheOut: [ramp(0, 600, 0.3, 0, 0.1)],
  countdownTick: [tr(0, 0.35, 0.5)],
  sessionEnd: [tr(0, 0.45, 0.6), tr(180, 0.7, 0.7), tr(360, 1, 0.8)],
  tap: [tr(0, 0.3, 0.5)],
  contractStart: [ramp(0, 400, 1, 1, 0.6)],
  contractTick: [tr(0, 0.3, 0.4)],
  relaxStart: [tr(0, 0.4, 0.3), tr(170, 0.4, 0.3)],
  releaseStage: [tr(0, 0.35, 0.3)],
  exerciseEnd: [tr(0, 0.8, 0.6), tr(170, 0.8, 0.6), tr(340, 0.8, 0.6)],
};

/**
 * Strength setting: Off / Light / Normal / Strong. Chosen so that after the app-wide boost below the
 * three are clearly apart (≈ 45 % / 75 % / 100 % of full intensity). The old 0.55 / 0.8 / 1 landed at
 * 88 / 95 / 100 % and felt the same (user report 2026-11-23).
 */
export const STRENGTH_SCALE: Record<HapticStrength, number> = { 0: 0, 1: 0.28, 2: 0.47, 3: 1 };

/**
 * App-wide boost of how strongly vibration is felt (+60 %: raised to +80 % on 2026-11-22, then a touch lower),
 * applied on top of the strength setting. Weak and medium intensities (up to 0.55) get the full +60 %;
 * above that the curve bends smoothly to full intensity at 1, so Light < Normal < Strong stays true for
 * the strongest cues too. On Android short pulses are also 60 % longer (TRANSIENT_MS).
 */
export const HAPTIC_GAIN = 1.6;
const KNEE = 0.55;
const PULSE_GAIN = 1.6;
export function boostIntensity(x: number): number {
  if (x <= 0) return 0;
  if (x <= KNEE) return x * HAPTIC_GAIN;
  const top = KNEE * HAPTIC_GAIN;
  return Math.min(1, top + ((x - KNEE) * (1 - top)) / (1 - KNEE));
}

/** Full-strength events scaled to the user's strength (empty when vibration is off). */
export function scaleEvents(events: HapticEvent[], strength: HapticStrength): HapticEvent[] {
  const k = STRENGTH_SCALE[strength];
  if (!k) return [];
  const s = (v: number) => Math.round(boostIntensity(v * k) * 1000) / 1000;
  return events.map((e) => (e.type === 'transient' ? { ...e, intensity: s(e.intensity) } : { ...e, intensity: s(e.intensity), intensityEnd: s(e.intensityEnd) }));
}

/** Events for a cue at the user's strength (empty when vibration is off). */
export function hapticEvents(cue: Cue, strength: HapticStrength): HapticEvent[] {
  return scaleEvents(LANGUAGE[cue], strength);
}

/**
 * Kegel vibration (user decision 2026-11-22): the phone vibrates for exactly as long as the muscle is
 * squeezed and stops when it lets go. Uzun sıkma = one continuous vibration for the whole hold; hızlı
 * sık-bırak = 1 s on / 1 s off; yavaş sıkma = rising while squeezing slowly, full at the top. Rest and
 * let-go phases are silent. `fromMs` = time already spent in the phase (resume after a pause).
 * Full strength; scale with `scaleEvents`.
 */
export function phaseVibration(phase: { kind: string; durationMs: number; variant?: string }, fromMs = 0): HapticEvent[] {
  if (phase.kind !== 'contract' && phase.kind !== 'cough') return [];
  const from = Math.max(0, fromMs);
  const left = Math.round(phase.durationMs - from);
  if (left < 40) return [];
  // Yavaş sıkma builds up from 30 % to full; everything else rumbles at full strength.
  const level = phase.variant === 'slowUp' ? (t: number) => 0.3 + (0.7 * Math.min(phase.durationMs, from + t)) / Math.max(1, phase.durationMs) : () => 1;
  return rumble(left, level, Math.floor(from / RUMBLE_GRAIN_MS));
}

/**
 * "Deprem gibi" (user request 2026-11-22): never off, never in separate pulses, but the strength dips
 * every few hundredths of a second — 40 ms grains whose intensity wanders between ~55 % and 100 % of
 * `level(t)` in an uneven, earthquake-like way (deterministic, so the same squeeze feels the same).
 */
export const RUMBLE_GRAIN_MS = 40;
const RUMBLE_DIPS = [1, 0.62, 0.9, 0.7, 1, 0.55, 0.85, 0.95, 0.6, 0.8, 1, 0.68, 0.88, 0.58, 0.97, 0.75];
export function rumble(durationMs: number, level: (t: number) => number = () => 1, offset = 0): HapticEvent[] {
  const out: HapticEvent[] = [];
  for (let t = 0, i = offset; t < durationMs; t += RUMBLE_GRAIN_MS, i++) {
    const d = Math.min(RUMBLE_GRAIN_MS, durationMs - t);
    if (d < 10) break;
    const a = Math.round(level(t) * RUMBLE_DIPS[i % RUMBLE_DIPS.length]! * 1000) / 1000;
    out.push({ type: 'continuous', time: t, duration: d, intensity: a, intensityEnd: a, sharpness: 0.6 });
  }
  return out;
}

/** Length of a transient pulse when it has to be played as a short vibration (Android); +30 % with the gain. */
export const TRANSIENT_MS = (sharpness: number) => Math.round((45 - 25 * sharpness) * PULSE_GAIN);
/** Ramp resolution on Android (amplitude steps). */
export const RAMP_STEP_MS = 50;

/**
 * Android `VibrationEffect.createWaveform(timings, amplitudes, -1)`: back-to-back segments with an
 * amplitude 0..255 each. Ramps become 50 ms steps; transients short pulses (sharper = shorter).
 */
export function androidWaveform(events: HapticEvent[]): { timings: number[]; amplitudes: number[] } {
  const segs: { start: number; dur: number; amp: number }[] = [];
  for (const e of events) {
    if (e.type === 'transient') segs.push({ start: e.time, dur: TRANSIENT_MS(e.sharpness), amp: e.intensity });
    else {
      const steps = Math.max(1, Math.round(e.duration / RAMP_STEP_MS));
      for (let i = 0; i < steps; i++) {
        const f = steps === 1 ? 0 : i / (steps - 1);
        segs.push({ start: e.time + (i * e.duration) / steps, dur: e.duration / steps, amp: e.intensity + (e.intensityEnd - e.intensity) * f });
      }
    }
  }
  segs.sort((a, b) => a.start - b.start);
  const timings: number[] = [];
  const amplitudes: number[] = [];
  let t = 0;
  for (const s of segs) {
    if (s.start > t) {
      timings.push(Math.round(s.start - t));
      amplitudes.push(0);
      t = s.start;
    }
    const end = Math.max(t, s.start + s.dur);
    const dur = Math.round(end - t);
    if (dur <= 0) continue;
    timings.push(dur);
    amplitudes.push(Math.max(0, Math.min(255, Math.round(s.amp * 255))));
    t = end;
  }
  // Merge equal neighbours; drop silent tails.
  const outT: number[] = [];
  const outA: number[] = [];
  timings.forEach((d, i) => {
    const a = amplitudes[i]!;
    if (outA.length && outA[outA.length - 1] === a) outT[outT.length - 1]! += d;
    else {
      outT.push(d);
      outA.push(a);
    }
  });
  while (outA.length && outA[outA.length - 1] === 0) {
    outA.pop();
    outT.pop();
  }
  return { timings: outT, amplitudes: outA };
}

/**
 * Devices without amplitude control (and the RN `Vibration` fallback): an [off, on, off, on…] pattern.
 * Intensity becomes length: a rising ramp is short pulses getting longer, a falling one the reverse,
 * so squeeze and release still feel different.
 */
const PWM_MS = 40;
/** On-share of an on/off slice for an intensity: 1 at full strength, about a third at Light. */
export const dutyFor = (intensity: number) => Math.max(0.2, Math.min(1, Math.pow(Math.min(1, intensity), 1.6)));

export function onOffPattern(events: HapticEvent[]): number[] {
  const pulses: { start: number; dur: number }[] = [];
  for (const e of events) {
    if (e.type === 'transient') pulses.push({ start: e.time, dur: Math.round(20 + 50 * e.intensity) });
    // A rumble grain (≤ 60 ms, steady): on for most of it, with a hairline gap that grows as the grain
    // weakens — on/off-only phones feel the dips without real pauses.
    else if (e.duration <= 60 && Math.abs(e.intensity - e.intensityEnd) < 0.05) pulses.push({ start: e.time, dur: Math.max(6, Math.round(e.duration * dutyFor(e.intensity))) });
    // A steady vibration: unbroken at full strength; weaker ones are chopped into short on/off slices
    // (pulse-width), so Light really feels lighter on phones that can only switch the motor on and off.
    else if (Math.abs(e.intensity - e.intensityEnd) < 0.05 && e.intensity >= 0.3) {
      const duty = dutyFor(e.intensity);
      if (duty >= 0.95) pulses.push({ start: e.time, dur: Math.round(e.duration) });
      else for (let t = 0; t < e.duration; t += PWM_MS) pulses.push({ start: e.time + t, dur: Math.max(6, Math.round(Math.min(PWM_MS, e.duration - t) * duty)) });
    }
    else {
      const n = Math.max(2, Math.round(e.duration / 110));
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1);
        const amp = e.intensity + (e.intensityEnd - e.intensity) * f;
        if (amp <= 0.02) continue;
        pulses.push({ start: e.time + (i * e.duration) / n, dur: Math.round(15 + 60 * amp) });
      }
    }
  }
  pulses.sort((a, b) => a.start - b.start);
  const out: number[] = [];
  let t = 0;
  for (const p of pulses) {
    const start = Math.max(t, Math.round(p.start));
    out.push(start - t, p.dur);
    t = start + p.dur;
  }
  return out;
}

export type IosImpact = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
/** iOS fallback without Core Haptics (Expo Go): timed expo-haptics impacts approximating the events. */
export function iosFallbackCalls(events: HapticEvent[]): { style: IosImpact; delayMs: number }[] {
  // Light / Normal / Strong (≈ 0.45 / 0.75 / 1) map to light / medium / heavy impacts.
  const style = (i: number, sharp: number): IosImpact => (sharp >= 0.9 && i >= 0.6 ? 'rigid' : i >= 0.9 ? 'heavy' : i >= 0.6 ? 'medium' : i >= 0.2 ? 'light' : 'soft');
  const out: { style: IosImpact; delayMs: number }[] = [];
  for (const e of events) {
    if (e.type === 'transient') out.push({ style: style(e.intensity, e.sharpness), delayMs: e.time });
    // A rumble grain: one impact, heavy or medium by its strength, so the rumble is uneven.
    else if (e.duration <= 60) {
      if (e.intensity > 0.05) out.push({ style: style(e.intensity, 0), delayMs: e.time });
    } else {
      const n = Math.max(2, Math.round(e.duration / 100));
      for (let i = 0; i < n; i++) {
        const amp = e.intensity + ((e.intensityEnd - e.intensity) * i) / (n - 1);
        if (amp > 0.05) out.push({ style: style(amp, e.sharpness), delayMs: Math.round(e.time + (i * e.duration) / n) });
      }
    }
  }
  return out.sort((a, b) => a.delayMs - b.delayMs);
}

/** Total length of a cue (ms), e.g. to space out the settings preview. */
export const cueLengthMs = (cue: Cue) => Math.max(...LANGUAGE[cue].map((e) => e.time + (e.type === 'continuous' ? e.duration : TRANSIENT_MS(e.sharpness))));

/** Cue for a phase start. `exerciseType` tells a quick flick from a squeeze. */
export function cueForPhase(phase: { kind: string; stage?: number; durationMs: number; variant?: string }, exerciseType?: ExerciseType): Cue | null {
  if (phase.variant === 'slowUp') return 'slowSqueeze';
  if (phase.variant === 'top') return 'holdTick';
  if (phase.variant === 'slowDown') return 'slowRelease';
  if (phase.variant === 'settle') return null;
  switch (phase.kind) {
    case 'contract':
      if (phase.stage) return phase.stage === 1 ? 'elevatorFloor1' : phase.stage === 2 ? 'elevatorFloor2' : 'elevatorFloor3';
      if (exerciseType === 'quick_flick' || exerciseType === 'quick' || exerciseType === 'pulse' || phase.durationMs <= 1000) return 'quickFlick';
      return 'squeezeStart';
    case 'cough':
      return 'knackCough';
    case 'release':
      return 'elevatorDown';
    case 'relax':
    case 'rest':
      // After a quick flick the release is the gap itself; after a slow release it was already felt.
      if (exerciseType === 'elevator') return null;
      return phase.durationMs <= 1000 ? null : 'releaseStart';
    case 'inhale':
      return 'breatheIn';
    case 'exhale':
      return 'breatheOut';
    case 'transition':
      return 'blockChange';
    case 'countdown':
      return 'countdownTick';
    default:
      return null;
  }
}

/** Tick during a hold: every whole second, stronger in the last 3 seconds; none for short squeezes. */
export function cueForHoldSecond(phase: { kind: string; durationMs: number; stage?: number; variant?: string }, second: number): Cue | null {
  if (phase.kind !== 'contract' || phase.stage || phase.durationMs < 2000) return null;
  const left = phase.durationMs / 1000 - second;
  if (second <= 0 || left <= 0) return null;
  return left <= 3 ? 'holdTickFinal' : 'holdTick';
}

/** Cues shown on the settings "try" screen, in the order of the spec table. */
export const PREVIEW_CUES: Cue[] = ['squeezeStart', 'holdTick', 'holdTickFinal', 'releaseStart', 'quickFlick', 'slowSqueeze', 'slowRelease', 'knackCough', 'blockChange', 'sessionEnd'];
