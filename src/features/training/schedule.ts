import { addDays, daysBetween } from '@/lib/date';
import type { DurationPreset, PainReport, StrengthTest, TrackId } from '@/types';

import { dailyContractionCap } from './levels';

/**
 * Kegel v2 scheduling rules (SPEC_KEGEL_V2 §6.4–6.6, §9, §11). All pure.
 */

// ---------------------------------------------------------------- deload (§6.4, §6.5)

/** Strength falling two weeks in a row: the last three tests each hold shorter than the one before. */
export function strengthFallingTwoWeeks(tests: StrengthTest[]): boolean {
  const last = [...tests].sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
  return last.length === 3 && last[2]!.holdBestMs < last[1]!.holdBestMs && last[1]!.holdBestMs < last[0]!.holdBestMs;
}

/**
 * The deload week follows the 30-day plan, so what the roadmap says is what the session does:
 * plan week 4 ("4. Hafta: Toparlanma", days 22–30) is the lighter week. Weeks are counted per plan:
 * days 1–7 week 1, 8–14 week 2, 15–21 week 3, 22–30 week 4.
 */
export const DELOAD_PLAN_WEEK = 3;
export const planWeekOf = (planDay: number) => Math.min(3, Math.max(0, Math.floor(planDay / 7)));
/** A running plan-week number across plans (plan 1 week 1 = 0, plan 2 week 1 = 4 …). */
export const planWeekNumber = (planNumber: number, planDay: number) => (Math.max(1, planNumber) - 1) * 4 + planWeekOf(planDay);
export const isPlanDeloadDay = (planDay: number) => planWeekOf(planDay) === DELOAD_PLAN_WEEK;

/**
 * Deload today? Always in plan week 4. Earlier only when strength tests have fallen two weeks in a
 * row and the last deload was at least 2 plan weeks ago; such an early deload then lasts the whole
 * plan week (`lastDeloadWeek` holds the plan-week number of the last deload).
 */
export function deloadDue(i: { planNumber: number; planDay: number; lastDeloadWeek: number; strengthFalling?: boolean }): boolean {
  if (isPlanDeloadDay(i.planDay)) return true;
  const week = planWeekNumber(i.planNumber, i.planDay);
  if (week === i.lastDeloadWeek) return true; // inside an early deload week
  return Boolean(i.strengthFalling) && week - i.lastDeloadWeek >= 2;
}

// ---------------------------------------------------------------- missed days and vacation (§6.6)

export interface MissedDaysPolicy {
  /** Days without a main session (vacation days not counted). */
  missedDays: number;
  levelDelta: 0 | -1 | -2;
  /** 'none' 1–2 days · 'gentle' 3–6 days · 'rewarm' 7+ days (short warm-up session). */
  kind: 'none' | 'gentle' | 'rewarm';
  preset?: DurationPreset;
}

const inVacation = (day: string, v?: { from: string; to: string }) => Boolean(v && day >= v.from && day <= v.to);

/** Non-punishing return after a break. `lastActive` = date key of the last main session. */
export function missedDaysPolicy(lastActive: string | null, today: string, vacation?: { from: string; to: string }): MissedDaysPolicy {
  if (!lastActive) return { missedDays: 0, levelDelta: 0, kind: 'none' };
  let missed = 0;
  for (let d = addDays(lastActive, 1); d < today; d = addDays(d, 1)) if (!inVacation(d, vacation)) missed += 1;
  if (missed >= 7) return { missedDays: missed, levelDelta: -2, kind: 'rewarm', preset: 'quick' };
  if (missed >= 3) return { missedDays: missed, levelDelta: -1, kind: 'gentle' };
  return { missedDays: missed, levelDelta: 0, kind: 'none' };
}

export const VACATION_MIN_DAYS = 3;
export const VACATION_MAX_DAYS = 14;

/** Vacation length 3–14 days (inclusive), not starting in the past. */
export function validVacation(from: string, to: string, today: string): boolean {
  const len = daysBetween(from, to) + 1;
  return from >= today && len >= VACATION_MIN_DAYS && len <= VACATION_MAX_DAYS;
}

