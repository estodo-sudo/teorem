/**
 * Odak Kampı data model (SPEC_ODAK_KAMPI 6). Everything below is kept only in the encrypted vault
 * (privacy/vault.ts); nothing is written in plain text.
 */
export type OdakReasonId = 'porn_control' | 'mast_freq' | 'time' | 'relationship' | 'values' | 'feel_bad' | 'coping' | 'other';
export type OdakTriggerId = 'night_bed' | 'alone_home' | 'stress' | 'boredom' | 'loneliness' | 'anxiety' | 'sadness' | 'tired' | 'sleepless' | 'after_argument' | 'social_media' | 'alcohol' | 'waking';
export type EmotionId = string;
export type ValueCardId = string;
export type PastAttemptId = 'first' | 'short' | 'slip_quit' | 'filter' | 'shame';
export type Score5 = 1 | 2 | 3 | 4 | 5;

export interface TimeRange {
  from: string;
  to: string;
}

export interface OdakProfile {
  reasons: OdakReasonId[];
  reasonOther?: string;
  /** Null while the BPS items are placeholders and were not answered. */
  bpsScore: number | null;
  bpsAnswers: number[];
  freqPorn2w: number;
  freqMast2w: number;
  triggers: OdakTriggerId[];
  emotionsBefore: EmotionId[];
  emotionsAfter: EmotionId[];
  values: ValueCardId[];
  valuesText: string;
  moralIncongruence: Score5 | null;
  phq2: number;
  gad2: number;
  pastAttempts: PastAttemptId[];
  riskyHours: TimeRange[];
  createdAt: string;
}

export type PornGoal = 'quit' | 'reduce' | 'undecided';
export type MastGoal = 'none' | 'reduce' | 'pause' | 'undecided';

export interface GoalConfig {
  porn: PornGoal;
  pornWeeklyMax?: number;
  mast: MastGoal;
  mastWeeklyMax?: number;
  mastPauseDays?: number;
  /** Counters start here (never moved). */
  startedAt: string;
  /** Programme phases start here; a relapse moves it back to the start of phase 2. Defaults to startedAt. */
  programStartedAt?: string;
}

export interface ScreeningResult {
  id: string;
  at: string;
  type: 'BPS' | 'PHQ2' | 'GAD2';
  score: number;
  answers: number[];
}

export interface OdakPlan {
  id: string;
  trigger: OdakTriggerId;
  ifText: string;
  thenText: string;
  createdAt: string;
}

export type BehaviorKind = 'porn' | 'mast' | 'both';

/** One logged behaviour (O3: kind + time; context and emotions come with the diary in O5). */
export interface BehaviorEvent {
  id: string;
  at: string;
  kind: BehaviorKind;
  trigger?: OdakTriggerId;
  emotionBefore?: EmotionId;
  emotionAfter?: EmotionId;
  satisfaction?: Score5;
  /** Went against the goal at the time it was logged. */
  isSlip: boolean;
}

export type OdakToolId = 'relocate' | 'surf' | 'breath' | 'move' | 'values' | 'futureSelf' | 'supporter';

/** One urge moment handled in SOS (SPEC_ODAK_KAMPI 6). */
export interface UrgeEvent {
  id: string;
  at: string;
  intensityBefore: number;
  intensityAfter?: number;
  trigger?: OdakTriggerId;
  dayy: { tired: boolean; hungry: boolean; lonely: boolean; loaded: boolean };
  toolsUsed: OdakToolId[];
  outcome: 'managed' | 'still_hard' | 'slipped';
  durationSec: number;
}

export interface FutureSelfLetter {
  text: string;
  updatedAt: string;
}

/** Daily check-in (SPEC_ODAK_KAMPI 5.5). */
export interface OdakCheckIn {
  id: string;
  at: string;
  onGoal: boolean;
  urgeCount: number;
  mood: Score5;
  sleep: Score5;
  loneliness: Score5;
  valueAction?: string;
}

/** Environment and digital boundaries (SPEC_ODAK_KAMPI 5.3). */
export interface BoundaryConfig {
  /** The user says the phone's own filter (iOS Screen Time / Android Digital Wellbeing) is set up. */
  iosWebFilter: boolean;
  androidWellbeing: boolean;
  /** Physical checklist items done. */
  checklist: string[];
  /** Android: gentle reminder when a chosen app opens in a risky hour. */
  reminder: { enabled: boolean; packages: string[] };
}
