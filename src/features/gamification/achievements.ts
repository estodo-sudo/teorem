import type { IconName } from '@/components/Icon';
import type { StrengthTest } from '@/types';

export interface AchievementContext {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  strengthTests: StrengthTest[];
  completedLessons: number;
  readStories: number;
  totalStories: number;
}

export interface AchievementDef {
  id: string;
  icon: IconName;
  /** Display only (ui-v3 medallion): the number on the ribbon and its unit, e.g. 7 + day → "3/7 gün". */
  target?: number;
  unit?: 'day' | 'workout' | 'level';
  /** Progress 0..1 toward unlocking (1 = unlocked). */
  progress: (c: AchievementContext) => number;
}

const ratio = (v: number, target: number) => Math.min(1, Math.max(0, v / target));

/** Relative improvement (0.25 = +25%) between the first and best later test. */
export function strengthImprovement(tests: StrengthTest[]): number {
  if (tests.length < 2) return 0;
  const sorted = [...tests].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const first = sorted[0]!;
  const later = sorted.slice(1);
  const bestHold = Math.max(...later.map((t) => t.holdBestMs));
  const bestQuick = Math.max(...later.map((t) => t.quickCount));
  const hold = first.holdBestMs > 0 ? (bestHold - first.holdBestMs) / first.holdBestMs : 0;
  const quick = first.quickCount > 0 ? (bestQuick - first.quickCount) / first.quickCount : 0;
  return Math.max(hold, quick);
}

const streak = (n: number): AchievementDef => ({
  id: `streak_${n}`,
  target: n,
  unit: 'day',
  icon: n >= 60 ? 'flame' : n >= 14 ? 'flame' : 'sparkle',
  progress: (c) => ratio(Math.max(c.currentStreak, c.longestStreak), n),
});
const workouts = (n: number): AchievementDef => ({
  id: `workouts_${n}`,
  target: n,
  unit: 'workout',
  icon: n >= 100 ? 'trophy' : 'dumbbell',
  progress: (c) => ratio(c.totalWorkouts, n),
});
const level = (n: number): AchievementDef => ({
  id: `level_${n}`,
  target: n,
  unit: 'level',
  icon: 'arrowUp',
  progress: (c) => ratio(c.level, n),
});

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_workout', icon: 'party', progress: (c) => ratio(c.totalWorkouts, 1) },
  streak(3),
  streak(7),
  streak(14),
  streak(30),
  streak(60),
  streak(100),
  workouts(10),
  workouts(50),
  workouts(100),
  workouts(250),
  level(5),
  level(10),
  level(20),
  { id: 'first_strength_test', icon: 'ruler', progress: (c) => ratio(c.strengthTests.length, 1) },
  { id: 'strength_plus_25', icon: 'trendUp', progress: (c) => ratio(strengthImprovement(c.strengthTests), 0.25) },
  { id: 'lessons_5', icon: 'graduation', target: 5, progress: (c) => ratio(c.completedLessons, 5) },
  {
    id: 'all_stories',
    icon: 'book',
    progress: (c) => (c.totalStories > 0 ? ratio(c.readStories, c.totalStories) : 0),
  },
];

/** Returns ids of achievements newly earned in this context. */
export function evaluateAchievements(c: AchievementContext, unlocked: Record<string, string>): string[] {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.progress(c) >= 1).map((a) => a.id);
}
