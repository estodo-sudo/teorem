import type { CigaretteLog, CravingEvent, TriggerId } from '../types';

import { autopilotLogs, riskyHours } from './plans';
import { dayKey } from '@/features/camps/core/time';

/** Logs of one attempt, oldest first. */
export const logsOfAttempt = (logs: CigaretteLog[], attemptId: string) => logs.filter((l) => l.attemptId === attemptId).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

/** Cigarettes logged on the calendar day of `now`. */
export const todayCount = (logs: CigaretteLog[], now: Date) => logs.filter((l) => dayKey(new Date(l.at)) === dayKey(now)).length;

/** Logs grouped by calendar day, newest day first (entries newest first within a day). */
export function logsByDay(logs: CigaretteLog[]): { day: string; logs: CigaretteLog[] }[] {
  const map = new Map<string, CigaretteLog[]>();
  for (const l of [...logs].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))) {
    const k = dayKey(new Date(l.at));
    map.set(k, [...(map.get(k) ?? []), l]);
  }
  return [...map.entries()].map(([day, items]) => ({ day, logs: items }));
}

export interface DiaryReport {
  total: number;
  /** Calendar days with at least one entry. */
  days: number;
  perDay: number;
  /** Count per hour of the day (0–23). */
  hours: number[];
  topHours: { hour: number; count: number }[];
  topTriggers: { trigger: TriggerId; count: number }[];
  /** "Autopilot" cigarettes (need 1–2): the first ones to drop. */
  autopilot: number;
  autopilotShare: number;
  /** Average "how much did I need it" (1–5); null when none rated. */
  avgNeed: number | null;
}

/**
 * Preparation diary report: "you smoke most at these hours and in these situations".
 * Feeds the if–then plans and (in K12) the risky-hour reminder.
 */
export function diaryReport(logs: CigaretteLog[]): DiaryReport {
  const hours = new Array<number>(24).fill(0);
  for (const l of logs) hours[new Date(l.at).getHours()]! += 1;
  const days = new Set(logs.map((l) => dayKey(new Date(l.at)))).size;
  const trig = new Map<TriggerId, number>();
  for (const l of logs) if (l.trigger) trig.set(l.trigger, (trig.get(l.trigger) ?? 0) + 1);
  const rated = logs.filter((l) => l.need !== undefined);
  const auto = autopilotLogs(logs).length;
  return {
    total: logs.length,
    days,
    perDay: days ? Math.round((logs.length / days) * 10) / 10 : 0,
    hours,
    topHours: riskyHours(logs, 3),
    topTriggers: [...trig.entries()]
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    autopilot: auto,
    autopilotShare: logs.length ? auto / logs.length : 0,
    avgNeed: rated.length ? Math.round((rated.reduce((a, l) => a + (l.need ?? 0), 0) / rated.length) * 10) / 10 : null,
  };
}

/** The report is meaningful once a few entries exist. */
export const REPORT_MIN_LOGS = 5;

/**
 * Trigger map: the user's triggers (from the assessment) plus any seen in the diary or SOS,
 * ordered by how often they came up (cigarettes + cravings), then in the assessment order.
 */
export function triggerFrequency(profileTriggers: TriggerId[], logs: CigaretteLog[], cravings: CravingEvent[]): { trigger: TriggerId; count: number; mine: boolean }[] {
  const count = new Map<TriggerId, number>();
  for (const t of profileTriggers) count.set(t, 0);
  for (const x of [...logs, ...cravings]) if (x.trigger) count.set(x.trigger, (count.get(x.trigger) ?? 0) + 1);
  const order = (t: TriggerId) => {
    const i = profileTriggers.indexOf(t);
    return i < 0 ? 99 : i;
  };
  return [...count.entries()].map(([trigger, c]) => ({ trigger, count: c, mine: profileTriggers.includes(trigger) })).sort((a, b) => b.count - a.count || order(a.trigger) - order(b.trigger));
}

/** "08:00–09:00" style label for an hour. */
export const hourRange = (h: number) => `${String(h).padStart(2, '0')}:00–${String((h + 1) % 24).padStart(2, '0')}:00`;
