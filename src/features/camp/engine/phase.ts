import type { CampPhase, QuitAttempt } from '../types';

import { calendarDaysBetween } from './time';

/** When smoking stopped (or is planned to stop) for this attempt. */
export const quitStart = (a: QuitAttempt) => a.actualQuitDateTime ?? a.plannedQuitDate;

/** Days since the quit day by calendar (0 = quit day; negative during preparation). */
export function daysSinceQuit(a: QuitAttempt, now: Date): number {
  return calendarDaysBetween(new Date(quitStart(a)), now);
}

/**
 * Programme phase:
 *   before the quit day → preparation · quit day → quit_day · day 1–7 → critical_week ·
 *   day 8–30 → strengthening · day 31–90 → maintenance · after day 90 (or graduated) → freedom.
 */
export function currentPhase(a: QuitAttempt, now: Date): CampPhase {
  if (a.status === 'graduated') return 'freedom';
  const d = daysSinceQuit(a, now);
  if (d < 0) return 'preparation';
  if (d === 0) return 'quit_day';
  if (d <= 7) return 'critical_week';
  if (d <= 30) return 'strengthening';
  if (d <= 90) return 'maintenance';
  return 'freedom';
}

export const PHASE_ORDER: CampPhase[] = ['preparation', 'quit_day', 'critical_week', 'strengthening', 'maintenance', 'freedom'];

/**
 * Day number used to pick missions. Preparation counts DOWN to the quit day (1 = the eve), so the
 * essential missions land right before it whatever the preparation length (3–28 days); afterwards it
 * is the number of days since the quit day (0 = quit day).
 */
export function programDay(a: QuitAttempt, now: Date): { phase: CampPhase; day: number } {
  const phase = currentPhase(a, now);
  if (phase === 'preparation') return { phase, day: Math.max(1, -daysSinceQuit(a, now)) };
  return { phase, day: Math.max(0, daysSinceQuit(a, now)) };
}

/** Check-ins expected per day: 2 in the critical week, 1 until day 30, then about 2 a week. */
export function checkinsPerDay(phase: CampPhase): number {
  return phase === 'critical_week' ? 2 : phase === 'quit_day' || phase === 'strengthening' ? 1 : phase === 'maintenance' ? 2 / 7 : 0;
}

/** Calendar days until the next phase starts (null in the last phase). */
export function daysToNextPhase(a: QuitAttempt, now: Date): number | null {
  const phase = currentPhase(a, now);
  const d = daysSinceQuit(a, now);
  const nextDay = phase === 'preparation' ? 0 : phase === 'quit_day' ? 1 : phase === 'critical_week' ? 8 : phase === 'strengthening' ? 31 : phase === 'maintenance' ? 91 : null;
  return nextDay === null ? null : nextDay - d;
}
