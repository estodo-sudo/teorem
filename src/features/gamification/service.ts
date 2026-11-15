import { useMemo } from 'react';

import { STORIES } from '@/features/content/data';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useProgressStore } from '@/stores/progressStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { ChallengeLog, WorkoutSession } from '@/types';

import { evaluateAchievements, type AchievementContext } from './achievements';
import { computeStreak } from './streak';

export const completedDates = (workouts: WorkoutSession[]) =>
  workouts.filter((w) => w.completed).map((w) => w.date);

export const countCompletedChallenges = (logs: Record<string, ChallengeLog>) =>
  Object.values(logs).reduce((a, l) => a + l.completedIds.length, 0);

export function buildAchievementContext(today = toDateKey()): AchievementContext {
  const h = useHistoryStore.getState();
  const p = useProgressStore.getState();
  const streak = computeStreak(completedDates(h.workouts), today);
  return {
    totalWorkouts: h.workouts.filter((w) => w.completed).length,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    level: useTrainingStore.getState().training.level,
    strengthTests: h.strengthTests,
    completedLessons: Object.values(p.content.courseProgress).reduce((a, c) => a + c.completedLessonIds.length, 0),
    readStories: p.content.readStoryIds.filter((id) => STORIES.some((s) => s.id === id)).length,
    totalStories: STORIES.length,
    completedChallenges: countCompletedChallenges(p.challengeLogs),
  };
}

/** Evaluates and unlocks any newly earned achievements (queues celebrations). */
export function checkAchievements(): string[] {
  const p = useProgressStore.getState();
  const fresh = evaluateAchievements(buildAchievementContext(), p.achievements);
  if (fresh.length) p.unlockAchievements(fresh);
  return fresh;
}

export function useStreak() {
  const workouts = useHistoryStore((s) => s.workouts);
  const today = toDateKey();
  return useMemo(() => computeStreak(completedDates(workouts), today), [workouts, today]);
}
