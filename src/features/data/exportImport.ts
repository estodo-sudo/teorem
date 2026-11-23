import { deepClone } from '@/lib/clone';
import { APP_NAME } from '@/config/app';
import { sanitizeAlcState } from '@/features/campus/alcohol/logic';
import { sanitizeBodyState } from '@/features/campus/body/logic';
import { defaultCampState, emptyCampEvents, sanitizeCampEvents, sanitizeCampState, type CampState } from '@/features/camps/smoking/state';
import type { CampEvents } from '@/features/camps/smoking/types';
import { migrateTraining } from '@/features/training/plan';
import { defaultCampus, type CampusSnapshot } from '@/stores/campusStore';
import { sanitizeKegelData, type KegelData } from '@/stores/kegelStore';
import type { ProgressSnapshot } from '@/stores/progressStore';
import type { Settings, TrainingState, UserProfile } from '@/types';

import type { HistoryData } from './repo';
import { MAX_IMPORT_BYTES, sanitizeHistory, sanitizeProfile, sanitizeSettings } from './sanitize';

/** Bump when the export shape changes; add a migration in `upgrade()`. */
export const EXPORT_SCHEMA_VERSION = 4;
export const EXPORT_FORMAT = 'pelvic-app-backup';

export interface ExportBundle {
  format: typeof EXPORT_FORMAT;
  schemaVersion: number;
  app: string;
  exportedAt: string;
  profile: UserProfile;
  settings: Settings;
  training: TrainingState;
  progress: ProgressSnapshot;
  campus: CampusSnapshot;
  camp: CampSnapshot;
  kegel: KegelData;
  history: HistoryData;
}

/** Sigarasız Kamp: persisted state plus its SQLite event logs. */
export interface CampSnapshot {
  state: CampState;
  events: CampEvents;
}

export interface AppSnapshot {
  profile: UserProfile;
  settings: Settings;
  training: TrainingState;
  progress: ProgressSnapshot;
  campus: CampusSnapshot;
  camp: CampSnapshot;
  /** Kegel v2: muscle profile, pain reports, self ratings, functional tasks. */
  kegel: KegelData;
  history: HistoryData;
}

/** Entitlement is intentionally NOT exported: it always comes from the store. */
export function buildExport(s: AppSnapshot, now = new Date()): ExportBundle {
  return {
    format: EXPORT_FORMAT,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    app: APP_NAME,
    exportedAt: now.toISOString(),
    ...deepClone(s),
  };
}

export function serializeExport(b: ExportBundle): string {
  return JSON.stringify(b, null, 2);
}

export type ImportResult = { ok: true; data: AppSnapshot } | { ok: false; error: 'invalidJson' | 'wrongFormat' | 'newerVersion' | 'corrupt' };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isArr = Array.isArray;

function upgrade(raw: Record<string, unknown>): Record<string, unknown> {
  let b = raw;
  // v1 → v2: campus programs (Sigara Bırakma Kampüsü) were added.
  if (Number(b.schemaVersion) < 2) b = { ...b, campus: defaultCampus(), schemaVersion: 2 };
  // v2 → v3: Sigarasız Kamp was added.
  if (Number(b.schemaVersion) < 3) b = { ...b, camp: { state: defaultCampState(), events: emptyCampEvents() }, schemaVersion: 3 };
  // v3 → v4: Kegel v2 (training fields are migrated on import; kegel data starts empty).
  if (Number(b.schemaVersion) < 4) b = { ...b, schemaVersion: 4 };
  return b;
}

export function parseImport(text: string): ImportResult {
  // A crafted, huge file is refused before parsing (security review 2026-11-23).
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'corrupt' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalidJson' };
  }
  if (!isObj(raw) || raw.format !== EXPORT_FORMAT) return { ok: false, error: 'wrongFormat' };
  const v = Number(raw.schemaVersion);
  if (!Number.isInteger(v) || v < 1) return { ok: false, error: 'corrupt' };
  if (v > EXPORT_SCHEMA_VERSION) return { ok: false, error: 'newerVersion' };
  const b = upgrade(raw);
  const h = b.history;
  const p = b.progress;
  if (!isObj(b.profile) || !isObj(b.settings) || !isObj(b.training) || !isObj(p) || !isObj(p.content) || !isObj(h) || !isArr(h.workouts) || !isArr(h.strengthTests) || !isArr(h.fitnessLogs) || !isArr(h.notes)) {
    return { ok: false, error: 'corrupt' };
  }
  const workoutsOk = (h.workouts as unknown[]).every((w) => isObj(w) && typeof w.id === 'string' && typeof w.date === 'string');
  if (!workoutsOk) return { ok: false, error: 'corrupt' };
  return {
    ok: true,
    data: {
      // Every field is checked: a wrong type falls back to the default (security review 2026-11-23).
      profile: sanitizeProfile(b.profile),
      settings: sanitizeSettings(b.settings),
      training: migrateTraining(b.training),
      progress: {
        content: p.content as unknown as ProgressSnapshot['content'],
        challengeLogs: (isObj(p.challengeLogs) ? p.challengeLogs : {}) as ProgressSnapshot['challengeLogs'],
        achievements: (isObj(p.achievements) ? p.achievements : {}) as ProgressSnapshot['achievements'],
        lastMindSession: typeof p.lastMindSession === 'string' ? p.lastMindSession : null,
      },
      // Campuses added later are simply missing from older backups → defaults; removed ones are ignored.
      campus: {
        alcohol: sanitizeAlcState(isObj(b.campus) ? b.campus.alcohol : undefined),
        neck: sanitizeBodyState(isObj(b.campus) ? b.campus.neck : undefined),
        feet: sanitizeBodyState(isObj(b.campus) ? b.campus.feet : undefined),
      },
      camp: {
        state: sanitizeCampState(isObj(b.camp) ? b.camp.state : undefined),
        events: sanitizeCampEvents(isObj(b.camp) ? b.camp.events : undefined),
      },
      kegel: sanitizeKegelData(b.kegel),
      history: sanitizeHistory(h),
    },
  };
}

export function exportFileName(now = new Date()): string {
  const d = now.toISOString().slice(0, 10);
  return `${
    APP_NAME.replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'backup'
  }-yedek-${d}.json`;
}