export const isOnVacation = (today: string, vacation?: { from: string; to: string }) => inVacation(today, vacation);

// ---------------------------------------------------------------- streak freeze (§6.6)

export const FREEZES_PER_MONTH = 2;

/** Refills the 2 monthly streak freezes when a new month starts. */
export function refreshFreezes(t: { freezeTokens: number; freezeMonth: string | null }, today: string): { freezeTokens: number; freezeMonth: string } {
  const month = today.slice(0, 7);
  return t.freezeMonth === month ? { freezeTokens: t.freezeTokens, freezeMonth: month } : { freezeTokens: FREEZES_PER_MONTH, freezeMonth: month };
}

// ---------------------------------------------------------------- daily contraction cap (§11.5)

export interface CapStatus {
  cap: number;
  used: number;
  /** Over the cap: further sessions are locked (only a release session opens). */
  locked: boolean;
}

export function capStatus(usedToday: number, level: number): CapStatus {
  const cap = dailyContractionCap(level);
  return { cap, used: usedToday, locked: usedToday >= cap };
}

/** Whether a session with `contractions` may start now. */
export const sessionAllowed = (usedToday: number, contractions: number, level: number) => contractions === 0 || usedToday + contractions <= dailyContractionCap(level);

// ---------------------------------------------------------------- pain (§11.1)

export const PAIN_LOCK_DAYS = 7;
export const PAIN_REFER_COUNT = 2;

export interface PainPolicy {
  /** No level increase before this date key. */
  lockUntil: string | null;
  /** 2 reports in 7 days → suggest a urologist / pelvic floor physiotherapist and the relaxation track. */
  refer: boolean;
}

export function painPolicy(reports: PainReport[], today: string): PainPolicy {
  const days = reports.map((r) => r.at.slice(0, 10)).filter((d) => d <= today && daysBetween(d, today) < PAIN_LOCK_DAYS);
  if (!days.length) return { lockUntil: null, refer: false };
  const latest = days.sort().at(-1)!;
  return { lockUntil: addDays(latest, PAIN_LOCK_DAYS), refer: days.length >= PAIN_REFER_COUNT };
}

export const levelLocked = (today: string, lockUntil?: string | null) => Boolean(lockUntil && today < lockUntil);

// ---------------------------------------------------------------- screening (§2)

export const SCREENING_QUESTIONS = 8;
/** Pain questions: pelvic/perineal pain, pain when sitting long, pain at or after ejaculation. */
export const PAIN_QUESTION_INDEXES = [0, 1, 2];

export interface ScreeningResult {
  hypertonicFlag: boolean;
  painFlag: boolean;
  /** Relaxation track recommended (the user still chooses). */
  suggestTrack: TrackId | null;
}

/** ≥ 2 "yes" among the first 7 questions → relaxation-focused track suggested. Not a diagnosis. */
export function screeningToTrack(answers: boolean[]): ScreeningResult {
  const yes = answers.slice(0, 7).filter(Boolean).length;
  const hypertonicFlag = yes >= 2;
  return { hypertonicFlag, painFlag: PAIN_QUESTION_INDEXES.some((i) => answers[i] === true), suggestTrack: hypertonicFlag ? 'relax' : null };
}

/** Re-screening every 2 weeks on the relaxation track. */
export const RESCREEN_EVERY_DAYS = 14;
export const rescreenDue = (screenedAt: string, today: string) => daysBetween(screenedAt.slice(0, 10), today) >= RESCREEN_EVERY_DAYS;

// ---------------------------------------------------------------- muscle score (§9)

/**
 * "Kas Skoru" 0–100: hold time and quick count against the user's own first test, averaged.
 * The baseline is 50; doubling both is 100. A personal progress measure, not a medical one.
 */
export function muscleScore(baseline: { holdBestMs: number; quickCount: number }, current: { holdBestMs: number; quickCount: number }): number {
  const ratio = (c: number, b: number) => (b > 0 ? c / b : 1);
  const raw = 25 * (ratio(current.holdBestMs, baseline.holdBestMs) + ratio(current.quickCount, baseline.quickCount));
  return Math.round(Math.min(100, Math.max(0, raw)));
}
