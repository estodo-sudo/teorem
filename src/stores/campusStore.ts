import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  defaultSmokingState,
  nextSlipEndsAttempt,
  removeLastSymptomLog,
  sanitizeSmokingState,
  startOver,
  type SmokingCampusState,
} from '@/features/campus/smoking/logic';
import { defaultAlcState, sanitizeAlcState, type AlcMode, type AlcState } from '@/features/campus/alcohol/logic';
import { defaultBodyState, sanitizeBodyState, type BodyId, type BodyState } from '@/features/campus/body/logic';
import { defaultPcState, MAX_VALUES, sanitizePcState, type PcLapse, type PcState } from '@/features/campus/porn/logic';
import {
  BASELINE_LIMITS,
  defaultMcState,
  newAttempt,
  nextLapseEndsAttempt,
  sanitizeMcState,
  weekUsage,
  weekKeyOf,
  type BaselineId,
  type McMode,
  type McState,
  type UrgeLog,
  type WeekUsage,
} from '@/features/campus/masturbation/logic';

import { persistStorage } from './storage';

/** Campus programs with their own state (course-style campuses live in progressStore). */
export interface CampusSnapshot {
  smoking: SmokingCampusState;
  /** Mastürbasyon Bağımlılığı Kampüsü. */
  masturbation: McState;
  /** Alkol Bağımlılığı Kampüsü. */
  alcohol: AlcState;
  /** Özgür Zihin Kampüsü (pornografi). */
  porn: PcState;
  /** Dik Boyun Kampüsü (boyun düzleşmesi). */
  neck: BodyState;
  /** Güçlü Kemer Kampüsü (düz taban). */
  feet: BodyState;
}

export const defaultCampus = (): CampusSnapshot => ({ smoking: defaultSmokingState(), masturbation: defaultMcState(), alcohol: defaultAlcState(), porn: defaultPcState(), neck: defaultBodyState(), feet: defaultBodyState() });

export interface BodySetup {
  redFlagIds: string[];
  answers: Record<string, string>;
  checkDoneIds: string[];
  guideReadIds: string[];
  /** Optional first measurement taken at enrolment. */
  measure?: number | null;
}

