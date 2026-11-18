import { MC } from '@/features/campus/masturbation/content';
import {
  BASELINE_LIMITS,
  calendar,
  CHECK_QUESTION_COUNT,
  checkBand,
  checkScore,
  DAY_MS,
  defaultMcState,
  lapsesThisAttempt,
  listProgress,
  MC_GUIDE_STEP_IDS,
  mcPhase,
  nextLapseEndsAttempt,
  QUIT_GOALS,
  QUIT_MAX_DAYS,
  quitDays,
  quitGoalReached,
  quitProgress,
  sanitizeMcState,
  thisWeek,
  urgeStats,
  weekHistory,
  weekKeyOf,
  weeksWithinStreak,
  type McState,
} from '@/features/campus/masturbation/logic';
import { useCampusStore } from '@/stores/campusStore';

const base = (extra: Partial<McState>): McState => ({ ...defaultMcState(), setupDone: true, ...extra });
const iso = (d: Date) => d.toISOString();

describe('masturbation campus · paths', () => {
  it('maps the current weekly frequency to the weekly allowance', () => {
    expect(BASELINE_LIMITS).toEqual({ gt14: 5, '10to14': 3, '7to9': 2, lt7: 1 });
    // Content offers exactly these choices with the same limits.
    expect(MC.baselines.map((b) => [b.id, b.limit])).toEqual(Object.entries(BASELINE_LIMITS));
  });

  it('caps the quit path at 15 days', () => {
    expect([...QUIT_GOALS]).toEqual([7, 10, 15]);
    expect(Math.max(...QUIT_GOALS)).toBe(QUIT_MAX_DAYS);
    expect(MC.quitGoals).toEqual([...QUIT_GOALS]);
  });
});

describe('masturbation campus · control path', () => {
  // Monday 16 Nov 2026, noon.
  const now = new Date(2026, 10, 16, 12);

  it('counts this week against the allowance (Monday starts a new week)', () => {
    const s = base({ mode: 'control', baselineId: '10to14', weeklyLimit: 3, startedAt: iso(new Date(2026, 10, 2)), firstStartedAt: iso(new Date(2026, 10, 2)) });
    expect(weekKeyOf(now)).toBe('2026-11-16');
    s.uses = [iso(new Date(2026, 10, 15, 22)), iso(new Date(2026, 10, 16, 8))]; // Sunday (last week) and Monday
    expect(thisWeek(s, now)).toMatchObject({ used: 1, limit: 3, left: 2, over: false });
    s.uses.push(iso(new Date(2026, 10, 16, 9)), iso(new Date(2026, 10, 16, 10)), iso(new Date(2026, 10, 16, 11)));
    expect(thisWeek(s, now)).toMatchObject({ used: 4, left: 0, over: true });
  });

  it('keeps a week history and a streak of completed weeks within the limit', () => {
    const s = base({ mode: 'control', weeklyLimit: 2, startedAt: iso(new Date(2026, 10, 2, 9)), firstStartedAt: iso(new Date(2026, 10, 2, 9)) });
    s.uses = [
      iso(new Date(2026, 10, 3, 22)),
      iso(new Date(2026, 10, 4, 22)),
      iso(new Date(2026, 10, 5, 22)), // week of 2 Nov: 3 uses → over
      iso(new Date(2026, 10, 10, 22)), // week of 9 Nov: 1 use → within
    ];
    const hist = weekHistory(s, now);
    expect(hist.map((w) => [w.weekKey, w.used, w.over])).toEqual([
      ['2026-11-02', 3, true],
      ['2026-11-09', 1, false],
      ['2026-11-16', 0, false],
    ]);
    // Only the completed week of 9 Nov counts; the week before was over.
    expect(weeksWithinStreak(s, now)).toBe(1);
  });

  it('marks used days and the use that went over the limit on the calendar', () => {
    const s = base({ mode: 'control', weeklyLimit: 1, startedAt: iso(new Date(2026, 10, 9, 9)), firstStartedAt: iso(new Date(2026, 10, 9, 9)) });
    s.uses = [iso(new Date(2026, 10, 10, 22)), iso(new Date(2026, 10, 12, 22))];
    const byKey = Object.fromEntries(calendar(s, now).map((d) => [d.key, d]));
    expect(byKey['2026-11-08']!.status).toBe('none');
    expect(byKey['2026-11-09']!.status).toBe('clean');
    expect(byKey['2026-11-10']!.status).toBe('use');
    expect(byKey['2026-11-12']!.status).toBe('over');
    expect(byKey['2026-11-16']).toMatchObject({ status: 'clean', today: true });
  });
});

