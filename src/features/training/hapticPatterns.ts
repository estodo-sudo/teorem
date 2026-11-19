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

/** Strength setting: Off / Light / Normal / Strong. */
export const STRENGTH_SCALE: Record<HapticStrength, number> = { 0: 0, 1: 0.55, 2: 0.8, 3: 1 };

/** Events for a cue at the user's strength (empty when vibration is off). */
export function hapticEvents(cue: Cue, strength: HapticStrength): HapticEvent[] {
  const k = STRENGTH_SCALE[strength];
  if (!k) return [];
  const s = (v: number) => Math.round(v * k * 1000) / 1000;
  return LANGUAGE[cue].map((e) => (e.type === 'transient' ? { ...e, intensity: s(e.intensity) } : { ...e, intensity: s(e.intensity), intensityEnd: s(e.intensityEnd) }));
}

/** Length of a transient pulse when it has to be played as a short vibration (Android). */
export const TRANSIENT_MS = (sharpness: number) => Math.round(45 - 25 * sharpness);
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
export function onOffPattern(events: HapticEvent[]): number[] {
  const pulses: { start: number; dur: number }[] = [];
  for (const e of events) {
    if (e.type === 'transient') pulses.push({ start: e.time, dur: Math.round(20 + 50 * e.intensity) });
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
  const style = (i: number, sharp: number): IosImpact => (sharp >= 0.9 ? 'rigid' : i >= 0.75 ? 'heavy' : i >= 0.45 ? 'medium' : i >= 0.2 ? 'light' : 'soft');
  const out: { style: IosImpact; delayMs: number }[] = [];
  for (const e of events) {
    if (e.type === 'transient') out.push({ style: style(e.intensity, e.sharpness), delayMs: e.time });
    else {
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
