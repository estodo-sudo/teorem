import { makeId } from '@/lib/random';

import { ODAK_LEGACY_TOOLS, type OdakActiveToolId, type OdakToolId, type OdakTriggerId, type UrgeEvent } from '../types';

/** Tools offered after "move first", in order (SPEC_V4 §D.2: breath first; relocation is the step before them). */
export const SOS_TOOLS: OdakToolId[] = ['breath', 'puzzle', 'move', 'values', 'futureSelf', 'supporter'];

/** A tool as statistics show it: tools removed in V4 count together as "other" ("Diğer araçlar"). */
export type OdakToolGroup = OdakActiveToolId | 'other';
export const odakToolGroup = (id: OdakToolId): OdakToolGroup => (ODAK_LEGACY_TOOLS.includes(id) ? 'other' : (id as OdakActiveToolId));
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
export function toolEffectiveness(urges: UrgeEvent[]): { tool: OdakToolGroup; used: number; managed: number; rate: number }[] {
  const m = new Map<OdakToolGroup, { used: number; managed: number }>();
  for (const u of urges)
    for (const t of new Set(u.toolsUsed.map(odakToolGroup))) {
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
    // 0 = skipped in the crisis (SPEC_V4 §C.1); left out of averages.
    intensityBefore: o.intensityBefore > 0 ? clamp10(o.intensityBefore) : 0,
    ...(o.intensityAfter ? { intensityAfter: clamp10(o.intensityAfter) } : {}),
    ...(o.trigger ? { trigger: o.trigger } : {}),
    dayy: o.dayy,
    toolsUsed: [...new Set(o.toolsUsed)],
    outcome: o.outcome,
    durationSec: Math.max(0, Math.round((o.endedAt.getTime() - o.startedAt.getTime()) / 1000)),
  };
}

/**
 * "Ne zaman / nerede?" chips (SPEC_V4 §D.3): every option is shown, the user's most frequent first
 * (counted over their urge logs), then the rest in catalogue order.
 */
export function odakTriggerOrder<T extends { id: string }>(options: T[], urges: Pick<UrgeEvent, 'trigger'>[]): T[] {
  const count = new Map<string, number>();
  for (const u of urges) if (u.trigger) count.set(u.trigger, (count.get(u.trigger) ?? 0) + 1);
  return options.map((o, i) => ({ o, i })).sort((a, b) => (count.get(b.o.id) ?? 0) - (count.get(a.o.id) ?? 0) || a.i - b.i).map((x) => x.o);
}
