import type { CampPhase, CheckIn, CigaretteLog, CravingEvent, IfThenPlan, QuitAttempt, ToolId, TriggerId } from '../types';

import { slipsOf } from './counters';
import { quitStart } from './phase';
import { DAY_MS, dayKey, ms, startOfDay } from './time';

/** Critical week: a morning check-in until 15:00, an evening one after. */
export const EVENING_HOUR = 15;
/** After day 30 about twice a week: due when the last one is this many days old. */
export const MAINTENANCE_GAP_DAYS = 3;
/** "Çok kötü" mood on this many days in a row shows the support card. */
export const MOOD_ALERT_DAYS = 3;

export type CheckinSlot = 'morning' | 'evening' | 'daily' | 'twice_weekly';

/**
 * Whether a check-in is due now, and which one:
 * critical week → morning and evening · quit day / days 8–30 → once a day ·
 * days 31–90 → about twice a week · preparation and after day 90 → none.
 */
export function checkinDue(checkins: CheckIn[], phase: CampPhase, now: Date): { due: boolean; slot: CheckinSlot | null } {
  const today = dayKey(now);
  const todays = checkins.filter((c) => dayKey(new Date(c.at)) === today);
  if (phase === 'critical_week') {
    const evening = now.getHours() >= EVENING_HOUR;
    const done = todays.some((c) => new Date(c.at).getHours() >= EVENING_HOUR === evening);
    return { due: !done, slot: evening ? 'evening' : 'morning' };
  }
  if (phase === 'quit_day' || phase === 'strengthening') return { due: todays.length === 0, slot: 'daily' };
  if (phase === 'maintenance') {
    const last = checkins.reduce((m, c) => Math.max(m, ms(c.at)), 0);
    return { due: !last || startOfDay(now).getTime() - startOfDay(new Date(last)).getTime() >= MAINTENANCE_GAP_DAYS * DAY_MS, slot: 'twice_weekly' };
  }
  return { due: false, slot: null };
}

/**
 * Safety rule: the latest mood of each day was "çok kötü" (1) on 3 calendar days in a row,
 * ending today or yesterday → a gentle support card pointing to a doctor / ALO 171.
 */
export function moodAlert(checkins: CheckIn[], now: Date): boolean {
  const byDay = new Map<string, CheckIn>();
  for (const c of [...checkins].sort((a, b) => ms(a.at) - ms(b.at))) byDay.set(dayKey(new Date(c.at)), c);
  const isLow = (d: Date) => byDay.get(dayKey(d))?.mood === 1;
  const start = isLow(now) ? startOfDay(now) : new Date(startOfDay(now).getTime() - DAY_MS);
  for (let i = 0; i < MOOD_ALERT_DAYS; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() - i);
    if (!isLow(d)) return false;
  }
  return true;
}

export interface Learnings {
  smokeFreeDays: number;
  resisted: number;
  /** Situations that led to slips or cravings, most frequent first. */
  hardTriggers: { trigger: TriggerId; count: number }[];
  /** Tools used in cravings that were ridden out, most used first. */
  helpfulTools: { tool: ToolId; count: number }[];
  /** Plans that were used in a crisis. */
  usedPlans: IfThenPlan[];
}

/** What an attempt taught: hard situations, tools that helped and plans that were used. */
export function learnings(a: QuitAttempt, logs: CigaretteLog[], cravings: CravingEvent[], plans: IfThenPlan[], smokeFreeDays: number): Learnings {
  const from = ms(quitStart(a));
  const own = cravings.filter((c) => ms(c.at) >= ms(a.startedAt));
  const trig = new Map<TriggerId, number>();
  for (const x of [...slipsOf(a, logs), ...own]) if (x.trigger) trig.set(x.trigger, (trig.get(x.trigger) ?? 0) + 1);
  const tools = new Map<ToolId, number>();
  for (const c of own) if (c.outcome === 'resisted') for (const t of c.toolUsed) tools.set(t, (tools.get(t) ?? 0) + 1);
  const top = <K>(m: Map<K, number>) => [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3);
  return {
    smokeFreeDays: from ? smokeFreeDays : 0,
    resisted: own.filter((c) => c.outcome === 'resisted').length,
    hardTriggers: top(trig).map(([trigger, count]) => ({ trigger, count })),
    helpfulTools: top(tools).map(([tool, count]) => ({ tool, count })),
    usedPlans: plans.filter((p) => p.usedCount > 0).sort((x, y) => y.usedCount - x.usedCount),
  };
}

/** Craving-count choices in the check-in ("Kaç kez güçlü istek oldu?"); the last means "6 or more". */
export const CRAVING_COUNTS = [0, 1, 2, 3, 5, 6] as const;
