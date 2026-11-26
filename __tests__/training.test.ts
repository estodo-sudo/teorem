import { adjustLevel, OK_STREAK_FOR_LEVEL_UP } from '@/features/training/adjustLevel';
import { contractionCount, generateReleaseSession, generateSession, generateSlowDemo, generateTrialSession, REST_SEC, type SessionInput } from '@/features/training/generateSession';
import { clampLevel, dailyContractionCap, getLevel, LEVELS, MAX_LEVEL, sessionContractionCap, SLOW_REP_SEC, startingLevelFor } from '@/features/training/levels';
import { applyReturn, applySessionResult, defaultTraining, migrateTraining, setManualLevel, todayPlanDay, todayWeekIndex } from '@/features/training/plan';
import { MAX_MOVE_BLOCK_REPS } from '@/features/training/moves';
import { capStatus, deloadDue, isPlanDeloadDay, missedDaysPolicy, muscleScore, painPolicy, planWeekNumber, refreshFreezes, screeningToTrack, sessionAllowed, strengthFallingTwoWeeks, validVacation } from '@/features/training/schedule';
import { goalsToTrack, KEGEL_CUES, KEGEL_TRACKS, trackAllowed } from '@/features/training/tracks';
import type { GeneratedSession, Phase } from '@/features/training/types';
import type { StrengthTest, TrainingState } from '@/types';

const SEED = '2026-11-15';
const input = (o: Partial<SessionInput> = {}): SessionInput => ({ level: 1, seed: SEED, ...o });
const sec = (s: GeneratedSession) => s.phases.reduce((a, p) => a + p.durationMs, 0) / 1000;
const types = (s: GeneratedSession) => s.blocks.map((b) => b.type);
const ofBlock = (s: GeneratedSession, i: number) => s.phases.filter((p) => p.exerciseIndex === i && p.kind !== 'transition');

describe('levels: three exercises, gently longer with the level', () => {
  it('level 1 = 12 s uzun sıkma, 30 s hızlı sık-bırak, 33 s yavaş sıkma, 2 cycles; level 30 = 20 / 60 / 60, 3 cycles (2026-11-23: 3 → 2 min by one cycle less, squeeze times unchanged)', () => {
    expect(getLevel(1)).toMatchObject({ holdSec: 12, quickSec: 30, slowBlockSec: 33, cycles: 2 });
    expect(getLevel(30)).toMatchObject({ holdSec: 20, quickSec: 60, slowBlockSec: 60, cycles: 3 });
  });
  it('has 30 levels and never gets easier from one level to the next', () => {
    expect(LEVELS).toHaveLength(MAX_LEVEL);
    for (let i = 1; i < LEVELS.length; i++) {
      const [a, b] = [LEVELS[i - 1]!, LEVELS[i]!];
      expect(b.holdSec).toBeGreaterThanOrEqual(a.holdSec);
      expect(b.quickSec).toBeGreaterThanOrEqual(a.quickSec);
      expect(b.slowBlockSec).toBeGreaterThanOrEqual(a.slowBlockSec);
      expect(b.cycles).toBeGreaterThanOrEqual(a.cycles);
      expect(b.quickSec % 2).toBe(0);
    }
  });
  it('clamps levels and maps experience to a start level', () => {
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(99)).toBe(30);
    expect(clampLevel(Number.NaN)).toBe(1);
    // Everyone starts at level 1 (2026-11-23), whatever the experience answer.
    expect([startingLevelFor(null), startingLevelFor('some'), startingLevelFor('regular')]).toEqual([1, 1, 1]);
  });
});

