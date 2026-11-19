import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from '@/stores/storage';

import { validPlan, type OdakNotifPlan } from '../engine/notifications';

interface LockState {
  /** Camp lock on (default) or off (camp privacy settings). */
  enabled: boolean;
  /** Enrolled in the camp: only then is there anything to lock (neutral flag, no content). */
  enrolled: boolean;
  /** Wrong app PINs in a row, and when the last one was (persisted so a restart does not reset the wait). */
  failures: number;
  lastFailAt: number | null;
  /** Neutral camp notifications on (default). */
  notifEnabled: boolean;
  /**
   * What the notifications need while the camp is locked: risky time ranges, the programme start and the
   * last check-in time. No content, no behaviour data (those stay in the encrypted vault).
   */
  notifPlan: OdakNotifPlan | null;
  /** Runtime only: unlocked since the app last came to the foreground. */
  unlocked: boolean;
  setEnabled: (v: boolean) => void;
  setEnrolled: (v: boolean) => void;
  setNotifEnabled: (v: boolean) => void;
  setNotifPlan: (p: OdakNotifPlan | null) => void;
  unlock: () => void;
  lock: () => void;
  pinFailed: (now?: number) => void;
  reset: () => void;
}

export const useOdakLockStore = create<LockState>()(
  persist(
    (set) => ({
      enabled: true,
      enrolled: false,
      failures: 0,
      lastFailAt: null,
      notifEnabled: true,
      notifPlan: null,
      unlocked: false,
      setEnabled: (v) => set({ enabled: v }),
      setEnrolled: (v) => set({ enrolled: v }),
      setNotifEnabled: (v) => set({ notifEnabled: v }),
      setNotifPlan: (p) => set({ notifPlan: p }),
      unlock: () => set({ unlocked: true, failures: 0, lastFailAt: null }),
      lock: () => set({ unlocked: false }),
      pinFailed: (now) => set((s) => ({ failures: s.failures + 1, lastFailAt: now ?? Date.now() })),
      reset: () => set({ enabled: true, enrolled: false, failures: 0, lastFailAt: null, notifEnabled: true, notifPlan: null, unlocked: false }),
    }),
    {
      name: 'odak-lock',
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({ enabled: s.enabled, enrolled: s.enrolled, failures: s.failures, lastFailAt: s.lastFailAt, notifEnabled: s.notifEnabled, notifPlan: s.notifPlan }),
      merge: (p, current) => {
        const v = (p ?? {}) as Partial<LockState>;
        return {
          ...current,
          enabled: typeof v.enabled === 'boolean' ? v.enabled : true,
          enrolled: v.enrolled === true,
          failures: typeof v.failures === 'number' && v.failures >= 0 ? v.failures : 0,
          lastFailAt: typeof v.lastFailAt === 'number' ? v.lastFailAt : null,
          notifEnabled: v.notifEnabled !== false,
          notifPlan: validPlan(v.notifPlan) ? v.notifPlan : null,
          unlocked: false,
        };
      },
    },
  ),
);

/**
 * Is the camp content hidden right now? Before enrolment there is nothing stored to protect (the
 * enrolment itself sets the lock up), so only an enrolled camp asks to unlock.
 */
export const isLocked = (s: Pick<LockState, 'enabled' | 'enrolled' | 'unlocked'>) => s.enabled && s.enrolled && !s.unlocked;
