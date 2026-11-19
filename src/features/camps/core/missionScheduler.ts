/** A daily mission of any camp: set for a day of a phase. */
export interface MissionRef<P extends string = string> {
  id: string;
  phase: P;
  day: number;
}

/**
 * Today's mission: the one set for this exact day of the phase; otherwise (in phases with missions
 * only on some days) the latest earlier mission of the same phase that is still open. Phases that count
 * down (`countdown`, e.g. preparation) never catch up.
 */
export function missionForDay<M extends MissionRef>(missions: M[], phase: M['phase'], day: number, completedIds: string[], countdown: readonly string[] = []): M | null {
  const own = missions.filter((m) => m.phase === phase);
  const exact = own.find((m) => m.day === day);
  if (exact) return exact;
  if (countdown.includes(phase)) return null;
  const open = own.filter((m) => m.day < day && !completedIds.includes(m.id)).sort((a, b) => b.day - a.day);
  return open[0] ?? null;
}
