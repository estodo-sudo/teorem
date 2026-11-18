/**
 * Mastürbasyon Bağımlılığı Kampüsü — pure logic (no React, no storage).
 *
 * Two paths, chosen at enrolment:
 * - "control": a weekly allowance set from the user's current frequency
 *   (>14/week → 5, 10–14 → 3, 7–9 → 2, <7 → 1). Using an allowance is normal use,
 *   not a slip; going over the allowance marks the week as over the limit.
 * - "quit": a full pause of 7, 10 or 15 days. Like the smoking campus, the first
 *   lapse of an attempt is logged and the counter goes on; a second lapse in the
 *   same attempt ends it and a new attempt starts.
 */
import { addDays, startOfWeek, toDateKey } from '@/lib/date';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const QUIT_GOALS = [7, 10, 15] as const;
export const QUIT_MAX_DAYS = 15;
export const DEFAULT_QUIT_GOAL = 15;
export const CALENDAR_DAYS = 28;
export const WEEK_HISTORY = 8;
export const CHECK_QUESTION_COUNT = 6;

export type McMode = 'control' | 'quit';

/** Current weekly frequency → weekly allowance on the control path. */
export const BASELINE_LIMITS = { gt14: 5, '10to14': 3, '7to9': 2, lt7: 1 } as const;
export type BaselineId = keyof typeof BASELINE_LIMITS;
export const isBaselineId = (v: unknown): v is BaselineId => typeof v === 'string' && v in BASELINE_LIMITS;

export interface UrgeLog {
  at: string;
  triggerId: string | null;
  actionId: string | null;
  /** True when the urge passed without acting on it. */
  passed: boolean;
}

export interface McState {
  setupDone: boolean;
  mode: McMode;
  /** Start of the current plan or attempt (ISO). */
  startedAt: string | null;
  /** First day in the campus (ISO); anchors the calendar and history. */
  firstStartedAt: string | null;
  /** Quit path: target days (7, 10 or 15). */
  goalDays: number;
  /** Control path: the frequency picked at enrolment. */
  baselineId: BaselineId | null;
  /** Control path: allowed times per week. */
  weeklyLimit: number;
  /** Quit path: 1 for the first attempt, +1 on each new one. */
  attempt: number;
  reasonIds: string[];
  triggerIds: string[];
  envDoneIds: string[];
  stepDoneIds: string[];
  /** Self-check answers (true = yes), in question order; null when skipped. */
  checkAnswers: boolean[] | null;
  checkValues: boolean | null;
  urges: UrgeLog[];
  /** Quit path: ISO times of lapses. */
  lapses: string[];
  /** Control path: ISO times an allowance was used. */
  uses: string[];
}

export const defaultMcState = (): McState => ({
  setupDone: false,
  mode: 'control',
  startedAt: null,
  firstStartedAt: null,
  goalDays: DEFAULT_QUIT_GOAL,
  baselineId: null,
  weeklyLimit: BASELINE_LIMITS['7to9'],
  attempt: 1,
  reasonIds: [],
  triggerIds: [],
  envDoneIds: [],
  stepDoneIds: [],
  checkAnswers: null,
  checkValues: null,
  urges: [],
  lapses: [],
  uses: [],
});

export type McPhase = 'setup' | 'active';
export const mcPhase = (s: McState): McPhase => (s.setupDone && s.startedAt ? 'active' : 'setup');

const time = (iso: string) => new Date(iso).getTime();
const validIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(new Date(v).getTime());

// ---------- Quit path ----------

export function quitElapsedMs(s: McState, now: Date): number {
  return s.startedAt ? Math.max(0, now.getTime() - time(s.startedAt)) : 0;
}
export const quitDays = (s: McState, now: Date) => Math.floor(quitElapsedMs(s, now) / DAY_MS);
export const quitProgress = (s: McState, now: Date) => (s.goalDays > 0 ? Math.min(1, quitDays(s, now) / s.goalDays) : 0);
export const quitGoalReached = (s: McState, now: Date) => s.mode === 'quit' && s.goalDays > 0 && quitDays(s, now) >= s.goalDays;

