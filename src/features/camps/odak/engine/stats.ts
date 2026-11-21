import { longestDayStreak, thresholdBadges } from '@/features/camps/core/badgeEngine';
import { DAY_MS, dayKey, startOfDay } from '@/features/camps/core/time';

import type { BehaviorEvent, BoundaryConfig, GoalConfig, OdakCheckIn, OdakPlan, OdakTriggerId, ScreeningResult, UrgeEvent } from '../types';

import { boundariesSet } from './boundaries';
import { programStart, slipDays } from './checkin';
import { weekdayIndex } from './diary';
import { dailyFits, goalCounters, targetsOf, weekStart } from './goals';
import { programDay } from './phase';
import { managedCount, toolEffectiveness } from './sos';

/**
 * Statistics and badges (SPEC_ODAK_KAMPI 5.12 / 5.13), pure. Colours stay neutral: a slip day is grey,
 * never "red = bad". Badges once earned are kept (a slip never takes one back).
 */
/** Urges with an intensity given (0 = skipped in the crisis). */
const given = (list: UrgeEvent[]) => list.filter((u) => u.intensityBefore > 0);

export type FitCell = 'fit' | 'slip' | 'none' | 'future';

/** Calendar of the last `weeks` weeks (Monday first): fit when every goal target fit that day. */
export function fitCalendar(goal: GoalConfig, events: BehaviorEvent[], checkins: OdakCheckIn[], now: Date, weeks = 13): FitCell[][] {
  const targets = targetsOf(goal);
  const perDay = new Map<string, boolean>();
  for (const t of targets) for (const d of dailyFits(t, goal.startedAt, events, now)) perDay.set(d.day, (perDay.get(d.day) ?? true) && d.fits);
  const slips = slipDays(events, checkins);
  const start = startOfDay(new Date(goal.startedAt)).getTime();
  const first = new Date(weekStart(now).getTime() - (weeks - 1) * 7 * DAY_MS);
  const out: FitCell[][] = [];
  for (let w = 0; w < weeks; w += 1) {
    const row: FitCell[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + w * 7 + i);
      const k = dayKey(d);
      if (d.getTime() > now.getTime()) row.push('future');
      else if (d.getTime() < start) row.push('none');
      else if (targets.length) row.push(perDay.get(k) === false || slips.has(k) ? 'slip' : 'fit');
      else row.push(slips.has(k) ? 'slip' : 'none');
    }
    out.push(row);
  }
  return out;
}

/** Urge moments per week (oldest first) with the average intensity. */
export function weeklyUrges(urges: UrgeEvent[], now: Date, weeks = 6): { count: number; avg: number | null }[] {
  const first = weekStart(now).getTime() - (weeks - 1) * 7 * DAY_MS;
  return Array.from({ length: weeks }, (_, i) => {
    const from = first + i * 7 * DAY_MS;
    const list = urges.filter((u) => Date.parse(u.at) >= from && Date.parse(u.at) < from + 7 * DAY_MS);
    return { count: list.length, avg: given(list).length ? Math.round((given(list).reduce((s, u) => s + u.intensityBefore, 0) / given(list).length) * 10) / 10 : null };
  });
}

/** Day × 3-hour block counts of urges and behaviours ([weekday 0–6][block 0–7]). */
export function riskyHeatmap(urges: UrgeEvent[], events: BehaviorEvent[]): number[][] {
  const m = Array.from({ length: 7 }, () => new Array<number>(8).fill(0));
  for (const at of [...urges.map((u) => u.at), ...events.map((e) => e.at)]) {
    const d = new Date(at);
    m[weekdayIndex(d)]![Math.floor(d.getHours() / 3)]! += 1;
  }
  return m;
}

