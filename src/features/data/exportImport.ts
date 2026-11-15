import { APP_NAME } from '@/config/app';
import type { ProgressSnapshot } from '@/stores/progressStore';
import type { Settings, TrainingState, UserProfile } from '@/types';

import type { HistoryData } from './repo';

/** Bump when the export shape changes; add a migration in `upgrade()`. */
export const EXPORT_SCHEMA_VERSION = 1;
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
  history: HistoryData;
}

export interface AppSnapshot {
  profile: UserProfile;
  settings: Settings;
  training: TrainingState;
  progress: ProgressSnapshot;
  history: HistoryData;
}

/** Entitlement is intentionally NOT exported: it always comes from the store. */
export function buildExport(s: AppSnapshot, now = new Date()): ExportBundle {
  return {
    format: EXPORT_FORMAT,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    app: APP_NAME,
    exportedAt: now.toISOString(),
    ...structuredClone(s),
  };
}

export function serializeExport(b: ExportBundle): string {
  return JSON.stringify(b, null, 2);
}

export type ImportResult = { ok: true; data: AppSnapshot } | { ok: false; error: 'invalidJson' | 'wrongFormat' | 'newerVersion' | 'corrupt' };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isArr = Array.isArray;

function upgrade(raw: Record<string, unknown>): Record<string, unknown> {
  // v1 is the first version — future migrations go here (v1 → v2 …).
  return raw;
}

export function parseImport(text: string): ImportResult {
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
  if (
    !isObj(b.profile) ||
    !isObj(b.settings) ||
    !isObj(b.training) ||
    !isObj(p) ||
    !isObj(p.content) ||
    !isObj(h) ||
    !isArr(h.workouts) ||
    !isArr(h.strengthTests) ||
    !isArr(h.fitnessLogs) ||
    !isArr(h.notes)
  ) {
    return { ok: false, error: 'corrupt' };
  }
  const workoutsOk = (h.workouts as unknown[]).every((w) => isObj(w) && typeof w.id === 'string' && typeof w.date === 'string');
  if (!workoutsOk) return { ok: false, error: 'corrupt' };
  return {
    ok: true,
    data: {
      profile: b.profile as unknown as UserProfile,
      settings: b.settings as unknown as Settings,
      training: b.training as unknown as TrainingState,
      progress: {
        content: p.content as unknown as ProgressSnapshot['content'],
        challengeLogs: (isObj(p.challengeLogs) ? p.challengeLogs : {}) as ProgressSnapshot['challengeLogs'],
        achievements: (isObj(p.achievements) ? p.achievements : {}) as ProgressSnapshot['achievements'],
        lastMindSession: typeof p.lastMindSession === 'string' ? p.lastMindSession : null,
      },
      history: h as unknown as HistoryData,
    },
  };
}

export function exportFileName(now = new Date()): string {
  const d = now.toISOString().slice(0, 10);
  return `${APP_NAME.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'backup'}-yedek-${d}.json`;
}
