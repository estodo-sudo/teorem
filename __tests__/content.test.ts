import { CHALLENGES, COURSES, STORIES } from '@/features/content/data';
import { pickDailyChallenges, quizScore, storyOfTheDay } from '@/features/content/daily';

describe('content files', () => {
  it('has 20 stories with 4–8 slides, sources and reviewed=false', () => {
    expect(STORIES).toHaveLength(20);
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(20);
    for (const s of STORIES) {
      expect(s.slides.length).toBeGreaterThanOrEqual(4);
      expect(s.slides.length).toBeLessThanOrEqual(8);
      expect(s.sources.length).toBeGreaterThan(0);
      s.sources.forEach((src) => expect(src.url).toMatch(/^https:\/\//));
      expect(s.reviewed).toBe(false);
    }
  });

  it('covers all six story categories', () => {
    expect(new Set(STORIES.map((s) => s.category))).toEqual(
      new Set(['menHealth', 'relationships', 'nutrition', 'sleep', 'stress', 'exercise']),
    );
  });

  it('has 3 courses × 5 lessons, each with a 2–3 question quiz', () => {
    expect(COURSES).toHaveLength(3);
    for (const c of COURSES) {
      expect(c.lessons).toHaveLength(5);
      expect(c.reviewed).toBe(false);
      for (const l of c.lessons) {
        expect(l.reviewed).toBe(false);
        expect(l.quiz.length).toBeGreaterThanOrEqual(2);
        expect(l.quiz.length).toBeLessThanOrEqual(3);
        for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });

  it('has at least 60 unique challenges in 4 categories', () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(60);
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length);
    expect(new Set(CHALLENGES.map((c) => c.category))).toEqual(new Set(['physical', 'mental', 'social', 'nutrition']));
  });

  it('never mentions the competitor', () => {
    const all = JSON.stringify([STORIES, COURSES, CHALLENGES]).toLowerCase();
    expect(all).not.toContain('dr. kegel');
    expect(all).not.toContain('appercut');
  });
});

describe('daily picks', () => {
  it('picks 3 challenges from different categories, deterministic per date', () => {
    const a = pickDailyChallenges('2026-11-15', CHALLENGES);
    expect(a).toHaveLength(3);
    expect(new Set(a.map((c) => c.category)).size).toBe(3);
    expect(pickDailyChallenges('2026-11-15', CHALLENGES)).toEqual(a);
  });

  it('avoids yesterday’s challenges', () => {
    const y = pickDailyChallenges('2026-11-14', CHALLENGES).map((c) => c.id);
    for (let d = 10; d < 28; d++) {
      const ids = pickDailyChallenges(`2026-11-${d}`, CHALLENGES, y).map((c) => c.id);
      ids.forEach((id) => expect(y).not.toContain(id));
    }
  });

  it('story of the day prefers unread and is stable', () => {
    const s = storyOfTheDay('2026-11-15', STORIES, [])!;
    expect(storyOfTheDay('2026-11-15', STORIES, [])).toBe(s);
    const allButOne = STORIES.slice(1).map((x) => x.id);
    expect(storyOfTheDay('2026-11-15', STORIES, allButOne)!.id).toBe(STORIES[0]!.id);
    expect(storyOfTheDay('2026-11-15', [], [])).toBeUndefined();
  });

  it('scores quizzes', () => {
    expect(quizScore([0, 1, null], [0, 2, 1])).toBeCloseTo(1 / 3);
    expect(quizScore([], [])).toBe(1);
  });
});
