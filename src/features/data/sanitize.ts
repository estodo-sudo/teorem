import { SUPPORTED_LANGUAGES, type Language } from '@/i18n/languages';
import { defaultProfile } from '@/stores/profileStore';
import { defaultSettings } from '@/stores/settingsStore';
import type { FitnessLog, ProgressNote, Settings, StrengthTest, UserProfile, WorkoutSession } from '@/types';

import type { HistoryData } from './repo';

/**
 * Import hardening (security review 2026-11-23). A backup file is something the user picks from
 * anywhere (mail, chat, Files), so it is treated as untrusted: every field is checked against its type
 * and allowed values, wrong ones fall back to the default. A crafted file can therefore never write an
 * object where the screens expect text (which would crash the app on every start) or an unknown
 * language / theme / strength. Entitlement is never imported (see exportImport.ts).
 */

/** Largest backup we read (a real one with years of data is far below 1 MB). */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
/** Per-list cap so a crafted file cannot fill the database or slow every screen down. */
export const MAX_RECORDS = 20_000;
const MAX_TEXT = 5_000;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length <= max;
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const nonNeg = (v: unknown): v is number => num(v) && v >= 0;
const oneOf = <T extends string | number>(v: unknown, allowed: readonly T[]): v is T => allowed.includes(v as T);
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const GOALS = ['endurance', 'bladder', 'erection', 'confidence', 'general', 'postSurgery'] as const;
const AGES = ['16-24', '25-34', '35-44', '45-54', '55+'] as const;
const EXPERIENCE = ['none', 'some', 'regular'] as const;
const ACTIVITY = ['low', 'mid', 'high'] as const;

export function sanitizeProfile(raw: unknown): UserProfile {
  const d = defaultProfile();
  if (!isObj(raw)) return d;
  return {
    goals: Array.isArray(raw.goals) ? [...new Set(raw.goals.filter((g): g is UserProfile['goals'][number] => oneOf(g, GOALS)))] : d.goals,
    ageRange: oneOf(raw.ageRange, AGES) ? raw.ageRange : null,
    experience: oneOf(raw.experience, EXPERIENCE) ? raw.experience : null,
    activity: oneOf(raw.activity, ACTIVITY) ? raw.activity : null,
    onboardingDone: raw.onboardingDone === true,
    tutorialDone: raw.tutorialDone === true,
    disclaimerAcceptedAt: str(raw.disclaimerAcceptedAt, 40) && !Number.isNaN(Date.parse(raw.disclaimerAcceptedAt)) ? raw.disclaimerAcceptedAt : null,
    paywallSeen: raw.paywallSeen === true,
    createdAt: str(raw.createdAt, 40) && !Number.isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : d.createdAt,
  };
}

export function sanitizeSettings(raw: unknown, base: Settings = defaultSettings()): Settings {
  if (!isObj(raw)) return base;
  const bool = (k: keyof Settings) => (typeof raw[k] === 'boolean' ? (raw[k] as boolean) : (base[k] as boolean));
  const times = Array.isArray(raw.reminderTimes) ? [...new Set(raw.reminderTimes.filter((x): x is string => typeof x === 'string' && TIME.test(x)))].slice(0, 3) : [];
  const out: Settings = {
    hapticStrength: oneOf(raw.hapticStrength, [0, 1, 2, 3] as const) ? raw.hapticStrength : base.hapticStrength,
    soundCues: bool('soundCues'),
    introSound: bool('introSound'),
    discreetPlayer: bool('discreetPlayer'),
    reminderTimes: times.length ? times : base.reminderTimes,
    remindersEnabled: bool('remindersEnabled'),
    weeklyTestReminder: bool('weeklyTestReminder'),
    discreetNotifications: bool('discreetNotifications'),
    theme: oneOf(raw.theme, ['light', 'dark', 'system'] as const) ? raw.theme : base.theme,
    sessionsPerDay: oneOf(raw.sessionsPerDay, [1, 2, 3] as const) ? raw.sessionsPerDay : base.sessionsPerDay,
    saveUnloadNotes: bool('saveUnloadNotes'),
    language: oneOf<Language>(raw.language, SUPPORTED_LANGUAGES) ? raw.language : base.language,
  };
  if (typeof raw.voiceCoach === 'boolean') out.voiceCoach = raw.voiceCoach;
  if (str(raw.reminderSkipDate, 10) && DATE_KEY.test(raw.reminderSkipDate)) out.reminderSkipDate = raw.reminderSkipDate;
  return out;
}

const capped = (list: unknown, ok: (x: Record<string, unknown>) => boolean) =>
  (Array.isArray(list) ? list : []).filter((x): x is Record<string, unknown> => isObj(x) && ok(x)).slice(-MAX_RECORDS);

const baseOk = (x: Record<string, unknown>) => str(x.id) && str(x.date, 10) && DATE_KEY.test(x.date as string);

/** Keeps only well-formed records; a bad row is dropped instead of breaking the charts. */
export function sanitizeHistory(raw: unknown): HistoryData {
  const h = isObj(raw) ? raw : {};
  const workouts = capped(
    h.workouts,
    (w) =>
      baseOk(w) &&
      str(w.finishedAt, 40) &&
      num(w.level) &&
      nonNeg(w.plannedSec) &&
      nonNeg(w.actualSec) &&
      typeof w.completed === 'boolean' &&
      Array.isArray(w.exercises) &&
      w.exercises.every(isObj) &&
      (w.completionRate === undefined || nonNeg(w.completionRate)),
  ) as unknown as WorkoutSession[];
  const strengthTests = capped(
    h.strengthTests,
    (s) => baseOk(s) && nonNeg(s.holdBestMs) && nonNeg(s.quickCount) && Array.isArray(s.holdAttemptsMs) && s.holdAttemptsMs.every(nonNeg) && (s.muscleScore === undefined || num(s.muscleScore)),
  ) as unknown as StrengthTest[];
  const fitnessLogs = capped(h.fitnessLogs, (f) => baseOk(f) && str(f.routineId) && nonNeg(f.durationSec)) as unknown as FitnessLog[];
  const notes = capped(h.notes, (n) => baseOk(n) && str(n.createdAt, 40) && str(n.text, MAX_TEXT) && oneOf(n.kind, ['progress', 'unload'] as const)) as unknown as ProgressNote[];
  return { workouts, strengthTests, fitnessLogs, notes };
}
