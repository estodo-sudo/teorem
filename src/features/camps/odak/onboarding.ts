import { makeId } from '@/lib/random';

import { bpsScore, twoItemScore } from './engine/screening';
import type { GoalConfig, MastGoal, OdakPlan, OdakProfile, OdakReasonId, OdakTriggerId, PastAttemptId, PornGoal, ScreeningResult, Score5, TimeRange } from './types';

/**
 * Odak Kampı enrolment (SPEC_ODAK_KAMPI 3): 18+ gate → "Bilmen gerekenler" → camp lock → 11
 * questions (one per screen; some can be skipped) → first plans → summary → commitment.
 */
export type StepId = 'age' | 'minor' | 'facts' | 'lock' | 'reasons' | 'bps' | 'freq' | 'triggers' | 'emotions' | 'values' | 'moral' | 'mood' | 'attempts' | 'goal' | 'risky' | 'plans' | 'summary' | 'commit';

/** Steps after the age gate, in order ('minor' is a dead end shown instead of them). */
export const STEPS: StepId[] = ['age', 'facts', 'lock', 'reasons', 'bps', 'freq', 'triggers', 'emotions', 'values', 'moral', 'mood', 'attempts', 'goal', 'risky', 'plans', 'summary', 'commit'];
/** The 11 assessment questions (for "Soru n/11"). */
export const QUESTIONS: StepId[] = ['reasons', 'bps', 'freq', 'triggers', 'emotions', 'values', 'moral', 'mood', 'attempts', 'goal', 'risky'];
/** Questions that can be skipped (marked on screen). */
export const SKIPPABLE: StepId[] = ['freq', 'triggers', 'emotions', 'moral', 'attempts', 'risky'];

export const FREQ_MAX = 14;
export const PORN_WEEKLY = { min: 1, max: 6 } as const;
export const MAST_WEEKLY = { min: 1, max: 7 } as const;
export const PAUSE_PRESETS = [7, 30, 90] as const;
export const PAUSE_DAYS = { min: 1, max: 365 } as const;
export const FIRST_PLANS = 3;
export const VALUES_TEXT_MAX = 300;
export const REASON_OTHER_MAX = 120;

export interface Answers {
  adult: boolean | null;
  reasons: OdakReasonId[];
  reasonOther: string;
  bps: (number | null)[];
  freqPorn: number;
  freqMast: number;
  triggers: OdakTriggerId[];
  emotionsBefore: string[];
  emotionsAfter: string[];
  values: string[];
  valuesText: string;
  moral: Score5 | null;
  phq: (number | null)[];
  gad: (number | null)[];
  attempts: PastAttemptId[];
  porn: PornGoal | null;
  pornWeeklyMax: number;
  mast: MastGoal | null;
  mastWeeklyMax: number;
  mastPauseDays: number;
  risky: TimeRange[];
}

export const defaultAnswers = (): Answers => ({
  adult: null,
  reasons: [],
  reasonOther: '',
  bps: [null, null, null, null, null],
  freqPorn: 0,
  freqMast: 0,
  triggers: [],
  emotionsBefore: [],
  emotionsAfter: [],
  values: [],
  valuesText: '',
  moral: null,
  phq: [null, null],
  gad: [null, null],
  attempts: [],
  porn: null,
  pornWeeklyMax: 2,
  mast: null,
  mastWeeklyMax: 3,
  mastPauseDays: 30,
  risky: [],
});

const inRange = (v: number, r: { min: number; max: number }) => Number.isInteger(v) && v >= r.min && v <= r.max;

