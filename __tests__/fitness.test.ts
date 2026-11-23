import {
  FITNESS_EXERCISES,
  getExercise,
  getRoutine,
  standardRoutine,
  routineDurationSec,
  routinePhases,
  routineRounds,
  ROUTINES,
} from '@/features/fitness/routines';
import { cycleMs, motionAt, MOVES, pillowRx, repsIn } from '@/features/fitness/motion';

describe('pelvic fitness content', () => {
  it('has 12 unique exercises', () => {
    expect(FITNESS_EXERCISES).toHaveLength(12);
    expect(new Set(FITNESS_EXERCISES.map((e) => e.id)).size).toBe(12);
  });

  it('every routine step references a known exercise', () => {
    for (const r of ROUTINES) for (const s of r.steps) expect(getExercise(s.exerciseId)).toBeDefined();
  });

  it('one standard routine, no levels, about 10 minutes (user request 2026-11-23)', () => {
    expect(ROUTINES.map((r) => r.id)).toEqual(['standard']);
    expect(standardRoutine().id).toBe('standard');
    expect('level' in standardRoutine()).toBe(false);
    const min = routineDurationSec(standardRoutine()) / 60;
    expect(min).toBeGreaterThanOrEqual(9.5);
    expect(min).toBeLessThanOrEqual(10.5);
    expect(standardRoutine().steps).toHaveLength(10);
  });

  it('old level links open the standard routine', () => {
    for (const id of ['beginner', 'intermediate', 'advanced']) expect(getRoutine(id)?.id).toBe('standard');
    expect(getRoutine('nope')).toBeUndefined();
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

describe('animation review (2026-11-23)', () => {
  it('dead bug and bird dog switch the opposite arm and leg every rep; the others switch at half time', () => {
    for (const id of ['dead_bug', 'bird_dog']) {
      const m = MOVES[id]!;
      expect(m.alternate).toBe(true);
      const c = cycleMs(m);
      const work = 48_000;
      expect([motionAt(m, 100, work).side, motionAt(m, c + 100, work).side, motionAt(m, 2 * c + 100, work).side]).toEqual([1, 2, 1]);
      // A rep counts when both sides are done.
      expect([motionAt(m, 100, work).rep, motionAt(m, c + 100, work).rep, motionAt(m, 2 * c + 100, work).rep]).toEqual([1, 1, 2]);
      expect(motionAt(m, work - 100, work).rep).toBe(repsIn(m, work));
    }
    const clam = MOVES.clamshell!;
    expect(clam.alternate).toBeUndefined();
    expect([motionAt(clam, 100, 48_000).side, motionAt(clam, 24_100, 48_000).side]).toEqual([1, 2]);
  });

  it('pelvic tilt: the pelvis stays on the floor; the low back flattens', () => {
    const m = MOVES.pelvic_tilt!;
    for (const k of ['A', 'B'] as const) expect(m.poses[k]!.p[1]).toBeGreaterThanOrEqual(119);
    expect(m.poses.A.m![1]).toBeLessThan(m.poses.B.m![1]);
  });

  it('pillow squeeze: the knees really come together (the pillow is drawn thinner)', () => {
    const m = MOVES.pillow_squeeze!;
    expect(pillowRx(m.poses.A) - pillowRx(m.poses.B)).toBeGreaterThan(3);
  });

  it('butterfly sits on the floor: pelvis at floor height, knees sink on the out-breath', () => {
    const m = MOVES.butterfly!;
    expect(m.poses.A.p[1]).toBeGreaterThanOrEqual(116);
    expect(m.poses.B.k1[1]).toBeGreaterThan(m.poses.A.k1[1]);
  });

  it('no joint of any pose goes below the floor', () => {
    for (const [id, m] of Object.entries(MOVES)) for (const pose of Object.values(m.poses)) for (const [x, y] of Object.values(pose!)) expect([id, x >= 0 && y <= 130]).toEqual([id, true]);
  });
});
