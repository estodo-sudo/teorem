import { DAY_MS, dayKey, startOfDay } from '@/features/camps/core/time';

import type { BehaviorEvent, BehaviorKind, GoalConfig } from '../types';

/**
 * Goal counters (pure), one per behaviour the user set a goal for (SPEC_ODAK_KAMPI 5.1 / 5.6).
 * A day "fits the goal" when:
 *   quit / pause — no event of that behaviour that day;
 *   reduce       — the days with the behaviour so far that week (Mon–Sun) stay within the weekly limit.
 * Today counts as fitting until an event says otherwise. A slip ends the current run only; the total of
 * fitting days and the longest run are kept.
 */
export type Target = 'porn' | 'mast';
export type TargetMode = 'quit' | 'reduce' | 'pause';

export interface TargetGoal {
  target: Target;
  mode: TargetMode;
  /** reduce: days a week allowed; pause: length of the pause in days. */
  limit?: number;
}

/** Behaviours with a measurable goal ("undecided" and "none" get no counter). */
export function targetsOf(goal: GoalConfig): TargetGoal[] {
  const out: TargetGoal[] = [];
  if (goal.porn === 'quit') out.push({ target: 'porn', mode: 'quit' });
  if (goal.porn === 'reduce') out.push({ target: 'porn', mode: 'reduce', limit: goal.pornWeeklyMax ?? 1 });
  if (goal.mast === 'reduce') out.push({ target: 'mast', mode: 'reduce', limit: goal.mastWeeklyMax ?? 1 });
  if (goal.mast === 'pause') out.push({ target: 'mast', mode: 'pause', limit: goal.mastPauseDays ?? 30 });
  return out;
}

export const touches = (kind: BehaviorKind, target: Target) => kind === 'both' || kind === target;

/** Monday of the week of `d` (local). */
export function weekStart(d: Date): Date {
  const s = startOfDay(d);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() - ((s.getDay() + 6) % 7));
}

/** Calendar days (keys) from the start day to today, inclusive. */
function daysFrom(startedAt: string, now: Date): Date[] {
  const out: Date[] = [];
  const first = startOfDay(new Date(startedAt));
  const last = startOfDay(now);
  for (let d = first; d.getTime() <= last.getTime(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) out.push(d);
  return out;
}

export interface GoalCounter {
  target: Target;
  mode: TargetMode;
  limit?: number;
  /** Consecutive fitting days ending today. */
  current: number;
  longest: number;
  /** Fitting days since the start (never reset). */
  total: number;
  /** reduce: days with the behaviour this week. */
  weekUsed: number;
  /** pause: the pause is complete (current run reached the length). */
  done: boolean;
}

/** Each calendar day from the start to today with whether it fit the goal for this target. */
export function dailyFits(t: TargetGoal, startedAt: string, events: BehaviorEvent[], now: Date): { day: string; fits: boolean }[] {
  const startMs = startOfDay(new Date(startedAt)).getTime();
  const eventDays = new Set(events.filter((e) => touches(e.kind, t.target) && Date.parse(e.at) >= startMs && Date.parse(e.at) <= now.getTime()).map((e) => dayKey(new Date(e.at))));
  const out: { day: string; fits: boolean }[] = [];
  let week = '';
  let used = 0;
  for (const d of daysFrom(startedAt, now)) {
    const wk = dayKey(weekStart(d));
    if (wk !== week) {
      week = wk;
      used = 0;
    }
    const k = dayKey(d);
    const had = eventDays.has(k);
    if (had) used += 1;
    // reduce: a day without the behaviour always fits, even after the week went over the limit.
    out.push({ day: k, fits: !had || (t.mode === 'reduce' && used <= (t.limit ?? 0)) });
  }
  return out;
}

export function goalCounter(t: TargetGoal, startedAt: string, events: BehaviorEvent[], now: Date): GoalCounter {
  let current = 0;
  let longest = 0;
  let total = 0;
  for (const d of dailyFits(t, startedAt, events, now)) {
    if (d.fits) {
      current += 1;
      total += 1;
      longest = Math.max(longest, current);
    } else current = 0;
  }
  const thisWeek = dayKey(weekStart(now));
  const startMs = startOfDay(new Date(startedAt)).getTime();
  const weekUsed = new Set(events.filter((e) => touches(e.kind, t.target) && Date.parse(e.at) >= startMs && Date.parse(e.at) <= now.getTime() && dayKey(weekStart(new Date(e.at))) === thisWeek).map((e) => dayKey(new Date(e.at)))).size;
  return { target: t.target, mode: t.mode, limit: t.limit, current, longest, total, weekUsed, done: t.mode === 'pause' && current >= (t.limit ?? Infinity) };
}

/** Every counter of the goal at once (the panel cards). */
export const goalCounters = (goal: GoalConfig, events: BehaviorEvent[], now: Date) => targetsOf(goal).map((t) => goalCounter(t, goal.startedAt, events, now));

/**
 * Does logging this behaviour now go against the goal? quit/pause: always; reduce: only when it takes
 * the week over the limit (a new day beyond the allowance).
 */
export function isSlip(goal: GoalConfig, kind: BehaviorKind, events: BehaviorEvent[], at: Date): boolean {
  return targetsOf(goal).some((t) => {
    if (!touches(kind, t.target)) return false;
    if (t.mode !== 'reduce') return true;
    const wk = weekStart(at).getTime();
    const days = new Set(events.filter((e) => touches(e.kind, t.target) && Date.parse(e.at) >= wk && Date.parse(e.at) < wk + 7 * DAY_MS).map((e) => dayKey(new Date(e.at))));
    days.add(dayKey(at));
    return days.size > (t.limit ?? 0);
  });
}
