export type BreathPatternId = 'box' | '478';
export type BreathKind = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export interface BreathPattern {
  id: BreathPatternId;
  steps: { kind: BreathKind; sec: number }[];
}

export const BREATH_PATTERNS: Record<BreathPatternId, BreathPattern> = {
  box: {
    id: 'box',
    steps: [
      { kind: 'inhale', sec: 4 },
      { kind: 'holdIn', sec: 4 },
      { kind: 'exhale', sec: 4 },
      { kind: 'holdOut', sec: 4 },
    ],
  },
  '478': {
    id: '478',
    steps: [
      { kind: 'inhale', sec: 4 },
      { kind: 'holdIn', sec: 7 },
      { kind: 'exhale', sec: 8 },
    ],
  },
};

export const BREATH_DURATIONS_MIN = [1, 3, 5] as const;

export interface BreathPhase {
  kind: BreathKind;
  durationMs: number;
  /** cycle index */
  exerciseIndex: number;
}

export const cycleSec = (p: BreathPattern) => p.steps.reduce((a, s) => a + s.sec, 0);

/** Whole breathing cycles that fit into the chosen minutes (at least one). */
export function breathingPhases(patternId: BreathPatternId, minutes: number): BreathPhase[] {
  const p = BREATH_PATTERNS[patternId];
  const cycles = Math.max(1, Math.round((minutes * 60) / cycleSec(p)));
  const out: BreathPhase[] = [];
  for (let c = 0; c < cycles; c++) {
    for (const s of p.steps) out.push({ kind: s.kind, durationMs: s.sec * 1000, exerciseIndex: c });
  }
  return out;
}
