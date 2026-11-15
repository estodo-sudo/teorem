import type { ExerciseType } from '@/types';

export type PhaseKind =
  | 'countdown'
  | 'contract'
  | 'release'
  | 'relax'
  | 'rest'
  | 'transition'
  | 'inhale'
  | 'exhale';

/** One timed step of a session. */
export interface Phase {
  kind: PhaseKind;
  durationMs: number;
  /** Index into session.exercises; -1 for the initial countdown. */
  exerciseIndex: number;
  /** 1-based rep (or block for pulse) within the exercise; 0 if n/a. */
  rep: number;
  reps: number;
  /** 1-based set number within the exercise. */
  set: number;
  sets: number;
  /** Elevator stage (1..3) for contract/release phases. */
  stage?: 1 | 2 | 3;
  /** For transitions: the exercise that comes next. */
  nextType?: ExerciseType;
}

export interface SessionExercise {
  type: ExerciseType;
  reps: number;
  sets: number;
  contractSec: number;
  relaxSec: number;
}

export interface GeneratedSession {
  id: string;
  seed: string;
  level: number;
  dayIndex: number;
  variant: 'elevator' | 'pulse';
  exercises: SessionExercise[];
  phases: Phase[];
  plannedSec: number;
}
