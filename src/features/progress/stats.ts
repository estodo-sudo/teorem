import { addDays, daysBetween, startOfWeek } from '@/lib/date';
import type { StrengthTest, WorkoutSession } from '@/types';

export interface Summary {
  totalWorkouts: number;
  totalMinutes: number;
  longestStreak: number;
  level: number;
}

export function summarize(workouts: WorkoutSession[], longestStreak: number, level: number): Summary {
  const done = workouts.filter((w) => w.completed);
  return {
    totalWorkouts: done.length,
    totalMinutes: Math.round(workouts.reduce((a, w) => a + w.actualSec, 0) / 60),
    longestStreak,
    level,
  };
}

/** Training minutes per week (Mon-based) for the last `weeks` weeks, oldest first. */
export function weeklyMinutes(workouts: WorkoutSession[], today: string, weeks = 8): { week: string; minutes: number }[] {
  const thisWeek = startOfWeek(today);
  const buckets = Array.from({ length: weeks }, (_, i) => ({ week: addDays(thisWeek, -7 * (weeks - 1 - i)), minutes: 0 }));
  for (const w of workouts) {
    const wk = startOfWeek(w.date);
    const b = buckets.find((x) => x.week === wk);
    if (b) b.minutes += w.actualSec / 60;
  }
  return buckets.map((b) => ({ ...b, minutes: Math.round(b.minutes * 10) / 10 }));
}

export interface HeatCell {
  date: string;
  /** 0 = nothing, 1 = partial session, 2 = completed, 3 = completed ≥ 2 sessions */
  intensity: 0 | 1 | 2 | 3;
}

/** Calendar heat map: `weeks` columns × 7 rows (Mon..Sun), ending this week. */
export function heatMap(workouts: WorkoutSession[], today: string, weeks = 12): HeatCell[][] {
  const byDay = new Map<string, { completed: number; any: number }>();
  for (const w of workouts) {
    const d = byDay.get(w.date) ?? { completed: 0, any: 0 };
    d.any++;
    if (w.completed) d.completed++;
    byDay.set(w.date, d);
  }
  const start = addDays(startOfWeek(today), -7 * (weeks - 1));
  const cols: HeatCell[][] = [];
  for (let c = 0; c < weeks; c++) {
    const col: HeatCell[] = [];
    for (let r = 0; r < 7; r++) {
      const date = addDays(start, c * 7 + r);
      const d = byDay.get(date);
      const intensity: HeatCell['intensity'] =
        daysBetween(date, today) < 0 || !d ? 0 : d.completed >= 2 ? 3 : d.completed === 1 ? 2 : 1;
      col.push({ date, intensity });
    }
    cols.push(col);
  }
  return cols;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export function holdTrend(tests: StrengthTest[]): TrendPoint[] {
  return [...tests]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((t) => ({ date: t.date, value: Math.round(t.holdBestMs / 100) / 10 }));
}

export function quickTrend(tests: StrengthTest[]): TrendPoint[] {
  return [...tests].sort((a, b) => (a.date < b.date ? -1 : 1)).map((t) => ({ date: t.date, value: t.quickCount }));
}

export const STRENGTH_TEST_INTERVAL_DAYS = 7;

/** True when no test exists yet or the last one is ≥ 7 days old. */
export function strengthTestDue(tests: StrengthTest[], today: string): boolean {
  if (tests.length === 0) return true;
  const last = tests.reduce((a, t) => (t.date > a ? t.date : a), tests[0]!.date);
  return daysBetween(last, today) >= STRENGTH_TEST_INTERVAL_DAYS;
}

/** Best of the hold attempts (ms). */
export function bestHold(attempts: number[]): number {
  return attempts.length ? Math.max(...attempts) : 0;
}
