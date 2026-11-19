import type { DurationPreset, ExerciseType, KegelExerciseType, Position, TrackId } from '@/types';

export type PhaseKind =
  | 'countdown'
  | 'contract'
  /** Knack: the cough while the squeeze is held. */
  | 'cough'
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
  /** Index into session.exercises / session.blocks; -1 for the initial countdown. */
  exerciseIndex: number;
  /** 1-based rep within the block; 0 if n/a. */
  rep: number;
  reps: number;
  /** 1-based set number within the exercise. */
  set: number;
  sets: number;
  /** v1 elevator floor (1..3); not produced any more, kept for type compatibility. */
  stage?: 1 | 2 | 3;
  /**
   * Slow squeeze/release block: slowUp = squeeze slowly, top = short hold at the top, slowDown = let go
   * slowly. Release block: settle = loosen, letGo = let go fully.
   */
  variant?: 'slowUp' | 'top' | 'slowDown' | 'settle' | 'letGo';
  /** For transitions: the exercise that comes next. */
  nextType?: ExerciseType;
}

/** v1-compatible summary of a block (what the player and history read). */
export interface SessionExercise {
  type: ExerciseType;
  reps: number;
  sets: number;
  contractSec: number;
  relaxSec: number;
}

/** One block of a v2 session (SPEC_KEGEL_V2 §14). */
export interface SessionBlock {
  type: KegelExerciseType;
  position: Position;
  holdSec?: number;
  restSec: number;
  reps: number;
  floors?: number;
  /** Slow squeeze / slow release: seconds for each slow phase. */
  slowSec?: number;
  /** Ids of technique cues shown in turn during the block (src/content/kegel/cues.tr.json). */
  cueSet: string[];
  /** Warm-up / cool-down / main. */
  role: 'warmup' | 'main' | 'cooldown';
}

export interface GeneratedSession {
  id: string;
  seed: string;
  level: number;
  dayIndex: number;
  weekIndex: number;
  track: TrackId;
  durationPreset: DurationPreset;
  deload: boolean;
  isMicro: boolean;
  blocks: SessionBlock[];
  exercises: SessionExercise[];
  phases: Phase[];
  plannedSec: number;
  /** Contractions in the session (daily cap). */
  contractions: number;
}
