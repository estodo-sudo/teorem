import fitness from '@/content/fitness.tr.json';
import type { ActivityLevel } from '@/types';

export type Posture = 'bridge' | 'lying' | 'seated' | 'squat' | 'plank' | 'kneeling' | 'lunge' | 'side';

export interface FitnessExercise {
  id: string;
  posture: Posture;
  name: string;
  desc: string;
  cue: string;
}

export interface RoutineStep {
  exerciseId: string;
  workSec: number;
  restSec: number;
}

export interface Routine {
  id: string;
  name: string;
  level: ActivityLevel;
  steps: RoutineStep[];
}

export const FITNESS_EXERCISES = fitness.exercises as FitnessExercise[];
export const ROUTINES = fitness.routines as Routine[];
export const FITNESS_COUNTDOWN_SEC = 5;

export function getExercise(id: string): FitnessExercise | undefined {
  return FITNESS_EXERCISES.find((e) => e.id === id);
}

export function getRoutine(id: string): Routine | undefined {
  return ROUTINES.find((r) => r.id === id);
}

export function routineDurationSec(r: Routine): number {
  return FITNESS_COUNTDOWN_SEC + r.steps.reduce((a, s) => a + s.workSec + s.restSec, 0);
}

/** Routine suggested on Today based on onboarding activity level. */
export function recommendedRoutine(activity: ActivityLevel | null): Routine {
  const target: ActivityLevel = activity ?? 'low';
  return ROUTINES.find((r) => r.level === target) ?? ROUTINES[0]!;
}

export interface FitnessPhase {
  kind: 'countdown' | 'work' | 'rest';
  durationMs: number;
  exerciseIndex: number;
  exerciseId: string;
}

/** Flattens a routine into timed phases for the generic player machine. */
export function routinePhases(r: Routine): FitnessPhase[] {
  const out: FitnessPhase[] = [
    { kind: 'countdown', durationMs: FITNESS_COUNTDOWN_SEC * 1000, exerciseIndex: -1, exerciseId: r.steps[0]?.exerciseId ?? '' },
  ];
  r.steps.forEach((s, i) => {
    out.push({ kind: 'work', durationMs: s.workSec * 1000, exerciseIndex: i, exerciseId: s.exerciseId });
    if (s.restSec > 0) {
      // Rest belongs to the following exercise so the preview shows what's next.
      const next = r.steps[i + 1];
      out.push({ kind: 'rest', durationMs: s.restSec * 1000, exerciseIndex: next ? i + 1 : i, exerciseId: next?.exerciseId ?? s.exerciseId });
    }
  });
  return out;
}