/** Lapses logged in the current attempt (after its start). */
export function lapsesThisAttempt(s: Pick<McState, 'lapses' | 'startedAt'>): number {
  if (!s.startedAt) return 0;
  const q = time(s.startedAt);
  return s.lapses.filter((x) => time(x) > q).length;
}

/** One lapse per attempt is absorbed; a second one ends the attempt (confirmed in the UI). */
export const nextLapseEndsAttempt = (s: Pick<McState, 'lapses' | 'startedAt'>) => lapsesThisAttempt(s) >= 1;

/** Starts a new quit attempt now (after a second lapse, or to go again after reaching the goal). */
export function newAttempt(s: McState, now: Date): McState {
  return { ...s, startedAt: now.toISOString(), attempt: s.attempt + 1 };
}

// ---------- Control path ----------

export const weekKeyOf = (d: Date) => startOfWeek(toDateKey(d));

export interface WeekUsage {
  weekKey: string;
  used: number;
  limit: number;
  /** Allowance not used yet (0 when over). */
  left: number;
  over: boolean;
}

function usesByWeek(s: McState): Map<string, number> {
  const m = new Map<string, number>();
  for (const u of s.uses) {
    const k = weekKeyOf(new Date(u));
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function weekUsage(s: McState, weekKey: string): WeekUsage {
  const used = usesByWeek(s).get(weekKey) ?? 0;
  return { weekKey, used, limit: s.weeklyLimit, left: Math.max(0, s.weeklyLimit - used), over: used > s.weeklyLimit };
}

export const thisWeek = (s: McState, now: Date) => weekUsage(s, weekKeyOf(now));

/** Last `n` weeks (oldest first) since the first campus week. */
export function weekHistory(s: McState, now: Date, n = WEEK_HISTORY): WeekUsage[] {
  if (!s.firstStartedAt) return [];
  const first = weekKeyOf(new Date(s.firstStartedAt));
  const out: WeekUsage[] = [];
  for (let k = weekKeyOf(now), i = 0; i < n && k >= first; i++, k = addDays(k, -7)) out.unshift(weekUsage(s, k));
  return out;
}

/** Completed weeks in a row (most recent first, current week excluded) that stayed within the limit. */
export function weeksWithinStreak(s: McState, now: Date): number {
  if (!s.startedAt) return 0;
  const start = weekKeyOf(new Date(s.startedAt));
  let n = 0;
  for (let k = addDays(weekKeyOf(now), -7); k >= start; k = addDays(k, -7)) {
    if (weekUsage(s, k).over) break;
    n++;
  }
  return n;
}

// ---------- Shared ----------

export type DayStatus = 'none' | 'clean' | 'lapse' | 'use' | 'over';

export interface CalendarDay {
  key: string;
  status: DayStatus;
  today: boolean;
  /** Control path: allowance uses that day. */
  uses: number;
  /** Urges ridden out that day. */
  urges: number;
}

/**
 * Last `days` calendar days ending today. Quit path: clean or lapse days.
 * Control path: clean, used within the allowance, or a use beyond the week's allowance.
 */
export function calendar(s: McState, now: Date, days = CALENDAR_DAYS): CalendarDay[] {
  const today = toDateKey(now);
  const startKey = s.firstStartedAt ? toDateKey(new Date(s.firstStartedAt)) : s.startedAt ? toDateKey(new Date(s.startedAt)) : null;
  const lapseKeys = new Set(s.lapses.map((x) => toDateKey(new Date(x))));
  const urgeCount = new Map<string, number>();
  for (const u of s.urges) {
    if (!u.passed) continue;
    const k = toDateKey(new Date(u.at));
    urgeCount.set(k, (urgeCount.get(k) ?? 0) + 1);
  }
  // Control: per day uses, and whether a use that day went over the week's limit.
  const useCount = new Map<string, number>();
  const overDays = new Set<string>();
  const weekRunning = new Map<string, number>();
  for (const u of [...s.uses].sort((a, b) => time(a) - time(b))) {
    const d = new Date(u);
    const k = toDateKey(d);
    const w = weekKeyOf(d);
    const n = (weekRunning.get(w) ?? 0) + 1;
    weekRunning.set(w, n);
    useCount.set(k, (useCount.get(k) ?? 0) + 1);
    if (n > s.weeklyLimit) overDays.add(k);
  }
  const out: CalendarDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = addDays(today, -i);
    let status: DayStatus;
    if (!startKey || key < startKey) status = 'none';
    else if (s.mode === 'quit') status = lapseKeys.has(key) ? 'lapse' : 'clean';
    else status = overDays.has(key) ? 'over' : useCount.has(key) ? 'use' : 'clean';
    out.push({ key, status, today: key === today, uses: s.mode === 'control' ? (useCount.get(key) ?? 0) : 0, urges: urgeCount.get(key) ?? 0 });
  }
  return out;
}

export const checkScore = (answers: boolean[] | null) => (answers ? answers.filter(Boolean).length : 0);

/** Band for a self-check score (bands sorted by their max score). */
export function checkBand<B extends { id: string; max: number }>(score: number, bands: B[]): B | undefined {
  return [...bands].sort((a, b) => a.max - b.max).find((b) => score <= b.max) ?? bands[bands.length - 1];
}

export interface UrgeStats {
  total: number;
  passed: number;
  topTriggerId: string | null;
  topActionId: string | null;
}

function top(ids: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const id of ids) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [id, c] of counts) if (c > n) [best, n] = [id, c];
  return best;
}

