import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { deepClone } from '@/lib/clone';
import { makeId } from '@/lib/random';
import { createMemoryCampRepo, type CampRepo } from '@/features/camps/smoking/repo';
import { activateIfDue, currentAttempt, defaultCampState, emptyCampEvents, endAsRelapse, graduate, newAttempt, quitNow, sanitizeCampState, type CampState } from '@/features/camps/smoking/state';
import type { CampEvents, CampProfile, CheckIn, CigaretteLog, CravingEvent, IfThenPlan, PriceEntry, RewardGoal } from '@/features/camps/smoking/types';

import { persistStorage } from './storage';

// ── Small persisted state (profile, prices, attempts, plans, progress) ─────────────

interface CampStore extends CampState {
  /** Finishes the assessment: profile, first price and the first attempt. */
  enrol: (profile: CampProfile, price: Omit<PriceEntry, 'from'>, attempt: { plannedQuitDate: string; quitAt?: string }) => void;
  /** New pack price from now on (older periods keep their price). */
  updatePrice: (price: Omit<PriceEntry, 'from'>, at?: Date) => void;
  /** Moves a preparing attempt to active when its quit day has started. */
  refreshAttempt: (now?: Date) => void;
  quitEarly: (now?: Date) => void;
  changeQuitDate: (plannedQuitDate: string) => void;
  /** Relapse: closes the attempt and starts a new one with a short preparation. */
  relapse: (plannedQuitDate: string, now?: Date) => void;
  graduate: (now?: Date) => void;
  addPlan: (p: Omit<IfThenPlan, 'id' | 'createdAt' | 'usedCount'>) => void;
  removePlan: (id: string) => void;
  usePlan: (id: string) => void;
  completeMission: (missionId: string, at?: Date) => void;
  completeSkill: (lessonId: string, quizScore?: number, at?: Date) => void;
  addReward: (title: string, amountTRY: number) => void;
  removeReward: (id: string) => void;
  markReward: (id: string, at?: Date) => void;
  unlockBadge: (id: string, at?: Date) => void;
  markMilestonesSeen: (ids: string[]) => void;
  setNotifyEnabled: (on: boolean) => void;
  /** Ticks an item of the quit-day checklist for this attempt. */
  toggleQuitDayCheck: (attemptId: string, id: string) => void;
  replace: (s: CampState) => void;
  reset: () => void;
}

export const useCampStore = create<CampStore>()(
  persist(
    (set, get) => ({
      ...defaultCampState(),
      enrol: (profile, price, attempt) => {
        const now = new Date();
        set((s) => ({
          profile,
          prices: [...s.prices, { ...price, from: now.toISOString() }],
          attempts: [...s.attempts.map((a) => (a.status === 'preparing' || a.status === 'active' ? endAsRelapse(a, now) : a)), newAttempt(s.attempts, attempt, now)],
        }));
      },
      updatePrice: (price, at) => set((s) => ({ prices: [...s.prices, { ...price, from: (at ?? new Date()).toISOString() }] })),
      refreshAttempt: (now = new Date()) => {
        const a = currentAttempt(get());
        if (!a) return;
        const next = activateIfDue(a, now);
        if (next !== a) set((s) => ({ attempts: s.attempts.map((x) => (x.id === a.id ? next : x)) }));
      },
      quitEarly: (now = new Date()) => set((s) => ({ attempts: s.attempts.map((x) => (x.status === 'preparing' ? quitNow(x, now) : x)) })),
      changeQuitDate: (plannedQuitDate) => set((s) => ({ attempts: s.attempts.map((x) => (x.status === 'preparing' ? { ...x, plannedQuitDate } : x)) })),
      relapse: (plannedQuitDate, now = new Date()) =>
        set((s) => {
          const closed = s.attempts.map((x) => (x.status === 'preparing' || x.status === 'active' ? endAsRelapse(x, now) : x));
          return { attempts: [...closed, newAttempt(closed, { plannedQuitDate }, now)] };
        }),
      graduate: (now = new Date()) => set((s) => ({ attempts: s.attempts.map((x) => (x.status === 'active' ? graduate(x, now) : x)) })),
      addPlan: (p) => set((s) => ({ plans: [...s.plans, { ...p, id: makeId('plan'), createdAt: new Date().toISOString(), usedCount: 0 }] })),
      removePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      usePlan: (id) => set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, usedCount: p.usedCount + 1 } : p)) })),
      completeMission: (missionId, at) => set((s) => (s.missions.some((m) => m.missionId === missionId) ? s : { missions: [...s.missions, { missionId, completedAt: (at ?? new Date()).toISOString() }] })),
      completeSkill: (lessonId, quizScore, at) => set((s) => ({ skills: [...s.skills.filter((k) => k.lessonId !== lessonId), { lessonId, completedAt: (at ?? new Date()).toISOString(), quizScore }] })),
      addReward: (title, amountTRY) => set((s) => ({ rewards: [...s.rewards, { id: makeId('rw'), title, amountTRY } satisfies RewardGoal] })),
      removeReward: (id) => set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })),
      markReward: (id, at) => set((s) => ({ rewards: s.rewards.map((r) => (r.id === id && !r.reachedAt ? { ...r, reachedAt: (at ?? new Date()).toISOString() } : r)) })),
      unlockBadge: (id, at) => set((s) => (s.badges.some((b) => b.id === id && b.unlockedAt) ? s : { badges: [...s.badges.filter((b) => b.id !== id), { id, unlockedAt: (at ?? new Date()).toISOString() }] })),
      markMilestonesSeen: (ids) => set((s) => ({ seenMilestoneIds: Array.from(new Set([...s.seenMilestoneIds, ...ids])) })),
      toggleQuitDayCheck: (attemptId, id) =>
        set((s) => {
          const ids = s.quitDayChecks?.attemptId === attemptId ? s.quitDayChecks.ids : [];
          return { quitDayChecks: { attemptId, ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] } };
        }),
      setNotifyEnabled: (on) => set({ notifyEnabled: on }),
      replace: (snap) => set(sanitizeCampState(snap)),
      reset: () => set(defaultCampState()),
    }),
    {
      name: 'camp',
      storage: persistStorage,
      version: 1,
      partialize: (s): CampState => ({
        profile: s.profile,
        prices: s.prices,
        attempts: s.attempts,
        plans: s.plans,
        missions: s.missions,
        skills: s.skills,
        rewards: s.rewards,
        badges: s.badges,
        seenMilestoneIds: s.seenMilestoneIds,
        quitDayChecks: s.quitDayChecks,
        notifyEnabled: s.notifyEnabled,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeCampState(persisted) }),
    },
  ),
);

