import { createRng, shuffle } from '@/lib/random';
import type { ChallengeCategory } from '@/types';

import type { Challenge, Story } from './data';

/**
 * 3 challenges for a date, each from a different category. Deterministic per
 * date; avoids repeating yesterday's challenge ids when possible.
 */
export function pickDailyChallenges(date: string, all: readonly Challenge[], avoidIds: readonly string[] = []): Challenge[] {
  const rng = createRng(`challenges|${date}`);
  const cats = shuffle(rng, ['physical', 'mental', 'social', 'nutrition'] as ChallengeCategory[]).slice(0, 3);
  const out: Challenge[] = [];
  for (const cat of cats) {
    const pool = all.filter((c) => c.category === cat);
    const fresh = pool.filter((c) => !avoidIds.includes(c.id));
    const from = fresh.length ? fresh : pool;
    if (from.length) out.push(from[Math.floor(rng() * from.length)]!);
  }
  return out;
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
