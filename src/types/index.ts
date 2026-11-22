/** Shared domain types. All data lives on-device only. */

export type Goal = 'endurance' | 'bladder' | 'erection' | 'confidence' | 'general' | 'postSurgery';

export type AgeRange = '16-24' | '25-34' | '35-44' | '45-54' | '55+';
export type Experience = 'none' | 'some' | 'regular';
export type ActivityLevel = 'low' | 'mid' | 'high';

export interface UserProfile {
  goals: Goal[];
  ageRange: AgeRange | null;
  experience: Experience | null;
  activity: ActivityLevel | null;
  onboardingDone: boolean;
  tutorialDone: boolean;
  /** ISO timestamp when the 16+ age gate + medical disclaimer were accepted. */
  disclaimerAcceptedAt: string | null;
  /** Whether the post-onboarding paywall has been shown at least once. */
  paywallSeen: boolean;
  createdAt: string;
}

export interface TrainingState {
  level: number;
  /** Consecutive "ok" feedbacks (3 → level up). */
  consecutiveOk: number;
  /** 0-based day within the current 30-day plan. */
  planDayIndex: number;
  /** 1-based plan number (Plan 1, Plan 2, ...). */
  planNumber: number;
  /** Date key (YYYY-MM-DD) of the last day the plan advanced. */
  lastAdvancedDate: string | null;
  /** If true, the next day repeats the same plan day (after a "failed" session). */
  repeatNextDay: boolean;
  // --- Kegel v2 (SPEC_KEGEL_V2 §14) ---
  track: TrackId;
  durationPreset: DurationPreset;
  /** Sessions per day: 1 main session + micro sets. */
  dailyTarget: DailyTarget;
  /** 0-based programme week and day within it, counted across all plans. */
  weekIndex: number;
  dayIndex: number;
  /** Consecutive "hard" feedbacks (2 → level down). */
  consecutiveHard: number;
  /** Week index of the last deload (lighter) week; -1 = none yet. */
  lastDeloadWeek: number;
  /** Streak freezes left this month (2 per month) and the month (YYYY-MM) they belong to. */
  freezeTokens: number;
  freezeMonth: string | null;
  /** Vacation mode: the streak is kept and reminders are silent (date keys, inclusive). */
  vacation?: { from: string; to: string };
  /** No level increase before this date key (after a pain report). */
  levelLockUntil?: string;
  /** After a "hard" session: suggest one shorter duration preset next time. */
  suggestShorter?: boolean;
  /** The next main session uses this preset once (first session after the tutorial: quick 3 min). */
  nextPresetOnce?: DurationPreset;
  /** The short Tur 2 (yavaş sıkma) introduction was shown once. */
  round2IntroDone?: boolean;
  /** Days kept by a streak freeze (date keys). */
  frozenDays?: string[];
  /** Last day the missed-days check ran (date key). */
  lastReturnCheck?: string;
  /** Message for today after a break or a used freeze. */
  returnNotice?: { kind: 'gentle' | 'rewarm' | 'frozen'; date: string; days: number };
}

export type TrackId = 'general' | 'erection' | 'control' | 'bladder' | 'surgery' | 'relax';
export type Position = 'lying' | 'sitting' | 'standing' | 'functional';
export type DurationPreset = 'quick' | 'standard' | 'full';
export type DailyTarget = 1 | 2 | 3 | 4;

/** Kegel muscle profile from the screening (not a diagnosis; only picks the programme). */
export interface KegelProfile {
  primaryTrack: TrackId;
  hypertonicFlag: boolean;
  /** Any of the pain questions answered "yes" → the "stop if it hurts" notice before every session. */
  painFlag: boolean;
  screeningAnswers: boolean[];
  screenedAt: string;
}

export interface PainReport {
  id: string;
  at: string;
  sessionId?: string;
  note?: string;
}

export interface SelfRating {
  id: string;
  at: string;
  track: TrackId;
  answers: Record<string, number>;
}

