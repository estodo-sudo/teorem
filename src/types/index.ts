/** Shared domain types. All data lives on-device only. */

export type Goal =
  | 'endurance'
  | 'bladder'
  | 'erection'
  | 'confidence'
  | 'general'
  | 'postSurgery';

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
}

export type Feedback = 'easy' | 'ok' | 'hard' | 'failed';

export type ExerciseType = 'hold' | 'quick' | 'elevator' | 'pulse' | 'endurance' | 'relax';

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
}

export interface StrengthTest {
  id: string;
  date: string;
  holdBestMs: number;
  holdAttemptsMs: number[];
  quickCount: number;
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
}

export interface Entitlement {
  active: boolean;
  productId?: string;
  expiresAt?: string;
  lastVerifiedAt?: string;
}
