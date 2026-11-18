/**
 * Smoking cessation campus — pure logic (no React, no storage).
 *
 * Approach (see content sources): pick a quit day, stop completely on that day
 * ("not a puff" after the quit date), plan for triggers, ride out cravings
 * (they usually pass within ~5 minutes) and aim for 28 smoke-free days.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** Staying smoke-free this long makes quitting for good much more likely (NHS). */
export const KEY_MILESTONE_DAYS = 28;
/** Guided craving session length. Most cravings pass within 3–5 minutes. */
export const CRAVING_SESSION_SEC = 300;

export const CIGS_PER_DAY_MIN = 1;
export const CIGS_PER_DAY_MAX = 80;
export const PACK_SIZE_DEFAULT = 20;
export const PACK_PRICE_MAX = 10_000;

export interface CravingLog {
  at: string;
  triggerId: string | null;
  /** True when the user rode it out without smoking. */
  passed: boolean;
}

export interface SymptomLog {
  at: string;
  symptomId: string;
}

export interface SmokingCampusState {
  setupDone: boolean;
  /** ISO time the smoke-free period starts (may be in the future while preparing). */
  quitAt: string | null;
  cigsPerDay: number;
  /** Price of one pack in the user's currency (TL). 0 = not given. */
  packPrice: number;
  cigsPerPack: number;
  reasonIds: string[];
  triggerIds: string[];
  prepDoneIds: string[];
  /** Guide sections the user has gone through (all of them after enrolment). */
  stepDoneIds: string[];
  cravings: CravingLog[];
  /** ISO times of slips (smoked after the quit date). */
  slips: string[];
  /** Withdrawal symptoms the user marked as experienced (one entry per time). */
  symptomLogs: SymptomLog[];
  /** 1 for the first quit attempt, +1 on each fresh start. */
  attempt: number;
}

export const defaultSmokingState = (): SmokingCampusState => ({
  setupDone: false,
  quitAt: null,
  cigsPerDay: 10,
  packPrice: 0,
  cigsPerPack: PACK_SIZE_DEFAULT,
  reasonIds: [],
  triggerIds: [],
  prepDoneIds: [],
  stepDoneIds: [],
  cravings: [],
  slips: [],
  symptomLogs: [],
  attempt: 1,
});

export type SmokingPhase = 'setup' | 'preparing' | 'smokeFree';

export function smokingPhase(s: SmokingCampusState, now: Date): SmokingPhase {
  if (!s.setupDone || !s.quitAt) return 'setup';
  return new Date(s.quitAt).getTime() > now.getTime() ? 'preparing' : 'smokeFree';
}

export function smokeFreeMs(s: SmokingCampusState, now: Date): number {
  if (!s.quitAt) return 0;
  return Math.max(0, now.getTime() - new Date(s.quitAt).getTime());
}

export function splitDuration(ms: number): { days: number; hours: number; minutes: number } {
  const total = Math.max(0, Math.floor(ms / MINUTE_MS));
  return { days: Math.floor(total / 1440), hours: Math.floor((total % 1440) / 60), minutes: total % 60 };
}

/** Whole cigarettes not smoked since the quit time. */
export function cigsAvoided(s: SmokingCampusState, now: Date): number {
  return Math.floor((smokeFreeMs(s, now) / DAY_MS) * s.cigsPerDay);
}

/** Money not spent, from cigarettes avoided × price per cigarette (0 when no price given). */
export function moneySaved(s: SmokingCampusState, now: Date): number {
  if (s.packPrice <= 0 || s.cigsPerPack <= 0) return 0;
  return Math.floor((cigsAvoided(s, now) * s.packPrice) / s.cigsPerPack);
}

/** Projected spend per month (30 days) at the user's previous habit. */
export function monthlyCost(s: Pick<SmokingCampusState, 'cigsPerDay' | 'packPrice' | 'cigsPerPack'>): number {
  if (s.packPrice <= 0 || s.cigsPerPack <= 0) return 0;
  return Math.round((s.cigsPerDay * 30 * s.packPrice) / s.cigsPerPack);
}

/** 0..1 progress towards the 28 smoke-free days milestone. */
export function keyMilestoneProgress(s: SmokingCampusState, now: Date): number {
  return Math.min(1, smokeFreeMs(s, now) / (KEY_MILESTONE_DAYS * DAY_MS));
}

export interface Milestone {
  id: string;
  /** Hours after the quit time. */
  hours: number;
}

