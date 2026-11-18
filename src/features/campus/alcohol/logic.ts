/**
 * Alkol Bağımlılığı Kampüsü — pure logic (no React, no storage).
 *
 * Core tool is a drink diary: every drink is logged in standard drinks (10 g of
 * pure alcohol). Two paths:
 * - "cut": a weekly limit (10, 7 or 4 standard drinks), at most 4 in a day,
 *   and at least 3 alcohol-free days a week.
 * - "quit": an alcohol-free goal (14, 30 or 60 days) counted from the last drink.
 * Safety first: the withdrawal check flags people who should not stop alone.
 */
import { addDays, startOfWeek, toDateKey } from '@/lib/date';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const ETHANOL_G_PER_ML = 0.789;
export const STD_DRINK_GRAMS = 10;
export const CUT_LIMITS = [10, 7, 4] as const;
export const DAILY_MAX = 4;
export const FREE_DAYS_TARGET = 3;
export const QUIT_GOALS = [14, 30, 60] as const;
export const AUDIT_QUESTIONS = 3;
export const WITHDRAWAL_QUESTIONS = 4;
/** AUDIT-C cut-off for men: 4 or more = hazardous drinking. */
export const AUDIT_POSITIVE_MEN = 4;

export type AlcMode = 'cut' | 'quit';

export interface DrinkLog {
  at: string;
  typeId: string;
  /** Standard drinks at the time of logging. */
  std: number;
}

export interface AlcState {
  setupDone: boolean;
  mode: AlcMode;
  /** Start of the current plan (ISO). */
  startedAt: string | null;
  /** First day in the campus (ISO). */
  firstStartedAt: string | null;
  weeklyLimit: number;
  quitGoalDays: number;
  /** AUDIT-C answers, 0–4 each; null when skipped. */
  audit: number[] | null;
  /** Withdrawal check answers (true = yes); null when skipped. */
  withdrawal: boolean[] | null;
  reasonIds: string[];
  triggerIds: string[];
  stepDoneIds: string[];
  drinks: DrinkLog[];
}

export const defaultAlcState = (): AlcState => ({
  setupDone: false,
  mode: 'cut',
  startedAt: null,
  firstStartedAt: null,
  weeklyLimit: 10,
  quitGoalDays: 30,
  audit: null,
  withdrawal: null,
  reasonIds: [],
  triggerIds: [],
  stepDoneIds: [],
  drinks: [],
});

export const alcPhase = (s: AlcState): 'setup' | 'active' => (s.setupDone && s.startedAt ? 'active' : 'setup');

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Standard drinks in a serving: ml × ABV × 0.789 g/ml ÷ 10 g. */
export const standardDrinks = (ml: number, abv: number) => round1((ml * abv * ETHANOL_G_PER_ML) / STD_DRINK_GRAMS);

export const auditScore = (answers: number[] | null) => (answers ? answers.reduce((a, b) => a + b, 0) : 0);

export function auditBand<B extends { id: string; max: number }>(score: number, bands: B[]): B | undefined {
  return [...bands].sort((a, b) => a.max - b.max).find((b) => score <= b.max) ?? bands[bands.length - 1];
}

/** Any "yes" on the withdrawal check means stopping should be planned with a doctor. */
export const withdrawalRisk = (answers: boolean[] | null) => !!answers && answers.some(Boolean);

const dayKey = (iso: string) => toDateKey(new Date(iso));

function totalsByDay(s: AlcState): Map<string, number> {
  const m = new Map<string, number>();
  for (const d of s.drinks) m.set(dayKey(d.at), (m.get(dayKey(d.at)) ?? 0) + d.std);
  return m;
}

export const dayTotal = (s: AlcState, key: string) => round1(totalsByDay(s).get(key) ?? 0);

/** Last `n` days (oldest first) with their standard drinks; `before` marks days before the campus start. */
export function lastDays(s: AlcState, now: Date, n = 7): { key: string; std: number; before: boolean }[] {
  const m = totalsByDay(s);
  const today = toDateKey(now);
  const start = s.firstStartedAt ? toDateKey(new Date(s.firstStartedAt)) : today;
  return Array.from({ length: n }, (_, i) => {
    const key = addDays(today, i - (n - 1));
    return { key, std: round1(m.get(key) ?? 0), before: key < start };
  });
}