/** Snapshot of the persisted part (export / tests). */
export const campSnapshot = (): CampState => {
  const s = useCampStore.getState();
  return {
    profile: s.profile,
    prices: s.prices,
    attempts: s.attempts,
    plans: s.plans,
    missions: s.missions,
    skills: s.skills,
    rewards: s.rewards,
    badges: s.badges,
    seenMilestoneIds: s.seenMilestoneIds,
    quitDayChecks: s.quitDayChecks,
    notifyEnabled: s.notifyEnabled,
  };
};

// ── Event logs (SQLite) ──────────────────────────────────────────────────────────

let repo: CampRepo | null = null;

function getRepo(): CampRepo {
  if (!repo && Platform.OS === 'web') repo = createMemoryCampRepo(); // web is a development preview only
  if (!repo) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSqliteCampRepo } = require('@/features/camps/smoking/db') as typeof import('@/features/camps/smoking/db');
    try {
      const sqlite = createSqliteCampRepo();
      sqlite.loadAll(); // opens + migrates; throws if SQLite is unusable
      repo = sqlite;
    } catch {
      console.warn('[camp] SQLite unavailable; camp logs kept in memory.');
      repo = createMemoryCampRepo();
    }
  }
  return repo;
}

/** Test hook: swap in an in-memory repo. */
export function setCampRepo(r: CampRepo) {
  repo = r;
}

interface CampEventsStore extends CampEvents {
  loaded: boolean;
  load: () => void;
  logCigarette: (l: Omit<CigaretteLog, 'id' | 'at'> & { at?: string }) => CigaretteLog;
  /** Undo a mistaken cigarette entry. */
  removeCigarette: (id: string) => void;
  logCraving: (c: Omit<CravingEvent, 'id' | 'at'> & { at?: string }) => CravingEvent;
  logCheckin: (c: Omit<CheckIn, 'id' | 'at'> & { at?: string }) => CheckIn;
  clearAll: () => void;
  replaceAll: (d: CampEvents) => void;
}

const byAt = <T extends { at: string }>(a: T, b: T) => Date.parse(a.at) - Date.parse(b.at);

export const useCampEventsStore = create<CampEventsStore>()((set, get) => ({
  ...emptyCampEvents(),
  loaded: false,
  load: () => {
    if (get().loaded) return;
    set({ ...getRepo().loadAll(), loaded: true });
  },
  logCigarette: ({ at, ...rest }) => {
    const l: CigaretteLog = { ...rest, id: makeId('cig'), at: at ?? new Date().toISOString() };
    getRepo().insertCigarette(l);
    set((s) => ({ cigarettes: [...s.cigarettes, l].sort(byAt) }));
    return l;
  },
  removeCigarette: (id) => {
    getRepo().deleteCigarette(id);
    set((s) => ({ cigarettes: s.cigarettes.filter((l) => l.id !== id) }));
  },
  logCraving: ({ at, ...rest }) => {
    const c: CravingEvent = { ...rest, id: makeId('crv'), at: at ?? new Date().toISOString() };
    getRepo().insertCraving(c);
    set((s) => ({ cravings: [...s.cravings, c].sort(byAt) }));
    return c;
  },
  logCheckin: ({ at, ...rest }) => {
    const c: CheckIn = { ...rest, id: makeId('chk'), at: at ?? new Date().toISOString() };
    getRepo().insertCheckin(c);
    set((s) => ({ checkins: [...s.checkins, c].sort(byAt) }));
    return c;
  },
  clearAll: () => {
    getRepo().clearAll();
    set({ ...emptyCampEvents(), loaded: true });
  },
  replaceAll: (d) => {
    getRepo().replaceAll(d);
    set({ ...deepClone(d), loaded: true });
  },
}));

/** Current event logs (export / tests). */
export const campEventsSnapshot = (): CampEvents => {
  const s = useCampEventsStore.getState();
  return { cigarettes: s.cigarettes, cravings: s.cravings, checkins: s.checkins };
};
