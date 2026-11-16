import { deepClone } from '@/lib/clone';
import type { FitnessLog, ProgressNote, StrengthTest, WorkoutSession } from '@/types';

/** All history that lives in SQLite. */
export interface HistoryData {
  workouts: WorkoutSession[];
  strengthTests: StrengthTest[];
  fitnessLogs: FitnessLog[];
  notes: ProgressNote[];
}

export const emptyHistory = (): HistoryData => ({
  workouts: [],
  strengthTests: [],
  fitnessLogs: [],
  notes: [],
});

/** Persistence port for history. SQLite in the app, in-memory in tests. */
export interface HistoryRepo {
  loadAll(): HistoryData;
  upsertWorkout(w: WorkoutSession): void;
  insertStrengthTest(t: StrengthTest): void;
  insertFitnessLog(l: FitnessLog): void;
  insertNote(n: ProgressNote): void;
  deleteNote(id: string): void;
  clearAll(): void;
  replaceAll(data: HistoryData): void;
}

export function createMemoryRepo(initial: HistoryData = emptyHistory()): HistoryRepo {
  let data: HistoryData = deepClone(initial);
  const upsert = <T extends { id: string }>(list: T[], item: T) => {
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = item;
    else list.push(item);
  };
  return {
    loadAll: () => deepClone(data),
    upsertWorkout: (w) => upsert(data.workouts, deepClone(w)),
    insertStrengthTest: (t) => upsert(data.strengthTests, deepClone(t)),
    insertFitnessLog: (l) => upsert(data.fitnessLogs, deepClone(l)),
    insertNote: (n) => upsert(data.notes, deepClone(n)),
    deleteNote: (id) => {
      data.notes = data.notes.filter((n) => n.id !== id);
    },
    clearAll: () => {
      data = emptyHistory();
    },
    replaceAll: (d) => {
      data = deepClone(d);
    },
  };
}
