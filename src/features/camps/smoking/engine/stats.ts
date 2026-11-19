import type { CampState } from '../state';
import type { CampEvents, CheckIn, CigaretteLog, CravingEvent, PriceEntry, QuitAttempt } from '../types';

import { slipsOf, totalSmokeFreeDays } from './counters';
import { daysSinceQuit, quitStart } from './phase';
import { moneySaved } from './savings';
import { resistedCount } from './sos';
import { longestDayStreak, newBadges, thresholdBadges } from '@/features/camps/core/badgeEngine';
import { DAY_MS, dayKey, ms, startOfDay } from '@/features/camps/core/time';

// ── Statistics (4.13) ──────────────────────────────────────────────────────────

export type HeatCell = 'free' | 'slip' | 'today' | 'future';

/** Smoke-free calendar from the quit day: `weeks` rows of 7 days ('free' / 'slip' / 'today' / 'future'). */
export function smokeFreeCalendar(a: QuitAttempt, logs: CigaretteLog[], now: Date, weeks = 13): HeatCell[][] {
  const start = startOfDay(new Date(quitStart(a)));
  const slipDays = new Set(slipsOf(a, logs).map((l) => dayKey(new Date(l.at))));
  const today = dayKey(now);
  const todayMs = startOfDay(now).getTime();
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i);
      const k = dayKey(d);
      if (slipDays.has(k)) return 'slip';
      if (k === today) return 'today';
      return d.getTime() < todayMs ? 'free' : 'future';
    }),
  );
}

/** Cravings per calendar day for the last `days` days (oldest first). */
export function cravingsPerDay(cravings: CravingEvent[], now: Date, days = 14): { day: string; count: number }[] {
  const out: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dayKey(d);
    out.push({ day: k, count: cravings.filter((c) => dayKey(new Date(c.at)) === k).length });
  }
  return out;
}

/** Average craving intensity (1–10, before the tools) per week, last `weeks` weeks (oldest first; null = no cravings). */
export function weeklyIntensity(cravings: CravingEvent[], now: Date, weeks = 6): (number | null)[] {
  const end = startOfDay(now).getTime() + DAY_MS;
  return Array.from({ length: weeks }, (_, i) => {
    const to = end - (weeks - 1 - i) * 7 * DAY_MS;
    const from = to - 7 * DAY_MS;
    const xs = cravings.filter((c) => ms(c.at) >= from && ms(c.at) < to).map((c) => c.intensityBefore);
    return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;
  });
}

/** Money saved at the end of each day since the quit (at most the last `days` days). */
export function cumulativeSavings(prices: PriceEntry[], perDay: number, a: QuitAttempt, logs: CigaretteLog[], now: Date, days = 30): { day: string; amount: number }[] {
  const since = Math.max(0, daysSinceQuit(a, now));
  const n = Math.min(days, since + 1);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - i));
    const endOfDay = i === n - 1 ? now : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return { day: dayKey(d), amount: Math.round(moneySaved(prices, perDay, a, logs, endOfDay)) };
  });
}

// ── Badges (4.14) ──────────────────────────────────────────────────────────────

/** Smoke-free day badges: 1, 3 (the peak is over), 7, 14, 30, 60, 90, 180, 365 days. */
export const DAY_BADGES = [1, 3, 7, 14, 30, 60, 90, 180, 365] as const;
export const CRISIS_BADGES = [10, 50, 100] as const;
export const SAVINGS_BADGE_TRY = 1000;
export const CHECKIN_STREAK = 7;

/** Longest run of consecutive calendar days with at least one check-in. */
export const longestCheckinStreak = (checkins: CheckIn[]): number => longestDayStreak(checkins);

/** Badge ids earned now (earned badges are stored and never taken back). */
export function earnedBadges(s: CampState, ev: CampEvents, mainLessonIds: string[], now: Date): string[] {
  const out: string[] = [];
  const a = s.attempts.find((x) => x.status === 'active' || x.status === 'graduated') ?? null;
  if (a && s.profile) {
    const days = totalSmokeFreeDays(a, ev.cigarettes, now);
    out.push(...thresholdBadges('days', DAY_BADGES, days));
    if (moneySaved(s.prices, s.profile.perDay, a, ev.cigarettes, now) >= SAVINGS_BADGE_TRY) out.push('saved-1000');
  }
  const resisted = resistedCount(ev.cravings);
  out.push(...thresholdBadges('crisis', CRISIS_BADGES, resisted));
  if (s.plans.length) out.push('first-plan');
  if (mainLessonIds.length && mainLessonIds.every((id) => s.skills.some((k) => k.lessonId === id))) out.push('all-skills');
  if (longestCheckinStreak(ev.checkins) >= CHECKIN_STREAK) out.push('checkin-7');
  if (s.attempts.some((x) => x.status === 'graduated')) out.push('graduate');
  return out;
}

/** Badges earned but not yet stored (to celebrate), in definition order. */
export { newBadges };

// ── Graduation ─────────────────────────────────────────────────────────────────

export const GRADUATION_DAY = 90;

/** Day 90 since the quit reached and not graduated yet. */
export const canGraduate = (a: QuitAttempt | null, now: Date) => Boolean(a && a.status === 'active' && daysSinceQuit(a, now) >= GRADUATION_DAY);

/** Reward jar progress: total savings against the goal (0–1). */
export const goalProgress = (saved: number, amount: number) => (amount > 0 ? Math.min(1, saved / amount) : 0);
