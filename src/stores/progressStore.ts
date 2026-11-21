import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ChallengeLog, ContentProgress } from '@/types';

import { persistStorage } from './storage';

export const defaultContentProgress = (): ContentProgress => ({
  readStoryIds: [],
  favoriteStoryIds: [],
  courseProgress: {},
});

export interface ProgressSnapshot {
  content: ContentProgress;
  /** Keyed by date key. */
  challengeLogs: Record<string, ChallengeLog>;
  /** achievementId → ISO unlock time. */
  achievements: Record<string, string>;
  /** Date key of the last completed mind / breathing session (for Today hints). */
  lastMindSession: string | null;
}

interface ProgressStore extends ProgressSnapshot {
  /** Newly unlocked achievement ids waiting for the celebration overlay. */
  celebrationQueue: string[];
  markStoryRead: (id: string) => void;
  toggleFavorite: (id: string) => void;
  /** Remembers where a story was left; `null` forgets it (the story was finished). */
  setStoryPosition: (id: string, index: number | null) => void;
  completeLesson: (courseId: string, lessonId: string, score: number) => void;
  setChallengeLog: (log: ChallengeLog) => void;
  unlockAchievements: (ids: string[], at?: string) => void;
  shiftCelebration: () => void;
  setLastMindSession: (date: string) => void;
  replace: (s: ProgressSnapshot) => void;
  reset: () => void;
}

const initial = (): ProgressSnapshot => ({
  content: defaultContentProgress(),
  challengeLogs: {},
  achievements: {},
  lastMindSession: null,
});

const uniq = (arr: string[]) => Array.from(new Set(arr));

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      ...initial(),
      celebrationQueue: [],
      markStoryRead: (id) =>
        set((s) => ({
          content: { ...s.content, readStoryIds: uniq([...s.content.readStoryIds, id]) },
        })),
      toggleFavorite: (id) =>
        set((s) => {
          const fav = s.content.favoriteStoryIds;
          return {
            content: {
              ...s.content,
              favoriteStoryIds: fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id],
            },
          };
        }),
      setStoryPosition: (id, index) =>
        set((s) => {
          const next = { ...(s.content.storyPositions ?? {}) };
          if (index === null || index <= 0) delete next[id];
          else next[id] = index;
          return { content: { ...s.content, storyPositions: next } };
        }),
      completeLesson: (courseId, lessonId, score) =>
        set((s) => {
          const prev = s.content.courseProgress[courseId] ?? {
            completedLessonIds: [],
            quizScores: {},
          };
          const best = Math.max(prev.quizScores[lessonId] ?? 0, score);
          return {
            content: {
              ...s.content,
              courseProgress: {
                ...s.content.courseProgress,
                [courseId]: {
                  completedLessonIds: uniq([...prev.completedLessonIds, lessonId]),
                  quizScores: { ...prev.quizScores, [lessonId]: best },
                },
              },
            },
          };
        }),
      setChallengeLog: (log) =>
        set((s) => ({ challengeLogs: { ...s.challengeLogs, [log.date]: log } })),
      unlockAchievements: (ids, at) =>
        set((s) => {
          const fresh = ids.filter((id) => !s.achievements[id]);
          if (fresh.length === 0) return {};
          const when = at ?? new Date().toISOString();
          const next = { ...s.achievements };
          fresh.forEach((id) => (next[id] = when));
          return { achievements: next, celebrationQueue: [...s.celebrationQueue, ...fresh] };
        }),
      shiftCelebration: () => set((s) => ({ celebrationQueue: s.celebrationQueue.slice(1) })),
      setLastMindSession: (date) => set({ lastMindSession: date }),
      replace: (snap) => set({ ...initial(), ...snap, celebrationQueue: [] }),
      reset: () => set({ ...initial(), celebrationQueue: [] }),
    }),
    {
      name: 'progress',
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({
        content: s.content,
        challengeLogs: s.challengeLogs,
        achievements: s.achievements,
        lastMindSession: s.lastMindSession,
      }),
    },
  ),
);
