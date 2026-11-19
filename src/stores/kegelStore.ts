import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { makeId } from '@/lib/random';
import type { FunctionalTask, KegelProfile, PainReport, SelfRating, TrackId } from '@/types';

import { persistStorage } from './storage';

/** Kegel v2 data (SPEC_KEGEL_V2 §14): muscle profile, pain reports, self ratings, functional tasks. */
export interface KegelData {
  profile: KegelProfile | null;
  painReports: PainReport[];
  selfRatings: SelfRating[];
  functionalTasks: FunctionalTask[];
  /** "My doctor approved" for the prostate surgery track (spec §3, §11.3). Kept apart from the screening. */
  surgeryClearance: { confirmedAt: string } | null;
  /** The user skipped the muscle profile screening (asked once; can be done later from settings). */
  screeningSkippedAt: string | null;
}

export const defaultKegelData = (): KegelData => ({ profile: null, painReports: [], selfRatings: [], functionalTasks: [], surgeryClearance: null, screeningSkippedAt: null });

const TRACKS: TrackId[] = ['general', 'erection', 'control', 'bladder', 'surgery', 'relax'];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/** Keeps only well-formed entries (stored state or an imported backup). */
export function sanitizeKegelData(raw: unknown): KegelData {
  if (!isObj(raw)) return defaultKegelData();
  const p = raw.profile;
  const profile: KegelProfile | null =
    isObj(p) && TRACKS.includes(p.primaryTrack as TrackId) && Array.isArray(p.screeningAnswers) && str(p.screenedAt)
      ? {
          primaryTrack: p.primaryTrack as TrackId,
          hypertonicFlag: p.hypertonicFlag === true,
          painFlag: p.painFlag === true,
          screeningAnswers: (p.screeningAnswers as unknown[]).map((a) => a === true),
          screenedAt: p.screenedAt,
        }
      : null;
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : []);
  return {
    profile,
    painReports: arr(raw.painReports)
      .filter((r) => str(r.id) && str(r.at))
      .map((r) => ({ id: r.id as string, at: r.at as string, ...(str(r.sessionId) ? { sessionId: r.sessionId } : {}), ...(str(r.note) ? { note: r.note } : {}) })),
    selfRatings: arr(raw.selfRatings)
      .filter((r) => str(r.id) && str(r.at) && TRACKS.includes(r.track as TrackId) && isObj(r.answers))
      .map((r) => ({
        id: r.id as string,
        at: r.at as string,
        track: r.track as TrackId,
        answers: Object.fromEntries(Object.entries(r.answers as Record<string, unknown>).filter(([, n]) => typeof n === 'number' && n >= 0 && n <= 10)) as Record<string, number>,
      })),
    functionalTasks: arr(raw.functionalTasks)
      .filter((r) => str(r.id) && str(r.date) && str(r.taskId))
      .map((r) => ({ id: r.id as string, date: r.date as string, taskId: r.taskId as string, done: r.done === true })),
    surgeryClearance: isObj(raw.surgeryClearance) && str(raw.surgeryClearance.confirmedAt) ? { confirmedAt: raw.surgeryClearance.confirmedAt } : null,
    screeningSkippedAt: str(raw.screeningSkippedAt) ? raw.screeningSkippedAt : null,
  };
}

interface KegelStore extends KegelData {
  setProfile: (p: KegelProfile) => void;
  addPainReport: (r: Omit<PainReport, 'id' | 'at'> & { at?: string }) => PainReport;
  addSelfRating: (r: Omit<SelfRating, 'id' | 'at'> & { at?: string }) => void;
  setFunctionalTask: (date: string, taskId: string, done: boolean) => void;
  setSurgeryClearance: (c: { confirmedAt: string } | null) => void;
  skipScreening: (at: string) => void;
  replace: (d: KegelData) => void;
  reset: () => void;
}

export const useKegelStore = create<KegelStore>()(
  persist(
    (set) => ({
      ...defaultKegelData(),
      setProfile: (profile) => set({ profile }),
      addPainReport: ({ at, ...rest }) => {
        const r: PainReport = { id: makeId('pain_'), at: at ?? new Date().toISOString(), ...rest };
        set((s) => ({ painReports: [...s.painReports, r] }));
        return r;
      },
      addSelfRating: ({ at, ...rest }) => set((s) => ({ selfRatings: [...s.selfRatings, { id: makeId('sr_'), at: at ?? new Date().toISOString(), ...rest }] })),
      setFunctionalTask: (date, taskId, done) =>
        set((s) => {
          const others = s.functionalTasks.filter((t) => !(t.date === date && t.taskId === taskId));
          return { functionalTasks: [...others, { id: `${date}_${taskId}`, date, taskId, done }] };
        }),
      setSurgeryClearance: (surgeryClearance) => set({ surgeryClearance }),
      skipScreening: (at) => set({ screeningSkippedAt: at }),
      replace: (d) => set(sanitizeKegelData(d)),
      reset: () => set(defaultKegelData()),
    }),
    {
      name: 'kegel',
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({ profile: s.profile, painReports: s.painReports, selfRatings: s.selfRatings, functionalTasks: s.functionalTasks, surgeryClearance: s.surgeryClearance, screeningSkippedAt: s.screeningSkippedAt }),
      merge: (persisted, current) => ({ ...current, ...sanitizeKegelData(persisted) }),
    },
  ),
);

export const kegelSnapshot = (): KegelData => {
  const s = useKegelStore.getState();
  return { profile: s.profile, painReports: s.painReports, selfRatings: s.selfRatings, functionalTasks: s.functionalTasks, surgeryClearance: s.surgeryClearance, screeningSkippedAt: s.screeningSkippedAt };
};
