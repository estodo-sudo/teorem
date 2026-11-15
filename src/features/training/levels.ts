/**
 * Kegel training levels 1..30 as PURE DATA.
 *
 * holdSec       contraction length for "hold" reps (s)
 * relaxSec      relaxation after each contraction (s)
 * reps          reps per hold set
 * setCount      number of hold sets
 * quickReps     quick flicks (1 s squeeze / 1 s relax); warm-up uses half
 * enduranceSec  single long hold (0 = not yet unlocked; from level 5)
 * elevatorReps  "elevator" reps (3 stages × 2 s, top hold, staged release)
 * pulseBlocks   number of rhythm blocks
 * pulseCount    pulses per block (0.5 s squeeze / 0.5 s relax)
 *
 * Tuned so that a session is ~4 min at level 1 and ~8 min at level 30, with
 * every parameter non-decreasing (see __tests__/training.test.ts).
 */
export interface LevelParams {
  level: number;
  holdSec: number;
  relaxSec: number;
  reps: number;
  setCount: number;
  quickReps: number;
  enduranceSec: number;
  elevatorReps: number;
  pulseBlocks: number;
  pulseCount: number;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 30;

/** Level at which the endurance block is added to the daily session. */
export const ENDURANCE_FROM_LEVEL = 5;

// prettier-ignore
export const LEVELS: readonly LevelParams[] = [
  { level: 1, holdSec: 3, relaxSec: 3, reps: 10, setCount: 2, quickReps: 10, enduranceSec: 0, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 2, holdSec: 3, relaxSec: 3, reps: 10, setCount: 2, quickReps: 10, enduranceSec: 0, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 3, holdSec: 3, relaxSec: 3, reps: 10, setCount: 2, quickReps: 11, enduranceSec: 0, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 4, holdSec: 4, relaxSec: 3, reps: 10, setCount: 2, quickReps: 11, enduranceSec: 0, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 5, holdSec: 4, relaxSec: 4, reps: 10, setCount: 2, quickReps: 11, enduranceSec: 10, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 6, holdSec: 4, relaxSec: 4, reps: 10, setCount: 2, quickReps: 12, enduranceSec: 11, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 7, holdSec: 4, relaxSec: 4, reps: 10, setCount: 2, quickReps: 12, enduranceSec: 11, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 8, holdSec: 4, relaxSec: 4, reps: 10, setCount: 2, quickReps: 12, enduranceSec: 12, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 9, holdSec: 4, relaxSec: 4, reps: 10, setCount: 2, quickReps: 13, enduranceSec: 12, elevatorReps: 3, pulseBlocks: 3, pulseCount: 11 },
  { level: 10,  holdSec: 5, relaxSec: 4, reps: 10, setCount: 2, quickReps: 13, enduranceSec: 13, elevatorReps: 3, pulseBlocks: 3, pulseCount: 12 },
  { level: 11,  holdSec: 5, relaxSec: 5, reps: 10, setCount: 2, quickReps: 13, enduranceSec: 14, elevatorReps: 3, pulseBlocks: 3, pulseCount: 13 },
  { level: 12,  holdSec: 5, relaxSec: 5, reps: 10, setCount: 2, quickReps: 14, enduranceSec: 14, elevatorReps: 3, pulseBlocks: 3, pulseCount: 13 },
  { level: 13,  holdSec: 5, relaxSec: 5, reps: 10, setCount: 2, quickReps: 14, enduranceSec: 15, elevatorReps: 3, pulseBlocks: 3, pulseCount: 13 },
  { level: 14,  holdSec: 5, relaxSec: 5, reps: 10, setCount: 2, quickReps: 14, enduranceSec: 15, elevatorReps: 3, pulseBlocks: 3, pulseCount: 13 },
  { level: 15,  holdSec: 5, relaxSec: 5, reps: 10, setCount: 2, quickReps: 15, enduranceSec: 16, elevatorReps: 3, pulseBlocks: 3, pulseCount: 13 },
  { level: 16,  holdSec: 6, relaxSec: 5, reps: 10, setCount: 2, quickReps: 15, enduranceSec: 17, elevatorReps: 4, pulseBlocks: 3, pulseCount: 18 },
  { level: 17,  holdSec: 6, relaxSec: 6, reps: 10, setCount: 2, quickReps: 16, enduranceSec: 17, elevatorReps: 4, pulseBlocks: 3, pulseCount: 19 },
  { level: 18,  holdSec: 6, relaxSec: 6, reps: 10, setCount: 2, quickReps: 16, enduranceSec: 18, elevatorReps: 4, pulseBlocks: 3, pulseCount: 19 },
  { level: 19,  holdSec: 6, relaxSec: 6, reps: 10, setCount: 2, quickReps: 16, enduranceSec: 18, elevatorReps: 4, pulseBlocks: 3, pulseCount: 19 },
  { level: 20,  holdSec: 6, relaxSec: 6, reps: 10, setCount: 2, quickReps: 17, enduranceSec: 19, elevatorReps: 4, pulseBlocks: 3, pulseCount: 19 },
  { level: 21,  holdSec: 6, relaxSec: 6, reps: 10, setCount: 2, quickReps: 17, enduranceSec: 20, elevatorReps: 4, pulseBlocks: 3, pulseCount: 19 },
  { level: 22,  holdSec: 7, relaxSec: 6, reps: 10, setCount: 2, quickReps: 17, enduranceSec: 20, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
  { level: 23,  holdSec: 7, relaxSec: 6, reps: 10, setCount: 2, quickReps: 18, enduranceSec: 21, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
  { level: 24,  holdSec: 7, relaxSec: 6, reps: 10, setCount: 2, quickReps: 18, enduranceSec: 21, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
  { level: 25,  holdSec: 7, relaxSec: 6, reps: 10, setCount: 2, quickReps: 18, enduranceSec: 22, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
  { level: 26,  holdSec: 7, relaxSec: 6, reps: 10, setCount: 2, quickReps: 19, enduranceSec: 23, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
  { level: 27,  holdSec: 7, relaxSec: 6, reps: 10, setCount: 2, quickReps: 19, enduranceSec: 23, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
  { level: 28,  holdSec: 8, relaxSec: 6, reps: 10, setCount: 2, quickReps: 19, enduranceSec: 24, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
  { level: 29,  holdSec: 8, relaxSec: 6, reps: 10, setCount: 2, quickReps: 20, enduranceSec: 24, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
  { level: 30,  holdSec: 8, relaxSec: 6, reps: 10, setCount: 2, quickReps: 20, enduranceSec: 25, elevatorReps: 4, pulseBlocks: 3, pulseCount: 20 },
];

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
}

export function getLevel(level: number): LevelParams {
  return LEVELS[clampLevel(level) - 1] as LevelParams;
}

/** Starting level derived from onboarding experience answer. */
export function startingLevelFor(experience: 'none' | 'some' | 'regular' | null): number {
  switch (experience) {
    case 'regular':
      return 5;
    case 'some':
      return 3;
    default:
      return 1;
  }
}
