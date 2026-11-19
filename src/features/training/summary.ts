import { CONTRACTION_TYPES } from './tracks';
import type { GeneratedSession } from './types';

/** Session end (SPEC_KEGEL_V2 §7.5): what was done, and what tomorrow looks like. Pure. */

export interface SessionSummary {
  /** Contractions in the blocks that were finished. */
  contractions: number;
  /** Total squeeze-and-hold time in finished blocks (s). */
  holdSec: number;
  /** Longest single hold (s). */
  longestHoldSec: number;
}

export function sessionSummary(session: GeneratedSession, outcomes: { completed: boolean }[]): SessionSummary {
  let contractions = 0;
  let holdSec = 0;
  let longest = 0;
  session.blocks.forEach((b, i) => {
    if (!outcomes[i]?.completed || !CONTRACTION_TYPES.has(b.type)) return;
    contractions += b.reps;
    const hold = b.holdSec ?? 0;
    holdSec += hold * b.reps;
    longest = Math.max(longest, hold);
  });
  return { contractions, holdSec: Math.round(holdSec * 10) / 10, longestHoldSec: longest };
}

export type LevelOutlook = 'up' | 'down' | 'same' | 'sameShorter' | 'steady' | 'locked';

/** Tomorrow's level message: "Seviye 7 → 8", "Seviye aynı, harika gidiyorsun", a shorter preset after "hard"… */
export function levelOutlook(i: { before: number; after: number; suggestShorter?: boolean; locked?: boolean; wouldRise?: boolean; struggled?: boolean }): LevelOutlook {
  if (i.after > i.before) return 'up';
  if (i.after < i.before) return 'down';
  if (i.locked && i.wouldRise) return 'locked';
  if (i.suggestShorter) return 'sameShorter';
  // "Hard" / "could not finish" at the lowest level: no praise, just keep going gently.
  if (i.struggled) return 'steady';
  return 'same';
}

/** Main sessions and micro sets done today toward the daily target (e.g. 1/2). */
export function dailyProgress(workouts: { date: string; completed: boolean }[], today: string, target: number): { done: number; target: number; reached: boolean } {
  const done = workouts.filter((w) => w.date === today && w.completed).length;
  return { done, target, reached: done >= target };
}
