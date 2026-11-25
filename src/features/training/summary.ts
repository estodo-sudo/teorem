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

/** The fields of a workout the daily rules look at. */
export interface DayWorkout {
  date: string;
  completed: boolean;
  round?: 1 | 2;
  isMicro?: boolean;
  track?: string;
}

/** The release session ("Bırakma seansı": no contractions, after the cap or pain) is not a training session. */
const isRelease = (w: Omit<DayWorkout, 'date'>) => w.isMicro === true && w.track === 'relax';

/**
 * A finished session for the daily target: Tur 2 continues Tur 1 and does not count again, a release
 * session does not count at all (2026-11-23 fixes).
 */
export const countsAsSession = (w: Omit<DayWorkout, 'date'>) => w.completed && w.round !== 2 && !isRelease(w);

export interface DayStatus {
  /** Sessions counted that day (main sessions and micro sets). */
  sessions: number;
  /** The day's training (a main session) is done. */
  mainDone: boolean;
  microDone: boolean;
  /** The day is done: the target is reached and one of the sessions is the main one. */
  full: boolean;
  /** What the ring shows (e.g. 1 of 2): never the full target before the main session is done. */
  counted: number;
  target: number;
}

/**
 * One rule for the whole app (2026-11-23: the Today card, the "Bugün" tasks, the week strip and the
 * calendar disagreed): a day is done when the daily target is reached AND one of the sessions is the
 * day's training — a micro set is the extra session, it cannot replace the main one.
 */
export function dayStatus(workouts: DayWorkout[], date: string, target: number): DayStatus {
  const list = workouts.filter((w) => w.date === date && countsAsSession(w));
  const goal = Math.max(1, target);
  const sessions = list.length;
  const mainDone = list.some((w) => !w.isMicro);
  const microDone = list.some((w) => w.isMicro);
  const full = mainDone && sessions >= goal;
  return { sessions, mainDone, microDone, full, counted: full ? Math.min(sessions, goal) : Math.min(sessions, goal - 1), target: goal };
}

/** Days split by that rule: `full` = done, `partial` = some session but not done (shown half filled). */
export function targetDays(workouts: DayWorkout[], target: number): { full: string[]; partial: string[] } {
  const dates = new Set(workouts.filter(countsAsSession).map((w) => w.date));
  const full: string[] = [];
  const partial: string[] = [];
  dates.forEach((d) => (dayStatus(workouts, d, target).full ? full : partial).push(d));
  return { full, partial };
}

export function dailyProgress(workouts: DayWorkout[], today: string, target: number): { done: number; target: number; reached: boolean } {
  const s = dayStatus(workouts, today, target);
  return { done: s.counted, target, reached: s.full };
}
