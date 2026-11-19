import { DAY_MS, dayKey, ms, startOfDay } from './time';

/** Morning check-in until this hour, an evening one after (twice-a-day cadence). */
export const EVENING_HOUR = 15;

/**
 * How often a camp asks for a check-in in a phase: twice a day (morning / evening), once a day,
 * every few days, or not at all.
 */
export type CheckinCadence = 'twice_daily' | 'daily' | { everyDays: number } | 'none';
export type CadenceSlot = 'morning' | 'evening' | 'daily' | 'periodic';

/** Whether a check-in is due now under a cadence, and which slot. */
export function cadenceDue(checkins: { at: string }[], cadence: CheckinCadence, now: Date): { due: boolean; slot: CadenceSlot | null } {
  const today = dayKey(now);
  const todays = checkins.filter((c) => dayKey(new Date(c.at)) === today);
  if (cadence === 'twice_daily') {
    const evening = now.getHours() >= EVENING_HOUR;
    const done = todays.some((c) => new Date(c.at).getHours() >= EVENING_HOUR === evening);
    return { due: !done, slot: evening ? 'evening' : 'morning' };
  }
  if (cadence === 'daily') return { due: todays.length === 0, slot: 'daily' };
  if (cadence !== 'none') {
    const last = checkins.reduce((m, c) => Math.max(m, ms(c.at)), 0);
    return { due: !last || startOfDay(now).getTime() - startOfDay(new Date(last)).getTime() >= cadence.everyDays * DAY_MS, slot: 'periodic' };
  }
  return { due: false, slot: null };
}

/**
 * Safety rule: the latest mood of each day was the lowest (`low`) on `days` calendar days in a row,
 * ending today or yesterday → a gentle support card.
 */
export function lowMoodRun(checkins: { at: string; mood: number }[], now: Date, days: number, low = 1): boolean {
  const byDay = new Map<string, { mood: number }>();
  for (const c of [...checkins].sort((a, b) => ms(a.at) - ms(b.at))) byDay.set(dayKey(new Date(c.at)), c);
  const isLow = (d: Date) => byDay.get(dayKey(d))?.mood === low;
  const start = isLow(now) ? startOfDay(now) : new Date(startOfDay(now).getTime() - DAY_MS);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() - i);
    if (!isLow(d)) return false;
  }
  return true;
}

/** Calendar days with a morning (before EVENING_HOUR) / evening check-in. */
export function checkinSlotDays(checkins: { at: string }[]): { morning: string[]; evening: string[] } {
  const morning = new Set<string>();
  const evening = new Set<string>();
  for (const c of checkins) {
    const d = new Date(c.at);
    (d.getHours() >= EVENING_HOUR ? evening : morning).add(dayKey(d));
  }
  return { morning: [...morning], evening: [...evening] };
}
