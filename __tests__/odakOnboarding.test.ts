import fs from 'fs';
import path from 'path';

import onboardingJson from '@/content/camps/odak/onboarding.tr.json';
import plansJson from '@/content/camps/odak/plans.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { ODAK_ONBOARDING as ONB, ODAK_PLANS } from '@/features/camps/odak/content';
import { bpsHigh, bpsScore, onboardingReferral, phqGadFlags, twoItemScore } from '@/features/camps/odak/engine/screening';
import { buildGoal, buildPlans, buildProfile, buildScreenings, defaultAnswers, planTriggers, QUESTIONS, SKIPPABLE, STEPS, stepError, toggleRange, type Answers } from '@/features/camps/odak/onboarding';
import { useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { sanitizeOdak, useOdakStore } from '@/features/camps/odak/store';
import tr from '@/i18n/tr.json';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockBackend = createMemoryVaultBackend();
  const mockCodec = { seal: async (t: string) => `x${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(1), 'base64').toString() };
  const mockVault = createVault(mockBackend, mockCodec);
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear(), mockBackend };
});

const now = new Date('2026-11-18T10:00:00Z');
const filled = (patch: Partial<Answers> = {}): Answers => ({
  ...defaultAnswers(),
  adult: true,
  reasons: ['porn_control', 'other'],
  reasonOther: '  Gece uykumu bölüyor  ',
  bps: [1, 1, 0, 2, 1],
  freqPorn: 6,
  freqMast: 20,
  triggers: ['stress', 'night_bed', 'boredom', 'social_media'],
  values: ['focus'],
  phq: [1, 2],
  gad: [0, 1],
  porn: 'quit',
  mast: 'pause',
  mastPauseDays: 30,
  ...patch,
});

describe('screening scores', () => {
  it('scores the BPS only when complete; 4+ is high', () => {
    expect(bpsScore([1, 1, 0, 2, 1])).toBe(5);
    expect(bpsScore([1, null, 0, 2, 1])).toBeNull();
    expect(bpsScore([1, 3, 0, 2, 1])).toBeNull();
    expect(bpsScore([1, 1, 0])).toBeNull();
    expect([bpsHigh(3), bpsHigh(4), bpsHigh(null)]).toEqual([false, true, false]);
  });
  it('flags PHQ-2 / GAD-2 at 3+', () => {
    expect(twoItemScore([1, 2])).toBe(3);
    expect(twoItemScore([1, 4])).toBeNull();
    expect(phqGadFlags(3, 2)).toEqual({ depression: true, anxiety: false, any: true });
    expect(phqGadFlags(2, 2).any).toBe(false);
    expect(onboardingReferral(5, 1, 3)).toEqual({ expert: true, mood: true });
    expect(onboardingReferral(null, 0, 0)).toEqual({ expert: false, mood: false });
  });
});

describe('enrolment steps', () => {
  it('has 11 questions in order, the 18+ gate first and the commitment last', () => {
    expect(QUESTIONS).toHaveLength(11);
    expect(STEPS[0]).toBe('age');
    expect(STEPS.slice(1, 3)).toEqual(['facts', 'lock']);
    expect(STEPS[STEPS.length - 1]).toBe('commit');
    for (const q of QUESTIONS) expect(STEPS).toContain(q);
    for (const s of SKIPPABLE) expect(stepError(s, defaultAnswers())).toBeNull();
  });
  it('blocks required steps until answered', () => {
    const a = defaultAnswers();
    expect(stepError('age', a)).toBe('age');
    expect(stepError('reasons', a)).toBe('reasons');
    expect(stepError('bps', a)).toBe('bps');
    expect(stepError('bps', a, { bpsPlaceholder: true })).toBeNull();
    expect(stepError('values', a)).toBe('values');
    expect(stepError('values', { ...a, valuesText: 'Odaklı olmak' })).toBeNull();
    expect(stepError('mood', a)).toBe('mood');
    expect(stepError('goal', a)).toBe('goal');
    const f = filled();
    for (const s of STEPS) expect(stepError(s, f)).toBeNull();
    expect(stepError('goal', filled({ porn: 'reduce', pornWeeklyMax: 0 }))).toBe('goalNumber');
    expect(stepError('goal', filled({ mast: 'pause', mastPauseDays: 400 }))).toBe('goalNumber');
    expect(stepError('goal', filled({ mast: 'reduce', mastWeeklyMax: 8 }))).toBe('goalNumber');
  });
});

describe('building the plan', () => {
  it('builds profile, goal, screenings and first plans', () => {
    const a = filled({ risky: toggleRange(toggleRange([], { from: '23:00', to: '01:00' }), { from: '06:00', to: '09:00' }) });
    const p = buildProfile(a, now);
    expect(p).toMatchObject({ reasonOther: 'Gece uykumu bölüyor', bpsScore: 5, freqPorn2w: 6, freqMast2w: 14, phq2: 3, gad2: 1, createdAt: now.toISOString() });
    expect(p.riskyHours).toEqual([
      { from: '23:00', to: '01:00' },
      { from: '06:00', to: '09:00' },
    ]);
    expect(buildProfile(filled({ reasons: ['time'] }), now).reasonOther).toBeUndefined();
    expect(buildGoal(a, now)).toEqual({ porn: 'quit', mast: 'pause', mastPauseDays: 30, startedAt: now.toISOString() });
    expect(buildGoal(filled({ porn: 'reduce', pornWeeklyMax: 2, mast: 'reduce', mastWeeklyMax: 3 }), now)).toEqual({ porn: 'reduce', pornWeeklyMax: 2, mast: 'reduce', mastWeeklyMax: 3, startedAt: now.toISOString() });
    expect(buildScreenings(a, now).map((s) => [s.type, s.score])).toEqual([
      ['BPS', 5],
      ['PHQ2', 3],
      ['GAD2', 1],
    ]);
    expect(buildScreenings(filled({ bps: [null, null, null, null, null] }), now).map((s) => s.type)).toEqual(['PHQ2', 'GAD2']);
    const order = ONB.triggers.options.map((o) => o.id);
    expect(planTriggers(a.triggers, order)).toEqual(['night_bed', 'stress', 'boredom']);
    const plans = buildPlans([{ trigger: 'stress', ifText: 'x', thenText: 'y' }], now);
    expect(plans[0]).toMatchObject({ trigger: 'stress', ifText: 'x', thenText: 'y', createdAt: now.toISOString() });
    expect(toggleRange([{ from: '06:00', to: '09:00' }], { from: '06:00', to: '09:00' })).toEqual([]);
  });
});

describe('Odak store (encrypted vault)', () => {
  beforeEach(async () => {
    await useOdakStore.getState().wipe();
  });
  it('enrols, writes only sealed rows, and reads back after a restart', async () => {
    const a = filled();
    await useOdakStore.getState().enrol({ profile: buildProfile(a, now), goal: buildGoal(a, now), plans: buildPlans([{ trigger: 'stress', ifText: 'gergin olursam', thenText: 'Nefes alırım.' }], now), screenings: buildScreenings(a, now) });
    expect(useOdakLockStore.getState().enrolled).toBe(true);
    const { mockBackend } = jest.requireMock('@/features/camps/odak/privacy/device') as { mockBackend: { rows: Map<string, { data: string }> } };
    expect(mockBackend.rows.size).toBe(1 + 1 + 1 + 3);
    for (const r of mockBackend.rows.values()) expect(r.data).not.toMatch(/Gece|gergin|quit/);
    useOdakStore.setState({ profile: null, goal: null, plans: [], screenings: [], ready: false });
    await useOdakStore.getState().hydrate();
    const s = useOdakStore.getState();
    expect(s.ready).toBe(true);
    expect(s.goal?.porn).toBe('quit');
    expect(s.plans.map((p) => p.thenText)).toEqual(['Nefes alırım.']);
    expect(s.screenings).toHaveLength(3);
    expect(s.profile?.reasonOther).toBe('Gece uykumu bölüyor');
  });
  it('wipe removes everything and the enrolled flag', async () => {
    const a = filled();
    await useOdakStore.getState().enrol({ profile: buildProfile(a, now), goal: buildGoal(a, now), plans: [], screenings: [] });
    await useOdakStore.getState().wipe();
    expect(useOdakLockStore.getState().enrolled).toBe(false);
    await useOdakStore.getState().hydrate();
    expect(useOdakStore.getState().profile).toBeNull();
  });
  it('sanitizes damaged vault contents', () => {
    expect(sanitizeOdak({ profile: { reasons: 'x' }, goal: 42 }, { plans: [{ id: 1 }, null], screenings: [{ id: 's', score: 'x' }] })).toMatchObject({ profile: null, goal: null, plans: [], screenings: [], events: [], urges: [], letter: null, checkins: [] });
  });
});

describe('Odak content rules (spec 0.3 / 7)', () => {
  const content = [onboardingJson, plansJson];
  const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
  const all = [...content.flatMap(strings), ...strings((tr as Record<string, unknown>).odak)];
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
    /KCDB'n/i,
  ];
  it('uses none of the banned words, no percentages and no labels', () => {
    for (const s of all) {
      for (const b of BANNED) expect(s).not.toMatch(b);
      expect(s).not.toMatch(/%\s?\d|\d\s?%/);
    }
  });
  it('never presents masturbation as harmful', () => {
    for (const s of all.filter((x) => /mastürbasyon/i.test(x) && /zarar/i.test(x))) expect(s).toMatch(/zararlı kabul edilmez|zararlı değil/);
  });
  it('every block is unreviewed, evidence-tagged and has known sources', () => {
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const c of content) {
      expect(c.reviewed).toBe(false);
      expect(['guideline', 'rct', 'review', 'expert']).toContain(c.evidenceLevel);
      expect(c.sourceIds.length).toBeGreaterThan(0);
      for (const id of c.sourceIds) expect(ids.has(id)).toBe(true);
    }
    for (const s of sourcesJson) expect(s.url).toMatch(/^https:\/\//);
  });
  it('has a plan template for every trigger and well-formed scales', () => {
    for (const o of ONB.triggers.options) expect(ODAK_PLANS.templates[o.id]?.then.length).toBeGreaterThanOrEqual(2);
    expect(ONB.bps.items).toHaveLength(5);
    expect(ONB.bps.options.map((o) => o.value)).toEqual([0, 1, 2]);
    expect(ONB.bps.threshold).toBe(4);
    expect(ONB.mood.phq).toHaveLength(2);
    expect(ONB.mood.gad).toHaveLength(2);
    expect(ONB.mood.options.map((o) => o.value)).toEqual([0, 1, 2, 3]);
    expect(ONB.moral.scale).toHaveLength(5);
  });
  it('the BPS stays a placeholder until the translation is confirmed (docs/SCALES.md)', () => {
    expect(ONB.bps.placeholder).toBe(true);
    const scales = fs.readFileSync(path.join(__dirname, '..', 'docs', 'SCALES.md'), 'utf8');
    expect(scales).toMatch(/BPS/);
    expect(scales).toMatch(/PHQ-2/);
    expect(scales).toMatch(/GAD-2/);
  });
  it('under-18 users are pointed to adults, school counsellors and 115; 112 always shown', () => {
    expect(ONB.under18.help.map((h) => h.id)).toEqual(['adult', 'school', 'yedam']);
    expect(ONB.under18.help.find((h) => h.id === 'yedam')).toMatchObject({ phone: '115', needsVerification: true });
    expect(ONB.under18.emergency).toMatch(/112/);
    expect(ONB.expert.emergency).toMatch(/112/);
    expect(ONB.expert.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
