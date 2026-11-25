import { deepClone } from '@/lib/clone';
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
    try {
      const sqlite = createSqliteRepo();
      sqlite.loadAll(); // opens + migrates; throws if SQLite is unusable
      repo = sqlite;
    } catch {
      console.warn('[history] SQLite unavailable; history kept in memory.');
      repo = createMemoryRepo();
    }
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

/**
 * Writes to the database without ever blocking the screen (2026-11-23 fix): the store is updated first,
 * so the Today ring, the week and the calendar always show a finished session; a failed write is logged.
 */
function persist(what: string, write: () => void) {
  try {
    write();
  } catch (e) {
    console.warn(`[history] could not save ${what}`, e);
  }
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  ...emptyHistory(),
  loaded: false,
  load: () => {
    if (get().loaded) return;
    set({ ...getRepo().loadAll(), loaded: true });
  },
  saveWorkout: (w) => {
    set((s) => {
      const exists = s.workouts.some((x) => x.id === w.id);
      return { workouts: exists ? s.workouts.map((x) => (x.id === w.id ? w : x)) : [...s.workouts, w] };
    });
    persist('workout', () => getRepo().upsertWorkout(w));
  },
  addStrengthTest: (t) => {
    set((s) => ({ strengthTests: [...s.strengthTests, t] }));
    persist('strength test', () => getRepo().insertStrengthTest(t));
  },
  addFitnessLog: (l) => {
    set((s) => ({ fitnessLogs: [...s.fitnessLogs, l] }));
    persist('fitness log', () => getRepo().insertFitnessLog(l));
  },
  addNote: (n) => {
    set((s) => ({ notes: [...s.notes, n] }));
    persist('note', () => getRepo().insertNote(n));
  },
  deleteNote: (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    persist('note delete', () => getRepo().deleteNote(id));
  },
  clearAll: () => {
    getRepo().clearAll();
    set({ ...emptyHistory(), loaded: true });
  },
  replaceAll: (d) => {
    getRepo().replaceAll(d);
    set({ ...deepClone(d), loaded: true });
  },
}));
