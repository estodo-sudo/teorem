import type { CigaretteLog, CravingEvent, IfThenPlan, TriggerId } from '../types';

/**
 * Trigger coverage for the panel and the trigger map (SPEC_V4 §C.2): situations the user has lived —
 * picked in the assessment, logged with a cigarette or with a craving — and how many have a plan.
 */
export function triggerCoverage(profileTriggers: TriggerId[], cravings: Pick<CravingEvent, 'trigger' | 'triggers'>[], logs: Pick<CigaretteLog, 'trigger'>[], plans: Pick<IfThenPlan, 'trigger'>[]): { done: number; total: number } {
  const lived = livedTriggers(profileTriggers, cravings, logs);
  const planned = new Set<string>(plans.map((p) => p.trigger));
  return { done: [...lived].filter((x) => planned.has(x)).length, total: lived.size };
}

/** How often each trigger came up: every trigger of a craving (several can be chosen) and of a logged cigarette. */
export function triggerCounts(cravings: Pick<CravingEvent, 'trigger' | 'triggers'>[], logs: Pick<CigaretteLog, 'trigger'>[]): Map<TriggerId, number> {
  const count = new Map<TriggerId, number>();
  const add = (t?: TriggerId) => {
    if (t) count.set(t, (count.get(t) ?? 0) + 1);
  };
  for (const c of cravings) (c.triggers?.length ? c.triggers : [c.trigger]).forEach(add);
  for (const l of logs) add(l.trigger);
  return count;
}

/** Situations the user has lived: picked in the assessment, or logged with a craving or a cigarette. */
export function livedTriggers(profileTriggers: TriggerId[], cravings: Pick<CravingEvent, 'trigger' | 'triggers'>[], logs: Pick<CigaretteLog, 'trigger'>[]): Set<TriggerId> {
  return new Set<TriggerId>([...profileTriggers, ...triggerCounts(cravings, logs).keys()]);
}

/**
 * The trigger map (SPEC_V4 §C.2) lists the whole catalogue in three groups: with a plan; lived but no
 * plan yet; and the other situations, not met so far. Each group is most frequent first.
 */
export function triggerMapGroups(catalog: TriggerId[], profileTriggers: TriggerId[], cravings: Pick<CravingEvent, 'trigger' | 'triggers'>[], logs: Pick<CigaretteLog, 'trigger'>[], plans: Pick<IfThenPlan, 'trigger'>[]) {
  const counts = triggerCounts(cravings, logs);
  const lived = livedTriggers(profileTriggers, cravings, logs);
  const planned = new Set<string>(plans.map((p) => p.trigger));
  const sorted = [...catalog].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || catalog.indexOf(a) - catalog.indexOf(b));
  return {
    planned: sorted.filter((x) => planned.has(x)),
    livedNoPlan: sorted.filter((x) => !planned.has(x) && lived.has(x)),
    other: sorted.filter((x) => !planned.has(x) && !lived.has(x)),
    counts,
  };
}

/** The one situational card under "Bugün" (SPEC_V4 §C.6, layer 4), in priority order. */
export type PanelContext = 'safety' | 'quitDay' | 'quitSoon' | 'slip' | 'graduation' | 'health' | 'reason' | null;

export function panelContext(o: { safety: boolean; quitDayToday: boolean; daysToQuit: number | null; slipWithinDay: boolean; graduation: boolean; nextHealth: boolean; reason: boolean }): PanelContext {
  if (o.safety) return 'safety';
  if (o.quitDayToday) return 'quitDay';
  if (o.daysToQuit !== null && o.daysToQuit >= 0 && o.daysToQuit <= 3) return 'quitSoon';
  if (o.slipWithinDay) return 'slip';
  if (o.graduation) return 'graduation';
  if (o.nextHealth) return 'health';
  if (o.reason) return 'reason';
  return null;
}

/** True when the latest slip was today or yesterday ("Dün bir kayma oldu"). */
export function recentSlip(slips: Pick<CigaretteLog, 'at'>[], now: Date): boolean {
  if (!slips.length) return false;
  const latest = Math.max(...slips.map((s) => new Date(s.at).getTime()));
  const startYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  return latest >= startYesterday && latest <= now.getTime();
}

/** Same calendar day (local time). */
export const sameDay = (iso: string, now: Date): boolean => {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

/**
 * Trigger chips in "Canım çekiyor" (SPEC_V4 §C.2): the whole catalogue, the user's most frequent
 * situations first (counted over cravings — every chosen trigger — and logged cigarettes), then the rest
 * in catalogue order.
 */
export function triggerOrder(catalog: TriggerId[], cravings: Pick<CravingEvent, 'trigger' | 'triggers'>[], logs: Pick<CigaretteLog, 'trigger'>[]): TriggerId[] {
  const count = triggerCounts(cravings, logs);
  return [...catalog].sort((a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0) || catalog.indexOf(a) - catalog.indexOf(b));
}
