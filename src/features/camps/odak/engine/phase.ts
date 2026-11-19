import type { CheckinCadence } from '@/features/camps/core/checkinEngine';
import { daysToNext, phaseAt, phaseOrder, type PhaseModel } from '@/features/camps/core/phaseEngine';
import { calendarDaysBetween } from '@/features/camps/core/time';

/**
 * Odak Kampı programme (SPEC_ODAK_KAMPI 4): a 6-week core, then consolidation to day 90, then
 * maintenance. Day 1 = the day the goal was set (index 0 in the shared phase engine).
 *   1–7 awareness · 8–14 boundaries · 15–28 skills · 29–42 rebuild · 43–90 consolidation · 90+ maintenance
 */
export type OdakPhase = 'awareness' | 'boundaries' | 'skills' | 'rebuild' | 'consolidation' | 'maintenance';

export const ODAK_PHASES: PhaseModel<OdakPhase> = [
  { id: 'awareness', untilDay: 6 },
  { id: 'boundaries', untilDay: 13 },
  { id: 'skills', untilDay: 27 },
  { id: 'rebuild', untilDay: 41 },
  { id: 'consolidation', untilDay: 89 },
  { id: 'maintenance', untilDay: Infinity },
];
export const ODAK_PHASE_ORDER = phaseOrder(ODAK_PHASES);
export const ODAK_PROGRAM_DAYS = 90;
/** Days the short screen is repeated (only for the user's own view of progress). */
export const BPS_REPEAT_DAYS = [42, 90] as const;

/** Programme day: 1 on the start day (never below 1). */
export const programDay = (startedAt: string, now: Date) => Math.max(1, calendarDaysBetween(new Date(startedAt), now) + 1);

export const odakPhase = (startedAt: string, now: Date): OdakPhase => phaseAt(ODAK_PHASES, programDay(startedAt, now) - 1);

/** Days until the next phase starts (null in maintenance). */
export const daysToNextOdakPhase = (startedAt: string, now: Date) => {
  const idx = programDay(startedAt, now) - 1;
  return daysToNext(ODAK_PHASES, phaseAt(ODAK_PHASES, idx), idx);
};

/** Check-ins: once a day in the core programme, about three times a week in consolidation, monthly after. */
export function odakCadence(phase: OdakPhase): CheckinCadence {
  if (phase === 'consolidation') return { everyDays: 2 };
  if (phase === 'maintenance') return { everyDays: 30 };
  return 'daily';
}

/** Programme progress 0–1 over the 90 days. */
export const programProgress = (startedAt: string, now: Date) => Math.min(1, programDay(startedAt, now) / ODAK_PROGRAM_DAYS);

/**
 * Is the repeat screen due? On day 42 and 90 (and after), unless one was already done on or after
 * that day.
 */
export function screeningDue(startedAt: string, bpsDates: string[], now: Date): 42 | 90 | null {
  const day = programDay(startedAt, now);
  for (const d of [...BPS_REPEAT_DAYS].reverse()) {
    if (day < d) continue;
    const done = bpsDates.some((at) => programDay(startedAt, new Date(at)) >= d);
    return done ? null : d;
  }
  return null;
}
