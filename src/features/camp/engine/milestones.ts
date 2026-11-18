import { DAY_MS, HOUR_MS, MIN_MS, ms } from './time';

/**
 * Health benefits of quitting, after the WHO list. A range ("2–12 weeks") is reached at its
 * start; the texts (K3) say that it varies from person to person.
 */
export const HEALTH_MILESTONES = [
  { id: 'min20', afterMs: 20 * MIN_MS },
  { id: 'h12', afterMs: 12 * HOUR_MS },
  { id: 'w2', afterMs: 14 * DAY_MS },
  { id: 'm1', afterMs: 30 * DAY_MS },
  { id: 'y1', afterMs: 365 * DAY_MS },
  { id: 'y5', afterMs: 5 * 365 * DAY_MS },
  { id: 'y10', afterMs: 10 * 365 * DAY_MS },
  { id: 'y15', afterMs: 15 * 365 * DAY_MS },
] as const;

export type MilestoneId = (typeof HEALTH_MILESTONES)[number]['id'];

/** Milestones already reached. */
export function reachedMilestones(quitDateTime: string, now: Date): MilestoneId[] {
  const elapsed = now.getTime() - ms(quitDateTime);
  return HEALTH_MILESTONES.filter((m) => elapsed >= m.afterMs).map((m) => m.id);
}

/** The next milestone, how long until it, and progress from the previous one (0–1). Null when all are reached. */
export function nextHealthMilestone(quitDateTime: string, now: Date): { id: MilestoneId; at: Date; remainingMs: number; progress: number } | null {
  const start = ms(quitDateTime);
  const elapsed = Math.max(0, now.getTime() - start);
  const i = HEALTH_MILESTONES.findIndex((m) => elapsed < m.afterMs);
  if (i < 0) return null;
  const m = HEALTH_MILESTONES[i]!;
  const prev = i > 0 ? HEALTH_MILESTONES[i - 1]!.afterMs : 0;
  return { id: m.id, at: new Date(start + m.afterMs), remainingMs: m.afterMs - elapsed, progress: (elapsed - prev) / (m.afterMs - prev) };
}

/**
 * Which reached milestone to celebrate now: the latest one not seen yet (several can be reached at
 * once, e.g. after "already quit"; only the latest is shown and all are then marked seen).
 */
export function milestoneToCelebrate(reached: MilestoneId[], seen: string[]): MilestoneId | null {
  const fresh = reached.filter((id) => !seen.includes(id));
  return fresh.length ? fresh[fresh.length - 1]! : null;
}
