import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { defaultAlcState, sanitizeAlcState, type AlcMode, type AlcState } from '@/features/campus/alcohol/logic';
import { defaultBodyState, sanitizeBodyState, type BodyId, type BodyState } from '@/features/campus/body/logic';

import { persistStorage } from './storage';

/** Campus programs with their own state (course-style campuses live in progressStore). */
export interface CampusSnapshot {
  /** Alkol Bağımlılığı Kampüsü. */
  alcohol: AlcState;
  /** Dik Boyun Kampüsü (boyun düzleşmesi). */
  neck: BodyState;
  /** Güçlü Kemer Kampüsü (düz taban). */
  feet: BodyState;
}

export const defaultCampus = (): CampusSnapshot => ({ alcohol: defaultAlcState(), neck: defaultBodyState(), feet: defaultBodyState() });

export interface BodySetup {
  redFlagIds: string[];
  answers: Record<string, string>;
  checkDoneIds: string[];
  guideReadIds: string[];
  /** Optional first measurement taken at enrolment. */
  measure?: number | null;
}

export interface AlcSetup {
  mode: AlcMode;
  weeklyLimit?: number;
  quitGoalDays?: number;
  reasonIds: string[];
  triggerIds: string[];
  /** Enrolment only (omitted on later edits → kept). */
  audit?: number[] | null;
  withdrawal?: boolean[] | null;
  guideReadIds?: string[];
}

interface CampusStore extends CampusSnapshot {
  /** First enrolment or a plan edit: the same path keeps its start; a new path starts now. */
  saveAlcSetup: (setup: AlcSetup) => void;
  logDrink: (typeId: string, std: number, at?: Date) => void;
  /** Removes the most recent drink (undo a mistaken tap). */
  undoLastDrink: () => void;
  resetAlc: () => void;
  /** Exercise campuses (neck / feet): enrolment starts the 8-week programme now. */
  saveBodySetup: (id: BodyId, setup: BodySetup) => void;
  logBodySession: (id: BodyId, done: number, total: number, at?: Date) => void;
  logBodyMeasure: (id: BodyId, value: number, at?: Date) => void;
  /** Removes the most recent measurement (undo a mistaken entry). */
  undoBodyMeasure: (id: BodyId) => void;
  toggleBodyCheck: (id: BodyId, itemId: string) => void;
  resetBody: (id: BodyId) => void;
  replace: (s: CampusSnapshot) => void;
  reset: () => void;
}

const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

export const useCampusStore = create<CampusStore>()(
  persist(
    (set) => ({
      ...defaultCampus(),
      saveAlcSetup: ({ guideReadIds = [], audit, withdrawal, mode, weeklyLimit, quitGoalDays, ...setup }) =>
        set((s) => {
          const a = s.alcohol;
          const nowIso = new Date().toISOString();
          const restart = !a.startedAt || !a.setupDone || a.mode !== mode;
          return {
            alcohol: {
              ...a,
              ...setup,
              mode,
              weeklyLimit: weeklyLimit ?? a.weeklyLimit,
              quitGoalDays: quitGoalDays ?? a.quitGoalDays,
              audit: audit === undefined ? a.audit : audit,
              withdrawal: withdrawal === undefined ? a.withdrawal : withdrawal,
              setupDone: true,
              startedAt: restart ? nowIso : a.startedAt,
              firstStartedAt: a.firstStartedAt ?? nowIso,
              stepDoneIds: Array.from(new Set([...a.stepDoneIds, ...guideReadIds])),
            },
          };
        }),
      logDrink: (typeId, std, at) => set((s) => ({ alcohol: { ...s.alcohol, drinks: [...s.alcohol.drinks, { at: (at ?? new Date()).toISOString(), typeId, std }] } })),
      undoLastDrink: () => set((s) => ({ alcohol: { ...s.alcohol, drinks: s.alcohol.drinks.slice(0, -1) } })),
      resetAlc: () => set({ alcohol: defaultAlcState() }),
      saveBodySetup: (id, { redFlagIds, answers, checkDoneIds, guideReadIds, measure }) =>
        set((s) => {
          const b = s[id];
          const now = new Date().toISOString();
          return {
            [id]: {
              ...b,
              setupDone: true,
              startedAt: b.startedAt ?? now,
              firstStartedAt: b.firstStartedAt ?? now,
              redFlagIds,
              answers,
              checkDoneIds,
              stepDoneIds: Array.from(new Set([...b.stepDoneIds, ...guideReadIds])),
              measures: measure === null || measure === undefined ? b.measures : [...b.measures, { at: now, value: measure }],
            },
          } as Pick<CampusSnapshot, BodyId>;
        }),
      logBodySession: (id, done, total, at) =>
        set((s) => ({ [id]: { ...s[id], sessions: [...s[id].sessions, { at: (at ?? new Date()).toISOString(), done, total }] } }) as Pick<CampusSnapshot, BodyId>),
      logBodyMeasure: (id, value, at) =>
        set((s) => ({ [id]: { ...s[id], measures: [...s[id].measures, { at: (at ?? new Date()).toISOString(), value }] } }) as Pick<CampusSnapshot, BodyId>),
      undoBodyMeasure: (id) => set((s) => ({ [id]: { ...s[id], measures: s[id].measures.slice(0, -1) } }) as Pick<CampusSnapshot, BodyId>),
      toggleBodyCheck: (id, itemId) => set((s) => ({ [id]: { ...s[id], checkDoneIds: toggle(s[id].checkDoneIds, itemId) } }) as Pick<CampusSnapshot, BodyId>),
      resetBody: (id) => set({ [id]: defaultBodyState() } as Pick<CampusSnapshot, BodyId>),
      replace: (snap) =>
        set({ alcohol: sanitizeAlcState(snap.alcohol), neck: sanitizeBodyState(snap.neck), feet: sanitizeBodyState(snap.feet) }),
      reset: () => set(defaultCampus()),
    }),
    {
      name: 'campus',
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({ alcohol: s.alcohol, neck: s.neck, feet: s.feet }),
      merge: (persisted, current) => {
        const p = persisted as Partial<CampusSnapshot> | undefined;
        return {
          ...current,
          alcohol: sanitizeAlcState(p?.alcohol),
          neck: sanitizeBodyState(p?.neck),
          feet: sanitizeBodyState(p?.feet),
        };
      },
    },
  ),
);
