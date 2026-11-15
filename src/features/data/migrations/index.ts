/**
 * Ordered SQLite migrations. Each migration runs once; the current schema
 * version is tracked with `PRAGMA user_version`. Never edit a shipped
 * migration — append a new one.
 */
export interface Migration {
  version: number;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        finished_at TEXT NOT NULL,
        level INTEGER NOT NULL,
        planned_sec INTEGER NOT NULL,
        actual_sec INTEGER NOT NULL,
        exercises TEXT NOT NULL,
        feedback TEXT,
        completed INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);

      CREATE TABLE IF NOT EXISTS strength_tests (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        hold_best_ms INTEGER NOT NULL,
        hold_attempts_ms TEXT NOT NULL,
        quick_count INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fitness_logs (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        routine_id TEXT NOT NULL,
        duration_sec INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        text TEXT NOT NULL,
        kind TEXT NOT NULL
      );
    `,
  },
];

export interface MigratableDb {
  execSync(sql: string): void;
  getFirstSync<T>(sql: string): T | null;
}

/** Applies pending migrations. Returns the resulting schema version. */
export function runMigrations(db: MigratableDb, migrations: Migration[] = MIGRATIONS): number {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;
  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);
  for (const m of pending) {
    db.execSync(`BEGIN;\n${m.sql}\nPRAGMA user_version = ${m.version};\nCOMMIT;`);
    current = m.version;
  }
  return current;
}
