import { DAY_MS, dayKey, ms } from './time';

/**
 * Streak counters shared by every camp. A camp can track several targets at once (e.g. "no
 * cigarettes", or one counter per goal); each target has a start and its own lapses.
 */
export interface Lapse {
  at: string;
}

export interface StreakTarget<L extends Lapse = Lapse> {
  id: string;
  /** ISO start of the counter (quit day, goal start). */
  start: string;
  lapses: L[];
}

/** Lapses at or after the start, oldest first. */
export function lapsesSince<L extends Lapse>(start: string, lapses: L[]): L[] {
  const s = ms(start);
  return lapses.filter((l) => ms(l.at) >= s).sort((x, y) => ms(x.at) - ms(y.at));
}

/** Time since the last lapse (or the start). 0 before the start. Lapses must be at/after the start. */
export function cleanDuration(start: string, lapses: Lapse[], now: Date): number {
  const s = ms(start);
  if (now.getTime() < s) return 0;
  const past = lapses.filter((l) => ms(l.at) <= now.getTime());
  const last = past.length ? Math.max(...past.map((l) => ms(l.at))) : s;
  return Math.max(0, now.getTime() - last);
}

/**
 * Total clean days: whole days since the start minus the calendar days that had a lapse.
 * A lapse resets "since the last lapse", never this total.
 */
export function cleanDays(start: string, lapses: Lapse[], now: Date): number {
  const s = ms(start);
  if (now.getTime() < s) return 0;
  const whole = Math.floor((now.getTime() - s) / DAY_MS);
  const lapseDays = new Set(lapses.filter((l) => ms(l.at) <= now.getTime()).map((l) => dayKey(new Date(l.at)))).size;
  return Math.max(0, whole - lapseDays);
}

/** Every target's counters at once. */
export function streaks(targets: StreakTarget[], now: Date): { id: string; sinceLastMs: number; cleanDays: number; lapses: number }[] {
  return targets.map((t) => {
    const ls = lapsesSince(t.start, t.lapses);
    return { id: t.id, sinceLastMs: cleanDuration(t.start, ls, now), cleanDays: cleanDays(t.start, ls, now), lapses: ls.filter((l) => ms(l.at) <= now.getTime()).length };
  });
}
