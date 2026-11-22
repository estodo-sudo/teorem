import {
  FITNESS_EXERCISES,
  getExercise,
  recommendedRoutine,
  routineDurationSec,
  routinePhases,
  routineRounds,
  ROUTINES,
} from '@/features/fitness/routines';
import { cycleMs, motionAt, MOVES, repsIn } from '@/features/fitness/motion';

describe('pelvic fitness content', () => {
  it('has 12 unique exercises', () => {
    expect(FITNESS_EXERCISES).toHaveLength(12);
    expect(new Set(FITNESS_EXERCISES.map((e) => e.id)).size).toBe(12);
  });

  it('every routine step references a known exercise', () => {
    for (const r of ROUTINES) for (const s of r.steps) expect(getExercise(s.exerciseId)).toBeDefined();
  });

  it('routines last about 5 / 8 / 12 minutes', () => {
    const mins = ROUTINES.map((r) => routineDurationSec(r) / 60);
    expect(mins[0]).toBeGreaterThanOrEqual(4.5);
    expect(mins[0]).toBeLessThanOrEqual(5.5);
    expect(mins[1]).toBeGreaterThanOrEqual(7.5);
    expect(mins[1]).toBeLessThanOrEqual(8.5);
    expect(mins[2]).toBeGreaterThanOrEqual(11.5);
    expect(mins[2]).toBeLessThanOrEqual(12.5);
  });

  it('recommends a routine by activity level', () => {
    expect(recommendedRoutine('low').id).toBe('beginner');
    expect(recommendedRoutine('mid').id).toBe('intermediate');
    expect(recommendedRoutine('high').id).toBe('advanced');
    expect(recommendedRoutine(null).id).toBe('beginner');
  });

  it('flattens routines into phases whose total equals the routine duration', () => {
    for (const r of ROUTINES) {
      const p = routinePhases(r);
      expect(p[0]!.kind).toBe('countdown');
      expect(p.filter((x) => x.kind === 'work')).toHaveLength(r.steps.length);
      expect(p.reduce((a, x) => a + x.durationMs, 0) / 1000).toBe(routineDurationSec(r));
    }
  });
});

describe('pelvic fitness: rounds, how-to and motion (update 2026-11-22)', () => {
  it('every routine goes Isınma → Güç → Esneme', () => {
    for (const r of ROUTINES) expect(routineRounds(r).map((x) => x.round)).toEqual([1, 2, 3]);
  });
  it('every move has a target, a start position, 3 steps, a tip, a mistake, a figure and a tempo', () => {
    for (const e of FITNESS_EXERCISES) {
      expect([e.id, e.target.length > 0 && e.setup.length > 20 && e.steps.length === 3 && e.tip.length > 0 && e.mistake.length > 0]).toEqual([e.id, true]);
      const m = MOVES[e.id]!;
      expect(m.tempo.length).toBeGreaterThan(0);
      for (const s of m.tempo) expect(m.poses[s.to]).toBeDefined();
    }
  });
  it('repeated moves fit whole reps into each exercise (per side for one-sided moves)', () => {
    for (const r of ROUTINES)
      for (const s of r.steps) {
        const m = MOVES[s.exerciseId]!;
        if (m.kind !== 'reps') continue;
        const per = (m.sides ? s.workSec / 2 : s.workSec) * 1000;
        expect([s.exerciseId, per % cycleMs(m)]).toEqual([s.exerciseId, 0]);
      }
  });
  it('köprü: KALDIR → TUT → İNDİR, the figure rises and comes back; rep count', () => {
    const m = MOVES.glute_bridge!;
    expect([0, 2500, 4500].map((t) => motionAt(m, t, 36000).word)).toEqual(['lift', 'hold', 'lower']);
    expect(motionAt(m, 0).pose.p[1]).toBeCloseTo(m.poses.A.p[1]);
    expect(motionAt(m, 2000).pose.p[1]).toBeCloseTo(m.poses.B.p[1]);
    expect(motionAt(m, 6000).pose.p[1]).toBeCloseTo(m.poses.A.p[1]);
    expect(motionAt(m, 13000, 36000)).toMatchObject({ rep: 3, reps: 6, side: 1 });
    expect(repsIn(m, 36000)).toBe(6);
  });
  it('one-sided moves switch side at half time', () => {
    const m = MOVES.clamshell!;
    expect(motionAt(m, 19000, 40000).side).toBe(1);
    expect(motionAt(m, 20000, 40000)).toMatchObject({ side: 2, rep: 1, reps: 5 });
  });
});
