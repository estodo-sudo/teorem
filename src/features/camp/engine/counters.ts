import type { CigaretteLog, QuitAttempt } from '../types';

import { quitStart } from './phase';
import { DAY_MS, dayKey, ms } from './time';

/** Slips of this attempt after its quit start, oldest first. */
export function slipsOf(a: QuitAttempt, logs: CigaretteLog[]): CigaretteLog[] {
  const start = ms(quitStart(a));
  return logs.filter((l) => l.isSlip && l.attemptId === a.id && ms(l.at) >= start).sort((x, y) => ms(x.at) - ms(y.at));
}

/** Time since the last cigarette: since the latest slip, or the quit start. 0 before the quit. */
export function smokeFreeDuration(a: QuitAttempt, logs: CigaretteLog[], now: Date): number {
  const start = ms(quitStart(a));
  if (now.getTime() < start) return 0;
  const slips = slipsOf(a, logs).filter((l) => ms(l.at) <= now.getTime());
  const last = slips.length ? ms(slips[slips.length - 1]!.at) : start;
  return Math.max(0, now.getTime() - last);
}

/**
 * Total smoke-free days of the attempt: whole days since the quit start, minus the calendar
 * days that had a slip. A slip resets "since the last cigarette", never this total.
 */
export function totalSmokeFreeDays(a: QuitAttempt, logs: CigaretteLog[], now: Date): number {
  const start = ms(quitStart(a));
  if (now.getTime() < start) return 0;
  const whole = Math.floor((now.getTime() - start) / DAY_MS);
  const slipDays = new Set(
    slipsOf(a, logs)
      .filter((l) => ms(l.at) <= now.getTime())
      .map((l) => dayKey(new Date(l.at))),
  ).size;
  return Math.max(0, whole - slipDays);
}

/** Cigarettes not smoked: daily average × time since the quit start, minus slip cigarettes. */
export function cigarettesNotSmoked(perDay: number, a: QuitAttempt, logs: CigaretteLog[], now: Date): number {
  const start = ms(quitStart(a));
  if (now.getTime() <= start) return 0;
  const expected = Math.floor((perDay * (now.getTime() - start)) / DAY_MS);
  const smoked = slipsOf(a, logs).filter((l) => ms(l.at) <= now.getTime()).length;
  return Math.max(0, expected - smoked);
}
