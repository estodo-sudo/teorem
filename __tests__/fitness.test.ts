import {
  FITNESS_EXERCISES,
  getExercise,
  recommendedRoutine,
  routineDurationSec,
  routinePhases,
  ROUTINES,
} from '@/features/fitness/routines';

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
