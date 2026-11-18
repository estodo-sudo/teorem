import type { CampPhase, CigaretteLog, Mission } from '../types';

/**
 * Cut-down method: daily targets that step down evenly each week, ending in a quit day.
 * E.g. 20 a day over 4 weeks → 16, 12, 8, 4, then the quit day. Reduction is a bridge, not a goal.
 */
export function cutDownPlan(perDay: number, weeks: number): { week: number; perDay: number }[] {
  const w = Math.min(4, Math.max(2, Math.round(weeks)));
  const n = Math.max(1, Math.round(perDay));
  return Array.from({ length: w }, (_, i) => ({ week: i + 1, perDay: Math.max(1, Math.round((n * (w - i)) / (w + 1))) }));
}

/**
 * Today's mission: the one set for this exact day of the phase; otherwise (in phases with missions
 * only on some days) the latest earlier mission of the same phase that is still open. Preparation
 * days count down, so it never catches up there.
 */
export function missionForDay(missions: Mission[], phase: CampPhase, day: number, completedIds: string[]): Mission | null {
  const own = missions.filter((m) => m.phase === phase);
  const exact = own.find((m) => m.day === day);
  if (exact) return exact;
  if (phase === 'preparation') return null;
  const open = own.filter((m) => m.day < day && !completedIds.includes(m.id)).sort((a, b) => b.day - a.day);
  return open[0] ?? null;
}

/** Hours of the day with the most logged cigarettes (most first; ties by hour). */
export function riskyHours(logs: CigaretteLog[], top = 3): { hour: number; count: number }[] {
  const counts = new Array<number>(24).fill(0);
  for (const l of logs) counts[new Date(l.at).getHours()]! += 1;
  return counts
    .map((count, hour) => ({ hour, count }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count || a.hour - b.hour)
    .slice(0, top);
}

/** "Autopilot" cigarettes (need rated 1–2): the first ones to drop when cutting down. */
export const autopilotLogs = (logs: CigaretteLog[]) => logs.filter((l) => l.need !== undefined && l.need <= 2);
