import { DAY_MS, dayKey } from '@/features/camps/core/time';

import type { BehaviorEvent, EmotionId, OdakTriggerId, UrgeEvent } from '../types';

import { toolEffectiveness, type OdakToolGroup } from './sos';

/**
 * Self-monitoring (SPEC_ODAK_KAMPI 5.4). Pure helpers for the diary list and the weekly summary:
 * riskiest hour / weekday, most frequent situation, the tool that helped most and the usual
 * before → after feeling. For awareness only; never a score.
 */
export const SUMMARY_MIN = 3;
export const WEEK_DAYS = 7;

export type DiaryEntry = { type: 'urge'; at: string; urge: UrgeEvent } | { type: 'behavior'; at: string; behavior: BehaviorEvent };

/** Urges and behaviours together, newest first. */
export const diaryEntries = (urges: UrgeEvent[], events: BehaviorEvent[]): DiaryEntry[] =>
  [...urges.map((u) => ({ type: 'urge' as const, at: u.at, urge: u })), ...events.map((b) => ({ type: 'behavior' as const, at: b.at, behavior: b }))].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

/** Entries grouped by local calendar day, newest day first. */
export function byDay(entries: DiaryEntry[]): { day: string; entries: DiaryEntry[] }[] {
  const m = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    const k = dayKey(new Date(e.at));
    m.set(k, [...(m.get(k) ?? []), e]);
  }
  return [...m.entries()].map(([day, list]) => ({ day, entries: list }));
}

const top = <K>(items: K[]): K | null => {
  const m = new Map<K, number>();
  for (const k of items) m.set(k, (m.get(k) ?? 0) + 1);
  let best: K | null = null;
  let n = 0;
  for (const [k, v] of m) if (v > n) [best, n] = [k, v];
  return best;
};

/** Monday-first weekday index (0 = Pazartesi … 6 = Pazar). */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export interface WeeklySummary {
  urges: number;
  managed: number;
  behaviors: number;
  enough: boolean;
  riskyHour: number | null;
  riskyDay: number | null;
  topTrigger: OdakTriggerId | null;
  bestTool: OdakToolGroup | null;
  emotionBefore: EmotionId | null;
  emotionAfter: EmotionId | null;
  avgSatisfaction: number | null;
}

/** Summary of the last 7 days (rolling, ending now). */
export function weeklySummary(urges: UrgeEvent[], events: BehaviorEvent[], now: Date): WeeklySummary {
  const from = now.getTime() - WEEK_DAYS * DAY_MS;
  const inWeek = (at: string) => Date.parse(at) > from && Date.parse(at) <= now.getTime();
  const u = urges.filter((x) => inWeek(x.at));
  const b = events.filter((x) => inWeek(x.at));
  const moments = [...u.map((x) => x.at), ...b.map((x) => x.at)].map((at) => new Date(at));
  const sat = b.map((x) => x.satisfaction).filter((x): x is NonNullable<typeof x> => typeof x === 'number');
  const best = toolEffectiveness(u).find((x) => x.managed > 0);
  return {
    urges: u.length,
    managed: u.filter((x) => x.outcome === 'managed').length,
    behaviors: b.length,
    enough: u.length + b.length >= SUMMARY_MIN,
    riskyHour: top(moments.map((d) => d.getHours())),
    riskyDay: top(moments.map(weekdayIndex)),
    topTrigger: top([...u.map((x) => x.trigger), ...b.map((x) => x.trigger)].filter((x): x is OdakTriggerId => !!x)),
    bestTool: best?.tool ?? null,
    emotionBefore: top(b.map((x) => x.emotionBefore).filter((x): x is EmotionId => !!x)),
    emotionAfter: top(b.map((x) => x.emotionAfter).filter((x): x is EmotionId => !!x)),
    avgSatisfaction: sat.length ? Math.round((sat.reduce((s, x) => s + x, 0) / sat.length) * 10) / 10 : null,
  };
}

export const hourRange = (h: number) => `${String(h).padStart(2, '0')}:00–${String((h + 1) % 24).padStart(2, '0')}:00`;
