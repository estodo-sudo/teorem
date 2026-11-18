import { ALC } from '@/features/campus/alcohol/content';
import {
  ALC_GUIDE_STEP_IDS,
  alcPhase,
  AUDIT_QUESTIONS,
  auditBand,
  auditScore,
  CUT_LIMITS,
  DAY_MS,
  dayTotal,
  defaultAlcState,
  dryDays,
  lastDays,
  longestDryDays,
  QUIT_GOALS,
  sanitizeAlcState,
  standardDrinks,
  thisWeek,
  WITHDRAWAL_QUESTIONS,
  withdrawalRisk,
  type AlcState,
} from '@/features/campus/alcohol/logic';
import { useCampusStore } from '@/stores/campusStore';

const iso = (d: Date) => d.toISOString();
const base = (extra: Partial<AlcState>): AlcState => ({ ...defaultAlcState(), setupDone: true, ...extra });
const drink = (at: Date, std = 1.3, typeId = 'beer33') => ({ at: iso(at), typeId, std });

describe('alcohol campus · standard drinks and screening', () => {
  it('computes standard drinks (10 g of pure alcohol)', () => {
    expect(standardDrinks(330, 0.05)).toBe(1.3);
    expect(standardDrinks(150, 0.13)).toBe(1.5);
    expect(standardDrinks(40, 0.45)).toBe(1.4);
    // Content values match the formula.
    expect(ALC.drinks.find((d) => d.id === 'raki2')!.std).toBe(standardDrinks(80, 0.45));
  });

  it('scores AUDIT-C (0–12) with the 4+ cut-off for men', () => {
    expect(auditScore(null)).toBe(0);
    expect(auditScore([1, 1, 1])).toBe(3);
    expect(auditBand(3, ALC.audit.bands)!.id).toBe('low');
    expect(auditBand(4, ALC.audit.bands)!.id).toBe('risky');
    expect(auditBand(8, ALC.audit.bands)!.id).toBe('high');
    expect(auditBand(12, ALC.audit.bands)!.id).toBe('high');
  });

  it('flags withdrawal risk on any yes', () => {
    expect(withdrawalRisk(null)).toBe(false);
    expect(withdrawalRisk([false, false, false, false])).toBe(false);
    expect(withdrawalRisk([false, true, false, false])).toBe(true);
  });
});

describe('alcohol campus · diary', () => {
  // Monday 16 Nov 2026, 21:00.
  const now = new Date(2026, 10, 16, 21);

  it('sums this week (from Monday), alcohol-free days and heavy days', () => {
    const s = base({
      startedAt: iso(new Date(2026, 10, 9, 9)),
      firstStartedAt: iso(new Date(2026, 10, 9, 9)),
      weeklyLimit: 7,
      drinks: [drink(new Date(2026, 10, 15, 20), 2.8, 'raki2'), drink(new Date(2026, 10, 16, 19)), drink(new Date(2026, 10, 16, 20))],
    });
    const w = thisWeek(s, now);
    expect(w.total).toBe(2.6); // Sunday belongs to last week
    expect(w).toMatchObject({ limit: 7, over: false, freeDays: 0, daysSoFar: 1, heavyDays: 0 });
    expect(dayTotal(s, '2026-11-16')).toBe(2.6);
    const days = lastDays(s, now);
    expect(days).toHaveLength(7);
    expect(days[6]).toEqual({ key: '2026-11-16', std: 2.6, before: false });
    expect(days[5]).toEqual({ key: '2026-11-15', std: 2.8, before: false });
    expect(days[0]).toMatchObject({ key: '2026-11-10', before: false });
    expect(lastDays(s, now, 10)[0]).toMatchObject({ key: '2026-11-07', before: true });
  });

  it('counts alcohol-free days only since the start', () => {
    const start = new Date(2026, 10, 18, 9); // Wednesday
    const later = new Date(2026, 10, 21, 22); // Saturday
    const s = base({ startedAt: iso(start), firstStartedAt: iso(start), drinks: [drink(new Date(2026, 10, 19, 20), 5)] });
    const w = thisWeek(s, later);
    expect(w.daysSoFar).toBe(4); // Wed..Sat
    expect(w.freeDays).toBe(3);
    expect(w.heavyDays).toBe(1); // 5 > 4 standard drinks
  });

  it('counts alcohol-free time from the last drink on the quit path', () => {
    const s = base({ mode: 'quit', quitGoalDays: 14, startedAt: iso(new Date(now.getTime() - 10 * DAY_MS)), firstStartedAt: iso(new Date(now.getTime() - 20 * DAY_MS)) });
    expect(dryDays(s, now)).toBe(10);
    s.drinks = [drink(new Date(now.getTime() - 3.5 * DAY_MS))];
    expect(dryDays(s, now)).toBe(3);
    // Longest stretch: from the first start (20 days ago) to that drink (3.5 days ago).
    expect(longestDryDays(s, now)).toBe(16);
  });
});

