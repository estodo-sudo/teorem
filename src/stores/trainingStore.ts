import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TrainingState } from '@/types';

import { persistStorage } from './storage';

export const defaultTraining = (): TrainingState => ({
  level: 1,
  consecutiveOk: 0,
  planDayIndex: 0,
  planNumber: 1,
  lastAdvancedDate: null,
  repeatNextDay: false,
});

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
      update: (patch) => set((s) => ({ training: { ...s.training, ...patch } })),
      replace: (training) => set({ training: { ...defaultTraining(), ...training } }),
      reset: () => set({ training: defaultTraining() }),
    }),
    { name: 'training', storage: persistStorage, version: 1 },
  ),
);
