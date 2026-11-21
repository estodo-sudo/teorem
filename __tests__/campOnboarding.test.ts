import fs from 'fs';
import path from 'path';

import { CAMP_LIBRARY, CAMP_REWARDS, CAMP_MISSIONS, CAMP_ONBOARDING, CAMP_PLANS, CAMP_SKILLS, CAMP_SOURCES, campSources } from '@/features/camps/smoking/content';
import { lessonStatuses, nextLesson, quizScore, recommendedLessons } from '@/features/camps/smoking/engine/skills';
import { CRISIS_BADGES, DAY_BADGES } from '@/features/camps/smoking/engine/stats';
import { FREE_STORIES, isMinor, lessonIsFree, MEDICATION_STORIES, missionIsFree, storyIsFree } from '@/features/camps/smoking/engine/premium';
import { hasAccess } from '@/features/purchases/gate';
import { missionForDay } from '@/features/camps/smoking/engine/plans';
import { buildProfile, defaultAnswers, effectivePerDay, parsePriceTRY, planTriggers, quitPlan, stepError, type Answers } from '@/features/camps/smoking/onboarding';
import { currentPhase, programDay } from '@/features/camps/smoking/engine/phase';
import { calendarDaysBetween } from '@/features/camps/core/time';
import tr from '@/i18n/tr.json';

const now = new Date(2026, 10, 17, 10, 0);
const answers = (over: Partial<Answers> = {}): Answers => ({
  ...defaultAnswers(),
  products: ['cigarette'],
  perDay: 20,
  firstCig: 30,
  priceText: '95',
  reasonIds: ['health'],
  triggers: ['coffee_tea', 'stress', 'after_meal', 'bedtime'],
  pastAttempts: 0,
  ageRange: '25to39',
  ...over,
});

describe('assessment answers', () => {
  it('parses Turkish price input', () => {
    expect(parsePriceTRY('95')).toBe(95);
    expect(parsePriceTRY('95,50')).toBe(95.5);
    expect(parsePriceTRY('95.5')).toBe(95.5);
    expect(parsePriceTRY('1.250')).toBe(1250);
    expect(parsePriceTRY('1.250,75')).toBe(1250.75);
    expect(parsePriceTRY('')).toBeNull();
    expect(parsePriceTRY('0')).toBeNull();
    expect(parsePriceTRY('abc')).toBeNull();
  });
  it('counts hookah-only use per week', () => {
    expect(effectivePerDay({ products: ['hookah'], perDay: 20, hookahPerWeek: 7 })).toBe(1);
    expect(effectivePerDay({ products: ['hookah', 'cigarette'], perDay: 12, hookahPerWeek: 7 })).toBe(12);
  });
  it('blocks steps until they are answered', () => {
    const empty = defaultAnswers();
    expect(stepError('products', empty)).toBe('products');
    expect(stepError('firstCig', empty)).toBe('firstCig');
    expect(stepError('price', empty)).toBe('price');
    expect(stepError('reasons', { ...empty, customReason: '  Kızım için ' })).toBeNull();
    expect(stepError('triggers', empty)).toBe('triggers');
    expect(stepError('attempts', empty)).toBe('attempts');
    expect(stepError('support', empty)).toBe('age');
    expect(stepError('amount', empty)).toBeNull();
    const a = answers();
    for (const s of ['products', 'firstCig', 'price', 'reasons', 'triggers', 'attempts', 'support'] as const) expect(stepError(s, a)).toBeNull();
  });
  it('builds the profile with HSI', () => {
    const p = buildProfile(answers({ customReason: 'Kızım için', pastAttempts: 1, relapseCauses: ['stress'] }), now);
    expect(p).toMatchObject({ perDay: 20, hsiScore: 3, hsiLevel: 'mid', pastAttempts: 1, relapseCauses: ['stress'], method: 'quit_day' });
    expect(p.reasons).toEqual([{ id: 'health' }, { id: 'custom', text: 'Kızım için' }]);
    // Relapse causes are dropped when there was no earlier attempt.
    expect(buildProfile(answers({ relapseCauses: ['stress'] }), now).relapseCauses).toEqual([]);
  });
  it('plans the quit day for each method', () => {
    const q = quitPlan({ ...answers(), method: 'quit_day', quitInDays: 7 }, now);
    expect(calendarDaysBetween(now, new Date(q.plannedQuitDate))).toBe(7);
    expect(q.quitAt).toBeUndefined();
    expect(calendarDaysBetween(now, new Date(quitPlan({ ...answers(), quitInDays: 30 }, now).plannedQuitDate))).toBe(14);
    expect(calendarDaysBetween(now, new Date(quitPlan({ ...answers(), method: 'cut_down', cutWeeks: 3 }, now).plannedQuitDate))).toBe(21);
    const done = quitPlan({ ...answers(), method: 'already_quit', quitDaysAgo: 3 }, now);
    expect(done.quitAt).toBe(done.plannedQuitDate);
    expect(currentPhase({ id: 'x', attemptNo: 1, startedAt: now.toISOString(), plannedQuitDate: done.plannedQuitDate, actualQuitDateTime: done.quitAt, status: 'active' }, now)).toBe('critical_week');
  });
  it('makes first plans for up to three triggers in display order', () => {
    const order = CAMP_ONBOARDING.triggers.map((x) => x.id);
    expect(planTriggers(['bedtime', 'stress', 'coffee_tea', 'after_meal'], order)).toEqual(['coffee_tea', 'after_meal', 'stress']);
  });
});

