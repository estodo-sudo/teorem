import type { Reason } from '../types';

import { DAY_MS, dayKey, HOUR_MS, MIN_MS } from '@/features/camps/core/time';

export type DurationUnit = 'min' | 'hour' | 'day' | 'month' | 'year';

/**
 * A remaining time in one readable unit, rounded up so it never shows "0":
 * under an hour → minutes, under a day → hours, under 60 days → days, under a year → months, else years.
 */
export function remainingUnit(ms: number): { value: number; unit: DurationUnit } {
  const m = Math.max(0, ms);
  if (m < HOUR_MS) return { value: Math.max(1, Math.ceil(m / MIN_MS)), unit: 'min' };
  if (m < DAY_MS) return { value: Math.ceil(m / HOUR_MS), unit: 'hour' };
  if (m < 60 * DAY_MS) return { value: Math.ceil(m / DAY_MS), unit: 'day' };
  if (m < 365 * DAY_MS) return { value: Math.round(m / (30.44 * DAY_MS)), unit: 'month' };
  return { value: Math.round(m / (365 * DAY_MS)), unit: 'year' };
}

/** Whole days and leftover hours/minutes of a duration (for "Y gün Z saat"). */
export function splitDuration(ms: number): { days: number; hours: number; minutes: number } {
  const m = Math.max(0, ms);
  return { days: Math.floor(m / DAY_MS), hours: Math.floor((m % DAY_MS) / HOUR_MS), minutes: Math.floor((m % HOUR_MS) / MIN_MS) };
}

/** The reason card of the day: one of the user's reasons, changing daily, stable within a day. */
export function reasonOfDay(reasons: Reason[], now: Date): Reason | null {
  if (!reasons.length) return null;
  const key = dayKey(now);
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return reasons[h % reasons.length]!;
}