export interface MilestoneStatus<M extends Milestone> {
  milestone: M;
  reached: boolean;
  /** 0..1 progress from the previous milestone to this one. */
  progress: number;
}

export function milestoneStatuses<M extends Milestone>(milestones: M[], elapsedMs: number): MilestoneStatus<M>[] {
  const sorted = [...milestones].sort((a, b) => a.hours - b.hours);
  return sorted.map((m, i) => {
    const startMs = i === 0 ? 0 : sorted[i - 1]!.hours * HOUR_MS;
    const endMs = m.hours * HOUR_MS;
    const reached = elapsedMs >= endMs;
    const progress = reached ? 1 : elapsedMs <= startMs ? 0 : (elapsedMs - startMs) / (endMs - startMs);
    return { milestone: m, reached, progress };
  });
}

/** The first milestone not reached yet, or null when all are reached. */
export function nextMilestone<M extends Milestone>(milestones: M[], elapsedMs: number): MilestoneStatus<M> | null {
  return milestoneStatuses(milestones, elapsedMs).find((x) => !x.reached) ?? null;
}

export type QuitDayChoice = 'now' | 'tomorrow' | 'in3' | 'in7';
export const QUIT_DAY_CHOICES: QuitDayChoice[] = ['now', 'tomorrow', 'in3', 'in7'];

/** "now" starts immediately; the others start at local midnight of that day. */
export function quitAtFromChoice(choice: QuitDayChoice, now: Date): Date {
  if (choice === 'now') return new Date(now.getTime());
  const days = choice === 'tomorrow' ? 1 : choice === 'in3' ? 3 : 7;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 0, 0, 0, 0);
  return d;
}

/** Calendar days until the quit day (1 = tomorrow). 0 once it has started. */
export function daysUntilQuit(s: SmokingCampusState, now: Date): number {
  if (!s.quitAt) return 0;
  const q = new Date(s.quitAt);
  if (q.getTime() <= now.getTime()) return 0;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.max(1, Math.round((startOf(q) - startOf(now)) / DAY_MS));
}

export function clampCigsPerDay(n: number): number {
  if (!Number.isFinite(n)) return CIGS_PER_DAY_MIN;
  return Math.min(CIGS_PER_DAY_MAX, Math.max(CIGS_PER_DAY_MIN, Math.round(n)));
}