describe('camp content rules', () => {
  const dir = path.join(__dirname, '..', 'src', 'content', 'camp');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tr.json'));
  const texts = [...files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')), JSON.stringify(tr.camp)];
  const all = texts.join('\n').toLocaleLowerCase('tr');

  it('every content file is marked for review and cites existing sources', () => {
    const ids = new Set(CAMP_SOURCES.map((s) => s.id));
    for (const f of files) {
      const json = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as { reviewed?: boolean; sourceIds?: string[] };
      expect(json.reviewed).toBe(false);
      expect(json.sourceIds?.length).toBeGreaterThan(0);
      for (const id of json.sourceIds ?? []) expect(ids.has(id)).toBe(true);
    }
    expect(CAMP_SOURCES.every((s) => s.url.startsWith('https://') && !/wikipedia/i.test(s.url))).toBe(true);
  });
  it('uses none of the judging words', () => {
    for (const w of ['başarısız', 'pes ettin', 'sıfırdan']) expect(all).not.toContain(w);
  });
  it('names no medication or dose and promises no success rate', () => {
    for (const w of ['vareniklin', 'varenicline', 'bupropion', 'sitizin', 'cytisine', 'nikotin bandı', 'nikotin sakızı', ' mg']) expect(all).not.toContain(w);
    expect(all).not.toMatch(/%\s?\d|\d\s?%/);
  });
  it('never suggests e-cigarettes as a way to quit', () => {
    expect(all).not.toMatch(/e-?sigaraya (geç|geçebilirsin)|elektronik sigaraya geç/);
  });
  it('has an if–then template for every trigger', () => {
    for (const t of CAMP_ONBOARDING.triggers) expect(CAMP_PLANS.templates[t.id]?.then.length).toBeGreaterThanOrEqual(2);
  });
});

describe('camp missions (K7)', () => {
  const all = CAMP_MISSIONS.missions;
  it('has at least 90 well-formed, uniquely named missions', () => {
    expect(all.length).toBeGreaterThanOrEqual(90);
    expect(new Set(all.map((m) => m.id)).size).toBe(all.length);
    for (const m of all) {
      expect(m.reviewed).toBe(false);
      expect(m.title.length).toBeGreaterThan(3);
      expect(m.body.length).toBeGreaterThan(20);
      expect(m.durationMin).toBeGreaterThan(0);
      expect(['action', 'reflection', 'learning', 'social']).toContain(m.type);
      expect(m.bctCodes.length).toBeGreaterThan(0);
      for (const c of m.bctCodes) expect(c).toMatch(/^\d{1,2}\.\d{1,2}$/);
    }
  });
  it('covers every day where the programme expects one', () => {
    const days = (phase: string) => new Set(all.filter((m) => m.phase === phase).map((m) => m.day));
    for (let d = 1; d <= 28; d += 1) expect(days('preparation').has(d)).toBe(true);
    expect(days('quit_day').has(0)).toBe(true);
    for (let d = 1; d <= 7; d += 1) expect(days('critical_week').has(d)).toBe(true);
    for (let d = 8; d <= 30; d += 1) expect(days('strengthening').has(d)).toBe(true);
    // Maintenance: 2–3 a week over days 31–90.
    const mnt = [...days('maintenance')].sort((a, b) => a - b);
    expect(mnt.every((d) => d >= 31 && d <= 90)).toBe(true);
    for (let w = 31; w <= 84; w += 7) expect(mnt.filter((d) => d >= w && d < w + 7).length).toBeGreaterThanOrEqual(2);
  });
  it('gives a mission for every day of a real attempt', () => {
    const a = { id: 'a', attemptNo: 1, startedAt: new Date(2026, 10, 3).toISOString(), plannedQuitDate: new Date(2026, 10, 10).toISOString(), status: 'preparing' as const };
    for (let i = 0; i < 31; i += 1) {
      const now = new Date(2026, 10, 3 + i, 12);
      const { phase, day } = programDay(i < 7 ? a : { ...a, status: 'active', actualQuitDateTime: a.plannedQuitDate }, now);
      expect(missionForDay(all, phase, day, [])).not.toBeNull();
    }
  });
  it('has a quit-day checklist', () => {
    expect(CAMP_MISSIONS.quitDay.checklist.length).toBeGreaterThanOrEqual(4);
  });
});

describe('skills and library (K8)', () => {
  const L = CAMP_SKILLS.lessons;
  it('has 12+ ordered ACT lessons with practice and quiz, and 15+ library stories', () => {
    expect(L.filter((l) => !l.bonus).length).toBeGreaterThanOrEqual(12);
    for (const l of L) {
      expect(l.slides.length).toBeGreaterThanOrEqual(3);
      expect(l.practice.text.length).toBeGreaterThan(10);
      expect(l.quiz.length).toBeGreaterThanOrEqual(1);
      for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length);
      expect(campSources(l.sourceIds)).toHaveLength(l.sourceIds.length);
    }
    expect(CAMP_LIBRARY.stories.length).toBeGreaterThanOrEqual(15);
    for (const s of CAMP_LIBRARY.stories) {
      expect(s.slides.length).toBeGreaterThanOrEqual(3);
      expect(campSources(s.sourceIds)).toHaveLength(s.sourceIds.length);
    }
  });
  it('opens lessons in order and brings related ones forward', () => {
    const st = lessonStatuses(L, [], []);
    expect(st.values).toBe('open');
    expect(st.wave).toBe('locked');
    expect(st['sexual-health']).toBe('locked');
    const after1 = lessonStatuses(L, ['values'], []);
    expect(after1.wave).toBe('open');
    expect(after1['sexual-health']).toBe('open');
    // Earlier relapse because of weight → the weight lesson is open and suggested first.
    expect(lessonStatuses(L, [], ['weight']).weight).toBe('open');
    expect(recommendedLessons(L, [], ['weight'])).toEqual(['weight']);
    expect(nextLesson(L, [], ['weight'])).toBe('weight');
    expect(nextLesson(L, [], [])).toBe('values');
    expect(
      nextLesson(
        L,
        L.map((l) => l.id),
        [],
      ),
    ).toBeNull();
  });
  it('scores quizzes', () => {
    expect(quizScore([1, 0], [1, 1])).toBe(0.5);
    expect(quizScore([], [])).toBe(1);
  });
});

