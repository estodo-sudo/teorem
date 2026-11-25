/**
 * "Bu hafta" strip on Günüm (SPEC_V4 §A.2): the calendar week Monday → Sunday with each day's state.
 * Pure; date keys are local YYYY-MM-DD.
 */
export type WeekDayState = 'done' | 'partial' | 'today' | 'todayDone' | 'todayPartial' | 'missed' | 'future' | 'rest';

export interface WeekDay {
  key: string;
  /** 0 = Monday … 6 = Sunday. */
  index: number;
  state: WeekDayState;
}

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
};

/** Monday of the week that contains `todayKey`. */
export function weekStartKey(todayKey: string): string {
  const d = fromKey(todayKey);
  const back = (d.getDay() + 6) % 7;
  return keyOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() - back));
}

/**
 * The seven days of this week. Done: a completed workout that day. Rest: a protected day (holiday or
 * streak freeze) without a workout. Today is ringed (or done). Past days without a workout are "missed"
 * (shown like future days, never in a warning colour).
 */
export function weekDays(todayKey: string, completed: Iterable<string>, rest: Iterable<string> = [], partialDays: Iterable<string> = []): WeekDay[] {
  const done = new Set(completed);
  const off = new Set(rest);
  // Started but below the daily target (2026-11-23): shown half filled, not as done.
  const half = new Set(partialDays);
  const start = fromKey(weekStartKey(todayKey));
  return Array.from({ length: 7 }, (_, i) => {
    const key = keyOf(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    const state: WeekDayState = key === todayKey ? (done.has(key) ? 'todayDone' : half.has(key) ? 'todayPartial' : 'today') : done.has(key) ? 'done' : half.has(key) ? 'partial' : off.has(key) ? 'rest' : key < todayKey ? 'missed' : 'future';
    return { key, index: i, state };
  });
}

/** "Bu hafta 2/5 antrenman": workouts done this week out of the training days (rest days excluded). */
export function weekCount(days: WeekDay[]): { done: number; total: number } {
  return { done: days.filter((d) => d.state === 'done' || d.state === 'todayDone').length, total: days.filter((d) => d.state !== 'rest').length };
}
