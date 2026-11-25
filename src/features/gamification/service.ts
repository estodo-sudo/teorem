import { useMemo } from 'react';

import { STORIES } from '@/features/content/data';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useProgressStore } from '@/stores/progressStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { WorkoutSession } from '@/types';

import { protectedDays } from '@/features/training/returns';

import { evaluateAchievements, type AchievementContext } from './achievements';
import { computeStreak } from './streak';
import { countsAsSession } from '@/features/training/summary';

/** Days with a counted session (streak, returns). Same rule as the daily target: no release session (2026-11-24). */
export const completedDates = (workouts: WorkoutSession[]) => workouts.filter(countsAsSession).map((w) => w.date);

export function buildAchievementContext(today = toDateKey()): AchievementContext {
  const h = useHistoryStore.getState();
  const p = useProgressStore.getState();
  const streak = computeStreak(completedDates(h.workouts), today, protectedDays(useTrainingStore.getState().training));
  return {
    // Tur 2 continues Tur 1 and a release session is not a workout (2026-11-24).
    totalWorkouts: h.workouts.filter(countsAsSession).length,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    level: useTrainingStore.getState().training.level,
    strengthTests: h.strengthTests,
    completedLessons: Object.values(p.content.courseProgress).reduce((a, c) => a + c.completedLessonIds.length, 0),
    readStories: p.content.readStoryIds.filter((id) => STORIES.some((s) => s.id === id)).length,
    totalStories: STORIES.length,
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
  const frozen = useTrainingStore((s) => s.training.frozenDays);
  const vacation = useTrainingStore((s) => s.training.vacation);
  const today = toDateKey();
  return useMemo(() => computeStreak(completedDates(workouts), today, protectedDays({ frozenDays: frozen, vacation })), [workouts, today, frozen, vacation]);
}
