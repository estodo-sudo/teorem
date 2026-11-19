import type { Feedback } from '@/types';

import { MAX_LEVEL, MIN_LEVEL } from './levels';

export const OK_STREAK_FOR_LEVEL_UP = 3;
/** "OK" counts toward a level up only with ≥ 90 % completion (§6.5). */
export const OK_MIN_COMPLETION = 0.9;
/** Below 70 % completion the level goes down. */
export const LOW_COMPLETION = 0.7;
export const HARD_STREAK_FOR_LEVEL_DOWN = 2;
/** Many pauses or a skipped block: the session does not count toward a level up. */
export const PAUSES_BLOCK_LEVEL_UP = 3;

export interface LevelState {
  level: number;
  consecutiveOk: number;
  consecutiveHard: number;
}

export interface SessionSignals {
  feedback: Feedback;
  /** 0..1 */
  completionRate?: number;
  pauses?: number;
  skippedBlocks?: number;
  /** Level increases are paused (pain report in the last 7 days). */
  locked?: boolean;
}

export interface LevelAdjustment extends LevelState {
  /** True when tomorrow should repeat the same plan day. */
  repeatDay: boolean;
  delta: -1 | 0 | 1;
  /** "Hard": keep the level, offer a one-step shorter duration next time. */
  suggestShorter: boolean;
}

const clamp = (l: number) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, l));

/**
 * Adaptive difficulty v2 (SPEC_KEGEL_V2 §6.5):
 *  - could not finish            → −1, repeat the day
 *  - completion < 70 %           → −1
 *  - hard                        → same level, shorter preset suggested; 2 hard in a row → −1
 *  - too easy                    → +1
 *  - 3 ok in a row (≥ 90 %, few pauses, nothing skipped) → +1
 *  - a pain report locks increases for 7 days (`locked`)
 * Falling strength tests trigger an early deload week instead (see schedule.deloadDue).
 */
export function adjustLevel(state: LevelState, signals: SessionSignals | Feedback): LevelAdjustment {
  const sig: SessionSignals = typeof signals === 'string' ? { feedback: signals } : signals;
  const completion = sig.completionRate ?? 1;
  const down = (repeatDay: boolean): LevelAdjustment => {
    const level = clamp(state.level - 1);
    return { level, consecutiveOk: 0, consecutiveHard: 0, repeatDay, delta: level < state.level ? -1 : 0, suggestShorter: false };
  };
  const up = (): LevelAdjustment => {
    const level = sig.locked ? state.level : clamp(state.level + 1);
    return { level, consecutiveOk: 0, consecutiveHard: 0, repeatDay: false, delta: level > state.level ? 1 : 0, suggestShorter: false };
  };
  const same = (patch: Partial<LevelAdjustment>): LevelAdjustment => ({ level: state.level, consecutiveOk: 0, consecutiveHard: 0, repeatDay: false, delta: 0, suggestShorter: false, ...patch });

  if (sig.feedback === 'failed') return down(true);
  if (completion < LOW_COMPLETION) return down(false);
  if (sig.feedback === 'hard') {
    const hard = state.consecutiveHard + 1;
    return hard >= HARD_STREAK_FOR_LEVEL_DOWN ? down(false) : same({ consecutiveHard: hard, suggestShorter: true });
  }
  if (sig.feedback === 'easy') return up();
  // ok
  const counts = completion >= OK_MIN_COMPLETION && (sig.skippedBlocks ?? 0) === 0 && (sig.pauses ?? 0) < PAUSES_BLOCK_LEVEL_UP;
  if (!counts) return same({});
  const streak = state.consecutiveOk + 1;
  if (streak >= OK_STREAK_FOR_LEVEL_UP && !sig.locked) return up();
  return same({ consecutiveOk: Math.min(streak, OK_STREAK_FOR_LEVEL_UP) });
}
