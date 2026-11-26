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
  round2Locked?: boolean;
}

/** The release session ("Bırakma seansı": no contractions, after the cap or pain) is not a training session. */
const isRelease = (w: Omit<DayWorkout, 'date'>) => w.isMicro === true && w.track === 'relax';

/**
 * A finished session for the daily target: Tur 2 continues Tur 1 and does not count again, a release
 * session does not count at all (2026-11-23 fixes).
 */
export const countsAsSession = (w: Omit<DayWorkout, 'date'>) => w.completed && w.round !== 2 && !isRelease(w);

/**
 * A day has two halves (user decision 2026-11-25): Tur 1 is the first half, Tur 2 the second. The day
 * is done when both are done. (Micro sets were removed 2026-11-25; old ones in the history count for nothing.)
 */
export const DAY_HALVES = 2;

/** A finished round of the main session (not a micro set, not a release session). */
const isMainRound = (w: Omit<DayWorkout, 'date'>) => w.completed && !w.isMicro && !isRelease(w);

export interface DayStatus {
  /** Sessions counted that day (main sessions and micro sets), for totals. */
  sessions: number;
  /** Tur 1 (the first half of the day) is done. */
  mainDone: boolean;
  /** Tur 2 (the second half) is done. */
  round2Done: boolean;
  /** An extra micro set was done. */
  microDone: boolean;
  /** Tur 2 needed premium when that day's Tur 1 finished (Tur 1 alone completes the day). */
  round2Locked: boolean;
  /** The day is done: Tur 1 and Tur 2 — or Tur 1 alone when Tur 2 was locked (2026-11-26). */
  full: boolean;
  /** Halves done (0, 1 or 2), for the ring and the "1/2" counters. */
  counted: number;
  target: number;
}

/**
 * One rule for the whole app — the Today card and tasks, the week, the calendar, the feedback screen,
 * the reminders and the streak. `_target` (the old "sessions per day" setting) is no longer used.
 */
export function dayStatus(workouts: DayWorkout[], date: string, _target?: number): DayStatus {
  const day = workouts.filter((w) => w.date === date);
  const mainDone = day.some((w) => isMainRound(w) && w.round !== 2);
  const round2Done = day.some((w) => isMainRound(w) && w.round === 2);
  const microDone = day.some((w) => w.completed && w.isMicro === true && !isRelease(w));
  const round2Locked = day.some((w) => isMainRound(w) && w.round !== 2 && w.round2Locked === true);
  const counted = (mainDone ? 1 : 0) + (round2Done ? 1 : 0);
  return { sessions: day.filter(countsAsSession).length, mainDone, round2Done, microDone, round2Locked, full: mainDone && (round2Done || round2Locked), counted, target: DAY_HALVES };
}

/** Days split by that rule: `full` = both halves, `partial` = one half (shown half filled). Micro sets alone don't mark a day. */
export function targetDays(workouts: DayWorkout[], _target?: number): { full: string[]; partial: string[] } {
  const dates = new Set(workouts.filter(isMainRound).map((w) => w.date));
  const full: string[] = [];
  const partial: string[] = [];
  dates.forEach((d) => (dayStatus(workouts, d).full ? full : partial).push(d));
  return { full, partial };
}

export function dailyProgress(workouts: DayWorkout[], today: string, _target?: number): { done: number; target: number; reached: boolean } {
  const s = dayStatus(workouts, today);
  // Tur 2 locked (no premium): the day's target is Tur 1 alone, so "1/1" and a full bar (2026-11-26).
  const target = s.round2Locked && !s.round2Done ? 1 : s.target;
  return { done: Math.min(s.counted, target), target, reached: s.full };
}