describe('rewards content (K11)', () => {
  it('describes every badge the engine can award', () => {
    const ids = CAMP_REWARDS.badges.map((b) => b.id);
    for (const d of DAY_BADGES) expect(ids).toContain(`days-${d}`);
    for (const c of CRISIS_BADGES) expect(ids).toContain(`crisis-${c}`);
    expect(ids).toEqual(expect.arrayContaining(['first-plan', 'all-skills', 'checkin-7', 'saved-1000', 'graduate']));
  });
});

describe('camp notification texts (K12)', () => {
  const n = tr.camp.notif as unknown as { explicit: Record<string, string>; discreet: Record<string, string> };
  it('has explicit and discreet texts for every kind', () => {
    expect(Object.keys(n.discreet).sort()).toEqual(Object.keys(n.explicit).sort());
    for (const k of ['prep', 'quit', 'morning', 'evening', 'daily', 'maintenance', 'risky', 'badge', 'health']) {
      expect(n.explicit[`${k}Title`]).toBeTruthy();
      expect(n.discreet[`${k}Body`]).toBeTruthy();
    }
  });
  it('never says "sigara" in discreet mode', () => {
    for (const v of Object.values(n.discreet)) expect(v.toLocaleLowerCase('tr')).not.toMatch(/sigara|nikotin|tütün|duman/);
  });
});

