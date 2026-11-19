import { attemptLapses } from '@/features/camps/core/slipFlow';
import { cleanDays, cleanDuration } from '@/features/camps/core/streakEngine';
import { DAY_MS, ms } from '@/features/camps/core/time';

import type { CigaretteLog, QuitAttempt } from '../types';

import { quitStart } from './phase';

/** Slips of this attempt after its quit start, oldest first. */
export function slipsOf(a: QuitAttempt, logs: CigaretteLog[]): CigaretteLog[] {
  return attemptLapses(
    a,
    logs.filter((l) => l.isSlip),
  );
}

/** Time since the last cigarette: since the latest slip, or the quit start. 0 before the quit. */
export function smokeFreeDuration(a: QuitAttempt, logs: CigaretteLog[], now: Date): number {
  return cleanDuration(quitStart(a), slipsOf(a, logs), now);
}

/**
 * Total smoke-free days of the attempt: whole days since the quit start, minus the calendar
 * days that had a slip. A slip resets "since the last cigarette", never this total.
 */
export function totalSmokeFreeDays(a: QuitAttempt, logs: CigaretteLog[], now: Date): number {
  return cleanDays(quitStart(a), slipsOf(a, logs), now);
}

/** Cigarettes not smoked: daily average × time since the quit start, minus slip cigarettes. */
export function cigarettesNotSmoked(perDay: number, a: QuitAttempt, logs: CigaretteLog[], now: Date): number {
  const start = ms(quitStart(a));
  if (now.getTime() <= start) return 0;
  const expected = Math.floor((perDay * (now.getTime() - start)) / DAY_MS);
  const smoked = slipsOf(a, logs).filter((l) => ms(l.at) <= now.getTime()).length;
  return Math.max(0, expected - smoked);
}
