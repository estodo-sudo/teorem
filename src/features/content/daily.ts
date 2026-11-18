import { daysBetween } from '@/lib/date';
import { createRng } from '@/lib/random';

import type { Challenge, Story } from './data';

/**
 * Day of the nutrition plan (0-based) for a date: counted from the day the user
 * started, repeating every `days` days.
 */
export function nutritionDayIndex(startDate: string, date: string, days: number): number {
  if (days <= 0) return 0;
  const n = daysBetween(startDate, date);
  return ((n % days) + days) % days;
}

/** The tasks of one plan day (unknown ids are skipped). */
export function nutritionTasksForDay(plan: readonly string[][], all: readonly Challenge[], dayIndex: number): Challenge[] {
  return (plan[dayIndex] ?? []).map((id) => all.find((c) => c.id === id)).filter((c): c is Challenge => !!c);
}

/** "Story of the day": deterministic per date, preferring unread stories. */
export function storyOfTheDay(date: string, stories: readonly Story[], readIds: readonly string[]): Story | undefined {
  if (!stories.length) return undefined;
  const unread = stories.filter((s) => !readIds.includes(s.id));
  const pool = unread.length ? unread : stories;
  const rng = createRng(`story|${date}`);
  return pool[Math.floor(rng() * pool.length)];
}

/** Score of a quiz as a fraction 0..1. */
export function quizScore(answers: (number | null)[], correct: number[]): number {
  if (!correct.length) return 1;
  return answers.filter((a, i) => a === correct[i]).length / correct.length;
}