export interface FunctionalTask {
  id: string;
  date: string;
  taskId: string;
  done: boolean;
}

export type Feedback = 'easy' | 'ok' | 'hard' | 'failed';

/** Kegel v2 exercise types (SPEC_KEGEL_V2 §4). */
export type KegelExerciseType = 'slow_hold' | 'quick_flick' | 'max_contraction' | 'elevator' | 'endurance' | 'knack' | 'release' | 'breath';
/** v1 ids, still found in sessions saved before v2. */
export type LegacyExerciseType = 'hold' | 'quick' | 'pulse' | 'relax';
export type ExerciseType = KegelExerciseType | LegacyExerciseType;

export interface ExerciseResult {
  type: ExerciseType;
  completed: boolean;
  skipped: boolean;
}

export interface WorkoutSession {
  id: string;
  /** Date key YYYY-MM-DD (local). */
  date: string;
  /** ISO timestamp the session finished. */
  finishedAt: string;
  level: number;
  plannedSec: number;
  actualSec: number;
  exercises: ExerciseResult[];
  feedback?: Feedback;
  completed: boolean;
  // --- Kegel v2 (optional: older sessions don't have them) ---
  track?: TrackId;
  durationPreset?: DurationPreset;
  pauses?: number;
  skippedBlocks?: number;
  /** 0..1: completed main blocks / all blocks. */
  completionRate?: number;
  techniqueConfidence?: 'sure' | 'unsure';
  isMicro?: boolean;
  /** Contractions done (finished blocks; daily cap). */
  contractions?: number;
  /** Total hold time and longest hold in finished blocks (s). */
  holdSec?: number;
  longestHoldSec?: number;
  deload?: boolean;
}

export interface StrengthTest {
  id: string;
  date: string;
  holdBestMs: number;
  holdAttemptsMs: number[];
  quickCount: number;
  // --- Kegel v2 ---
  position?: Position;
  releaseSelfRating?: 1 | 2 | 3 | 4 | 5;
  muscleScore?: number;
}

export interface FitnessLog {
  id: string;
  date: string;
  routineId: string;
  durationSec: number;
}

export interface ProgressNote {
  id: string;
  date: string;
  createdAt: string;
  text: string;
  kind: 'progress' | 'unload';
}

/** Daily tasks: a 28-day nutrition plan for sexual health (snack, fruit, plate). */
export type ChallengeCategory = 'snack' | 'fruit' | 'plate';

export interface ChallengeLog {
  date: string;
  challengeIds: string[];
  completedIds: string[];
}

export interface CourseProgressEntry {
  completedLessonIds: string[];
  quizScores: Record<string, number>;
}

export interface ContentProgress {
  readStoryIds: string[];
  favoriteStoryIds: string[];
  courseProgress: Record<string, CourseProgressEntry>;
  /** Story id → slide the reader left off at (SPEC_V4 §B.1). Absent in older saves. */
  storyPositions?: Record<string, number>;
}

export interface Achievement {
  id: string;
  unlockedAt?: string;
}

export type HapticStrength = 0 | 1 | 2 | 3;
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Settings {
  hapticStrength: HapticStrength;
  soundCues: boolean;
  /** Sound of the "Pelvik taban kasın nerede?" animation (on by default; the mute button there). */
  introSound: boolean;
  discreetPlayer: boolean;
  /** "HH:MM" 24h strings, 1..3 entries. */
  reminderTimes: string[];
  remindersEnabled: boolean;
  weeklyTestReminder: boolean;
  discreetNotifications: boolean;
  theme: ThemePreference;
  sessionsPerDay: 1 | 2 | 3;
  saveUnloadNotes: boolean;
  language: 'tr' | 'en';
  /** Kegel v2 voice coach (device text-to-speech, offline). */
  voiceCoach?: boolean;
  /** "Skip today" from a reminder: no more reminders that day (date key). */
  reminderSkipDate?: string;
}

export interface Entitlement {
  active: boolean;
  productId?: string;
  expiresAt?: string;
  lastVerifiedAt?: string;
}