describe('masturbation campus · quit path', () => {
  const now = new Date(2026, 10, 16, 12);
  const ago = (days: number) => new Date(now.getTime() - days * DAY_MS);

  it('counts days towards a goal of at most 15 days', () => {
    const s = base({ mode: 'quit', goalDays: 10, startedAt: iso(ago(5.5)) });
    expect(quitDays(s, now)).toBe(5);
    expect(quitProgress(s, now)).toBe(0.5);
    expect(quitGoalReached(s, now)).toBe(false);
    expect(quitGoalReached(base({ mode: 'quit', goalDays: 10, startedAt: iso(ago(10)) }), now)).toBe(true);
  });

  it('absorbs one lapse per attempt; the second one ends it (like the smoking campus)', () => {
    const s = base({ mode: 'quit', startedAt: iso(ago(4)), lapses: [iso(ago(9))] });
    expect(lapsesThisAttempt(s)).toBe(0); // before this attempt
    expect(nextLapseEndsAttempt(s)).toBe(false);
    expect(nextLapseEndsAttempt({ ...s, lapses: [...s.lapses, iso(ago(2))] })).toBe(true);
  });

  it('shows lapse days on the calendar', () => {
    const s = base({ mode: 'quit', startedAt: iso(ago(3)), firstStartedAt: iso(ago(10)), lapses: [iso(ago(6))] });
    const cal = calendar(s, now);
    expect(cal.filter((d) => d.status === 'lapse')).toHaveLength(1);
    expect(cal.filter((d) => d.status === 'none').length).toBe(28 - 11);
  });
});

describe('masturbation campus · shared logic', () => {
  it('has a setup phase until the plan is saved', () => {
    expect(mcPhase(defaultMcState())).toBe('setup');
    expect(mcPhase(base({ startedAt: iso(new Date()) }))).toBe('active');
  });

  it('scores the self-check into bands', () => {
    expect(checkScore(null)).toBe(0);
    expect(checkScore([true, true, false, false, true, false])).toBe(3);
    expect(checkBand(0, MC.check.bands)!.id).toBe('low');
    expect(checkBand(2, MC.check.bands)!.id).toBe('some');
    expect(checkBand(6, MC.check.bands)!.id).toBe('high');
  });

  it('summarizes urges and list progress', () => {
    const u = (actionId: string, passed: boolean, triggerId: string | null = 'bed-phone') => ({ at: '2026-11-10T10:00:00.000Z', triggerId, actionId, passed });
    expect(urgeStats([u('leave', true), u('move', false), u('leave', true, 'stress'), u('move', true)])).toEqual({ total: 4, passed: 3, topTriggerId: 'bed-phone', topActionId: 'leave' });
    expect(listProgress(['a', 'b'], ['b', 'a'])).toEqual({ done: 2, total: 2, complete: true });
  });

  it('sanitizes broken imported data', () => {
    expect(sanitizeMcState(undefined)).toEqual(defaultMcState());
    const s = sanitizeMcState({ setupDone: true, startedAt: 'nope', goalDays: 30, mode: 'x', baselineId: 'many', checkAnswers: [true], uses: ['x', '2026-11-01T00:00:00.000Z'], urges: [{ at: 5 }] });
    expect(s.setupDone).toBe(false);
    expect(s.mode).toBe('control');
    expect(s.goalDays).toBe(15); // 30 is not allowed any more
    expect(s.baselineId).toBeNull();
    expect(s.checkAnswers).toBeNull();
    expect(s.uses).toEqual(['2026-11-01T00:00:00.000Z']);
    expect(s.urges).toEqual([]);
    // The weekly limit always follows the chosen frequency.
    expect(sanitizeMcState({ baselineId: 'gt14', weeklyLimit: 99 }).weeklyLimit).toBe(5);
    const good = base({ mode: 'quit', startedAt: '2026-11-01T00:00:00.000Z', firstStartedAt: '2026-10-20T00:00:00.000Z', goalDays: 10, attempt: 2, checkAnswers: [true, false, true, false, true, false], checkValues: true });
    expect(sanitizeMcState(JSON.parse(JSON.stringify(good)))).toEqual(good);
  });
});

