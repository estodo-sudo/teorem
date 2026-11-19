import { addDays, daysBetween } from '@/lib/date';

export interface StreakInfo {
  current: number;
  longest: number;
  /** Whether today's main workout is already done. */
  doneToday: boolean;
}

/**
 * Streak from the set of days with a completed main workout.
 * The current streak stays alive until the end of today: if today is not done
 * yet but yesterday was, the streak still counts (it resets only after a full
 * missed day). Protected days (streak freezes, vacation — Kegel v2 §6.6) keep the streak alive
 * without adding to it.
 */
export function computeStreak(completedDates: Iterable<string>, today: string, protectedDays: Iterable<string> = []): StreakInfo {
  const kept = new Set(protectedDays);
  const days = Array.from(new Set(completedDates))
    .filter((d) => daysBetween(d, today) >= 0)
    .sort();
  const set = new Set(days);

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  const bridged = (a: string, b: string) => {
    // Every day strictly between a and b is protected.
    for (let d = addDays(a, 1); d < b; d = addDays(d, 1)) if (!kept.has(d)) return false;
    return true;
  };
  for (const d of days) {
    run = prev && (daysBetween(prev, d) === 1 || bridged(prev, d)) ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  const doneToday = set.has(today);
  let current = 0;
  let cursor = doneToday ? today : addDays(today, -1);
  while (set.has(cursor) || kept.has(cursor)) {
    if (set.has(cursor)) current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest, doneToday };
}