export function topTriggers(urges: UrgeEvent[], events: BehaviorEvent[], n = 5): { id: OdakTriggerId; count: number }[] {
  const m = new Map<OdakTriggerId, number>();
  for (const t of [...urges.map((u) => u.trigger), ...events.map((e) => e.trigger)]) if (t) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Most frequent before → after feeling pairs of logged behaviours. */
export function emotionPairs(events: BehaviorEvent[], n = 3): { before: string; after: string; count: number }[] {
  const m = new Map<string, number>();
  for (const e of events) if (e.emotionBefore && e.emotionAfter) m.set(`${e.emotionBefore}>${e.emotionAfter}`, (m.get(`${e.emotionBefore}>${e.emotionAfter}`) ?? 0) + 1);
  return [...m.entries()]
    .map(([k, count]) => ({ before: k.split('>')[0]!, after: k.split('>')[1]!, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** BPS results with the programme day they were taken on. */
export const bpsProgress = (screenings: ScreeningResult[], goal: GoalConfig) => screenings.filter((s) => s.type === 'BPS').map((s) => ({ day: Math.max(0, programDay(goal.startedAt, new Date(s.at)) - 1), score: s.score }));

// ── Badges ─────────────────────────────────────────────────────────────────────

export const DAY_BADGES = [1, 3, 7, 14, 30, 60, 90] as const;
export const URGE_BADGES = [10, 50, 100] as const;
export const CHECKIN_STREAK = 7;
export const COMEBACK_DAYS = 7;
export const MAIN_LESSONS = 16;

export interface BadgeInput {
  goal: GoalConfig;
  events: BehaviorEvent[];
  urges: UrgeEvent[];
  checkins: OdakCheckIn[];
  plans: OdakPlan[];
  boundaries: BoundaryConfig;
  /** Ids of completed main (non-bonus) lessons. */
  mainLessonsDone: number;
  now: Date;
}

/** A run of COMEBACK_DAYS fitting days after the first slip of a target. */
function comeback(goal: GoalConfig, events: BehaviorEvent[], now: Date): boolean {
  return targetsOf(goal).some((t) => {
    const days = dailyFits(t, goal.startedAt, events, now);
    const firstSlip = days.findIndex((d) => !d.fits);
    if (firstSlip < 0) return false;
    let run = 0;
    for (const d of days.slice(firstSlip + 1)) {
      run = d.fits ? run + 1 : 0;
      if (run >= COMEBACK_DAYS) return true;
    }
    return false;
  });
}

/** Badge ids earned now, in display order. Day badges count total goal-fitting days (never reset). */
export function earnedOdakBadges(o: BadgeInput): string[] {
  const counters = goalCounters(o.goal, o.events, o.now);
  const fitDays = counters.length ? Math.min(...counters.map((c) => c.total)) : 0;
  const out = [...thresholdBadges('days', DAY_BADGES, fitDays), ...thresholdBadges('urges', URGE_BADGES, managedCount(o.urges))];
  if (o.plans.length) out.push('first-plan');
  if (boundariesSet(o.boundaries)) out.push('boundaries');
  if (longestDayStreak(o.checkins) >= CHECKIN_STREAK) out.push('checkin-7');
  if (o.mainLessonsDone >= MAIN_LESSONS) out.push('all-skills');
  if (comeback(o.goal, o.events, o.now)) out.push('comeback');
  if (programDay(programStart(o.goal), o.now) >= 90 || programDay(o.goal.startedAt, o.now) >= 90) out.push('graduate');
  return out;
}

// ── Specialist summary ─────────────────────────────────────────────────────────

export interface SummaryNumbers {
  fitTotal: number;
  longest: number;
  current: number;
  urges: number;
  managed: number;
  urgeIntensity: number | null;
  slipDays14: number;
  slipDays30: number;
  triggers: OdakTriggerId[];
  tools: string[];
  mood14: number | null;
  sleep14: number | null;
}

export function summaryNumbers(o: { goal: GoalConfig; events: BehaviorEvent[]; urges: UrgeEvent[]; checkins: OdakCheckIn[]; now: Date }): SummaryNumbers {
  const c = goalCounters(o.goal, o.events, o.now);
  const slips = [...slipDays(o.events, o.checkins)];
  const within = (days: number) => {
    const from = startOfDay(o.now).getTime() - (days - 1) * DAY_MS;
    return slips.filter((k) => {
      const [y, m, d] = k.split('-').map(Number) as [number, number, number];
      return new Date(y, m - 1, d).getTime() >= from;
    }).length;
  };
  const recent = o.checkins.filter((x) => Date.parse(x.at) >= o.now.getTime() - 14 * DAY_MS);
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null);
  return {
    fitTotal: c.length ? Math.min(...c.map((x) => x.total)) : 0,
    longest: c.length ? Math.min(...c.map((x) => x.longest)) : 0,
    current: c.length ? Math.min(...c.map((x) => x.current)) : 0,
    urges: o.urges.length,
    managed: managedCount(o.urges),
    urgeIntensity: avg(o.urges.map((u) => u.intensityBefore).filter((v) => v > 0)),
    slipDays14: within(14),
    slipDays30: within(30),
    triggers: topTriggers(o.urges, o.events, 3).map((x) => x.id),
    tools: toolEffectiveness(o.urges)
      .filter((x) => x.managed > 0)
      .slice(0, 3)
      .map((x) => x.tool),
    mood14: avg(recent.map((x) => x.mood)),
    sleep14: avg(recent.map((x) => x.sleep)),
  };
}
