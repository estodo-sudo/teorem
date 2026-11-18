import { SMOKING } from '@/features/campus/smoking/content';
import {
  cigsAvoided,
  cravingPeakPart,
  dayPartOf,
  nextSlipEndsAttempt,
  slipsThisAttempt,
  type CravingLog,
  clampCigsPerDay,
  cravingStats,
  DAY_MS,
  daysUntilQuit,
  formatThousands,
  GUIDE_STEP_IDS,
  defaultSmokingState,
  HOUR_MS,
  keyMilestoneProgress,
  milestoneStatuses,
  moneySaved,
  monthlyCost,
  nextMilestone,
  parsePrice,
  prepProgress,
  quitAtFromChoice,
  recommendedGuideStep,
  removeLastSymptomLog,
  sanitizeSmokingState,
  smokeFreeMs,
  smokingPhase,
  splitDuration,
  startOver,
  symptomCounts,
  topSymptom,
  type SmokingCampusState,
} from '@/features/campus/smoking/logic';
import { useCampusStore } from '@/stores/campusStore';

const quitState = (quitAt: Date, extra: Partial<SmokingCampusState> = {}): SmokingCampusState => ({
  ...defaultSmokingState(),
  setupDone: true,
  quitAt: quitAt.toISOString(),
  cigsPerDay: 20,
  packPrice: 100,
  cigsPerPack: 20,
  ...extra,
});

