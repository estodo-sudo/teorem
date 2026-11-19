import { daysToNext, missionDay, phaseAt, phaseOrder, type PhaseModel } from '@/features/camps/core/phaseEngine';
import { attemptStart } from '@/features/camps/core/slipFlow';
import { calendarDaysBetween } from '@/features/camps/core/time';

import type { CampPhase, QuitAttempt } from '../types';

/**
 * Programme phases (days since the quit day):
 *   before the quit day → preparation · quit day → quit_day · day 1–7 → critical_week ·
 *   day 8–30 → strengthening · day 31–90 → maintenance · after day 90 (or graduated) → freedom.
 */
export const SMOKING_PHASES: PhaseModel<CampPhase> = [
  { id: 'preparation', untilDay: -1 },
  { id: 'quit_day', untilDay: 0 },
  { id: 'critical_week', untilDay: 7 },
  { id: 'strengthening', untilDay: 30 },
  { id: 'maintenance', untilDay: 90 },
  { id: 'freedom', untilDay: Infinity },
];

/** When smoking stopped (or is planned to stop) for this attempt. */
export const quitStart = attemptStart;

/** Days since the quit day by calendar (0 = quit day; negative during preparation). */
export function daysSinceQuit(a: QuitAttempt, now: Date): number {
  return calendarDaysBetween(new Date(quitStart(a)), now);
}

export function currentPhase(a: QuitAttempt, now: Date): CampPhase {
  if (a.status === 'graduated') return 'freedom';
  return phaseAt(SMOKING_PHASES, daysSinceQuit(a, now));
}

export const PHASE_ORDER: CampPhase[] = phaseOrder(SMOKING_PHASES);

/**
 * Day number used to pick missions. Preparation counts DOWN to the quit day (1 = the eve), so the
 * essential missions land right before it whatever the preparation length (3–28 days); afterwards it
 * is the number of days since the quit day (0 = quit day).
 */
export function programDay(a: QuitAttempt, now: Date): { phase: CampPhase; day: number } {
  const phase = currentPhase(a, now);
  const d = daysSinceQuit(a, now);
  return { phase, day: phase === 'preparation' ? missionDay(d) : Math.max(0, d) };
}

/** Check-ins expected per day: 2 in the critical week, 1 until day 30, then about 2 a week. */
export function checkinsPerDay(phase: CampPhase): number {
  return phase === 'critical_week' ? 2 : phase === 'quit_day' || phase === 'strengthening' ? 1 : phase === 'maintenance' ? 2 / 7 : 0;
}

/** Calendar days until the next phase starts (null in the last phase). */
export function daysToNextPhase(a: QuitAttempt, now: Date): number | null {
  return daysToNext(SMOKING_PHASES, currentPhase(a, now), daysSinceQuit(a, now));
}
