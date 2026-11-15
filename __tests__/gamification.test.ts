import { ACHIEVEMENTS, evaluateAchievements, strengthImprovement, type AchievementContext } from '@/features/gamification/achievements';
import { computeStreak } from '@/features/gamification/streak';
import type { StrengthTest } from '@/types';

describe('computeStreak', () => {
  const today = '2026-11-15';
  it('is zero with no workouts', () => {
    expect(computeStreak([], today)).toEqual({ current: 0, longest: 0, doneToday: false });
  });
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-11-13', '2026-11-14', '2026-11-15'], today)).toEqual({
      current: 3,
      longest: 3,
      doneToday: true,
    });
  });
  it('keeps the streak alive until today ends', () => {
    expect(computeStreak(['2026-11-13', '2026-11-14'], today).current).toBe(2);
  });
  it('resets after a missed day', () => {
    const s = computeStreak(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-15'], today);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
    expect(computeStreak(['2026-11-12', '2026-11-13'], today).current).toBe(0);
  });
  it('ignores duplicates and future dates, handles month boundaries', () => {
    const s = computeStreak(['2026-10-31', '2026-11-01', '2026-11-01', '2026-11-02', '2026-12-01'], '2026-11-02');
    expect(s).toEqual({ current: 3, longest: 3, doneToday: true });
  });
});

const ctx = (patch: Partial<AchievementContext> = {}): AchievementContext => ({
  totalWorkouts: 0,
  currentStreak: 0,
  longestStreak: 0,
  level: 1,
  strengthTests: [],
  completedLessons: 0,
  readStories: 0,
  totalStories: 20,
  completedChallenges: 0,
  ...patch,
});

const test = (date: string, holdBestMs: number, quickCount: number): StrengthTest => ({
  id: date,
  date,
  holdBestMs,
  holdAttemptsMs: [holdBestMs],
  quickCount,
});

describe('achievements', () => {
  it('defines at least 15 unique achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
  it('unlocks nothing for a fresh user', () => {
    expect(evaluateAchievements(ctx(), {})).toEqual([]);
  });
  it('unlocks first workout and workout milestones', () => {
    expect(evaluateAchievements(ctx({ totalWorkouts: 1 }), {})).toEqual(['first_workout']);
    expect(evaluateAchievements(ctx({ totalWorkouts: 50 }), {})).toEqual(
      expect.arrayContaining(['first_workout', 'workouts_10', 'workouts_50']),
    );
  });
  it('does not re-unlock already unlocked achievements', () => {
    expect(evaluateAchievements(ctx({ totalWorkouts: 1 }), { first_workout: '2026-01-01' })).toEqual([]);
  });
  it('uses the longest streak so broken streaks keep earned badges', () => {
    expect(evaluateAchievements(ctx({ currentStreak: 0, longestStreak: 7 }), {})).toEqual(['streak_3', 'streak_7']);
  });
  it('unlocks level badges', () => {
    expect(evaluateAchievements(ctx({ level: 10 }), {})).toEqual(['level_5', 'level_10']);
  });
  it('computes strength improvement from the first test', () => {
    expect(strengthImprovement([test('2026-01-01', 4000, 10)])).toBe(0);
    expect(strengthImprovement([test('2026-01-08', 5000, 10), test('2026-01-01', 4000, 10)])).toBeCloseTo(0.25);
    expect(strengthImprovement([test('2026-01-01', 4000, 10), test('2026-01-08', 4000, 13)])).toBeCloseTo(0.3);
  });
  it('unlocks the +25% strength badge', () => {
    const ids = evaluateAchievements(ctx({ strengthTests: [test('2026-01-01', 4000, 10), test('2026-01-08', 5000, 10)] }), {});
    expect(ids).toEqual(['first_strength_test', 'strength_plus_25']);
  });
  it('requires all stories read and 30 challenges', () => {
    expect(evaluateAchievements(ctx({ readStories: 19 }), {})).toEqual([]);
    expect(evaluateAchievements(ctx({ readStories: 20, completedChallenges: 30, completedLessons: 5 }), {})).toEqual([
      'lessons_5',
      'all_stories',
      'challenges_30',
    ]);
  });
});
