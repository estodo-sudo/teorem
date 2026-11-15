import { adjustLevel, OK_STREAK_FOR_LEVEL_UP } from '@/features/training/adjustLevel';
import { generateSession, generateTrialSession } from '@/features/training/generateSession';
import { clampLevel, getLevel, LEVELS, MAX_LEVEL, startingLevelFor } from '@/features/training/levels';
import { applySessionResult, setManualLevel, todayPlanDay } from '@/features/training/plan';
import type { TrainingState } from '@/types';

const SEED = '2026-11-15';

describe('levels table', () => {
  it('has 30 levels numbered 1..30', () => {
    expect(LEVELS).toHaveLength(30);
    LEVELS.forEach((l, i) => expect(l.level).toBe(i + 1));
  });

  it('never decreases any parameter from one level to the next', () => {
    const keys = [
      'holdSec',
      'relaxSec',
      'reps',
      'setCount',
      'quickReps',
      'enduranceSec',
      'elevatorReps',
      'pulseBlocks',
      'pulseCount',
    ] as const;
    for (let i = 1; i < LEVELS.length; i++) {
      for (const k of keys) expect(LEVELS[i]![k]).toBeGreaterThanOrEqual(LEVELS[i - 1]![k]);
    }
  });

  it('unlocks endurance at level 5', () => {
    expect(getLevel(4).enduranceSec).toBe(0);
    expect(getLevel(5).enduranceSec).toBeGreaterThanOrEqual(10);
    expect(getLevel(30).enduranceSec).toBeLessThanOrEqual(30);
  });

  it('clamps out-of-range levels', () => {
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(99)).toBe(30);
    expect(clampLevel(NaN)).toBe(1);
    expect(getLevel(-3).level).toBe(1);
  });

  it('maps experience to a starting level', () => {
    expect(startingLevelFor('none')).toBe(1);
    expect(startingLevelFor('some')).toBe(3);
    expect(startingLevelFor('regular')).toBe(5);
    expect(startingLevelFor(null)).toBe(1);
  });
});

describe('generateSession', () => {
  it('is deterministic for the same level, day and seed', () => {
    for (const day of [0, 1, 7]) {
      expect(generateSession(12, day, SEED)).toEqual(generateSession(12, day, SEED));
    }
  });

  it('builds a deterministic id from seed, level and day', () => {
    expect(generateSession(3, 4, SEED).id).toBe(`${SEED}-L3-D4`);
  });

  it('keeps level 1 around 4 minutes and level 30 around 8 minutes', () => {
    for (const day of [0, 1]) {
      const l1 = generateSession(1, day, SEED).plannedSec;
      const l30 = generateSession(30, day, SEED).plannedSec;
      expect(l1).toBeGreaterThanOrEqual(210);
      expect(l1).toBeLessThanOrEqual(270);
      expect(l30).toBeGreaterThanOrEqual(450);
      expect(l30).toBeLessThanOrEqual(520);
    }
  });

  it('grows duration smoothly (non-decreasing, no jump > 60 s)', () => {
    for (const day of [0, 1]) {
      let prev = 0;
      for (let l = 1; l <= MAX_LEVEL; l++) {
        const d = generateSession(l, day, SEED).plannedSec;
        expect(d).toBeGreaterThanOrEqual(prev);
        if (prev) expect(d - prev).toBeLessThanOrEqual(60);
        prev = d;
      }
    }
  });

  it('keeps elevator and pulse days within 10% of each other', () => {
    for (let l = 1; l <= MAX_LEVEL; l++) {
      const a = generateSession(l, 0, SEED).plannedSec;
      const b = generateSession(l, 1, SEED).plannedSec;
      expect(Math.abs(a - b) / a).toBeLessThan(0.1);
    }
  });

  it('alternates elevator / pulse by day index', () => {
    const types = (day: number) => generateSession(6, day, SEED).exercises.map((e) => e.type);
    expect(types(0)).toEqual(['quick', 'hold', 'elevator', 'endurance', 'relax']);
    expect(types(1)).toEqual(['quick', 'hold', 'pulse', 'endurance', 'relax']);
    expect(generateSession(6, 2, SEED).variant).toBe('elevator');
  });

  it('adds endurance only from level 5', () => {
    expect(generateSession(4, 0, SEED).exercises.map((e) => e.type)).not.toContain('endurance');
    expect(generateSession(5, 0, SEED).exercises.map((e) => e.type)).toContain('endurance');
  });

  it('starts with a countdown and ends with relaxation breathing', () => {
    const s = generateSession(10, 3, SEED);
    expect(s.phases[0]!.kind).toBe('countdown');
    const last = s.phases[s.phases.length - 1]!;
    expect(last.kind).toBe('exhale');
    expect(s.exercises[s.exercises.length - 1]!.type).toBe('relax');
  });

  it('plannedSec equals the sum of phase durations', () => {
    const s = generateSession(17, 5, SEED);
    const sum = s.phases.reduce((a, p) => a + p.durationMs, 0) / 1000;
    expect(s.plannedSec).toBe(Math.round(sum));
  });

  it('hold block has setCount × reps contractions of holdSec', () => {
    const lvl = getLevel(8);
    const s = generateSession(8, 0, SEED);
    const holdIdx = s.exercises.findIndex((e) => e.type === 'hold');
    const contractions = s.phases.filter((p) => p.exerciseIndex === holdIdx && p.kind === 'contract');
    expect(contractions).toHaveLength(lvl.setCount * lvl.reps);
    contractions.forEach((c) => expect(c.durationMs).toBe(lvl.holdSec * 1000));
  });

  it('elevator rep climbs 3 stages then releases gradually', () => {
    const s = generateSession(10, 0, SEED);
    const i = s.exercises.findIndex((e) => e.type === 'elevator');
    const rep1 = s.phases.filter((p) => p.exerciseIndex === i && p.rep === 1 && p.kind !== 'transition');
    expect(rep1.map((p) => `${p.kind}${p.stage ?? ''}`)).toEqual([
      'contract1',
      'contract2',
      'contract3',
      'release2',
      'release1',
      'relax',
    ]);
  });

  it('pulse total count is independent of the seed', () => {
    const count = (seed: string) => {
      const s = generateSession(9, 1, seed);
      const i = s.exercises.findIndex((e) => e.type === 'pulse');
      return s.phases.filter((p) => p.exerciseIndex === i && p.kind === 'contract').length;
    };
    expect(count('2026-01-01')).toBe(count('2026-06-30'));
    expect(count('a')).toBe(getLevel(9).pulseBlocks * getLevel(9).pulseCount);
  });

  it('trial session is 3 × 3 s squeeze / 3 s relax', () => {
    const t = generateTrialSession();
    const c = t.phases.filter((p) => p.kind === 'contract');
    expect(c).toHaveLength(3);
    expect(t.plannedSec).toBe(3 + 18);
  });
});

