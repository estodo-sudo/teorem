import { Platform } from 'react-native';
import { create } from 'zustand';

import { createMemoryRepo, emptyHistory, type HistoryData, type HistoryRepo } from '@/features/data/repo';
import type { FitnessLog, ProgressNote, StrengthTest, WorkoutSession } from '@/types';

let repo: HistoryRepo | null = null;

/** Lazily resolves the SQLite repo (kept out of module scope so tests can inject). */
function getRepo(): HistoryRepo {
  if (!repo && Platform.OS === 'web') {
    // Web is only a development preview; history stays in memory there.
    repo = createMemoryRepo();
  }
  if (!repo) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSqliteRepo } = require('@/features/data/db') as typeof import('@/features/data/db');
    repo = createSqliteRepo();
  }
  return repo;
}

/** Test hook: swap in an in-memory repo. */
export function setHistoryRepo(r: HistoryRepo) {
  repo = r;
}

interface HistoryStore extends HistoryData {
  loaded: boolean;
  load: () => void;
  saveWorkout: (w: WorkoutSession) => void;
  addStrengthTest: (t: StrengthTest) => void;
  addFitnessLog: (l: FitnessLog) => void;
  addNote: (n: ProgressNote) => void;
  deleteNote: (id: string) => void;
  clearAll: () => void;
  replaceAll: (d: HistoryData) => void;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  ...emptyHistory(),
  loaded: false,
  load: () => {
    if (get().loaded) return;
    set({ ...getRepo().loadAll(), loaded: true });
  },
  saveWorkout: (w) => {
    getRepo().upsertWorkout(w);
    set((s) => {
      const exists = s.workouts.some((x) => x.id === w.id);
      return {
        workouts: exists ? s.workouts.map((x) => (x.id === w.id ? w : x)) : [...s.workouts, w],
      };
    });
  },
  addStrengthTest: (t) => {
    getRepo().insertStrengthTest(t);
    set((s) => ({ strengthTests: [...s.strengthTests, t] }));
  },
  addFitnessLog: (l) => {
    getRepo().insertFitnessLog(l);
    set((s) => ({ fitnessLogs: [...s.fitnessLogs, l] }));
  },
  addNote: (n) => {
    getRepo().insertNote(n);
    set((s) => ({ notes: [...s.notes, n] }));
  },
  deleteNote: (id) => {
    getRepo().deleteNote(id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },
  clearAll: () => {
    getRepo().clearAll();
    set({ ...emptyHistory(), loaded: true });
  },
  replaceAll: (d) => {
    getRepo().replaceAll(d);
    set({ ...structuredClone(d), loaded: true });
  },
}));
