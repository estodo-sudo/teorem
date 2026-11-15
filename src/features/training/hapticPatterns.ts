import type { HapticStrength } from '@/types';

/**
 * Haptic "vibration language" — pure mapping from a semantic cue to a
 * platform-specific pattern. Kept free of native imports so it can be tested.
 *
 *  contractStart  strong single pulse        → "SQUEEZE"
 *  contractTick   light tick every second    → "keep holding"
 *  relaxStart     double light pulse         → "RELAX"
 *  exerciseEnd    triple pulse               → exercise finished
 */
export type Cue =
  | 'contractStart'
  | 'contractTick'
  | 'relaxStart'
  | 'releaseStage'
  | 'breatheIn'
  | 'breatheOut'
  | 'countdownTick'
  | 'exerciseEnd'
  | 'sessionEnd'
  | 'tap';

export type IosHapticCall =
  | { type: 'impact'; style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'; delayMs: number }
  | { type: 'notification'; style: 'success' | 'warning' | 'error'; delayMs: number }
  | { type: 'selection'; delayMs: number };

export type HapticPattern =
  | { platform: 'ios'; calls: IosHapticCall[] }
  | { platform: 'android'; pattern: number[] }
  | { platform: 'none' };

const scale = (ms: number, s: HapticStrength) => Math.round(ms * [0, 0.5, 1, 1.5][s]!);

/** Android: RN Vibration pattern [wait, vibrate, wait, vibrate, ...] in ms. */
function android(cue: Cue, s: HapticStrength): number[] {
  switch (cue) {
    case 'contractStart':
      return [0, scale(400, s)];
    case 'contractTick':
      return [0, scale(40, s)];
    case 'relaxStart':
      return [0, scale(90, s), 120, scale(90, s)];
    case 'releaseStage':
      return [0, scale(60, s)];
    case 'breatheIn':
      return [0, scale(120, s)];
    case 'breatheOut':
      return [0, scale(60, s), 100, scale(60, s)];
    case 'countdownTick':
      return [0, scale(30, s)];
    case 'exerciseEnd':
      return [0, scale(150, s), 110, scale(150, s), 110, scale(150, s)];
    case 'sessionEnd':
      return [0, scale(250, s), 120, scale(250, s), 120, scale(400, s)];
    case 'tap':
      return [0, scale(25, s)];
  }
}

function ios(cue: Cue, s: HapticStrength): IosHapticCall[] {
  const strongImpact = s === 1 ? 'medium' : s === 2 ? 'heavy' : 'heavy';
  const lightImpact = s === 1 ? 'soft' : s === 2 ? 'light' : 'medium';
  switch (cue) {
    case 'contractStart':
      return s === 3
        ? [
            { type: 'notification', style: 'success', delayMs: 0 },
            { type: 'impact', style: 'heavy', delayMs: 90 },
          ]
        : [{ type: 'impact', style: strongImpact, delayMs: 0 }];
    case 'contractTick':
      return [{ type: 'impact', style: lightImpact, delayMs: 0 }];
    case 'relaxStart':
      return [
        { type: 'impact', style: lightImpact, delayMs: 0 },
        { type: 'impact', style: lightImpact, delayMs: 160 },
      ];
    case 'releaseStage':
      return [{ type: 'impact', style: lightImpact, delayMs: 0 }];
    case 'breatheIn':
      return [{ type: 'impact', style: 'soft', delayMs: 0 }];
    case 'breatheOut':
      return [
        { type: 'impact', style: 'soft', delayMs: 0 },
        { type: 'impact', style: 'soft', delayMs: 140 },
      ];
    case 'countdownTick':
      return [{ type: 'selection', delayMs: 0 }];
    case 'exerciseEnd':
      return [
        { type: 'impact', style: strongImpact, delayMs: 0 },
        { type: 'impact', style: strongImpact, delayMs: 170 },
        { type: 'impact', style: strongImpact, delayMs: 340 },
      ];
    case 'sessionEnd':
      return [
        { type: 'notification', style: 'success', delayMs: 0 },
        { type: 'impact', style: strongImpact, delayMs: 250 },
        { type: 'impact', style: strongImpact, delayMs: 420 },
      ];
    case 'tap':
      return [{ type: 'selection', delayMs: 0 }];
  }
}

export function hapticPattern(cue: Cue, strength: HapticStrength, platform: string): HapticPattern {
  if (strength === 0) return { platform: 'none' };
  if (platform === 'ios') return { platform: 'ios', calls: ios(cue, strength) };
  if (platform === 'android') return { platform: 'android', pattern: android(cue, strength) };
  return { platform: 'none' };
}

/** Maps a phase start to its cue. */
export function cueForPhaseStart(kind: string, stage?: number): Cue | null {
  switch (kind) {
    case 'contract':
      return stage && stage > 1 ? 'releaseStage' : 'contractStart';
    case 'release':
      return 'releaseStage';
    case 'relax':
      return 'relaxStart';
    case 'inhale':
      return 'breatheIn';
    case 'exhale':
      return 'breatheOut';
    case 'rest':
    case 'transition':
      return 'relaxStart';
    case 'countdown':
      return 'countdownTick';
    default:
      return null;
  }
}

/**
 * Cue for a phase start, accounting for very short phases (rhythm pulses):
 * sub-second squeezes get a light tick and sub-second relaxes stay silent so
 * the pattern remains readable without looking at the screen.
 */
export function cueForPhase(phase: { kind: string; stage?: number; durationMs: number }): Cue | null {
  if (phase.durationMs < 1000) {
    if (phase.kind === 'contract') return 'contractTick';
    if (phase.kind === 'relax') return null;
  }
  return cueForPhaseStart(phase.kind, phase.stage);
}
