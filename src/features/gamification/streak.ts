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
 * missed day). "Streak freeze" is a Phase-2 feature.
 */
export function computeStreak(completedDates: Iterable<string>, today: string): StreakInfo {
  const days = Array.from(new Set(completedDates))
    .filter((d) => daysBetween(d, today) >= 0)
    .sort();
  const set = new Set(days);

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  const doneToday = set.has(today);
  let current = 0;
  let cursor = doneToday ? today : addDays(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest, doneToday };
}
