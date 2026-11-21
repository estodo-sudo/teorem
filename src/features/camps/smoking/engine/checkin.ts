import { LEGACY_TOOLS, type CampPhase, type CheckIn, type CigaretteLog, type CravingEvent, type IfThenPlan, type QuitAttempt, type TriggerId, type ActiveToolId, type LegacyToolId, type ToolId } from '../types';

import { slipsOf } from './counters';
import { quitStart } from './phase';
import { cadenceDue, EVENING_HOUR, lowMoodRun, type CheckinCadence } from '@/features/camps/core/checkinEngine';
import { ms } from '@/features/camps/core/time';

/** Critical week: a morning check-in until 15:00, an evening one after. */
export { EVENING_HOUR };
/** After day 30 about twice a week: due when the last one is this many days old. */
export const MAINTENANCE_GAP_DAYS = 3;
/** "Çok kötü" mood on this many days in a row shows the support card. */
export const MOOD_ALERT_DAYS = 3;

export type CheckinSlot = 'morning' | 'evening' | 'daily' | 'twice_weekly';

/** Check-in cadence of each phase (spec 4.6). */
export function smokingCadence(phase: CampPhase): CheckinCadence {
  if (phase === 'critical_week') return 'twice_daily';
  if (phase === 'quit_day' || phase === 'strengthening') return 'daily';
  if (phase === 'maintenance') return { everyDays: MAINTENANCE_GAP_DAYS };
  return 'none';
}

/**
 * Whether a check-in is due now, and which one:
 * critical week → morning and evening · quit day / days 8–30 → once a day ·
 * days 31–90 → about twice a week · preparation and after day 90 → none.
 */
export function checkinDue(checkins: CheckIn[], phase: CampPhase, now: Date): { due: boolean; slot: CheckinSlot | null } {
  const r = cadenceDue(checkins, smokingCadence(phase), now);
  return { due: r.due, slot: r.slot === 'periodic' ? 'twice_weekly' : r.slot };
}

/**
 * Safety rule: the latest mood of each day was "çok kötü" (1) on 3 calendar days in a row,
 * ending today or yesterday → a gentle support card pointing to a doctor / ALO 171.
 */
export const moodAlert = (checkins: CheckIn[], now: Date): boolean => lowMoodRun(checkins, now, MOOD_ALERT_DAYS);

export interface Learnings {
  smokeFreeDays: number;
  resisted: number;
  /** Situations that led to slips or cravings, most frequent first. */
  hardTriggers: { trigger: TriggerId; count: number }[];
  /** Tools used in cravings that were ridden out, most used first. */
  /** Removed V4 tools are grouped as `other` ("Diğer araçlar"). */
  helpfulTools: { tool: ActiveToolId | 'other'; count: number }[];
  /** Plans that were used in a crisis. */
  usedPlans: IfThenPlan[];
}

/** A tool id as statistics show it: tools removed in V4 count as "other". */
export const toolGroup = (id: ToolId): ActiveToolId | 'other' => ((LEGACY_TOOLS as readonly string[]).includes(id) ? 'other' : (id as Exclude<ToolId, LegacyToolId>));

/** What an attempt taught: hard situations, tools that helped and plans that were used. */
export function learnings(a: QuitAttempt, logs: CigaretteLog[], cravings: CravingEvent[], plans: IfThenPlan[], smokeFreeDays: number): Learnings {
  const from = ms(quitStart(a));
  const own = cravings.filter((c) => ms(c.at) >= ms(a.startedAt));
  const trig = new Map<TriggerId, number>();
  for (const x of [...slipsOf(a, logs), ...own]) if (x.trigger) trig.set(x.trigger, (trig.get(x.trigger) ?? 0) + 1);
  const tools = new Map<ActiveToolId | 'other', number>();
  for (const c of own) if (c.outcome === 'resisted') for (const t of new Set(c.toolUsed.map(toolGroup))) tools.set(t, (tools.get(t) ?? 0) + 1);
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