describe('Tur 1: (uzun, dinlen, hızlı, dinlen) × cycles, then uzun', () => {
  it('level 1: uzun and hızlı twice, then a last uzun (5 exercises); about 2 minutes', () => {
    const s = generateSession(input());
    expect(types(s)).toEqual(['slow_hold', 'quick_flick', 'slow_hold', 'quick_flick', 'slow_hold']);
    expect(s.round).toBe(1);
    expect(sec(s)).toBeGreaterThanOrEqual(110);
    expect(sec(s)).toBeLessThanOrEqual(130);
  });
  it('gets longer with the level but stays short (at most 5 min at level 30)', () => {
    let prev = 0;
    for (const l of LEVELS) {
      const t = sec(generateSession(input({ level: l.level })));
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
    expect(prev).toBeLessThanOrEqual(5 * 60);
  });
  it('uzun sıkma is one unbroken squeeze; hızlı sık-bırak is 1 s squeeze / 1 s let go for the whole block', () => {
    const s = generateSession(input());
    expect(ofBlock(s, 0)).toEqual([expect.objectContaining({ kind: 'contract', durationMs: 12000 })]);
    const quick = ofBlock(s, 1);
    expect(quick).toHaveLength(30);
    quick.forEach((p, i) => expect([p.kind, p.durationMs]).toEqual([i % 2 ? 'relax' : 'contract', 1000]));
  });
  it('a 5 s "Dinlen" between exercises, none at the start or the end', () => {
    const s = generateSession(input({ level: 12 }));
    const rests = s.phases.filter((p) => p.kind === 'transition');
    expect(rests).toHaveLength(s.blocks.length - 1);
    expect(rests.every((p) => p.durationMs === REST_SEC * 1000)).toBe(true);
    expect(REST_SEC).toBe(5);
    expect(s.phases[0]!.kind).toBe('countdown');
    expect(s.phases[1]!.kind).toBe('contract');
    expect(s.phases[s.phases.length - 1]!.kind).not.toBe('transition');
  });
  it('only the three exercises; no breathing, knack, max-strength or release blocks', () => {
    for (const l of [1, 10, 20, 30])
      for (const r of [1, 2] as const) expect(new Set(types(generateSession(input({ level: l, round: r }))))).toEqual(new Set(r === 1 ? ['slow_hold', 'quick_flick'] : ['elevator', 'quick_flick', 'slow_hold']));
  });
  it('deterministic for the same input', () => {
    expect(generateSession(input({ level: 9 }))).toEqual(generateSession(input({ level: 9 })));
  });
});

describe('Tur 2: yavaş, hızlı, yavaş, uzun (with a 5 s rest between)', () => {
  it('yavaş sıkma: slowly up 3 s, 0.5 s at the top, let go and wait 1 s; about 33 s at level 1', () => {
    const s = generateSession(input({ round: 2 }));
    expect(s.round).toBe(2);
    expect(types(s)).toEqual(['elevator', 'quick_flick', 'elevator', 'slow_hold']);
    const slow = ofBlock(s, 0);
    expect(slow.slice(0, 3).map((p: Phase) => [p.kind, p.variant ?? null, p.durationMs])).toEqual([
      ['contract', 'slowUp', 3000],
      ['contract', 'top', 500],
      ['relax', null, 1000],
    ]);
    const total = slow.reduce((a, p) => a + p.durationMs, 0) / 1000;
    expect(Math.abs(total - 33)).toBeLessThanOrEqual(SLOW_REP_SEC);
  });
  it('about 2 minutes at level 1 (was about 3), shortened in the same proportion at every level (2026-11-23)', () => {
    const l1 = sec(generateSession(input({ round: 2 })));
    expect(l1).toBeGreaterThanOrEqual(110);
    expect(l1).toBeLessThanOrEqual(130);
    // The old 2 × (yavaş, hızlı, uzun) took 175 s at level 1 and 305 s at level 30: both drop to ~70 %.
    expect(l1 / 175).toBeCloseTo(0.7, 1);
    expect(sec(generateSession(input({ round: 2, level: 30 }))) / 305).toBeCloseTo(0.7, 1);
    // Squeeze times unchanged: a uzun sıkma at level 30 is still 20 s.
    expect(generateSession(input({ round: 2, level: 30 })).blocks.at(-1)).toMatchObject({ type: 'slow_hold', holdSec: 20 });
  });
  it('the slow demo is three yavaş sıkma reps', () => {
    expect(generateSlowDemo().blocks).toEqual([expect.objectContaining({ type: 'elevator', reps: 3 })]);
  });
});

describe('contractions, caps and the small sessions', () => {
  it('counts one contraction per squeeze; the level cap covers Tur 1 + Tur 2 with up to three move blocks (180-day plan)', () => {
    for (const l of [1, 15, 30]) {
      const r1 = generateSession(input({ level: l }));
      const r2 = generateSession(input({ level: l, round: 2 }));
      expect(r1.contractions).toBe(r1.phases.filter((p) => p.kind === 'contract' && p.variant !== 'top').length);
      expect(r1.contractions + r2.contractions + 3 * MAX_MOVE_BLOCK_REPS).toBe(sessionContractionCap(l));
      // the longest move blocks (Hızlı Yarım Sıkma as latest and review) still fit under the cap
      const m1 = generateSession(input({ level: l, moves: { latest: 'half_quick' } }));
      const m2 = generateSession(input({ level: l, round: 2, moves: { latest: 'half_quick', review: 'wave' } }));
      expect(m1.contractions + m2.contractions).toBeLessThanOrEqual(sessionContractionCap(l));
    }
    expect(contractionCount(generateReleaseSession(SEED).blocks)).toBe(0);
  });
  it('blocks carry known technique cues', () => {
    const ids = new Set(KEGEL_CUES.map((c) => c.id));
    for (const b of generateSession(input({ round: 2 })).blocks) for (const c of b.cueSet) expect(ids.has(c)).toBe(true);
  });
  it('release session has no contractions; trial is 3 × 3 s / 3 s (the micro set was removed 2026-11-25)', () => {
    expect(generateReleaseSession(SEED).contractions).toBe(0);
    const trial = generateTrialSession();
    expect(trial.phases.filter((p) => p.kind === 'contract').map((p) => p.durationMs)).toEqual([3000, 3000, 3000]);
  });
});

describe('adjustLevel v2 (spec 6.5)', () => {
  const st = (level: number, consecutiveOk = 0, consecutiveHard = 0) => ({ level, consecutiveOk, consecutiveHard });

  it('too easy → +1', () => {
    expect(adjustLevel(st(4, 2), { feedback: 'easy' })).toMatchObject({ level: 5, consecutiveOk: 0, delta: 1 });
  });

  it('3 ok in a row with ≥ 90 % completion → +1; a weaker ok breaks the streak', () => {
    let s = st(4);
    for (let i = 1; i < OK_STREAK_FOR_LEVEL_UP; i++) {
      const r = adjustLevel(s, { feedback: 'ok', completionRate: 0.95 });
      expect(r).toMatchObject({ level: 4, consecutiveOk: i });
      s = r;
    }
    expect(adjustLevel(s, { feedback: 'ok', completionRate: 1 })).toMatchObject({ level: 5, delta: 1 });
    expect(adjustLevel(s, { feedback: 'ok', completionRate: 0.8 })).toMatchObject({ level: 4, consecutiveOk: 0 });
    expect(adjustLevel(s, { feedback: 'ok', skippedBlocks: 1 })).toMatchObject({ level: 4, consecutiveOk: 0 });
    expect(adjustLevel(s, { feedback: 'ok', pauses: 3 })).toMatchObject({ level: 4, consecutiveOk: 0 });
  });

  it('hard keeps the level and suggests a shorter preset; 2 hard in a row → −1', () => {
    const a = adjustLevel(st(6), { feedback: 'hard' });
    expect(a).toMatchObject({ level: 6, consecutiveHard: 1, suggestShorter: true, delta: 0 });
    expect(adjustLevel(a, { feedback: 'hard' })).toMatchObject({ level: 5, consecutiveHard: 0, delta: -1 });
  });

  it('completion below 70 % → −1; could not finish → −1 and repeat the day', () => {
    expect(adjustLevel(st(6), { feedback: 'ok', completionRate: 0.6 })).toMatchObject({ level: 5, delta: -1, repeatDay: false });
    expect(adjustLevel(st(6, 1), { feedback: 'failed' })).toMatchObject({ level: 5, repeatDay: true, delta: -1 });
    expect(adjustLevel(st(1), { feedback: 'failed' }).level).toBe(1);
  });

  it('a pain lock stops increases but not decreases', () => {
    expect(adjustLevel(st(6), { feedback: 'easy', locked: true })).toMatchObject({ level: 6, delta: 0 });
    expect(adjustLevel(st(6, 2), { feedback: 'ok', locked: true })).toMatchObject({ level: 6, delta: 0 });
    expect(adjustLevel(st(6), { feedback: 'failed', locked: true }).level).toBe(5);
  });

  it('stays within 1..30 and still accepts a bare feedback', () => {
    expect(adjustLevel(st(30), 'easy')).toMatchObject({ level: 30, delta: 0 });
    expect(adjustLevel(st(MAX_LEVEL, 2), 'ok').level).toBe(30);
  });
});

describe('schedule rules', () => {
  const test = (date: string, holdBestMs: number): StrengthTest => ({ id: date, date, holdBestMs, holdAttemptsMs: [holdBestMs], quickCount: 10 });

  it('deload = week 4 of every 30-day stage (days 22–30, 52–60 …); early (≥ 2 weeks after the last) when strength falls two weeks in a row', () => {
    expect([0, 6, 7, 14, 20, 21, 25, 29].map(isPlanDeloadDay)).toEqual([false, false, false, false, false, true, true, true]);
    // the 180-day plan repeats the four-week rhythm in each of its six stages
    expect([30, 50, 51, 59, 60, 171, 179].map(isPlanDeloadDay)).toEqual([false, false, true, true, false, true, true]);
    expect([0, 7, 14, 21].map((planDay) => deloadDue({ planNumber: 1, planDay, lastDeloadWeek: -1 }))).toEqual([false, false, false, true]);
    // Stage 2 starts normal again, even right after the stage-1 deload.
    expect(deloadDue({ planNumber: 1, planDay: 30, lastDeloadWeek: 3 })).toBe(false);
    // Early: stage 2 week 2 (number 5) is 2 weeks after the last deload (3).
    expect(deloadDue({ planNumber: 1, planDay: 37, lastDeloadWeek: 3, strengthFalling: true })).toBe(true);
    expect(deloadDue({ planNumber: 1, planDay: 30, lastDeloadWeek: 3, strengthFalling: true })).toBe(false);
    // An early deload lasts the rest of that week.
    expect(deloadDue({ planNumber: 1, planDay: 40, lastDeloadWeek: 5 })).toBe(true);
    expect(deloadDue({ planNumber: 1, planDay: 44, lastDeloadWeek: 5 })).toBe(false);
    // plan 2 week 1 follows stage 6 week 4 (number 23)
    expect(planWeekNumber(1, 179)).toBe(23);
    expect(planWeekNumber(2, 0)).toBe(24);
    expect(strengthFallingTwoWeeks([test('2026-11-01', 9000), test('2026-11-08', 8000), test('2026-11-15', 7000)])).toBe(true);
    expect(strengthFallingTwoWeeks([test('2026-11-01', 9000), test('2026-11-08', 9500), test('2026-11-15', 7000)])).toBe(false);
  });

  it('missed days: 1–2 nothing, 3–6 −1, 7+ −2 with a short re-warm; vacation days do not count', () => {
    expect(missedDaysPolicy('2026-11-13', '2026-11-15')).toMatchObject({ missedDays: 1, levelDelta: 0, kind: 'none' });
    expect(missedDaysPolicy('2026-11-10', '2026-11-15')).toMatchObject({ missedDays: 4, levelDelta: -1, kind: 'gentle' });
    expect(missedDaysPolicy('2026-11-01', '2026-11-15')).toMatchObject({ levelDelta: -2, kind: 'rewarm', preset: 'quick' });
    expect(missedDaysPolicy('2026-11-01', '2026-11-15', { from: '2026-11-02', to: '2026-11-13' })).toMatchObject({ missedDays: 1, levelDelta: 0 });
    expect(missedDaysPolicy(null, '2026-11-15').levelDelta).toBe(0);
    expect(applyReturn({ ...defaultTraining(), level: 2 }, -2).level).toBe(1);
    expect(validVacation('2026-11-20', '2026-11-22', '2026-11-15')).toBe(true);
    expect(validVacation('2026-11-20', '2026-11-21', '2026-11-15')).toBe(false);
    expect(validVacation('2026-11-20', '2026-12-04', '2026-11-15')).toBe(false);
    expect(validVacation('2026-11-10', '2026-11-14', '2026-11-15')).toBe(false);
  });

  it('two streak freezes per month', () => {
    expect(refreshFreezes({ freezeTokens: 0, freezeMonth: '2026-10' }, '2026-11-15')).toEqual({ freezeTokens: 2, freezeMonth: '2026-11' });
    expect(refreshFreezes({ freezeTokens: 1, freezeMonth: '2026-11' }, '2026-11-30')).toEqual({ freezeTokens: 1, freezeMonth: '2026-11' });
  });

  it('daily contraction cap locks extra sessions; a release session still opens', () => {
    const cap = dailyContractionCap(10);
    expect(capStatus(cap - 1, 10).locked).toBe(false);
    expect(capStatus(cap, 10).locked).toBe(true);
    expect(sessionAllowed(cap - 10, 20, 10)).toBe(false);
    expect(sessionAllowed(cap, generateReleaseSession(SEED).contractions, 10)).toBe(true);
    // Tur 1 + Tur 2 and the one extra session before the rest fit under the cap.
    const both = sessionContractionCap(30);
    const extra = generateSession({ level: 30, seed: SEED }).contractions;
    expect(both + extra).toBeLessThanOrEqual(dailyContractionCap(30));
  });

  it('pain: level lock for 7 days; 2 reports in 7 days → referral', () => {
    expect(painPolicy([], '2026-11-15')).toEqual({ lockUntil: null, refer: false });
    expect(painPolicy([{ id: 'a', at: '2026-11-14T20:00:00.000Z' }], '2026-11-15')).toEqual({ lockUntil: '2026-11-21', refer: false });
    expect(
      painPolicy(
        [
          { id: 'a', at: '2026-11-10T20:00:00.000Z' },
          { id: 'b', at: '2026-11-14T20:00:00.000Z' },
        ],
        '2026-11-15',
      ).refer,
    ).toBe(true);
    expect(painPolicy([{ id: 'a', at: '2026-11-01T20:00:00.000Z' }], '2026-11-15').lockUntil).toBeNull();
  });

  it('screening: ≥ 2 yes in the first 7 → relaxation suggested; pain questions set the pain flag; dribbling alone does not', () => {
    const no = Array<boolean>(8).fill(false);
    expect(screeningToTrack(no)).toEqual({ hypertonicFlag: false, painFlag: false, suggestTrack: null });
    expect(screeningToTrack([false, false, false, true, true, false, false, false])).toMatchObject({ hypertonicFlag: true, painFlag: false, suggestTrack: 'relax' });
    expect(screeningToTrack([true, false, false, false, false, false, false, true])).toMatchObject({ hypertonicFlag: false, painFlag: true });
    expect(screeningToTrack([false, false, false, false, false, false, true, true]).hypertonicFlag).toBe(false);
  });

  it('muscle score: baseline 50, double 100, clamped', () => {
    const base = { holdBestMs: 5000, quickCount: 10 };
    expect(muscleScore(base, base)).toBe(50);
    expect(muscleScore(base, { holdBestMs: 10000, quickCount: 20 })).toBe(100);
    expect(muscleScore(base, { holdBestMs: 40000, quickCount: 40 })).toBe(100);
    expect(muscleScore(base, { holdBestMs: 0, quickCount: 0 })).toBe(0);
  });

  it('goals → primary track by priority; surgery only with clearance', () => {
    expect(goalsToTrack(['endurance', 'bladder', 'erection'])).toBe('bladder');
    expect(goalsToTrack(['postSurgery', 'erection'])).toBe('erection');
    expect(goalsToTrack(['postSurgery', 'erection'], true)).toBe('surgery');
    expect(goalsToTrack(['endurance'])).toBe('control');
    expect(goalsToTrack(['confidence'])).toBe('general');
    expect(goalsToTrack([])).toBe('general');
    expect(trackAllowed('surgery', false)).toBe(false);
    expect(KEGEL_TRACKS.map((t) => t.id).sort()).toEqual(['bladder', 'control', 'erection', 'general', 'relax', 'surgery']);
    expect(KEGEL_TRACKS.find((t) => t.id === 'surgery')?.requiresClearance).toBe(true);
  });
});

describe('plan progression and migration', () => {
  const base: TrainingState = { ...defaultTraining(), level: 3 };

  it('advances one plan day and programme day per calendar day', () => {
    const a = applySessionResult(base, { date: '2026-11-15', feedback: 'ok' });
    expect(a).toMatchObject({ planDayIndex: 1, dayIndex: 1, weekIndex: 0 });
    const b = applySessionResult(a, { date: '2026-11-15', feedback: 'ok' });
    expect(b.planDayIndex).toBe(1); // second session same day
    expect(b.consecutiveOk).toBe(2);
    const c = applySessionResult(b, { date: '2026-11-16', feedback: 'ok' });
    expect(c).toMatchObject({ planDayIndex: 2, level: 4 });
  });

  it('rolls the programme week after 7 days; extra sessions keep the finished day’s week', () => {
    const a = applySessionResult({ ...base, dayIndex: 6, weekIndex: 2 }, { date: '2026-11-15', feedback: 'ok' });
    expect(a).toMatchObject({ dayIndex: 0, weekIndex: 3 });
    expect(todayWeekIndex(a, '2026-11-15')).toBe(2);
    expect(todayWeekIndex(a, '2026-11-16')).toBe(3);
  });

  it('remembers a deload week and the pain lock; "hard" no longer suggests a shorter preset (one session length)', () => {
    // Day 53 (stage 2, week 4) → week number 4 + 3 = 7.
    expect(applySessionResult({ ...base, planNumber: 1, planDayIndex: 52 }, { date: '2026-11-15', feedback: 'ok', deload: true }).lastDeloadWeek).toBe(7);
    const hard = applySessionResult(base, { date: '2026-11-15', feedback: 'hard' });
    expect(hard.suggestShorter).toBeUndefined();
    expect(hard.level).toBe(base.level);
    const locked = applySessionResult({ ...base, levelLockUntil: '2026-11-20' }, { date: '2026-11-15', feedback: 'easy' });
    expect(locked.level).toBe(3);
    expect(applySessionResult({ ...base, levelLockUntil: '2026-11-20' }, { date: '2026-11-20', feedback: 'easy' }).level).toBe(4);
  });

  it('failed does not advance the plan; rolls to Plan 2 after 180 days keeping the level', () => {
    const a = applySessionResult({ ...base, planDayIndex: 4 }, { date: '2026-11-15', feedback: 'failed' });
    expect(a).toMatchObject({ planDayIndex: 4, level: 2, repeatNextDay: true });
    expect(todayPlanDay(a, '2026-11-16')).toBe(4);
    const b = applySessionResult({ ...base, planDayIndex: 179, level: 12 }, { date: '2026-11-15', feedback: 'easy' });
    expect(b).toMatchObject({ planDayIndex: 0, planNumber: 2, level: 13 });
    expect(applySessionResult({ ...base, planDayIndex: 29 }, { date: '2026-11-15', feedback: 'ok' })).toMatchObject({ planDayIndex: 30, planNumber: 1 });
    expect(setManualLevel({ ...base, consecutiveOk: 2 }, 40)).toMatchObject({ level: 30, consecutiveOk: 0 });
  });

  it('migrates v1 state: level and progress kept (old 30-day plans carry over onto the 180-day plan), general / standard', () => {
    const v1 = { level: 12, consecutiveOk: 1, planDayIndex: 20, planNumber: 2, lastAdvancedDate: '2026-11-14', repeatNextDay: false };
    const m = migrateTraining(v1);
    // old plan 2 day 21 = day 51 of the 180-day plan
    expect(m).toMatchObject({ ...v1, planDayIndex: 50, planNumber: 1, planLength: 180, track: 'general', durationPreset: 'standard', dailyTarget: 2, weekIndex: 7, dayIndex: 1, consecutiveHard: 0, freezeTokens: 2, lastDeloadWeek: -1 });
    // old plan 7 day 1 (180 days done) = plan 2 day 1
    expect(migrateTraining({ ...v1, planNumber: 7, planDayIndex: 0 })).toMatchObject({ planNumber: 2, planDayIndex: 0 });
    // once saved with planLength the position is kept as it is
    expect(migrateTraining({ ...v1, planDayIndex: 120, planNumber: 1, planLength: 180 })).toMatchObject({ planDayIndex: 120, planNumber: 1 });
    expect(migrateTraining({ ...m, movesLearned: ['step_up', 'nope', 'step_up', 4] })).toMatchObject({ movesLearned: ['step_up'] });
    expect(migrateTraining(m)).toEqual(m);
    expect(migrateTraining(null)).toEqual(defaultTraining());
    expect(migrateTraining({ level: 'x', track: 'nope', durationPreset: 'huge', dailyTarget: 9, vacation: { from: 1 } })).toEqual(defaultTraining());
    expect(migrateTraining({ ...m, vacation: { from: '2026-11-20', to: '2026-11-25' }, levelLockUntil: '2026-11-21' })).toMatchObject({ vacation: { from: '2026-11-20', to: '2026-11-25' }, levelLockUntil: '2026-11-21' });
  });
});
