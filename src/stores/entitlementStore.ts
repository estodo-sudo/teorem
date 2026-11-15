import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Entitlement } from '@/types';

import { persistStorage } from './storage';

interface EntitlementStore {
  entitlement: Entitlement;
  set: (e: Entitlement) => void;
  reset: () => void;
}

export const useEntitlementStore = create<EntitlementStore>()(
  persist(
    (set) => ({
      entitlement: { active: false },
      set: (entitlement) => set({ entitlement }),
      reset: () => set({ entitlement: { active: false } }),
    }),
    { name: 'entitlement', storage: persistStorage, version: 1 },
  ),
);