describe('adjustLevel', () => {
  it('easy → +1', () => {
    expect(adjustLevel({ level: 4, consecutiveOk: 2 }, 'easy')).toMatchObject({ level: 5, consecutiveOk: 0, delta: 1 });
  });

  it('ok → +1 only after 3 consecutive oks', () => {
    let s = { level: 4, consecutiveOk: 0 };
    for (let i = 1; i < OK_STREAK_FOR_LEVEL_UP; i++) {
      const r = adjustLevel(s, 'ok');
      expect(r.level).toBe(4);
      expect(r.consecutiveOk).toBe(i);
      s = r;
    }
    const r = adjustLevel(s, 'ok');
    expect(r).toMatchObject({ level: 5, consecutiveOk: 0, delta: 1 });
  });

  it('a non-ok feedback resets the ok streak', () => {
    const r = adjustLevel({ level: 4, consecutiveOk: 2 }, 'hard');
    expect(r.consecutiveOk).toBe(0);
    expect(adjustLevel(r, 'ok').level).toBe(3);
  });

  it('hard → −1 with minimum 1', () => {
    expect(adjustLevel({ level: 4, consecutiveOk: 0 }, 'hard').level).toBe(3);
    expect(adjustLevel({ level: 1, consecutiveOk: 0 }, 'hard')).toMatchObject({ level: 1, delta: 0 });
  });

  it('failed → −1 and repeat the day', () => {
    expect(adjustLevel({ level: 6, consecutiveOk: 1 }, 'failed')).toEqual({
      level: 5,
      consecutiveOk: 0,
      repeatDay: true,
      delta: -1,
    });
    expect(adjustLevel({ level: 1, consecutiveOk: 0 }, 'failed').level).toBe(1);
  });

  it('never exceeds the max level', () => {
    expect(adjustLevel({ level: 30, consecutiveOk: 0 }, 'easy')).toMatchObject({ level: 30, delta: 0 });
    expect(adjustLevel({ level: 30, consecutiveOk: 2 }, 'ok').level).toBe(30);
  });
});

describe('plan progression', () => {
  const base: TrainingState = {
    level: 3,
    consecutiveOk: 0,
    planDayIndex: 0,
    planNumber: 1,
    lastAdvancedDate: null,
    repeatNextDay: false,
  };

  it('advances one plan day per calendar day', () => {
    const a = applySessionResult(base, { date: '2026-11-15', feedback: 'ok' });
    expect(a.planDayIndex).toBe(1);
    const b = applySessionResult(a, { date: '2026-11-15', feedback: 'ok' });
    expect(b.planDayIndex).toBe(1); // second session same day
    expect(b.consecutiveOk).toBe(2); // but level logic still counts
    const c = applySessionResult(b, { date: '2026-11-16', feedback: 'ok' });
    expect(c.planDayIndex).toBe(2);
    expect(c.level).toBe(4);
  });

  it('failed does not advance the plan (same day repeats tomorrow)', () => {
    const a = applySessionResult({ ...base, planDayIndex: 4 }, { date: '2026-11-15', feedback: 'failed' });
    expect(a.planDayIndex).toBe(4);
    expect(a.level).toBe(2);
    expect(a.repeatNextDay).toBe(true);
    expect(todayPlanDay(a, '2026-11-16')).toBe(4);
  });

  it('rolls over to Plan 2 after 30 days, keeping the level', () => {
    const a = applySessionResult({ ...base, planDayIndex: 29, level: 12 }, { date: '2026-11-15', feedback: 'easy' });
    expect(a.planDayIndex).toBe(0);
    expect(a.planNumber).toBe(2);
    expect(a.level).toBe(13);
  });

  it('todayPlanDay replays the finished day for extra sessions', () => {
    const a = applySessionResult({ ...base, planDayIndex: 7 }, { date: '2026-11-15', feedback: 'ok' });
    expect(todayPlanDay(a, '2026-11-15')).toBe(7);
    expect(todayPlanDay(a, '2026-11-16')).toBe(8);
  });

  it('manual level change clamps and resets ok streak', () => {
    expect(setManualLevel({ ...base, consecutiveOk: 2 }, 40)).toMatchObject({ level: 30, consecutiveOk: 0 });
  });
});