/** Parses a user-typed price ("85", "85,50", "85.5"); invalid or negative → 0. */
export function parsePrice(text: string): number {
  const n = Number(text.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(PACK_PRICE_MAX, Math.round(n * 100) / 100);
}

export interface CravingStats {
  total: number;
  passed: number;
  /** Most frequent trigger id among logged cravings, or null. */
  topTriggerId: string | null;
}

export function cravingStats(cravings: CravingLog[]): CravingStats {
  const counts = new Map<string, number>();
  let passed = 0;
  for (const c of cravings) {
    if (c.passed) passed++;
    if (c.triggerId) counts.set(c.triggerId, (counts.get(c.triggerId) ?? 0) + 1);
  }
  let top: string | null = null;
  let best = 0;
  for (const [id, n] of counts) {
    if (n > best) {
      best = n;
      top = id;
    }
  }
  return { total: cravings.length, passed, topTriggerId: top };
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

/** Local time of day: morning 05–12, afternoon 12–17, evening 17–22, night 22–05. */
export function dayPartOf(d: Date): DayPart {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

/** Time of day cravings come most often (needs 3+ cravings and a repeat), or null. */
export function cravingPeakPart(cravings: CravingLog[]): DayPart | null {
  if (cravings.length < 3) return null;
  const counts = new Map<DayPart, number>();
  for (const c of cravings) {
    const d = new Date(c.at);
    if (Number.isNaN(d.getTime())) continue;
    const p = dayPartOf(d);
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  let best = 1;
  let peak: DayPart | null = null;
  for (const [p, n] of counts) {
    if (n > best) {
      best = n;
      peak = p;
    }
  }
  return peak;
}

/** Slips logged in the current attempt (after its quit time). */
export function slipsThisAttempt(s: Pick<SmokingCampusState, 'slips' | 'quitAt'>): number {
  if (!s.quitAt) return 0;
  const q = new Date(s.quitAt).getTime();
  return s.slips.filter((x) => new Date(x).getTime() > q).length;
}

/**
 * One slip is forgiven and the counter goes on; a second slip in the same
 * attempt ends it (the user is asked to confirm first, in the UI).
 */
export function nextSlipEndsAttempt(s: Pick<SmokingCampusState, 'slips' | 'quitAt'>): boolean {
  return slipsThisAttempt(s) >= 1;
}

/** Starts a new attempt: the smoke-free period restarts now. */
export function startOver(s: SmokingCampusState, now: Date): SmokingCampusState {
  return { ...s, quitAt: now.toISOString(), attempt: s.attempt + 1 };
}

/** Guide section ids in reading order (must match the content file). */
export const GUIDE_STEP_IDS = ['why', 'prepare', 'quitday', 'week1', 'cravings', 'day28'] as const;
export type GuideStepId = (typeof GUIDE_STEP_IDS)[number];

/** The guide section most relevant right now, offered as a shortcut on the campus home. */
export function recommendedGuideStep(s: SmokingCampusState, now: Date): GuideStepId {
  const phase = smokingPhase(s, now);
  if (phase === 'setup') return 'why';
  if (phase === 'preparing') return 'prepare';
  const days = Math.floor(smokeFreeMs(s, now) / DAY_MS);
  if (days < 1) return 'quitday';
  if (days < 7) return 'week1';
  if (days < KEY_MILESTONE_DAYS) return 'cravings';
  return 'day28';
}

/** Preparation checklist progress; the list stays on the campus home until every item is done. */
export function prepProgress(prepIds: string[], doneIds: string[]): { done: number; total: number; complete: boolean } {
  const done = prepIds.filter((id) => doneIds.includes(id)).length;
  return { done, total: prepIds.length, complete: prepIds.length > 0 && done === prepIds.length };
}

/** How many times each symptom was logged. */
export function symptomCounts(logs: SymptomLog[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of logs) out[l.symptomId] = (out[l.symptomId] ?? 0) + 1;
  return out;
}

/** Most often logged symptom (first logged wins ties), or null. */
export function topSymptom(logs: SymptomLog[]): { id: string; count: number } | null {
  const counts = symptomCounts(logs);
  let best: { id: string; count: number } | null = null;
  for (const l of logs) {
    const c = counts[l.symptomId]!;
    if (!best || c > best.count) best = { id: l.symptomId, count: c };
  }
  return best;
}

/** Removes the most recent log of one symptom (undo a mistaken tap). */
export function removeLastSymptomLog(logs: SymptomLog[], symptomId: string): SymptomLog[] {
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i]!.symptomId === symptomId) return [...logs.slice(0, i), ...logs.slice(i + 1)];
  }
  return logs;
}

/** Whole number with Turkish thousands separators: 12500 → "12.500" (no Intl dependency). */
export function formatThousands(n: number): string {
  const v = Math.round(Math.abs(n));
  const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return n < 0 && v !== 0 ? `-${s}` : s;
}

/** Guards imported data: unknown or broken fields fall back to defaults. */
export function sanitizeSmokingState(raw: unknown): SmokingCampusState {
  const d = defaultSmokingState();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return d;
  const r = raw as Record<string, unknown>;
  const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  const quitAt = typeof r.quitAt === 'string' && !Number.isNaN(new Date(r.quitAt).getTime()) ? r.quitAt : null;
  const cravings = Array.isArray(r.cravings)
    ? r.cravings
        .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null && typeof (c as Record<string, unknown>).at === 'string')
        .map((c) => ({ at: c.at as string, triggerId: typeof c.triggerId === 'string' ? c.triggerId : null, passed: c.passed === true }))
    : [];
  return {
    setupDone: r.setupDone === true && quitAt !== null,
    quitAt,
    cigsPerDay: clampCigsPerDay(num(r.cigsPerDay, d.cigsPerDay)),
    packPrice: Math.min(PACK_PRICE_MAX, Math.max(0, num(r.packPrice, 0))),
    cigsPerPack: Math.max(1, Math.round(num(r.cigsPerPack, PACK_SIZE_DEFAULT))),
    reasonIds: strArr(r.reasonIds),
    triggerIds: strArr(r.triggerIds),
    prepDoneIds: strArr(r.prepDoneIds),
    stepDoneIds: strArr(r.stepDoneIds),
    cravings,
    slips: strArr(r.slips),
    symptomLogs: Array.isArray(r.symptomLogs)
      ? r.symptomLogs
          .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null && typeof (x as Record<string, unknown>).at === 'string' && typeof (x as Record<string, unknown>).symptomId === 'string')
          .map((x) => ({ at: x.at as string, symptomId: x.symptomId as string }))
      : [],
    attempt: Math.max(1, Math.round(num(r.attempt, 1))),
  };
}