export interface PcSetup {
  goalDays: number;
  valueIds: string[];
  activityIds: string[];
  /** Enrolment only (omitted on later edits → kept). */
  bps?: number[] | null;
  valuesConflict?: boolean | null;
  envDoneIds?: string[];
  guideReadIds?: string[];
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

export interface McSetup {
  mode: McMode;
  /** Quit path: 7, 10 or 15 days. */
  goalDays?: number;
  /** Control path: current weekly frequency (sets the weekly allowance). */
  baselineId?: BaselineId;
  reasonIds: string[];
  triggerIds: string[];
  /** Self-check answers; omitted → keep the current ones. */
  checkAnswers?: boolean[] | null;
  checkValues?: boolean | null;
  envDoneIds?: string[];
  guideReadIds?: string[];
}

export interface SmokingSetup {
  quitAt: string;
  cigsPerDay: number;
  packPrice: number;
  reasonIds: string[];
  triggerIds: string[];
  /** Guide sections shown during enrolment, recorded as read. */
  guideReadIds?: string[];
  /** Prep items checked during enrolment; omitted → keep the current ones. */
  prepDoneIds?: string[];
}

interface CampusStore extends CampusSnapshot {
  /** First setup or later edit of the plan. Keeps logs, progress and attempt count. */
  saveSmokingSetup: (setup: SmokingSetup) => void;
  togglePrep: (id: string) => void;
  logCraving: (triggerId: string | null, passed: boolean, at?: string) => void;
  /** Records a slip. The second slip of an attempt ends it and starts a new one; returns whether it did. */
  logSlip: (at?: Date) => { restarted: boolean };
  logSymptom: (symptomId: string, at?: string) => void;
  undoSymptom: (symptomId: string) => void;
  resetSmoking: () => void;
  /** First enrolment, or a plan edit: the same path keeps its start; a new path starts now. */
  saveMcSetup: (setup: McSetup) => void;
  toggleMcEnv: (id: string) => void;
  logUrge: (u: Omit<UrgeLog, 'at'> & { at?: string }) => void;
  /** Quit path: logs a lapse; the second one in an attempt starts a new attempt. */
  logLapse: (at?: Date) => { restarted: boolean };
  /** Control path: logs one use of the weekly allowance; returns the week's usage after it. */
  logUse: (at?: Date) => WeekUsage;
  /** Quit path: a new attempt starting now (e.g. after reaching the goal). */
  restartQuit: () => void;
  resetMc: () => void;
  /** First enrolment or a plan edit: the same path keeps its start; a new path starts now. */
  saveAlcSetup: (setup: AlcSetup) => void;
  logDrink: (typeId: string, std: number, at?: Date) => void;
  /** Removes the most recent drink (undo a mistaken tap). */
  undoLastDrink: () => void;
  resetAlc: () => void;
  /** First enrolment (starts now) or a plan edit (keeps the start and history). */
  savePcSetup: (setup: PcSetup) => void;
  logPcLapse: (lapse: Omit<PcLapse, 'at'> & { at?: Date }) => void;
  logPcUrge: (activityId: string | null, at?: Date) => void;
  togglePcEnv: (id: string) => void;
  resetPc: () => void;
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
    (set, get) => ({
      ...defaultCampus(),
      saveSmokingSetup: ({ guideReadIds = [], prepDoneIds, ...setup }) =>
        set((s) => ({
          smoking: {
            ...s.smoking,
            ...setup,
            stepDoneIds: Array.from(new Set([...s.smoking.stepDoneIds, ...guideReadIds])),
            setupDone: true,
            // The quit day is always set once a plan is saved.
            prepDoneIds: Array.from(new Set([...(prepDoneIds ?? s.smoking.prepDoneIds), 'date'])),
          },
        })),
      togglePrep: (id) => set((s) => ({ smoking: { ...s.smoking, prepDoneIds: toggle(s.smoking.prepDoneIds, id) } })),
      logCraving: (triggerId, passed, at) =>
        set((s) => ({ smoking: { ...s.smoking, cravings: [...s.smoking.cravings, { at: at ?? new Date().toISOString(), triggerId, passed }] } })),
      logSlip: (at) => {
        const now = at ?? new Date();
        const restarted = nextSlipEndsAttempt(get().smoking);
        set((s) => {
          const withSlip = { ...s.smoking, slips: [...s.smoking.slips, now.toISOString()] };
          return { smoking: restarted ? startOver(withSlip, now) : withSlip };
        });
        return { restarted };
      },
      logSymptom: (symptomId, at) =>
        set((s) => ({ smoking: { ...s.smoking, symptomLogs: [...s.smoking.symptomLogs, { at: at ?? new Date().toISOString(), symptomId }] } })),
      undoSymptom: (symptomId) => set((s) => ({ smoking: { ...s.smoking, symptomLogs: removeLastSymptomLog(s.smoking.symptomLogs, symptomId) } })),
      resetSmoking: () => set({ smoking: defaultSmokingState() }),
      saveMcSetup: ({ guideReadIds = [], envDoneIds, checkAnswers, checkValues, mode, goalDays, baselineId, ...setup }) =>
        set((s) => {
          const m = s.masturbation;
          const nowIso = new Date().toISOString();
          const restart = !m.startedAt || !m.setupDone || m.mode !== mode;
          return {
            masturbation: {
              ...m,
              ...setup,
              mode,
              goalDays: goalDays ?? m.goalDays,
              baselineId: baselineId ?? m.baselineId,
              weeklyLimit: baselineId ? BASELINE_LIMITS[baselineId] : m.weeklyLimit,
              setupDone: true,
              startedAt: restart ? nowIso : m.startedAt,
              firstStartedAt: m.firstStartedAt ?? nowIso,
              attempt: restart && m.mode !== mode ? 1 : m.attempt,
              checkAnswers: checkAnswers === undefined ? m.checkAnswers : checkAnswers,
              checkValues: checkValues === undefined ? m.checkValues : checkValues,
              envDoneIds: envDoneIds ?? m.envDoneIds,
              stepDoneIds: Array.from(new Set([...m.stepDoneIds, ...guideReadIds])),
            },
          };
        }),
      toggleMcEnv: (id) => set((s) => ({ masturbation: { ...s.masturbation, envDoneIds: toggle(s.masturbation.envDoneIds, id) } })),
      logUrge: ({ at, ...u }) => set((s) => ({ masturbation: { ...s.masturbation, urges: [...s.masturbation.urges, { at: at ?? new Date().toISOString(), ...u }] } })),
      logLapse: (at) => {
        const now = at ?? new Date();
        const restarted = nextLapseEndsAttempt(get().masturbation);
        set((s) => {
          const withLapse = { ...s.masturbation, lapses: [...s.masturbation.lapses, now.toISOString()] };
          return { masturbation: restarted ? newAttempt(withLapse, now) : withLapse };
        });
        return { restarted };
      },
      logUse: (at) => {
        const now = at ?? new Date();
        set((s) => ({ masturbation: { ...s.masturbation, uses: [...s.masturbation.uses, now.toISOString()] } }));
        return weekUsage(get().masturbation, weekKeyOf(now));
      },
      restartQuit: () => set((s) => ({ masturbation: newAttempt(s.masturbation, new Date()) })),
      resetMc: () => set({ masturbation: defaultMcState() }),
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
      savePcSetup: ({ guideReadIds = [], bps, valuesConflict, envDoneIds, valueIds, activityIds, goalDays }) =>
        set((s) => {
          const p = s.porn;
          const nowIso = new Date().toISOString();
          return {
            porn: {
              ...p,
              goalDays,
              valueIds: valueIds.slice(0, MAX_VALUES),
              activityIds,
              bps: bps === undefined ? p.bps : bps,
              valuesConflict: valuesConflict === undefined ? p.valuesConflict : valuesConflict,
              envDoneIds: envDoneIds ?? p.envDoneIds,
              setupDone: true,
              startedAt: p.startedAt ?? nowIso,
              firstStartedAt: p.firstStartedAt ?? nowIso,
              stepDoneIds: Array.from(new Set([...p.stepDoneIds, ...guideReadIds])),
            },
          };
        }),
      logPcLapse: ({ at, ...l }) => set((s) => ({ porn: { ...s.porn, lapses: [...s.porn.lapses, { at: (at ?? new Date()).toISOString(), ...l }] } })),
      logPcUrge: (activityId, at) => set((s) => ({ porn: { ...s.porn, urges: [...s.porn.urges, { at: (at ?? new Date()).toISOString(), activityId }] } })),
      togglePcEnv: (id) => set((s) => ({ porn: { ...s.porn, envDoneIds: toggle(s.porn.envDoneIds, id) } })),
      resetPc: () => set({ porn: defaultPcState() }),
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
        set({ smoking: sanitizeSmokingState(snap.smoking), masturbation: sanitizeMcState(snap.masturbation), alcohol: sanitizeAlcState(snap.alcohol), porn: sanitizePcState(snap.porn), neck: sanitizeBodyState(snap.neck), feet: sanitizeBodyState(snap.feet) }),
      reset: () => set(defaultCampus()),
    }),
    {
      name: 'campus',
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({ smoking: s.smoking, masturbation: s.masturbation, alcohol: s.alcohol, porn: s.porn, neck: s.neck, feet: s.feet }),
      merge: (persisted, current) => {
        const p = persisted as Partial<CampusSnapshot> | undefined;
        return {
          ...current,
          smoking: sanitizeSmokingState(p?.smoking),
          masturbation: sanitizeMcState(p?.masturbation),
          alcohol: sanitizeAlcState(p?.alcohol),
          porn: sanitizePcState(p?.porn),
          neck: sanitizeBodyState(p?.neck),
          feet: sanitizeBodyState(p?.feet),
        };
      },
    },
  ),
);
