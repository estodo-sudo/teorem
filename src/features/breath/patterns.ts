/**
 * Breathing modes of the shared breath module (SPEC_V4 §C.4). Pure timing logic, no React Native.
 *
 * - quick — "Hızlı sakinleş" (cyclic sighing): a deep breath in through the nose, a short second one on
 *   top, then a slow, long breath out (about twice the breathing in). Balban et al. 2023.
 * - slow — "Yavaş nefes": 4 s in, 6 s out, about 6 breaths a minute. Zaccaro et al. 2018.
 * - box — "Kutu nefesi": 4 in · 4 hold · 4 out · 4 hold.
 */
export type BreathMode = 'quick' | 'slow' | 'box';
export type BreathStepKind = 'in' | 'inMore' | 'hold' | 'out';

export interface BreathModeDef {
  steps: { kind: BreathStepKind; sec: number }[];
  minutes: number[];
  defaultMinutes: number;
}

export const BREATH_MODES: Record<BreathMode, BreathModeDef> = {
  quick: { steps: [{ kind: 'in', sec: 2 }, { kind: 'inMore', sec: 1 }, { kind: 'out', sec: 6 }], minutes: [1, 3, 5], defaultMinutes: 1 },
  slow: { steps: [{ kind: 'in', sec: 4 }, { kind: 'out', sec: 6 }], minutes: [2, 5, 10], defaultMinutes: 5 },
  box: { steps: [{ kind: 'in', sec: 4 }, { kind: 'hold', sec: 4 }, { kind: 'out', sec: 4 }, { kind: 'hold', sec: 4 }], minutes: [2, 4], defaultMinutes: 2 },
};

export const BREATH_MODE_IDS: BreathMode[] = ['quick', 'slow', 'box'];

export const cycleMs = (mode: BreathMode) => BREATH_MODES[mode].steps.reduce((a, s) => a + s.sec * 1000, 0);

/** Whole cycles that fit into the chosen minutes (at least one), so a session never ends mid-breath. */
export const cyclesFor = (mode: BreathMode, minutes: number) => Math.max(1, Math.floor((minutes * 60_000) / cycleMs(mode)));

export const sessionMs = (mode: BreathMode, minutes: number) => cyclesFor(mode, minutes) * cycleMs(mode);

export interface BreathState {
  kind: BreathStepKind;
  /** Index of the step within the cycle. */
  step: number;
  stepMs: number;
  stepElapsed: number;
  /** 1-based. */
  cycle: number;
  cycles: number;
  remainingMs: number;
  progress: number;
  done: boolean;
}

export function breathState(mode: BreathMode, minutes: number, elapsedMs: number): BreathState {
  const def = BREATH_MODES[mode];
  const cycles = cyclesFor(mode, minutes);
  const total = cycles * cycleMs(mode);
  const e = Math.min(Math.max(0, elapsedMs), total);
  const done = e >= total;
  const inCycleRaw = done ? cycleMs(mode) - 1 : e % cycleMs(mode);
  let acc = 0;
  let step = 0;
  for (; step < def.steps.length - 1; step++) {
    const len = def.steps[step]!.sec * 1000;
    if (inCycleRaw < acc + len) break;
    acc += len;
  }
  const s = def.steps[step]!;
  return {
    kind: s.kind,
    step,
    stepMs: s.sec * 1000,
    stepElapsed: done ? s.sec * 1000 : inCycleRaw - acc,
    cycle: done ? cycles : Math.floor(e / cycleMs(mode)) + 1,
    cycles,
    remainingMs: total - e,
    progress: total ? e / total : 1,
    done,
  };
}

/** Orb size at the end of a step: grows on the way in (a little more on the second breath), shrinks out. */
export function orbTarget(kind: BreathStepKind, previous: number): number {
  if (kind === 'in') return 1;
  if (kind === 'inMore') return 1.08;
  if (kind === 'out') return 0.7;
  return previous;
}

/**
 * Haptic taps within a step, for following with closed eyes: breathing in, the taps come closer
 * together; breathing out, they spread apart; holding, there are none. Offsets in ms from the step start.
 */
export function hapticOffsets(kind: BreathStepKind, stepMs: number): number[] {
  if (kind === 'hold') return [];
  const out: number[] = [];
  const first = 520;
  const last = 160;
  // Gaps shrink (in) or grow (out) linearly between `first` and `last`.
  let t = 0;
  for (let i = 0; i < 40; i++) {
    const share = Math.min(1, t / stepMs);
    const gap = kind === 'out' ? last + (first - last) * share : first - (first - last) * share;
    if (t >= stepMs - 80) break;
    out.push(Math.round(t));
    t += gap;
  }
  return out;
}

export const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
