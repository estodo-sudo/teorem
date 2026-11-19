import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import type { FitnessLog, ProgressNote, StrengthTest, WorkoutSession } from '@/types';

import { runMigrations } from './migrations';
import type { HistoryData, HistoryRepo } from './repo';

const DB_NAME = 'history.db';

let instance: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!instance) {
    instance = openDatabaseSync(DB_NAME);
    instance.execSync('PRAGMA journal_mode = WAL;');
    runMigrations(instance);
  }
  return instance;
}

interface WorkoutRow {
  id: string;
  date: string;
  finished_at: string;
  level: number;
  planned_sec: number;
  actual_sec: number;
  exercises: string;
  feedback: string | null;
  completed: number;
  extra?: string | null;
}
interface StrengthRow {
  id: string;
  date: string;
  hold_best_ms: number;
  hold_attempts_ms: string;
  quick_count: number;
  extra?: string | null;
}
interface FitnessRow {
  id: string;
  date: string;
  routine_id: string;
  duration_sec: number;
}
interface NoteRow {
  id: string;
  date: string;
  created_at: string;
  text: string;
  kind: string;
}

/** Kegel v2 fields stored in the `extra` JSON column (migration 3). */
const WORKOUT_EXTRA = ['track', 'durationPreset', 'pauses', 'skippedBlocks', 'completionRate', 'techniqueConfidence', 'isMicro', 'contractions', 'holdSec', 'longestHoldSec', 'deload'] as const;
const STRENGTH_EXTRA = ['position', 'releaseSelfRating', 'muscleScore'] as const;
const pick = (o: object, keys: readonly string[]) => {
  const out = Object.fromEntries(keys.filter((k) => (o as Record<string, unknown>)[k] !== undefined).map((k) => [k, (o as Record<string, unknown>)[k]]));
  return Object.keys(out).length ? JSON.stringify(out) : null;
};
const extraOf = (s: string | null | undefined, keys: readonly string[]): Record<string, unknown> => {
  if (!s) return {};
  try {
    const o = JSON.parse(s) as unknown;
    return o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).filter(([k]) => keys.includes(k))) : {};
  } catch {
    return {};
  }
};

const safeJson = <T>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

function writeWorkout(db: SQLiteDatabase, w: WorkoutSession) {
  db.runSync(
    `INSERT OR REPLACE INTO workouts
      (id, date, finished_at, level, planned_sec, actual_sec, exercises, feedback, completed, extra)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    w.id,
    w.date,
    w.finishedAt,
    w.level,
    Math.round(w.plannedSec),
    Math.round(w.actualSec),
    JSON.stringify(w.exercises),
    w.feedback ?? null,
    w.completed ? 1 : 0,
    pick(w, WORKOUT_EXTRA),
  );
}
function writeStrength(db: SQLiteDatabase, t: StrengthTest) {
  db.runSync(
    `INSERT OR REPLACE INTO strength_tests (id, date, hold_best_ms, hold_attempts_ms, quick_count, extra)
      VALUES (?, ?, ?, ?, ?, ?)`,
    t.id,
    t.date,
    Math.round(t.holdBestMs),
    JSON.stringify(t.holdAttemptsMs),
    t.quickCount,
    pick(t, STRENGTH_EXTRA),
  );
}
function writeFitness(db: SQLiteDatabase, l: FitnessLog) {
  db.runSync(`INSERT OR REPLACE INTO fitness_logs (id, date, routine_id, duration_sec) VALUES (?, ?, ?, ?)`, l.id, l.date, l.routineId, Math.round(l.durationSec));
}
function writeNote(db: SQLiteDatabase, n: ProgressNote) {
  db.runSync(`INSERT OR REPLACE INTO notes (id, date, created_at, text, kind) VALUES (?, ?, ?, ?, ?)`, n.id, n.date, n.createdAt, n.text, n.kind);
}

export function createSqliteRepo(): HistoryRepo {
  return {
    loadAll(): HistoryData {
      const db = getDb();
      const workouts = db.getAllSync<WorkoutRow>('SELECT * FROM workouts ORDER BY finished_at ASC').map<WorkoutSession>((r) => ({
        id: r.id,
        date: r.date,
        finishedAt: r.finished_at,
        level: r.level,
        plannedSec: r.planned_sec,
        actualSec: r.actual_sec,
        exercises: safeJson(r.exercises, []),
        feedback: (r.feedback ?? undefined) as WorkoutSession['feedback'],
        completed: r.completed === 1,
        ...(extraOf(r.extra, WORKOUT_EXTRA) as Partial<WorkoutSession>),
      }));
      const strengthTests = db.getAllSync<StrengthRow>('SELECT * FROM strength_tests ORDER BY date ASC').map<StrengthTest>((r) => ({
        id: r.id,
        date: r.date,
        holdBestMs: r.hold_best_ms,
        holdAttemptsMs: safeJson(r.hold_attempts_ms, []),
        quickCount: r.quick_count,
        ...(extraOf(r.extra, STRENGTH_EXTRA) as Partial<StrengthTest>),
      }));
      const fitnessLogs = db.getAllSync<FitnessRow>('SELECT * FROM fitness_logs ORDER BY date ASC').map<FitnessLog>((r) => ({
        id: r.id,
        date: r.date,
        routineId: r.routine_id,
        durationSec: r.duration_sec,
      }));
      const notes = db.getAllSync<NoteRow>('SELECT * FROM notes ORDER BY created_at ASC').map<ProgressNote>((r) => ({
        id: r.id,
        date: r.date,
        createdAt: r.created_at,
        text: r.text,
        kind: r.kind === 'unload' ? 'unload' : 'progress',
      }));
      return { workouts, strengthTests, fitnessLogs, notes };
    },
    upsertWorkout: (w) => writeWorkout(getDb(), w),
    insertStrengthTest: (t) => writeStrength(getDb(), t),
    insertFitnessLog: (l) => writeFitness(getDb(), l),
    insertNote: (n) => writeNote(getDb(), n),
    deleteNote: (id) => {
      getDb().runSync('DELETE FROM notes WHERE id = ?', id);
    },
    clearAll() {
      getDb().execSync('DELETE FROM workouts; DELETE FROM strength_tests; DELETE FROM fitness_logs; DELETE FROM notes;');
    },
    replaceAll(data) {
      const db = getDb();
      db.withTransactionSync(() => {
        db.execSync('DELETE FROM workouts; DELETE FROM strength_tests; DELETE FROM fitness_logs; DELETE FROM notes;');
        data.workouts.forEach((w) => writeWorkout(db, w));
        data.strengthTests.forEach((t) => writeStrength(db, t));
        data.fitnessLogs.forEach((l) => writeFitness(db, l));
        data.notes.forEach((n) => writeNote(db, n));
      });
    },
  };
}
