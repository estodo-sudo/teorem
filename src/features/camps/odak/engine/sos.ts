import { makeId } from '@/lib/random';

import type { OdakToolId, OdakTriggerId, UrgeEvent } from '../types';

/** Tools offered after "move first", in order (relocation is the step before them). */
export const SOS_TOOLS: OdakToolId[] = ['surf', 'breath', 'move', 'values', 'futureSelf', 'supporter'];
export const LETTER_MAX = 2000;

export type Dayy = UrgeEvent['dayy'];
export const noDayy = (): Dayy => ({ tired: false, hungry: false, lonely: false, loaded: false });
export const dayyCount = (d: Dayy) => Object.values(d).filter(Boolean).length;

/** Urge moments ridden out ("Bu güne kadar N dürtü anını yönettin"). A slip never lowers it. */
export const managedCount = (urges: UrgeEvent[]) => urges.filter((u) => u.outcome === 'managed').length;

/** "Still hard": the next tool not tried yet in this moment (first tool again when all were tried). */
export function nextTool(used: OdakToolId[], all: OdakToolId[] = SOS_TOOLS): OdakToolId {
  return all.find((t) => !used.includes(t)) ?? all[0]!;
}

/** How often each tool was part of a managed moment, most effective first (ties by use). */
export function toolEffectiveness(urges: UrgeEvent[]): { tool: OdakToolId; used: number; managed: number; rate: number }[] {
  const m = new Map<OdakToolId, { used: number; managed: number }>();
  for (const u of urges)
    for (const t of new Set(u.toolsUsed)) {
      const v = m.get(t) ?? { used: 0, managed: 0 };
      v.used += 1;
      if (u.outcome === 'managed') v.managed += 1;
      m.set(t, v);
    }
  return [...m.entries()].map(([tool, v]) => ({ tool, ...v, rate: v.managed / v.used })).sort((a, b) => b.rate - a.rate || b.used - a.used);
}

const clamp10 = (v: number) => Math.min(10, Math.max(1, Math.round(v)));

export function buildUrge(o: { startedAt: Date; endedAt: Date; intensityBefore: number; intensityAfter?: number | null; dayy: Dayy; toolsUsed: OdakToolId[]; outcome: UrgeEvent['outcome']; trigger?: OdakTriggerId | null }): UrgeEvent {
  return {
    id: makeId('urge'),
    at: o.startedAt.toISOString(),
    intensityBefore: clamp10(o.intensityBefore),
    ...(o.intensityAfter ? { intensityAfter: clamp10(o.intensityAfter) } : {}),
    ...(o.trigger ? { trigger: o.trigger } : {}),
    dayy: o.dayy,
    toolsUsed: [...new Set(o.toolsUsed)],
    outcome: o.outcome,
    durationSec: Math.max(0, Math.round((o.endedAt.getTime() - o.startedAt.getTime()) / 1000)),
  };
}
