import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { defaultTraining, migrateTraining } from '@/features/training/plan';
import type { TrainingState } from '@/types';

import { persistStorage } from './storage';

export { defaultTraining };

interface TrainingStore {
  training: TrainingState;
  update: (patch: Partial<TrainingState>) => void;
  replace: (t: TrainingState) => void;
  reset: () => void;
}

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set) => ({
      training: defaultTraining(),
      update: (patch) => set((s) => ({ training: migrateTraining({ ...s.training, ...patch }) })),
      replace: (training) => set({ training: migrateTraining(training) }),
      reset: () => set({ training: defaultTraining() }),
    }),
    {
      name: 'training',
      storage: persistStorage,
      // v2 (Kegel v2): level and plan position kept, new fields get defaults.
      version: 2,
      migrate: (persisted) => ({ training: migrateTraining(persisted && typeof persisted === 'object' ? (persisted as { training?: unknown }).training : undefined) }),
      merge: (persisted, current) => ({ ...current, training: migrateTraining((persisted as { training?: unknown } | undefined)?.training) }),
    },
  ),
);
