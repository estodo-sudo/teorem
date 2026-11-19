import missionsJson from '@/content/camps/odak/missions.tr.json';
import skillsJson from '@/content/camps/odak/skills.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { ODAK_MISSIONS, ODAK_SKILLS } from '@/features/camps/odak/content';
import { restartAtBoundaries } from '@/features/camps/odak/engine/checkin';
import { ODAK_PHASE_ORDER, odakPhase } from '@/features/camps/odak/engine/phase';
import { lessonOfDay, lessonOpen, lessonOrder, quizScore, todayMission } from '@/features/camps/odak/engine/program';
import { useOdakStore } from '@/features/camps/odak/store';
import type { GoalConfig } from '@/features/camps/odak/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `s:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(2), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

const start = new Date(2026, 10, 1, 10).toISOString();
const goal: GoalConfig = { porn: 'quit', mast: 'none', startedAt: start };
const onDay = (n: number) => new Date(2026, 10, n, 20);

describe('90-day missions', () => {
  it('one a day for days 1–42, then weekly to day 90, each in the right phase', () => {
    const days = ODAK_MISSIONS.map((m) => m.day);
    for (let d = 1; d <= 42; d += 1) expect(days).toContain(d);
    expect(days.filter((d) => d > 42)).toEqual([43, 50, 57, 64, 71, 78, 85, 90]);
    for (const m of ODAK_MISSIONS) expect(m.phase).toBe(odakPhase(start, onDay(m.day)));
    expect(new Set(ODAK_MISSIONS.map((m) => m.id)).size).toBe(ODAK_MISSIONS.length);
  });
  it('shows today’s mission; in the weekly phase the latest open one', () => {
    expect(todayMission(ODAK_MISSIONS, goal, [], onDay(1))?.id).toBe('d1');
    expect(todayMission(ODAK_MISSIONS, goal, [], onDay(30))?.id).toBe('d30');
    expect(todayMission(ODAK_MISSIONS, goal, [], onDay(47))?.id).toBe('d43');
    expect(todayMission(ODAK_MISSIONS, goal, ['d43'], onDay(47))).toBeNull();
    expect(todayMission(ODAK_MISSIONS, goal, [], onDay(100))).toBeNull();
  });
  it('follows the programme start after a relapse (back to phase 2 = day 8)', () => {
    expect(todayMission(ODAK_MISSIONS, restartAtBoundaries(goal, onDay(30)), [], onDay(30))?.id).toBe('d8');
  });
});

describe('skill lessons', () => {
  it('has the 16 lessons of the spec plus the values-congruence bonus, spread over the phases', () => {
    const main = ODAK_SKILLS.filter((l) => !l.bonus);
    expect(main).toHaveLength(16);
    expect(main.map((l) => l.order)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    expect(ODAK_SKILLS.filter((l) => l.bonus).map((l) => l.id)).toEqual(['congruence']);
    // Phases never go backwards in lesson order.
    const idx = main.map((l) => ODAK_PHASE_ORDER.indexOf(l.phase));
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    for (const l of ODAK_SKILLS) {
      expect(l.slides.length).toBeGreaterThanOrEqual(3);
      expect(l.quiz.length).toBeGreaterThanOrEqual(1);
      expect(l.quiz.length).toBeLessThanOrEqual(2);
      for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length);
      expect(l.minutes).toBeGreaterThanOrEqual(3);
      expect(l.minutes).toBeLessThanOrEqual(5);
    }
  });
  it('opens lessons by phase and picks the next one; a high moral-incongruence answer moves the bonus up', () => {
    const lessons = ODAK_SKILLS;
    expect(
      lessonOpen(
        lessons.find((l) => l.id === 'surfing')!,
        'awareness',
      ),
    ).toBe(false);
    expect(
      lessonOpen(
        lessons.find((l) => l.id === 'surfing')!,
        'rebuild',
      ),
    ).toBe(true);
    expect(lessonOfDay(lessons, { moralIncongruence: 2 }, [], 'awareness')?.id).toBe('values');
    // The bonus lesson is open to everyone; with a low answer it simply comes after the main ones.
    expect(lessonOfDay(lessons, { moralIncongruence: 2 }, ['values', 'cycle', 'monitoring'], 'awareness')?.id).toBe('congruence');
    expect(lessonOfDay(lessons, { moralIncongruence: 2 }, ['values', 'cycle', 'monitoring', 'congruence'], 'awareness')).toBeNull();
    expect(lessonOfDay(lessons, { moralIncongruence: 5 }, ['values'], 'awareness')?.id).toBe('congruence');
    expect(
      lessonOrder(lessons, { moralIncongruence: 5 })
        .map((l) => l.id)
        .slice(0, 3),
    ).toEqual(['values', 'congruence', 'cycle']);
    expect(lessonOrder(lessons, null).at(-1)?.id).toBe('congruence');
    expect(quizScore([1, 0], [1, 1])).toBe(0.5);
  });
});

describe('progress (encrypted store)', () => {
  it('keeps completed missions and lessons after reload; a mission counts once', async () => {
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().completeMission('d1');
    await useOdakStore.getState().completeMission('d1');
    await useOdakStore.getState().completeLesson('values', 1);
    useOdakStore.setState({ missionsDone: [], skillsDone: [], ready: false });
    await useOdakStore.getState().hydrate();
    expect(useOdakStore.getState().missionsDone.map((m) => m.id)).toEqual(['d1']);
    expect(useOdakStore.getState().skillsDone[0]).toMatchObject({ id: 'values', quizScore: 1 });
  });
});

describe('programme content rules (spec 0.3 / 7)', () => {
  const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
  const all = [...strings(missionsJson), ...strings(skillsJson)];
  const BANNED = [
    /günah/i,
    /kirli/i,
    /iğrenç/i,
    /sapık/i,
    /zayıf irade/i,
    /başarısız/i,
    /pes ettin/i,
    /sıfırdan başla/i,
    /temiz gün/i,
    /gerçek erkek/i,
    /testosteron/i,
    /süper güç/i,
    /enerji patlaması/i,
    /semen/i,
    /reboot/i,
    /iktidarsız/i,
    /bağımlısın/i,
  ];
  it('no banned words, no percentages, masturbation never harmful', () => {
    for (const s of all) {
      for (const b of BANNED) expect(s).not.toMatch(b);
      expect(s).not.toMatch(/%\s?\d|\d\s?%/);
      if (/mastürbasyon/i.test(s) && /zarar/i.test(s)) expect(s).toMatch(/zararlı kabul edilmez|zararlı değil/);
    }
  });
  it('every lesson is unreviewed, evidence-tagged and sourced from sources.json', () => {
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const l of skillsJson.lessons) {
      expect(l.reviewed).toBe(false);
      expect(['guideline', 'rct', 'review', 'expert']).toContain(l.evidenceLevel);
      expect(l.sourceIds.length).toBeGreaterThan(0);
      for (const id of l.sourceIds) expect(ids.has(id)).toBe(true);
    }
    expect(missionsJson.reviewed).toBe(false);
    for (const id of missionsJson.sourceIds) expect(ids.has(id)).toBe(true);
  });
});