describe('free / premium split (K13)', () => {
  it('keeps the crisis basics free and gates the rest', () => {
    expect(missionIsFree('preparation')).toBe(true);
    expect(missionIsFree('critical_week')).toBe(true);
    expect(missionIsFree('strengthening')).toBe(false);
    const free = CAMP_SKILLS.lessons.filter((l) => lessonIsFree(l.order, l.bonus)).map((l) => l.id);
    expect(free).toEqual(['values', 'wave', 'surf']);
    for (const id of FREE_STORIES) expect(CAMP_LIBRARY.stories.some((s) => s.id === id)).toBe(true);
    expect(storyIsFree('hookah')).toBe(false);
  });
  it('gates camp premium like courses in both paywall modes', () => {
    const ctx = (mode: 'hard' | 'freemium', entitled = false) => ({ mode, entitled, completedWorkouts: 0, level: 1, devBypass: false });
    expect(hasAccess('camp', ctx('hard'))).toBe(false);
    expect(hasAccess('camp', ctx('freemium'))).toBe(false);
    expect(hasAccess('camp', ctx('hard', true))).toBe(true);
  });
});

describe('camp accessibility (K13)', () => {
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.tsx') ? [path.join(dir, e.name)] : []));
  const files = [...walk(path.join(__dirname, '..', 'app', 'camp')), ...walk(path.join(__dirname, '..', 'src', 'features', 'camps'))];
  it('every camp button has a role and a touch target of at least 48', () => {
    let checked = 0;
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<Pressable\b([\s\S]*?)(?<!=)>/g)) {
        const tag = m[1]!;
        checked += 1;
        if (!tag.includes('importantForAccessibility="no"')) expect([path.basename(f), tag.includes('accessibilityRole')]).toEqual([path.basename(f), true]);
        for (const n of tag.matchAll(/(?:minHeight|height|width): (\d+)/g)) expect([path.basename(f), Number(n[1])]).toEqual([path.basename(f), Math.max(48, Number(n[1]))]);
      }
    }
    expect(checked).toBeGreaterThan(40);
  });
});

describe('under-18 rule (K13)', () => {
  it('names the medication content to hide for minors', () => {
    expect(isMinor('under18')).toBe(true);
    expect(isMinor('25to39')).toBe(false);
    for (const id of MEDICATION_STORIES) expect(CAMP_LIBRARY.stories.some((s) => s.id === id)).toBe(true);
  });
});
