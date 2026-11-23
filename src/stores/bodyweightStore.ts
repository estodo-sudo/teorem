import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CategoryId, ProgramId, ProgramProgress } from '@/features/bodyweight/program';

import { persistStorage } from './storage';

/** Aletsiz Fitness progress: one active programme per category (local only). */
interface BodyweightStore {
  active: Partial<Record<CategoryId, ProgramProgress>>;
  start: (category: CategoryId, program: ProgramId, today: string) => void;
  completeDay: (category: CategoryId, day: number, today: string) => void;
  stop: (category: CategoryId) => void;
  reset: () => void;
}

const isDateKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Drops anything malformed from stored progress. */
export function sanitizeProgress(raw: unknown): Partial<Record<CategoryId, ProgramProgress>> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Partial<Record<CategoryId, ProgramProgress>> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    if (!['toparla', 'gelistir', 'guclendir'].includes(r.programId as string) || !isDateKey(r.startedAt)) continue;
    const done: Record<number, string> = {};
    if (r.done && typeof r.done === 'object') for (const [d, at] of Object.entries(r.done as Record<string, unknown>)) if (Number(d) > 0 && isDateKey(at)) done[Number(d)] = at;
    out[k as CategoryId] = { programId: r.programId as ProgramId, startedAt: r.startedAt, done };
  }
  return out;
}

export const useBodyweightStore = create<BodyweightStore>()(
  persist(
    (set) => ({
      active: {},
      start: (category, program, today) => set((s) => ({ active: { ...s.active, [category]: { programId: program, startedAt: today, done: {} } } })),
      completeDay: (category, day, today) =>
        set((s) => {
          const cur = s.active[category];
          if (!cur) return s;
          return { active: { ...s.active, [category]: { ...cur, done: { ...cur.done, [day]: today } } } };
        }),
      stop: (category) =>
        set((s) => {
          const next = { ...s.active };
          delete next[category];
          return { active: next };
        }),
      reset: () => set({ active: {} }),
    }),
    {
      name: 'bodyweight',
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({ active: s.active }),
      merge: (persisted, current) => ({ ...current, active: sanitizeProgress((persisted as { active?: unknown } | undefined)?.active) }),
    },
  ),
);