describe('alcohol campus · content and safety', () => {
  it('is complete and consistent with the code', () => {
    expect(ALC.steps.map((x) => x.id)).toEqual([...ALC_GUIDE_STEP_IDS]);
    expect(ALC.audit.questions).toHaveLength(AUDIT_QUESTIONS);
    // Official AUDIT-C scores; the first question has no "never" option (scores 1–4).
    expect(ALC.audit.questions.map((q) => q.options.map((o) => o.score))).toEqual([
      [1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
    ]);
    expect(ALC.audit.questions[0]!.options.some((o) => o.text === 'Hiç')).toBe(false);
    expect(ALC.withdrawal.questions).toHaveLength(WITHDRAWAL_QUESTIONS);
    expect(ALC.cutLimits).toEqual([...CUT_LIMITS]);
    expect(ALC.quitGoals).toEqual([...QUIT_GOALS]);
    for (const g of [ALC.drinks, ALC.reasons, ALC.triggers, ALC.help, ALC.steps, ALC.sexual]) expect(new Set(g.map((x) => x.id)).size).toBe(g.length);
    expect(ALC.reviewed).toBe(false);
    ALC.sources.forEach((s) => expect(s.url).toMatch(/^https:\/\//));
  });

  it('warns about 112 in text (no 112 call button), offers AMATEM, and never promises a safe amount', () => {
    expect(ALC.withdrawal.emergency).toContain('112');
    expect(ALC.help.find((h) => h.id === 'emergency')!.text).toContain('112');
    expect(ALC.help.filter((h) => h.phone).map((h) => h.phone)).toEqual(['182']);
    expect(ALC.tips.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ALC.tips.map((x) => x.id)).size).toBe(ALC.tips.length);
    for (const k of ['std', 'audit', 'statsCut', 'statsQuit'] as const) expect(ALC.info[k].text.trim()).not.toBe('');
    const all = JSON.stringify(ALC).toLocaleLowerCase('tr-TR');
    expect(all).not.toMatch(/güvenli (bir )?miktar(da| içebilir)|garanti|tedavi eder/);
  });

  it('sanitizes broken imported data', () => {
    expect(sanitizeAlcState(null)).toEqual(defaultAlcState());
    const s = sanitizeAlcState({ setupDone: true, startedAt: 'x', weeklyLimit: 20, quitGoalDays: 5, audit: [5, 1, 1], withdrawal: [true], drinks: [{ at: '2026-11-01T20:00:00.000Z', typeId: 'wine', std: 1.5 }, { at: 'x', typeId: 'wine', std: 1 }, { at: '2026-11-01T21:00:00.000Z', typeId: 'wine', std: -2 }] });
    expect(s.setupDone).toBe(false);
    expect(s.weeklyLimit).toBe(10);
    expect(s.quitGoalDays).toBe(30);
    expect(s.audit).toBeNull();
    expect(s.withdrawal).toBeNull();
    expect(s.drinks).toEqual([{ at: '2026-11-01T20:00:00.000Z', typeId: 'wine', std: 1.5 }]);
    const good = base({ startedAt: '2026-11-01T09:00:00.000Z', firstStartedAt: '2026-11-01T09:00:00.000Z', mode: 'quit', quitGoalDays: 60, audit: [4, 2, 1], withdrawal: [false, false, true, false] });
    expect(sanitizeAlcState(JSON.parse(JSON.stringify(good)))).toEqual(good);
  });
});

describe('alcohol campus · store', () => {
  beforeEach(() => useCampusStore.getState().reset());

  it('enrols, logs and undoes drinks, keeps the start on same-path edits', () => {
    useCampusStore.getState().saveAlcSetup({ mode: 'cut', weeklyLimit: 7, reasonIds: ['sleep'], triggerIds: ['social'], audit: [3, 1, 1], withdrawal: [false, false, false, false], guideReadIds: [...ALC_GUIDE_STEP_IDS] });
    let s = useCampusStore.getState().alcohol;
    expect(alcPhase(s)).toBe('active');
    expect(s.weeklyLimit).toBe(7);
    const start = s.startedAt;

    useCampusStore.getState().logDrink('wine', 1.5, new Date('2026-11-16T20:00:00.000Z'));
    useCampusStore.getState().logDrink('beer33', 1.3, new Date('2026-11-16T21:00:00.000Z'));
    useCampusStore.getState().undoLastDrink();
    s = useCampusStore.getState().alcohol;
    expect(s.drinks).toEqual([{ at: '2026-11-16T20:00:00.000Z', typeId: 'wine', std: 1.5 }]);

    useCampusStore.getState().saveAlcSetup({ mode: 'cut', weeklyLimit: 4, reasonIds: ['sleep'], triggerIds: [] });
    s = useCampusStore.getState().alcohol;
    expect(s.startedAt).toBe(start);
    expect(s.audit).toEqual([3, 1, 1]); // kept on edits

    useCampusStore.getState().saveAlcSetup({ mode: 'quit', quitGoalDays: 30, reasonIds: ['sleep'], triggerIds: [] });
    s = useCampusStore.getState().alcohol;
    expect(s.mode).toBe('quit');
    expect(s.firstStartedAt).not.toBeNull();

    useCampusStore.getState().resetAlc();
    expect(useCampusStore.getState().alcohol).toEqual(defaultAlcState());
  });
});
