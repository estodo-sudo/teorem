import { DAY_MS, dayKey } from './time';

/** Badges shared by every camp: earned ids are stored once and never taken back. */
export interface StoredBadge {
  id: string;
  unlockedAt?: string;
}

/** `${prefix}-${n}` for every threshold reached (e.g. days-7, crisis-10). */
export const thresholdBadges = (prefix: string, thresholds: readonly number[], value: number) => thresholds.filter((n) => value >= n).map((n) => `${prefix}-${n}`);

/** Badges earned but not yet stored (to celebrate), in definition order. */
export const newBadges = (earned: string[], stored: StoredBadge[]) => earned.filter((id) => !stored.some((b) => b.id === id && b.unlockedAt));

/** Longest run of consecutive calendar days with at least one entry. */
export function longestDayStreak(entries: { at: string }[]): number {
  const days = [...new Set(entries.map((c) => dayKey(new Date(c.at))))].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of days) {
    const [y, m, d] = k.split('-').map(Number) as [number, number, number];
    const t = new Date(y, m - 1, d).getTime();
    run = prev !== null && Math.round((t - prev) / DAY_MS) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}
