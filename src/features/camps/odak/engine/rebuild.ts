import { DAY_MS, dayKey } from '@/features/camps/core/time';

import type { TimeRange } from '../types';

import { weekStart } from './goals';

/**
 * Yeniden İnşa (SPEC_ODAK_KAMPI 5.8), pure helpers: alternatives per risky range, the sleep-hygiene
 * checklist and a weekly connection task that changes every week.
 */
export interface RebuildState {
  /** Alternatives chosen per risky range (key "HH:MM-HH:MM"). */
  activities: Record<string, string[]>;
  sleep: string[];
  /** Weeks (Monday day key) the connection task was done. */
  connectionWeeks: string[];
}

export const defaultRebuild = (): RebuildState => ({ activities: {}, sleep: [], connectionWeeks: [] });

export const rangeKey = (r: TimeRange) => `${r.from}-${r.to}`;

export const weekKeyOf = (d: Date) => dayKey(weekStart(d));

/** Toggles an alternative for a range, keeping at most `max` (the oldest choice drops out). */
export function toggleActivity(map: Record<string, string[]>, key: string, id: string, max = 2): Record<string, string[]> {
  const cur = map[key] ?? [];
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-max);
  return { ...map, [key]: next };
}

/** This week's connection task: rotates through the list, one per calendar week. */
export function connectionTask(tasks: string[], now: Date): string {
  const weeks = Math.floor(weekStart(now).getTime() / (7 * DAY_MS));
  return tasks[((weeks % tasks.length) + tasks.length) % tasks.length]!;
}

export const connectionDone = (s: RebuildState, now: Date) => s.connectionWeeks.includes(weekKeyOf(now));