/** Why a step cannot be left yet (an i18n error id), or null. Skippable steps never block. */
export function stepError(step: StepId, a: Answers, opts: { bpsPlaceholder?: boolean } = {}): string | null {
  switch (step) {
    case 'age':
      return a.adult === null ? 'age' : null;
    case 'reasons':
      return a.reasons.length ? null : 'reasons';
    case 'bps':
      // While the items are placeholders, answering is optional.
      return opts.bpsPlaceholder || bpsScore(a.bps) !== null ? null : 'bps';
    case 'values':
      return a.values.length || a.valuesText.trim() ? null : 'values';
    case 'mood':
      return twoItemScore(a.phq) !== null && twoItemScore(a.gad) !== null ? null : 'mood';
    case 'goal':
      if (!a.porn || !a.mast) return 'goal';
      if (a.porn === 'reduce' && !inRange(a.pornWeeklyMax, PORN_WEEKLY)) return 'goalNumber';
      if (a.mast === 'reduce' && !inRange(a.mastWeeklyMax, MAST_WEEKLY)) return 'goalNumber';
      if (a.mast === 'pause' && !inRange(a.mastPauseDays, PAUSE_DAYS)) return 'goalNumber';
      return null;
    default:
      return null;
  }
}

export function buildProfile(a: Answers, now: Date): OdakProfile {
  const other = a.reasons.includes('other') ? a.reasonOther.trim().slice(0, REASON_OTHER_MAX) : '';
  return {
    reasons: a.reasons,
    ...(other ? { reasonOther: other } : {}),
    bpsScore: bpsScore(a.bps),
    bpsAnswers: a.bps.map((x) => x ?? -1),
    freqPorn2w: Math.min(FREQ_MAX, Math.max(0, Math.round(a.freqPorn))),
    freqMast2w: Math.min(FREQ_MAX, Math.max(0, Math.round(a.freqMast))),
    triggers: a.triggers,
    emotionsBefore: a.emotionsBefore,
    emotionsAfter: a.emotionsAfter,
    values: a.values,
    valuesText: a.valuesText.trim().slice(0, VALUES_TEXT_MAX),
    moralIncongruence: a.moral,
    phq2: twoItemScore(a.phq) ?? 0,
    gad2: twoItemScore(a.gad) ?? 0,
    pastAttempts: a.attempts,
    riskyHours: a.risky,
    createdAt: now.toISOString(),
  };
}

/** The chosen goal; numbers only for the options that use them. */
export function buildGoal(a: Answers, now: Date): GoalConfig {
  const porn = a.porn ?? 'undecided';
  const mast = a.mast ?? 'undecided';
  return {
    porn,
    ...(porn === 'reduce' ? { pornWeeklyMax: a.pornWeeklyMax } : {}),
    mast,
    ...(mast === 'reduce' ? { mastWeeklyMax: a.mastWeeklyMax } : {}),
    ...(mast === 'pause' ? { mastPauseDays: a.mastPauseDays } : {}),
    startedAt: now.toISOString(),
  };
}

/** Day-0 screenings: the BPS only when every item was answered. */
export function buildScreenings(a: Answers, now: Date): ScreeningResult[] {
  const at = now.toISOString();
  const out: ScreeningResult[] = [];
  const bps = bpsScore(a.bps);
  if (bps !== null) out.push({ id: makeId('scr'), at, type: 'BPS', score: bps, answers: a.bps as number[] });
  const phq = twoItemScore(a.phq);
  if (phq !== null) out.push({ id: makeId('scr'), at, type: 'PHQ2', score: phq, answers: a.phq as number[] });
  const gad = twoItemScore(a.gad);
  if (gad !== null) out.push({ id: makeId('scr'), at, type: 'GAD2', score: gad, answers: a.gad as number[] });
  return out;
}

/** Triggers that get a first plan: the chosen ones in content order, at most three. */
export const planTriggers = (chosen: OdakTriggerId[], order: OdakTriggerId[]) => order.filter((t) => chosen.includes(t)).slice(0, FIRST_PLANS);

export function buildPlans(drafts: { trigger: OdakTriggerId; ifText: string; thenText: string }[], now: Date): OdakPlan[] {
  return drafts.map((d) => ({ id: makeId('plan'), ...d, createdAt: now.toISOString() }));
}

/** Toggles a time range in the risky-hours list (by its start and end). */
export const toggleRange = (list: TimeRange[], r: TimeRange) => (list.some((x) => x.from === r.from && x.to === r.to) ? list.filter((x) => !(x.from === r.from && x.to === r.to)) : [...list, r]);
