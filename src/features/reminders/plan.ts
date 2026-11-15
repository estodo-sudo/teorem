import { addDays, daysBetween, parseTime, toDateKey } from '@/lib/date';
import { hashString } from '@/lib/random';

export const REMINDER_HORIZON_DAYS = 7;
export const STRENGTH_TEST_EVERY_DAYS = 7;
export const DISCREET_MESSAGE_COUNT = 6;
export const EXPLICIT_MESSAGE_COUNT = 4;

export type ReminderKind = 'daily' | 'weeklyTest';

export interface PlannedReminder {
  /** Stable id so re-planning is idempotent. */
  id: string;
  kind: ReminderKind;
  fireAt: Date;
  /** i18n key of the body text. */
  bodyKey: string;
  titleKey: string;
}

export interface ReminderInput {
  now: Date;
  /** "HH:MM" entries (1..3). */
  times: string[];
  enabled: boolean;
  /** Main workout already completed today → skip today's remaining reminders. */
  completedToday: boolean;
  discreet: boolean;
  weeklyTest: boolean;
  /** Date key of the last strength test (null = never). */
  lastStrengthTest: string | null;
  horizonDays?: number;
}

function at(dateKey: string, hhmm: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const { hour, minute } = parseTime(hhmm);
  return new Date(y!, m! - 1, d!, hour, minute, 0, 0);
}

/**
 * Plans one-shot local notifications for the next N days. Using individual
 * date triggers (instead of a repeating daily trigger) lets us drop the rest of
 * today's reminders once the workout is done. Re-run on every app open,
 * workout completion and settings change.
 */
export function planReminders(input: ReminderInput): PlannedReminder[] {
  if (!input.enabled || input.times.length === 0) return [];
  const horizon = input.horizonDays ?? REMINDER_HORIZON_DAYS;
  const today = toDateKey(input.now);
  const times = Array.from(new Set(input.times)).sort().slice(0, 3);
  const out: PlannedReminder[] = [];
  const style = input.discreet ? 'discreet' : 'explicit';
  const count = input.discreet ? DISCREET_MESSAGE_COUNT : EXPLICIT_MESSAGE_COUNT;

  for (let d = 0; d < horizon; d++) {
    const day = addDays(today, d);
    if (d === 0 && input.completedToday) continue;
    times.forEach((time, i) => {
      const fireAt = at(day, time);
      if (fireAt.getTime() <= input.now.getTime()) return;
      const variant = hashString(`${day}|${i}`) % count;
      out.push({
        id: `daily-${day}-${time}`,
        kind: 'daily',
        fireAt,
        titleKey: `reminders.${style}.title`,
        bodyKey: `reminders.${style}.body${variant}`,
      });
    });
  }

  if (input.weeklyTest) {
    const first = times[0]!;
    // First day (from today) on which the last test is ≥ 7 days old.
    const dueKey = input.lastStrengthTest
      ? addDays(input.lastStrengthTest, STRENGTH_TEST_EVERY_DAYS)
      : addDays(today, 1);
    let key = daysBetween(today, dueKey) < 0 ? today : dueKey;
    let fireAt = at(key, first);
    if (fireAt.getTime() <= input.now.getTime()) {
      key = addDays(key, 1);
      fireAt = at(key, first);
    }
    // Shift 30 min after the daily reminder so they don't collide.
    fireAt = new Date(fireAt.getTime() + 30 * 60_000);
    if (daysBetween(today, key) < horizon + STRENGTH_TEST_EVERY_DAYS) {
      out.push({
        id: `test-${key}`,
        kind: 'weeklyTest',
        fireAt,
        titleKey: `reminders.${style}.testTitle`,
        bodyKey: `reminders.${style}.testBody`,
      });
    }
  }
  return out.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

export function snoozeDate(now: Date, minutes: number): Date {
  return new Date(now.getTime() + minutes * 60_000);
}