describe('smoking campus · phase and counters', () => {
  const now = new Date(2026, 10, 16, 12, 0, 0);

  it('is in setup until a quit time is saved', () => {
    expect(smokingPhase(defaultSmokingState(), now)).toBe('setup');
    expect(smokingPhase({ ...defaultSmokingState(), quitAt: now.toISOString() }, now)).toBe('setup');
  });

  it('is preparing before the quit time and smoke-free from it on', () => {
    expect(smokingPhase(quitState(new Date(now.getTime() + 1000)), now)).toBe('preparing');
    expect(smokingPhase(quitState(now), now)).toBe('smokeFree');
    expect(smokeFreeMs(quitState(new Date(now.getTime() + 5000)), now)).toBe(0);
  });

  it('splits durations into days, hours and minutes', () => {
    expect(splitDuration(3 * DAY_MS + 5 * HOUR_MS + 7 * 60_000 + 59_000)).toEqual({ days: 3, hours: 5, minutes: 7 });
    expect(splitDuration(-5)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });

  it('counts cigarettes avoided and money saved from the habit', () => {
    const s = quitState(new Date(now.getTime() - 2.5 * DAY_MS));
    expect(cigsAvoided(s, now)).toBe(50); // 2.5 days × 20
    expect(moneySaved(s, now)).toBe(250); // 50 cigarettes × 5 TL
    expect(moneySaved({ ...s, packPrice: 0 }, now)).toBe(0);
    expect(monthlyCost(s)).toBe(3000);
  });

  it('tracks progress towards 28 smoke-free days', () => {
    expect(keyMilestoneProgress(quitState(new Date(now.getTime() - 14 * DAY_MS)), now)).toBeCloseTo(0.5);
    expect(keyMilestoneProgress(quitState(new Date(now.getTime() - 40 * DAY_MS)), now)).toBe(1);
  });
});

describe('smoking campus · quit day', () => {
  const now = new Date(2026, 10, 16, 15, 30, 0);

  it('starts now, or at local midnight of the chosen day', () => {
    expect(quitAtFromChoice('now', now).getTime()).toBe(now.getTime());
    expect(quitAtFromChoice('tomorrow', now)).toEqual(new Date(2026, 10, 17, 0, 0, 0, 0));
    expect(quitAtFromChoice('in3', now)).toEqual(new Date(2026, 10, 19, 0, 0, 0, 0));
    expect(quitAtFromChoice('in7', now)).toEqual(new Date(2026, 10, 23, 0, 0, 0, 0));
  });

  it('crosses month ends correctly', () => {
    expect(quitAtFromChoice('in7', new Date(2026, 11, 28, 10))).toEqual(new Date(2027, 0, 4, 0, 0, 0, 0));
  });

  it('counts calendar days until the quit day', () => {
    expect(daysUntilQuit(quitState(quitAtFromChoice('tomorrow', now)), now)).toBe(1);
    expect(daysUntilQuit(quitState(quitAtFromChoice('in7', now)), now)).toBe(7);
    expect(daysUntilQuit(quitState(now), now)).toBe(0);
  });
});

describe('smoking campus · milestones', () => {
  const ms = SMOKING.milestones;

  it('content milestones are sorted, unique and start at 20 minutes', () => {
    expect(new Set(ms.map((m) => m.id)).size).toBe(ms.length);
    expect(ms.map((m) => m.hours)).toEqual([...ms.map((m) => m.hours)].sort((a, b) => a - b));
    expect(ms[0]!.hours * HOUR_MS).toBeCloseTo(20 * 60_000);
  });

  it('marks reached milestones and partial progress of the next one', () => {
    const st = milestoneStatuses(ms, 30 * HOUR_MS); // between 8 h and 48 h
    expect(st.filter((x) => x.reached).map((x) => x.milestone.id)).toEqual(['m20min', 'm8h']);
    expect(st[2]!.progress).toBeCloseTo((30 - 8) / (48 - 8));
    expect(st[3]!.progress).toBe(0);
    expect(nextMilestone(ms, 30 * HOUR_MS)?.milestone.id).toBe('m48h');
    expect(nextMilestone(ms, 20 * 365 * DAY_MS)).toBeNull();
  });
});

describe('smoking campus · helpers', () => {
  it('clamps cigarettes per day and parses prices', () => {
    expect(clampCigsPerDay(0)).toBe(1);
    expect(clampCigsPerDay(500)).toBe(80);
    expect(clampCigsPerDay(Number.NaN)).toBe(1);
    expect(parsePrice('85')).toBe(85);
    expect(parsePrice('85,50')).toBe(85.5);
    expect(parsePrice(' 1 200 ')).toBe(1200);
    expect(parsePrice('-3')).toBe(0);
    expect(parsePrice('abc')).toBe(0);
  });

  it('formats amounts with Turkish thousands separators', () => {
    expect(formatThousands(0)).toBe('0');
    expect(formatThousands(950)).toBe('950');
    expect(formatThousands(12500)).toBe('12.500');
    expect(formatThousands(1234567.6)).toBe('1.234.568');
  });

  it('tracks preparation progress', () => {
    expect(prepProgress(['a', 'b', 'c'], ['a'])).toEqual({ done: 1, total: 3, complete: false });
    expect(prepProgress(['a', 'b'], ['b', 'a', 'x'])).toEqual({ done: 2, total: 2, complete: true });
    expect(prepProgress([], []).complete).toBe(false);
  });

  it('counts withdrawal symptoms and finds the most frequent one', () => {
    const logs = [
      { at: '1', symptomId: 'sleep' },
      { at: '2', symptomId: 'mood' },
      { at: '3', symptomId: 'sleep' },
    ];
    expect(symptomCounts(logs)).toEqual({ sleep: 2, mood: 1 });
    expect(topSymptom(logs)).toEqual({ id: 'sleep', count: 2 });
    expect(topSymptom([])).toBeNull();
    expect(topSymptom([{ at: '1', symptomId: 'a' }, { at: '2', symptomId: 'b' }])).toEqual({ id: 'a', count: 1 });
  });

  it('undoes only the latest log of the given symptom', () => {
    const logs = [
      { at: '1', symptomId: 'sleep' },
      { at: '2', symptomId: 'mood' },
      { at: '3', symptomId: 'sleep' },
    ];
    expect(removeLastSymptomLog(logs, 'sleep')).toEqual([logs[0], logs[1]]);
    expect(removeLastSymptomLog(logs, 'nausea')).toBe(logs);
  });

  const crav = (at: string, triggerId: string | null, passed: boolean): CravingLog => ({ at, triggerId, passed });

  it('summarizes cravings', () => {
    const c = cravingStats([crav('a', 'coffee', true), crav('b', 'stress', false), crav('c', 'coffee', true), crav('d', null, true)]);
    expect(c).toEqual({ total: 4, passed: 3, topTriggerId: 'coffee' });
    expect(cravingStats([])).toEqual({ total: 0, passed: 0, topTriggerId: null });
  });

  it('finds the time of day cravings come most often', () => {
    const at = (day: number, hour: number) => new Date(2026, 10, day, hour).toISOString();
    expect(cravingPeakPart([crav(at(1, 15), null, true), crav(at(1, 9), null, true), crav(at(2, 16), null, false), crav(at(3, 14), null, true)])).toBe('afternoon');
    expect(cravingPeakPart([crav(at(1, 15), null, true), crav(at(2, 16), null, true)])).toBeNull();
    // No repeated time of day → no peak.
    expect(cravingPeakPart([crav(at(1, 9), null, true), crav(at(1, 15), null, true), crav(at(1, 20), null, true)])).toBeNull();
  });

  it('forgives one slip per attempt; the second one ends it', () => {
    const base = { quitAt: '2026-11-10T00:00:00.000Z', slips: [] as string[] };
    expect(slipsThisAttempt(base)).toBe(0);
    expect(nextSlipEndsAttempt(base)).toBe(false);
    const one = { ...base, slips: ['2026-11-09T10:00:00.000Z', '2026-11-12T10:00:00.000Z'] }; // first one is before the quit time
    expect(slipsThisAttempt(one)).toBe(1);
    expect(nextSlipEndsAttempt(one)).toBe(true);
    expect(slipsThisAttempt({ quitAt: null, slips: ['2026-11-12T10:00:00.000Z'] })).toBe(0);
  });

  it('maps hours to parts of the day', () => {
    expect(dayPartOf(new Date(2026, 0, 1, 5))).toBe('morning');
    expect(dayPartOf(new Date(2026, 0, 1, 12))).toBe('afternoon');
    expect(dayPartOf(new Date(2026, 0, 1, 21))).toBe('evening');
    expect(dayPartOf(new Date(2026, 0, 1, 2))).toBe('night');
  });

  it('starting over resets the clock and counts the attempt', () => {
    const now = new Date(2026, 10, 16, 12);
    const s = startOver(quitState(new Date(2026, 10, 1)), now);
    expect(s.quitAt).toBe(now.toISOString());
    expect(s.attempt).toBe(2);
  });

  it('suggests the guide section that fits the current phase', () => {
    const now = new Date(2026, 10, 16, 12);
    const ago = (days: number) => quitState(new Date(now.getTime() - days * DAY_MS));
    expect(recommendedGuideStep(defaultSmokingState(), now)).toBe('why');
    expect(recommendedGuideStep(quitState(new Date(now.getTime() + DAY_MS)), now)).toBe('prepare');
    expect(recommendedGuideStep(ago(0.2), now)).toBe('quitday');
    expect(recommendedGuideStep(ago(3), now)).toBe('week1');
    expect(recommendedGuideStep(ago(10), now)).toBe('cravings');
    expect(recommendedGuideStep(ago(28), now)).toBe('day28');
  });

  it('sanitizes broken imported data', () => {
    expect(sanitizeSmokingState(null)).toEqual(defaultSmokingState());
    const s = sanitizeSmokingState({ setupDone: true, quitAt: 'not a date', cigsPerDay: 999, packPrice: -4, reasonIds: ['health', 3], cravings: [{ at: 'x', passed: 'yes' }, 7] });
    expect(s.setupDone).toBe(false);
    expect(s.quitAt).toBeNull();
    expect(s.cigsPerDay).toBe(80);
    expect(s.packPrice).toBe(0);
    expect(s.reasonIds).toEqual(['health']);
    expect(s.cravings).toEqual([{ at: 'x', triggerId: null, passed: false }]);
    expect(sanitizeSmokingState({ symptomLogs: [{ at: 'x', symptomId: 'sleep' }, { at: 1, symptomId: 'mood' }, 'bad'] }).symptomLogs).toEqual([{ at: 'x', symptomId: 'sleep' }]);
    const good = quitState(new Date(2026, 10, 1));
    expect(sanitizeSmokingState(JSON.parse(JSON.stringify(good)))).toEqual(good);
  });
});

describe('smoking campus · content', () => {
  it('has unique ids and non-empty texts everywhere', () => {
    const groups = [SMOKING.reasons, SMOKING.triggers, SMOKING.prep, SMOKING.steps, SMOKING.help, SMOKING.craving.steps];
    for (const g of groups) expect(new Set(g.map((x) => x.id)).size).toBe(g.length);
    for (const t of SMOKING.triggers) expect(t.plan.trim()).not.toBe('');
    for (const st of SMOKING.steps) {
      expect(st.sections.length).toBeGreaterThan(0);
      expect(new Set(st.sections.map((s) => s.title)).size).toBe(st.sections.length);
    }
    expect(SMOKING.reviewed).toBe(false);
    expect(SMOKING.sources.length).toBeGreaterThan(0);
    SMOKING.sources.forEach((s) => expect(s.url).toMatch(/^https:\/\//));
  });

  it('withdrawal content is complete', () => {
    const w = SMOKING.withdrawal;
    expect(w.symptoms.length).toBeGreaterThanOrEqual(6);
    expect(new Set(w.symptoms.map((x) => x.id)).size).toBe(w.symptoms.length);
    for (const x of w.symptoms) {
      expect(x.tips.length).toBeGreaterThan(0);
      expect(new Set(x.tips).size).toBe(x.tips.length);
      [x.title, x.summary, x.duration, x.text].forEach((v) => expect(v.trim()).not.toBe(''));
    }
    expect(w.timeline.map((x) => x.level).every((l) => l >= 1 && l <= 3)).toBe(true);
  });

  it('guide sections in the content match the code order', () => {
    expect(SMOKING.steps.map((x) => x.id)).toEqual([...GUIDE_STEP_IDS]);
  });

  it('includes the automatically completed "date" prep item', () => {
    expect(SMOKING.prep.some((p) => p.id === 'date')).toBe(true);
  });
});

describe('smoking campus · store', () => {
  beforeEach(() => useCampusStore.getState().reset());

  it('saves the setup, keeps logs on edit and handles slips', () => {
    const st = useCampusStore.getState();
    st.saveSmokingSetup({ quitAt: '2026-11-16T00:00:00.000Z', cigsPerDay: 15, packPrice: 90, reasonIds: ['health'], triggerIds: ['coffee'] });
    st.logCraving('coffee', true, '2026-11-16T10:00:00.000Z');
    st.saveSmokingSetup({ quitAt: '2026-11-16T00:00:00.000Z', cigsPerDay: 12, packPrice: 90, reasonIds: ['health', 'money'], triggerIds: ['coffee'] });
    let s = useCampusStore.getState().smoking;
    expect(s.setupDone).toBe(true);
    expect(s.cigsPerDay).toBe(12);
    expect(s.cravings).toEqual([{ at: '2026-11-16T10:00:00.000Z', triggerId: 'coffee', passed: true }]);
    expect(s.prepDoneIds).toEqual(['date']);

    expect(useCampusStore.getState().logSlip(new Date('2026-11-17T09:00:00.000Z'))).toEqual({ restarted: false });
    s = useCampusStore.getState().smoking;
    expect(s.slips).toEqual(['2026-11-17T09:00:00.000Z']);
    expect(s.quitAt).toBe('2026-11-16T00:00:00.000Z');

    // Second slip in the same attempt ends it.
    expect(useCampusStore.getState().logSlip(new Date('2026-11-18T09:00:00.000Z'))).toEqual({ restarted: true });
    s = useCampusStore.getState().smoking;
    expect(slipsThisAttempt(s)).toBe(0);
    expect(s.quitAt).toBe('2026-11-18T09:00:00.000Z');
    expect(s.attempt).toBe(2);
  });

  it('toggles prep items', () => {
    useCampusStore.getState().togglePrep('tell');
    expect(useCampusStore.getState().smoking.prepDoneIds).toEqual(['tell']);
    useCampusStore.getState().togglePrep('tell');
    expect(useCampusStore.getState().smoking.prepDoneIds).toEqual([]);
  });

  it('saves prep items chosen at enrolment and always keeps the quit day checked', () => {
    const base = { quitAt: '2026-11-16T00:00:00.000Z', cigsPerDay: 10, packPrice: 0, reasonIds: ['health'], triggerIds: [] };
    useCampusStore.getState().saveSmokingSetup({ ...base, prepDoneIds: ['tell', 'clean'] });
    expect(useCampusStore.getState().smoking.prepDoneIds).toEqual(['tell', 'clean', 'date']);
    useCampusStore.getState().togglePrep('kit');
    useCampusStore.getState().saveSmokingSetup(base); // later edit without prep → keep existing
    expect(useCampusStore.getState().smoking.prepDoneIds).toEqual(['tell', 'clean', 'date', 'kit']);
  });

  it('logs and undoes symptoms', () => {
    useCampusStore.getState().logSymptom('sleep', '2026-11-16T10:00:00.000Z');
    useCampusStore.getState().logSymptom('sleep', '2026-11-16T11:00:00.000Z');
    useCampusStore.getState().undoSymptom('sleep');
    expect(useCampusStore.getState().smoking.symptomLogs).toEqual([{ at: '2026-11-16T10:00:00.000Z', symptomId: 'sleep' }]);
  });

  it('records the guide as read on enrolment and keeps it on later edits', () => {
    const base = { quitAt: '2026-11-16T00:00:00.000Z', cigsPerDay: 10, packPrice: 0, reasonIds: ['health'], triggerIds: [] };
    useCampusStore.getState().saveSmokingSetup({ ...base, guideReadIds: [...GUIDE_STEP_IDS] });
    expect(useCampusStore.getState().smoking.stepDoneIds).toEqual([...GUIDE_STEP_IDS]);
    useCampusStore.getState().saveSmokingSetup({ ...base, cigsPerDay: 8 });
    expect(useCampusStore.getState().smoking.stepDoneIds).toEqual([...GUIDE_STEP_IDS]);
    expect('guideReadIds' in useCampusStore.getState().smoking).toBe(false);
  });
});