export interface AlcWeek {
  total: number;
  limit: number;
  over: boolean;
  /** Days of this week so far (since the campus start) without any drink. */
  freeDays: number;
  /** Days of this week so far that are counted. */
  daysSoFar: number;
  /** Days this week above the daily maximum. */
  heavyDays: number;
}

export function thisWeek(s: AlcState, now: Date): AlcWeek {
  const m = totalsByDay(s);
  const today = toDateKey(now);
  const start = s.firstStartedAt ? toDateKey(new Date(s.firstStartedAt)) : today;
  let total = 0;
  let freeDays = 0;
  let daysSoFar = 0;
  let heavyDays = 0;
  for (let k = startOfWeek(today); k <= today; k = addDays(k, 1)) {
    const v = m.get(k) ?? 0;
    total += v;
    if (v > DAILY_MAX) heavyDays++;
    if (k < start) continue;
    daysSoFar++;
    if (v === 0) freeDays++;
  }
  total = round1(total);
  return { total, limit: s.weeklyLimit, over: total > s.weeklyLimit, freeDays, daysSoFar, heavyDays };
}

/** Quit path: time since the last drink (or since the start when there is none after it). */
export function dryMs(s: AlcState, now: Date): number {
  if (!s.startedAt) return 0;
  const start = new Date(s.startedAt).getTime();
  const last = s.drinks.map((d) => new Date(d.at).getTime()).filter((t) => t >= start).sort((a, b) => b - a)[0];
  return Math.max(0, now.getTime() - (last ?? start));
}
export const dryDays = (s: AlcState, now: Date) => Math.floor(dryMs(s, now) / DAY_MS);

/** Longest stretch without a drink since the first start, in whole days. */
export function longestDryDays(s: AlcState, now: Date): number {
  if (!s.firstStartedAt) return 0;
  const start = new Date(s.firstStartedAt).getTime();
  const points = [start, ...s.drinks.map((d) => new Date(d.at).getTime()).filter((t) => t >= start).sort((a, b) => a - b), now.getTime()];
  let best = 0;
  for (let i = 1; i < points.length; i++) best = Math.max(best, points[i]! - points[i - 1]!);
  return Math.floor(best / DAY_MS);
}

export const ALC_GUIDE_STEP_IDS = ['what', 'safety', 'track', 'situations', 'body', 'support'] as const;

/** Guards imported data: unknown or broken fields fall back to defaults. */
export function sanitizeAlcState(raw: unknown): AlcState {
  const d = defaultAlcState();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return d;
  const r = raw as Record<string, unknown>;
  const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const validIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(new Date(v).getTime());
  const startedAt = validIso(r.startedAt) ? r.startedAt : null;
  const audit =
    Array.isArray(r.audit) && r.audit.length === AUDIT_QUESTIONS && r.audit.every((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 4) ? (r.audit as number[]) : null;
  const withdrawal = Array.isArray(r.withdrawal) && r.withdrawal.length === WITHDRAWAL_QUESTIONS && r.withdrawal.every((x) => typeof x === 'boolean') ? (r.withdrawal as boolean[]) : null;
  return {
    setupDone: r.setupDone === true && startedAt !== null,
    mode: r.mode === 'quit' ? 'quit' : 'cut',
    startedAt,
    firstStartedAt: validIso(r.firstStartedAt) ? r.firstStartedAt : startedAt,
    weeklyLimit: typeof r.weeklyLimit === 'number' && (CUT_LIMITS as readonly number[]).includes(r.weeklyLimit) ? r.weeklyLimit : d.weeklyLimit,
    quitGoalDays: typeof r.quitGoalDays === 'number' && (QUIT_GOALS as readonly number[]).includes(r.quitGoalDays) ? r.quitGoalDays : d.quitGoalDays,
    audit,
    withdrawal,
    reasonIds: strArr(r.reasonIds),
    triggerIds: strArr(r.triggerIds),
    stepDoneIds: strArr(r.stepDoneIds),
    drinks: Array.isArray(r.drinks)
      ? r.drinks
          .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null && validIso((x as Record<string, unknown>).at))
          .filter((x) => typeof x.typeId === 'string' && typeof x.std === 'number' && Number.isFinite(x.std) && (x.std as number) > 0 && (x.std as number) < 50)
          .map((x) => ({ at: x.at as string, typeId: x.typeId as string, std: x.std as number }))
      : [],
  };
}
