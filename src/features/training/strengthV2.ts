import { pick } from '@/i18n/content';
import selfRatingJsonTr from '@/content/kegel/self-rating.tr.json';
import selfRatingJsonEn from '@/content/kegel/self-rating.en.json';
import { daysBetween } from '@/lib/date';
import type { SelfRating, StrengthTest, TrackId } from '@/types';

import { muscleScore } from './schedule';

const selfRatingJson = pick({ tr: selfRatingJsonTr, en: selfRatingJsonEn });

/** Güç Testi v2, Kas Skoru and the monthly self rating (SPEC_KEGEL_V2 §9, §10). Pure. */

export const HOLD_ATTEMPTS = 3;
/** Release the button when the muscle lets go, or at 60 s. */
export const HOLD_MAX_MS = 60_000;
/** Rest between hold attempts. */
export const HOLD_REST_SEC = 20;
export const QUICK_SEC = 10;
/** Every test in the same position, before the session, rested. */
export const TEST_POSITION = 'sitting' as const;
/** Shorter than this is an accidental tap. */
export const MIN_HOLD_MS = 300;

export const clampHold = (ms: number) => Math.min(HOLD_MAX_MS, Math.max(0, Math.round(ms)));

const byDate = (tests: StrengthTest[]) => [...tests].sort((a, b) => a.date.localeCompare(b.date));

/** New personal records against all earlier tests (none on the very first test). */
export function personalRecords(previous: StrengthTest[], current: { holdBestMs: number; quickCount: number }): { hold: boolean; quick: boolean } {
  if (!previous.length) return { hold: false, quick: false };
  return { hold: current.holdBestMs > Math.max(...previous.map((t) => t.holdBestMs)), quick: current.quickCount > Math.max(...previous.map((t) => t.quickCount)) };
}

/** Kas Skoru against the first test (the baseline); the first test itself is 50. */
export function scoreFor(previous: StrengthTest[], current: { holdBestMs: number; quickCount: number }): number {
  const base = byDate(previous)[0] ?? current;
  return muscleScore(base, current);
}

/** Kas Skoru over time (each test against the first one). */
export function scoreTrend(tests: StrengthTest[]): { date: string; value: number }[] {
  const sorted = byDate(tests);
  const base = sorted[0];
  return base ? sorted.map((t) => ({ date: t.date, value: t.muscleScore ?? muscleScore(base, t) })) : [];
}

// ---------------------------------------------------------------- self rating (§10)

export interface SelfRatingQuestion {
  id: string;
  text: string;
  minLabel: string;
  maxLabel: string;
  /** Which end is the good one. */
  better: 'high' | 'low';
}
export const SELF_RATING = selfRatingJson as unknown as { title: string; intro: string; tracks: Record<TrackId, SelfRatingQuestion[]> };

export const selfRatingQuestions = (track: TrackId) => SELF_RATING.tracks[track] ?? SELF_RATING.tracks.general;

export const SELF_RATING_EVERY_DAYS = 30;

/** Once a month per track (the first one any time). */
export function selfRatingDue(ratings: SelfRating[], track: TrackId, today: string): boolean {
  const last = ratings
    .filter((r) => r.track === track)
    .sort((a, b) => a.at.localeCompare(b.at))
    .at(-1);
  return !last || daysBetween(last.at.slice(0, 10), today) >= SELF_RATING_EVERY_DAYS;
}

/** One line per question for the progress chart. */
export function selfRatingTrend(ratings: SelfRating[], track: TrackId, questionId: string): { date: string; value: number }[] {
  return ratings
    .filter((r) => r.track === track && typeof r.answers[questionId] === 'number')
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((r) => ({ date: r.at.slice(0, 10), value: r.answers[questionId]! }));
}

/** Valid answers only (0–10 for this track's questions). */
export function cleanAnswers(track: TrackId, answers: Record<string, number>): Record<string, number> {
  const ids = new Set(selfRatingQuestions(track).map((q) => q.id));
  return Object.fromEntries(Object.entries(answers).filter(([k, v]) => ids.has(k) && Number.isInteger(v) && v >= 0 && v <= 10));
}
