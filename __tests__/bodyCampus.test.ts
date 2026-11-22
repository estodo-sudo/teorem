import {
  buildTimeline,
  clampMeasure,
  defaultBodyState,
  doneToday,
  measureDue,
  measureTrend,
  programGrid,
  programProgress,
  programWeek,
  routineDays,
  sanitizeBodyState,
  streakDays,
  timelineSeconds,
  weekRoutineDays,
  type BodyExercise,
  type BodyState,
} from '@/features/campus/body/logic';

const at = (y: number, m: number, d: number, h = 19) => new Date(y, m - 1, d, h).toISOString();
const active = (over: Partial<BodyState> = {}): BodyState => ({
  ...defaultBodyState(),
  setupDone: true,
  startedAt: at(2026, 11, 2, 9),
  firstStartedAt: at(2026, 11, 2, 9),
  ...over,
});
const full = (iso: string) => ({ at: iso, done: 8, total: 8 });

describe('routine timeline', () => {
  const ex = (o: Partial<BodyExercise>): BodyExercise => ({
    id: 'x',
    icon: 'leaf',
    title: '',
    steps: [],
    reps: 3,
    holdSec: 5,
    restSec: 2,
    sides: false,
    tip: '',
    ...o,
  });
  it('builds prep + hold/rest without a trailing rest', () => {
    const p = buildTimeline([ex({})], 5);
    expect(p.map((x) => x.kind)).toEqual(['prep', 'hold', 'rest', 'hold', 'rest', 'hold']);
    expect(timelineSeconds(p)).toBe(5 + 3 * 5 + 2 * 2);
  });
  it('repeats one-sided moves for both sides', () => {
    const p = buildTimeline([ex({ reps: 1, sides: true })], 5);
    expect(p.map((x) => `${x.kind}:${x.side}`)).toEqual(['prep:0', 'hold:0', 'prep:1', 'hold:1']);
  });
  it('groups phases by exercise for skipping', () => {
    const p = buildTimeline([ex({}), ex({ id: 'y' })]);
    expect(new Set(p.map((x) => x.exerciseIndex))).toEqual(new Set([0, 1]));
    expect(p.every((x, i) => i === 0 || x.exerciseIndex >= p[i - 1]!.exerciseIndex)).toBe(true);
  });
});

describe('programme progress', () => {
  it('counts a day only when half the routine was done', () => {
    const s = active({
      sessions: [
        { at: at(2026, 11, 3), done: 3, total: 8 },
        { at: at(2026, 11, 4), done: 4, total: 8 },
      ],
    });
    expect([...routineDays(s)]).toEqual(['2026-11-04']);
  });
  it('tracks weeks, weekly days and streaks', () => {
    const s = active({
      sessions: [full(at(2026, 11, 2)), full(at(2026, 11, 3)), full(at(2026, 11, 3, 21)), full(at(2026, 11, 9)), full(at(2026, 11, 10))],
    });
    const now = new Date(2026, 10, 10, 22);
    expect(programWeek(s, now)).toBe(2);
    expect(weekRoutineDays(s, now)).toBe(2);
    expect(streakDays(s, now)).toBe(2);
    expect(doneToday(s, now)).toBe(true);
    // Before today's routine the streak still counts yesterday.
    expect(streakDays(s, new Date(2026, 10, 11, 8))).toBe(2);
    expect(streakDays(s, new Date(2026, 10, 12, 8))).toBe(0);
    expect(programProgress(s, 8, 5)).toBeCloseTo(4 / 40);
  });
  it('lays out the calendar grid', () => {
    const s = active({ sessions: [full(at(2026, 11, 2))] });
    const g = programGrid(s, 8, new Date(2026, 10, 4, 12));
    expect(g).toHaveLength(8);
    expect(g[0]!.slice(0, 4)).toEqual(['done', 'missed', 'today', 'future']);
  });
});

describe('measurements', () => {
  it('reports the trend in the measure direction', () => {
    const s = active({
      measures: [
        { at: at(2026, 11, 2), value: 6 },
        { at: at(2026, 11, 9), value: 4.5 },
      ],
    });
    expect(measureTrend(s, 'lower')).toEqual({
      first: 6,
      last: 4.5,
      delta: -1.5,
      improved: true,
    });
    expect(measureTrend(s, 'higher')!.improved).toBe(false);
    expect(measureTrend(active(), 'lower')).toBeNull();
  });
  it('is due weekly', () => {
    const s = active({ measures: [{ at: at(2026, 11, 2, 9), value: 6 }] });
    expect(measureDue(s, new Date(2026, 10, 5))).toBe(false);
    expect(measureDue(s, new Date(2026, 10, 9, 10))).toBe(true);
    expect(measureDue(active(), new Date())).toBe(true);
  });
  it('clamps to range and step', () => {
    expect(clampMeasure(3.26, 0, 15, 0.5)).toBe(3.5);
    expect(clampMeasure(-2, 0, 15, 0.5)).toBe(0);
    expect(clampMeasure(200, 0, 120, 1)).toBe(120);
  });
});

describe('sanitizeBodyState', () => {
  it('falls back to defaults and drops bad rows', () => {
    expect(sanitizeBodyState(undefined)).toEqual(defaultBodyState());
    const s = sanitizeBodyState({
      setupDone: true,
      startedAt: '2026-11-02T09:00:00.000Z',
      answers: { screen: 'gt6', bad: 3 },
      sessions: [
        { at: 'x', done: 1, total: 8 },
        { at: '2026-11-03T19:00:00.000Z', done: 12, total: 8 },
      ],
      measures: [
        { at: '2026-11-03T19:00:00.000Z', value: -1 },
        { at: '2026-11-03T19:00:00.000Z', value: 5 },
      ],
      redFlagIds: ['nerve', 3],
    });
    expect(s.setupDone).toBe(true);
    expect(s.firstStartedAt).toBe('2026-11-02T09:00:00.000Z');
    expect(s.answers).toEqual({ screen: 'gt6' });
    expect(s.sessions).toEqual([{ at: '2026-11-03T19:00:00.000Z', done: 8, total: 8 }]);
    expect(s.measures).toEqual([{ at: '2026-11-03T19:00:00.000Z', value: 5 }]);
    expect(s.redFlagIds).toEqual(['nerve']);
  });
  it('is not active without a start date', () => {
    expect(sanitizeBodyState({ setupDone: true }).setupDone).toBe(false);
  });
});