describe('masturbation campus · content', () => {
  it('is complete and consistent with the code', () => {
    expect(MC.steps.map((x) => x.id)).toEqual([...MC_GUIDE_STEP_IDS]);
    expect(MC.check.questions).toHaveLength(CHECK_QUESTION_COUNT);
    expect(Object.keys(MC.paths)).toEqual(['control', 'quit']);
    const groups = [MC.reasons, MC.triggers, MC.env, MC.urge.actions, MC.facts, MC.help, MC.steps, MC.check.questions, MC.baselines];
    for (const g of groups) expect(new Set(g.map((x) => x.id)).size).toBe(g.length);
    for (const a of MC.urge.actions) expect(a.minutes).toBeGreaterThan(0);
    for (const b of MC.baselines) expect(b.hint.trim()).not.toBe('');
    expect(MC.harms.items.length).toBeGreaterThanOrEqual(5);
    expect(new Set(MC.harms.items.map((x) => x.id)).size).toBe(MC.harms.items.length);
    expect(MC.reviewed).toBe(false);
    MC.sources.forEach((s) => expect(s.url).toMatch(/^https:\/\//));
  });

  it('makes no promises, does not shame and has no hotline references', () => {
    const all = JSON.stringify(MC).toLocaleLowerCase('tr-TR');
    expect(all).not.toMatch(/garanti|kesin çözüm|tedavi eder|günah|iğrenç/);
    expect(all).not.toMatch(/yeşilay|yedam|115/);
  });
});

describe('masturbation campus · store', () => {
  beforeEach(() => useCampusStore.getState().reset());

  it('control path: logs allowance uses and reports the week', () => {
    useCampusStore.getState().saveMcSetup({ mode: 'control', baselineId: '7to9', reasonIds: ['time'], triggerIds: [] });
    const s = useCampusStore.getState().masturbation;
    expect(s.weeklyLimit).toBe(2);
    expect(s.firstStartedAt).toBe(s.startedAt);
    const at = new Date();
    expect(useCampusStore.getState().logUse(at)).toMatchObject({ used: 1, limit: 2, over: false });
    useCampusStore.getState().logUse(at);
    expect(useCampusStore.getState().logUse(at)).toMatchObject({ used: 3, over: true });
  });

  it('quit path: first lapse goes on, second starts a new attempt; switching path restarts the plan', () => {
    useCampusStore.getState().saveMcSetup({ mode: 'quit', goalDays: 15, reasonIds: ['time'], triggerIds: [] });
    const first = useCampusStore.getState().masturbation;
    const later = (min: number) => new Date(new Date(first.startedAt!).getTime() + min * 60_000);
    expect(useCampusStore.getState().logLapse(later(10))).toEqual({ restarted: false });
    expect(useCampusStore.getState().masturbation.startedAt).toBe(first.startedAt);
    expect(useCampusStore.getState().logLapse(later(20))).toEqual({ restarted: true });
    const s = useCampusStore.getState().masturbation;
    expect(s.attempt).toBe(2);
    expect(s.startedAt).toBe(later(20).toISOString());
    expect(s.firstStartedAt).toBe(first.firstStartedAt);

    // Same path edit keeps the start; switching path starts the new plan now.
    useCampusStore.getState().saveMcSetup({ mode: 'quit', goalDays: 7, reasonIds: ['time'], triggerIds: [] });
    expect(useCampusStore.getState().masturbation.startedAt).toBe(s.startedAt);
    useCampusStore.getState().saveMcSetup({ mode: 'control', baselineId: 'gt14', reasonIds: ['time'], triggerIds: [] });
    const c = useCampusStore.getState().masturbation;
    expect(c.mode).toBe('control');
    expect(c.weeklyLimit).toBe(5);
    expect(c.startedAt).not.toBe(s.startedAt);
    expect(c.firstStartedAt).toBe(first.firstStartedAt);

    useCampusStore.getState().resetMc();
    expect(useCampusStore.getState().masturbation).toEqual(defaultMcState());
  });
});
