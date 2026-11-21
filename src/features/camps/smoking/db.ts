import type { SQLiteDatabase } from 'expo-sqlite';

import { getDb } from '@/features/data/db';

import type { CampRepo } from './repo';
import { sanitizeCampEvents } from './state';
import type { CheckIn, CigaretteLog, CravingEvent } from './types';

interface CigRow {
  id: string;
  attempt_id: string;
  at: string;
  trig: string | null;
  mood: number | null;
  need: number | null;
  tag: string | null;
  is_slip: number;
}
interface CravingRow {
  id: string;
  at: string;
  intensity_before: number;
  intensity_after: number | null;
  trig: string | null;
  tools: string;
  outcome: string;
  duration_sec: number;
  extra: string | null;
}
interface CheckinRow {
  id: string;
  at: string;
  smoked: number;
  craving_count: number;
  mood: number;
  symptoms: string;
}

const json = <T>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};
const opt = <T>(v: T | null) => (v === null ? undefined : v);

function writeCig(db: SQLiteDatabase, l: CigaretteLog) {
  db.runSync('INSERT OR REPLACE INTO camp_cigarettes (id, attempt_id, at, trig, mood, need, tag, is_slip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', l.id, l.attemptId, l.at, l.trigger ?? null, l.mood ?? null, l.need ?? null, l.tag ?? null, l.isSlip ? 1 : 0);
}
function writeCraving(db: SQLiteDatabase, c: CravingEvent) {
  db.runSync(
    'INSERT OR REPLACE INTO camp_cravings (id, at, intensity_before, intensity_after, trig, tools, outcome, duration_sec, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    c.id,
    c.at,
    Math.round(c.intensityBefore),
    c.intensityAfter === undefined ? null : Math.round(c.intensityAfter),
    c.trigger ?? null,
    JSON.stringify(c.toolUsed),
    c.outcome,
    Math.round(c.durationSec),
    c.triggers?.length || c.otherTrigger ? JSON.stringify({ triggers: c.triggers, otherTrigger: c.otherTrigger }) : null,
  );
}
function writeCheckin(db: SQLiteDatabase, c: CheckIn) {
  db.runSync('INSERT OR REPLACE INTO camp_checkins (id, at, smoked, craving_count, mood, symptoms) VALUES (?, ?, ?, ?, ?, ?)', c.id, c.at, c.smoked ? 1 : 0, Math.round(c.cravingCount), c.mood, JSON.stringify(c.symptoms));
}

const CLEAR = 'DELETE FROM camp_cigarettes; DELETE FROM camp_cravings; DELETE FROM camp_checkins;';

export function createSqliteCampRepo(): CampRepo {
  return {
    loadAll() {
      const db = getDb();
      // Rows pass through the same sanitizer as imports, so a bad row can't break the screens.
      return sanitizeCampEvents({
        cigarettes: db.getAllSync<CigRow>('SELECT * FROM camp_cigarettes ORDER BY at ASC').map((r) => ({
          id: r.id,
          attemptId: r.attempt_id,
          at: r.at,
          trigger: opt(r.trig),
          mood: opt(r.mood),
          need: opt(r.need),
          tag: opt(r.tag),
          isSlip: r.is_slip === 1,
        })),
        cravings: db.getAllSync<CravingRow>('SELECT * FROM camp_cravings ORDER BY at ASC').map((r) => ({
          id: r.id,
          at: r.at,
          intensityBefore: r.intensity_before,
          intensityAfter: opt(r.intensity_after),
          trigger: opt(r.trig),
          toolUsed: json(r.tools, []),
          outcome: r.outcome,
          durationSec: r.duration_sec,
          ...json<{ triggers?: string[]; otherTrigger?: string }>(r.extra ?? '{}', {}),
        })),
        checkins: db.getAllSync<CheckinRow>('SELECT * FROM camp_checkins ORDER BY at ASC').map((r) => ({
          id: r.id,
          at: r.at,
          smoked: r.smoked === 1,
          cravingCount: r.craving_count,
          mood: r.mood,
          symptoms: json(r.symptoms, []),
        })),
      });
    },
    insertCigarette: (l) => writeCig(getDb(), l),
    deleteCigarette: (id) => {
      getDb().runSync('DELETE FROM camp_cigarettes WHERE id = ?', id);
    },
    insertCraving: (c) => writeCraving(getDb(), c),
    insertCheckin: (c) => writeCheckin(getDb(), c),
    clearAll: () => getDb().execSync(CLEAR),
    replaceAll(data) {
      const db = getDb();
      db.withTransactionSync(() => {
        db.execSync(CLEAR);
        data.cigarettes.forEach((l) => writeCig(db, l));
        data.cravings.forEach((c) => writeCraving(db, c));
        data.checkins.forEach((c) => writeCheckin(db, c));
      });
    },
  };
}