export function urgeStats(urges: UrgeLog[]): UrgeStats {
  return {
    total: urges.length,
    passed: urges.filter((u) => u.passed).length,
    topTriggerId: top(urges.map((u) => u.triggerId)),
    // The action that most often helped.
    topActionId: top(urges.filter((u) => u.passed).map((u) => u.actionId)),
  };
}

export function listProgress(ids: string[], doneIds: string[]): { done: number; total: number; complete: boolean } {
  const done = ids.filter((id) => doneIds.includes(id)).length;
  return { done, total: ids.length, complete: ids.length > 0 && done === ids.length };
}

export const MC_GUIDE_STEP_IDS = ['what', 'cycle', 'environment', 'urges', 'lapse', 'support'] as const;

/** Guards imported data: unknown or broken fields fall back to defaults. */
export function sanitizeMcState(raw: unknown): McState {
  const d = defaultMcState();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return d;
  const r = raw as Record<string, unknown>;
  const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const startedAt = validIso(r.startedAt) ? r.startedAt : null;
  const baselineId = isBaselineId(r.baselineId) ? r.baselineId : null;
  const answers =
    Array.isArray(r.checkAnswers) && r.checkAnswers.length === CHECK_QUESTION_COUNT && r.checkAnswers.every((x) => typeof x === 'boolean') ? (r.checkAnswers as boolean[]) : null;
  return {
    setupDone: r.setupDone === true && startedAt !== null,
    mode: r.mode === 'quit' ? 'quit' : 'control',
    startedAt,
    firstStartedAt: validIso(r.firstStartedAt) ? r.firstStartedAt : startedAt,
    goalDays: typeof r.goalDays === 'number' && (QUIT_GOALS as readonly number[]).includes(r.goalDays) ? r.goalDays : DEFAULT_QUIT_GOAL,
    baselineId,
    weeklyLimit: baselineId ? BASELINE_LIMITS[baselineId] : d.weeklyLimit,
    attempt: typeof r.attempt === 'number' && Number.isFinite(r.attempt) ? Math.max(1, Math.round(r.attempt)) : 1,
    reasonIds: strArr(r.reasonIds),
    triggerIds: strArr(r.triggerIds),
    envDoneIds: strArr(r.envDoneIds),
    stepDoneIds: strArr(r.stepDoneIds),
    checkAnswers: answers,
    checkValues: typeof r.checkValues === 'boolean' ? r.checkValues : null,
    urges: Array.isArray(r.urges)
      ? r.urges
          .filter((u): u is Record<string, unknown> => typeof u === 'object' && u !== null && validIso((u as Record<string, unknown>).at))
          .map((u) => ({
            at: u.at as string,
            triggerId: typeof u.triggerId === 'string' ? u.triggerId : null,
            actionId: typeof u.actionId === 'string' ? u.actionId : null,
            passed: u.passed === true,
          }))
      : [],
    lapses: strArr(r.lapses).filter(validIso),
    uses: strArr(r.uses).filter(validIso),
  };
}
