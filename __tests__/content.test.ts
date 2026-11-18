import { CHALLENGES, COURSES, GLOSSARY, NUTRITION_DAYS, NUTRITION_PLAN, STORIES } from '@/features/content/data';
import { nutritionDayIndex, nutritionTasksForDay, quizScore, storyOfTheDay } from '@/features/content/daily';

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

  it('has 5 courses × 5 lessons with unique ids, each with a 2–3 question quiz', () => {
    expect(COURSES).toHaveLength(5);
    expect(new Set(COURSES.map((c) => c.id)).size).toBe(COURSES.length);
    const lessonIds = COURSES.flatMap((c) => c.lessons.map((l) => l.id));
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
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

  it('has short nutrition tasks in 3 groups, each with a reason and a source', () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(36);
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length);
    expect(new Set(CHALLENGES.map((c) => c.category))).toEqual(new Set(['snack', 'fruit', 'plate']));
    expect(new Set(CHALLENGES.map((c) => c.text)).size).toBe(CHALLENGES.length);
    for (const c of CHALLENGES) {
      expect(c.why.trim().length).toBeGreaterThan(15);
      expect(c.text.length).toBeLessThanOrEqual(80);
      expect(c.source.url).toMatch(/^https:\/\//);
      expect(c.emoji).not.toBe('');
    }
    // No promises of cures or guaranteed results.
    const all = JSON.stringify(CHALLENGES).toLocaleLowerCase('tr-TR');
    expect(all).not.toMatch(/tedavi eder|garanti|kesin çözüm/);
    // Foods only, no referrals out of the app.
    expect(all).not.toMatch(/doktor|eczacı|hap/);
  });

  it('has "Neden, Nedir ve Ne Demek?" entries with unique ids and non-empty sections', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(3);
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length);
    for (const g of GLOSSARY) {
      expect(g.title.trim()).not.toBe('');
      expect(g.summary.trim()).not.toBe('');
      expect(g.sections.length).toBeGreaterThan(0);
      for (const s of g.sections) expect(s.text.trim()).not.toBe('');
      expect(new Set(g.sections.map((s) => s.title)).size).toBe(g.sections.length);
    }
  });

  it('lists the sexual-health topics right after Kegel, each with sources', () => {
    const ids = GLOSSARY.map((g) => g.id);
    expect(ids.slice(0, 11)).toEqual([
      'kegel',
      'premature-ejaculation',
      'erectile-dysfunction',
      'masturbation',
      'lasting-longer',
      'partner-satisfaction',
      'morning-erection',
      'low-desire',
      'dribble',
      'tight-pelvic-floor',
      'after-prostate-surgery',
    ]);
    for (const g of GLOSSARY.slice(0, 11)) {
      expect(g.sections.some((x) => x.title === 'Kaynaklar')).toBe(true);
      expect(g.sections.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('never mentions the competitor', () => {
    const all = JSON.stringify([STORIES, COURSES, CHALLENGES, GLOSSARY]).toLowerCase();
    expect(all).not.toContain('dr. kegel');
    expect(all).not.toContain('appercut');
  });
});

describe('daily picks', () => {
  it('has a 28-day plan with one snack, one fruit and one plate task per day', () => {
    expect(NUTRITION_DAYS).toBe(28);
    expect(NUTRITION_PLAN).toHaveLength(28);
    for (let d = 0; d < 28; d++) {
      const tasks = nutritionTasksForDay(NUTRITION_PLAN, CHALLENGES, d);
      expect(tasks.map((c) => c.category)).toEqual(['snack', 'fruit', 'plate']);
      // A food is not repeated on the next day.
      const next = NUTRITION_PLAN[(d + 1) % 28]!;
      tasks.forEach((c) => expect(next).not.toContain(c.id));
    }
    // Every food appears in the cycle; days are all different.
    const used = new Set(NUTRITION_PLAN.flat());
    expect(used.size).toBe(CHALLENGES.length);
    expect(new Set(NUTRITION_PLAN.map((p) => p.join())).size).toBe(28);
  });

  it('counts the plan day from the start date and repeats after 28 days', () => {
    expect(nutritionDayIndex('2026-11-01', '2026-11-01', 28)).toBe(0);
    expect(nutritionDayIndex('2026-11-01', '2026-11-05', 28)).toBe(4);
    expect(nutritionDayIndex('2026-11-01', '2026-11-29', 28)).toBe(0);
    expect(nutritionDayIndex('2026-11-10', '2026-11-09', 28)).toBe(27);
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
