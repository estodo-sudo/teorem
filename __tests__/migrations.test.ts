import { MIGRATIONS, runMigrations, type MigratableDb } from '@/features/data/migrations';

function fakeDb(start = 0): MigratableDb & { executed: string[]; version: number } {
  const db = {
    executed: [] as string[],
    version: start,
    execSync(sql: string) {
      db.executed.push(sql);
      const m = /PRAGMA user_version = (\d+)/.exec(sql);
      if (m) db.version = Number(m[1]);
    },
    getFirstSync<T>() {
      return { user_version: db.version } as T;
    },
  };
  return db;
}

describe('runMigrations', () => {
  it('applies all migrations on a fresh db', () => {
    const db = fakeDb();
    const v = runMigrations(db);
    expect(v).toBe(MIGRATIONS[MIGRATIONS.length - 1]!.version);
    expect(db.executed).toHaveLength(MIGRATIONS.length);
  });
  it('is idempotent', () => {
    const db = fakeDb();
    runMigrations(db);
    runMigrations(db);
    expect(db.executed).toHaveLength(MIGRATIONS.length);
  });
  it('applies only pending migrations in order', () => {
    const db = fakeDb(1);
    runMigrations(db, [
      { version: 3, sql: 'C' },
      { version: 1, sql: 'A' },
      { version: 2, sql: 'B' },
    ]);
    expect(db.executed.map((s) => s.split('\n')[1])).toEqual(['B', 'C']);
    expect(db.version).toBe(3);
  });
});
