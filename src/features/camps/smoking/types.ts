/**
 * Sigarasız Kamp (90 Gün) — data model.
 *
 * A separate programme from the older "Sigara Bırakma Kampüsü"; nothing here is shared with it.
 * Small, rarely-changing state (profile, price history, attempts, plans, progress) lives in the
 * persisted camp store; frequent event logs (cigarettes, cravings, check-ins) live in SQLite.
 */

export type ProductType = 'cigarette' | 'rolling' | 'hookah' | 'cigar_pipe' | 'ecig' | 'heated' | 'pouch';

export type TriggerId = 'waking' | 'coffee_tea' | 'after_meal' | 'work_break' | 'stress' | 'boredom' | 'alcohol' | 'friends' | 'driving' | 'phone' | 'bedtime' | 'toilet';

export type ReasonId = 'health' | 'family' | 'money' | 'fitness' | 'sexual_health' | 'looks' | 'freedom' | 'spiritual' | 'doctor';

export type RelapseCause = 'stress' | 'weight' | 'social' | 'alcohol' | 'just_one' | 'withdrawal';

export type SymptomId = 'restless' | 'irritable' | 'insomnia' | 'appetite' | 'headache' | 'focus' | 'cough' | 'constipation';

export type ToolId = 'surf' | 'breath' | 'delay' | 'four_e' | 'reasons' | 'game' | 'coach' | 'call171';

/** Minutes from waking to the first cigarette: ≤5, 6–30, 31–60, 60+. */
export type FirstCigMinutes = 5 | 30 | 60 | 61;

export type HsiLevel = 'low' | 'mid' | 'high';

export type QuitMethod = 'quit_day' | 'cut_down' | 'already_quit';

export type AgeRange = 'under18' | '18to24' | '25to39' | '40to59' | '60plus';

export interface Reason {
  id: ReasonId | 'custom';
  /** The user's own words (custom reason or a note on a preset one). */
  text?: string;
}

export interface CampProfile {
  products: ProductType[];
  /** Per day (cigarettes etc.); for hookah-only users this is sessions per week ÷ 7. */
  perDay: number;
  /** Hookah sessions per week, when hookah was selected. */
  hookahPerWeek?: number;
  firstCigMinutes: FirstCigMinutes;
  hsiScore: number;
  hsiLevel: HsiLevel;
  years: number;
  ageRange: AgeRange;
  reasons: Reason[];
  /** Local file URI only; never uploaded. */
  reasonPhotoUri?: string;
  triggers: TriggerId[];
  /** 0 = never, 1 = 1–2 times, 3 = 3+ times. */
  pastAttempts: 0 | 1 | 3;
  relapseCauses: RelapseCause[];
  method: QuitMethod;
  supporterName?: string;
  createdAt: string;
}

/** Pack price from a date on (inflation: the user updates it; savings keep the old periods). */
export interface PriceEntry {
  from: string;
  packPriceTRY: number;
  packSize: number;
}

/** Attempts follow the shared camp lifecycle (preparing → active → relapsed / graduated). */
export type { AttemptStatus, CampAttempt as QuitAttempt } from '@/features/camps/core/slipFlow';

export type Score5 = 1 | 2 | 3 | 4 | 5;

export interface CigaretteLog {
  id: string;
  attemptId: string;
  at: string;
  trigger?: TriggerId;
  mood?: Score5;
  /** "How much did I need it?" 1–5; 1–2 = autopilot cigarettes. */
  need?: Score5;
  /** Free place/label tag (no location services). */
  tag?: string;
  /** True for a cigarette after the quit (a slip); false for preparation logging. */
  isSlip: boolean;
}

export interface CravingEvent {
  id: string;
  at: string;
  intensityBefore: number;
  intensityAfter?: number;
  trigger?: TriggerId;
  toolUsed: ToolId[];
  outcome: 'resisted' | 'still_hard' | 'smoked';
  durationSec: number;
}

export interface CheckIn {
  id: string;
  at: string;
  smoked: boolean;
  cravingCount: number;
  mood: Score5;
  symptoms: SymptomId[];
}

export interface IfThenPlan {
  id: string;
  trigger: TriggerId;
  ifText: string;
  thenText: string;
  createdAt: string;
  usedCount: number;
}

export interface MissionProgress {
  missionId: string;
  completedAt: string;
}

export interface SkillProgress {
  lessonId: string;
  completedAt: string;
  quizScore?: number;
}

export interface RewardGoal {
  id: string;
  title: string;
  amountTRY: number;
  reachedAt?: string;
}

export interface CampBadge {
  id: string;
  unlockedAt?: string;
}

export type CampPhase = 'preparation' | 'quit_day' | 'critical_week' | 'strengthening' | 'maintenance' | 'freedom';

/** Daily mission (content arrives in K7). `day`: preparation day (1-based) or days since the quit day (0 = quit day). */
export interface Mission {
  id: string;
  phase: CampPhase;
  day: number;
  title: string;
  body: string;
  durationMin: number;
  bctCodes: string[];
  type: 'action' | 'reflection' | 'learning' | 'social';
  reviewed: boolean;
}

/** Event logs kept in SQLite. */
export interface CampEvents {
  cigarettes: CigaretteLog[];
  cravings: CravingEvent[];
  checkins: CheckIn[];
}
