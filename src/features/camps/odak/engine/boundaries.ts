import { dayKey } from '@/features/camps/core/time';

import type { BoundaryConfig, TimeRange } from '../types';

/**
 * Digital boundaries (pure). The phone's own tools do the filtering (iOS Screen Time, Android Digital
 * Wellbeing); the camp keeps a checklist and, on Android, a gentle reminder when a chosen app comes to
 * the foreground during one of the user's risky hours (checked about every 15 minutes in the background).
 */
export const defaultBoundaries = (): BoundaryConfig => ({ iosWebFilter: false, androidWellbeing: false, checklist: [], reminder: { enabled: false, packages: [] } });

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
};

/** Is `d` inside the range? Ranges may cross midnight (23:00–01:00). The end is exclusive. */
export function inRange(r: TimeRange, d: Date): boolean {
  const t = d.getHours() * 60 + d.getMinutes();
  const a = minutes(r.from);
  const b = minutes(r.to);
  return a <= b ? t >= a && t < b : t >= a || t < b;
}

export const riskyRangeAt = (ranges: TimeRange[], d: Date) => ranges.find((r) => inRange(r, d)) ?? null;

/** One reminder per range per day: the key a sent reminder is remembered by. */
export function reminderKey(r: TimeRange, d: Date): string {
  // A range crossing midnight belongs to the day it started.
  const start = minutes(r.from);
  const t = d.getHours() * 60 + d.getMinutes();
  const day = minutes(r.from) > minutes(r.to) && t < start ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1) : d;
  return `${dayKey(day)}@${r.from}`;
}

/**
 * Should a reminder go out now? `events` are foreground app events since the last check. Returns the
 * key to remember, or null (no chosen app opened in a risky hour, or already reminded for that range).
 */
export function reminderDue(o: { events: { packageName: string; at: number }[]; packages: string[]; ranges: TimeRange[]; sentKeys: string[] }): string | null {
  for (const e of [...o.events].sort((a, b) => a.at - b.at)) {
    if (!o.packages.includes(e.packageName)) continue;
    const d = new Date(e.at);
    const r = riskyRangeAt(o.ranges, d);
    if (!r) continue;
    const k = reminderKey(r, d);
    if (!o.sentKeys.includes(k)) return k;
  }
  return null;
}

/** Keep only the last week of sent keys. */
export const pruneKeys = (keys: string[], now: Date) => keys.filter((k) => Date.parse(k.slice(0, 10)) >= now.getTime() - 8 * 86_400_000);

/** "Dijital sınırları kurdu" (badge in O11): the phone filter or the reminder is set up. */
export const boundariesSet = (b: BoundaryConfig) => b.iosWebFilter || b.androidWellbeing || (b.reminder.enabled && b.reminder.packages.length > 0);

export const toggleItem = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
