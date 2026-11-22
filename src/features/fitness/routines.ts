import fitness from '@/content/fitness.tr.json';
import type { ActivityLevel } from '@/types';

import { MOVES, type MoveSpec } from './motion';

/** A pelvic fitness move: what it works, how to start, the steps, a tip and the usual mistake. */
export interface FitnessExercise {
  id: string;
  name: string;
  target: string;
  setup: string;
  steps: string[];
  tip: string;
  mistake: string;
}

/** Rounds of a routine (user request 2026-11-22): 1 Isınma, 2 Güç, 3 Esneme. */
export type FitnessRound = 1 | 2 | 3;

export interface RoutineStep {
  exerciseId: string;
  workSec: number;
  restSec: number;
  round: FitnessRound;
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

/** Tempo and figure of a move. */
export const getMove = (id: string): MoveSpec | undefined => MOVES[id];

/** The routine's steps grouped by round, in order. */
export function routineRounds(r: Routine): { round: FitnessRound; steps: { step: RoutineStep; index: number }[] }[] {
  const out: { round: FitnessRound; steps: { step: RoutineStep; index: number }[] }[] = [];
  r.steps.forEach((step, index) => {
    const last = out[out.length - 1];
    if (last && last.round === step.round) last.steps.push({ step, index });
    else out.push({ round: step.round, steps: [{ step, index }] });
  });
  return out;
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
