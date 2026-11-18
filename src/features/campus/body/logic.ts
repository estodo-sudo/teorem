/**
 * Exercise campuses (Dik Boyun / Güçlü Kemer) — pure logic shared by both.
 *
 * - An 8-week programme with a target of 5 routine days per week (the evidence favours
 *   programmes kept up for 6+ weeks).
 * - The daily routine is a timeline of "get ready / hold / rest" phases built from the
 *   exercises' reps, hold and rest seconds (both sides for one-sided moves).
 * - A weekly self-measurement (head–wall distance, single-leg balance) shows the trend.
 */
export const DAY_MS = 24 * 60 * 60 * 1000;
export const BODY_IDS = ['neck', 'feet'] as const;
export type BodyId = (typeof BODY_IDS)[number];
/** Seconds to get into position before each exercise (and each side). */
export const PREP_SEC = 5;
/** A new measurement is suggested after this many days. */
export const MEASURE_EVERY_DAYS = 7;

export interface BodyExercise {
  id: string;
  emoji: string;
  title: string;
  steps: string[];
  reps: number;
  holdSec: number;
  restSec: number;
  /** One side at a time: the reps are done for each side. */
  sides: boolean;
  tip: string;
}

export interface BodySession {
  at: string;
  /** Exercises finished (not skipped) out of the routine's total. */
  done: number;
  total: number;
}

export interface BodyMeasure {
  at: string;
  value: number;
}

export interface BodyState {
  setupDone: boolean;
  startedAt: string | null;
  firstStartedAt: string | null;
  /** Red-flag symptoms ticked at enrolment (shown as a reminder to see a doctor). */
  redFlagIds: string[];
  /** Self-test answers by question id. */
  answers: Record<string, string>;
  sessions: BodySession[];
  measures: BodyMeasure[];
  checkDoneIds: string[];
  stepDoneIds: string[];
}

export const defaultBodyState = (): BodyState => ({
  setupDone: false,
  startedAt: null,
  firstStartedAt: null,
  redFlagIds: [],
  answers: {},
  sessions: [],
  measures: [],
  checkDoneIds: [],
  stepDoneIds: [],
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const iso = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Accepts persisted or imported data; anything malformed falls back to defaults. */
export function sanitizeBodyState(raw: unknown): BodyState {
  const d = defaultBodyState();
  if (!isObj(raw)) return d;
  const answers: Record<string, string> = {};
  if (isObj(raw.answers)) for (const [k, v] of Object.entries(raw.answers)) if (typeof v === 'string') answers[k] = v;
  const sessions = Array.isArray(raw.sessions)
    ? raw.sessions.flatMap((x) => {
        if (!isObj(x)) return [];
        const at = iso(x.at);
        const done = num(x.done);
        const total = num(x.total);
        return at && done !== null && total !== null && total > 0 ? [{ at, done: Math.max(0, Math.min(done, total)), total }] : [];
      })
    : [];
  const measures = Array.isArray(raw.measures)
    ? raw.measures.flatMap((x) => {
        if (!isObj(x)) return [];
        const at = iso(x.at);
        const value = num(x.value);
        return at && value !== null && value >= 0 ? [{ at, value }] : [];
      })
    : [];
  const startedAt = iso(raw.startedAt);
  return {
    setupDone: raw.setupDone === true && startedAt !== null,
    startedAt,
    firstStartedAt: iso(raw.firstStartedAt) ?? startedAt,
    redFlagIds: strs(raw.redFlagIds),
    answers,
    sessions,
    measures,
    checkDoneIds: strs(raw.checkDoneIds),
    stepDoneIds: strs(raw.stepDoneIds),
  };
}

export const bodyPhase = (s: BodyState): 'setup' | 'active' => (s.setupDone && s.startedAt ? 'active' : 'setup');

/** Local calendar day key (YYYY-MM-DD). */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** A session counts towards the programme when at least half of the routine was done. */
export const sessionCounts = (x: BodySession) => x.done * 2 >= x.total;

/** Days with a counted routine. */
export function routineDays(s: BodyState): Set<string> {
  return new Set(s.sessions.filter(sessionCounts).map((x) => dayKey(new Date(x.at))));
}

export const doneToday = (s: BodyState, now: Date) => routineDays(s).has(dayKey(now));

/** Days since the programme started (day 0 = enrolment day), by calendar day. */
export function programDayIndex(s: BodyState, now: Date): number {
  if (!s.startedAt) return 0;
  return Math.max(0, Math.round((startOfDay(now).getTime() - startOfDay(new Date(s.startedAt)).getTime()) / DAY_MS));
}

/** 1-based programme week (keeps counting after the last planned week). */
export const programWeek = (s: BodyState, now: Date) => Math.floor(programDayIndex(s, now) / 7) + 1;

/** Counted routine days in the current programme week. */
export function weekRoutineDays(s: BodyState, now: Date): number {
  if (!s.startedAt) return 0;
  const start = startOfDay(new Date(s.startedAt));
  const weekStart = addDays(start, (programWeek(s, now) - 1) * 7);
  const days = routineDays(s);
  let n = 0;
  for (let i = 0; i < 7; i += 1) if (days.has(dayKey(addDays(weekStart, i)))) n += 1;
  return n;
}

/** Consecutive routine days up to today (or yesterday, while today is still open). */
export function streakDays(s: BodyState, now: Date): number {
  const days = routineDays(s);
  let d = days.has(dayKey(now)) ? startOfDay(now) : addDays(now, -1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

/** Programme calendar: one row per week, one cell per day ('done' | 'missed' | 'today' | 'future'). */
export type DayCell = 'done' | 'missed' | 'today' | 'future';
export function programGrid(s: BodyState, weeks: number, now: Date): DayCell[][] {
  if (!s.startedAt) return [];
  const start = startOfDay(new Date(s.startedAt));
  const days = routineDays(s);
  const today = dayKey(now);
  const todayMs = startOfDay(now).getTime();
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, w * 7 + i);
      const k = dayKey(d);
      if (days.has(k)) return 'done';
      if (k === today) return 'today';
      return d.getTime() < todayMs ? 'missed' : 'future';
    }),
  );
}

/** Share of the programme done: counted routine days out of weeks × weekly target. */
export function programProgress(s: BodyState, weeks: number, weeklyTarget: number): number {
  return Math.min(1, routineDays(s).size / (weeks * weeklyTarget));
}

// ── Measurements ──────────────────────────────────────────────────────────────

const byTime = (a: BodyMeasure, b: BodyMeasure) => Date.parse(a.at) - Date.parse(b.at);
export const sortedMeasures = (s: BodyState) => [...s.measures].sort(byTime);

/** True when there is no measurement in the last week. */
export function measureDue(s: BodyState, now: Date): boolean {
  const all = sortedMeasures(s);
  const last = all[all.length - 1];
  return !last || now.getTime() - Date.parse(last.at) >= MEASURE_EVERY_DAYS * DAY_MS;
}

/**
 * First vs latest measurement. `improved` follows the measure's direction
 * (lower head–wall distance, longer balance). Null with fewer than two measurements.
 */
export function measureTrend(s: BodyState, better: 'lower' | 'higher'): { first: number; last: number; delta: number; improved: boolean } | null {
  const m = sortedMeasures(s);
  if (m.length < 2) return null;
  const first = m[0]!.value;
  const last = m[m.length - 1]!.value;
  const delta = Math.round((last - first) * 10) / 10;
  return {
    first,
    last,
    delta,
    improved: better === 'lower' ? delta < 0 : delta > 0,
  };
}

/** Rounds to the measure's step and clamps to its range. */
export function clampMeasure(v: number, min: number, max: number, step: number): number {
  const r = Math.round(v / step) * step;
  return Math.min(max, Math.max(min, Math.round(r * 10) / 10));
}

// ── Routine timeline ──────────────────────────────────────────────────────────

export type PhaseKind = 'prep' | 'hold' | 'rest';
/** A routine phase, in the shape the shared player state machine expects. */
export interface Phase {
  exerciseIndex: number;
  durationMs: number;
  /** 0/1 for one-sided moves (first/second side), null otherwise. */
  side: 0 | 1 | null;
  /** 1-based repetition. */
  rep: number;
  kind: PhaseKind;
}

/**
 * Phases of a routine: for each exercise (and side) a short "get ready", then each
 * repetition as hold + rest. The rest after the last repetition of a side is dropped.
 */
export function buildTimeline(exercises: BodyExercise[], prepSec = PREP_SEC): Phase[] {
  const out: Phase[] = [];
  exercises.forEach((e, exerciseIndex) => {
    const sides: (0 | 1 | null)[] = e.sides ? [0, 1] : [null];
    for (const side of sides) {
      out.push({
        exerciseIndex,
        side,
        rep: 1,
        kind: 'prep',
        durationMs: prepSec * 1000,
      });
      for (let rep = 1; rep <= e.reps; rep += 1) {
        out.push({
          exerciseIndex,
          side,
          rep,
          kind: 'hold',
          durationMs: e.holdSec * 1000,
        });
        if (rep < e.reps && e.restSec > 0)
          out.push({
            exerciseIndex,
            side,
            rep,
            kind: 'rest',
            durationMs: e.restSec * 1000,
          });
      }
    }
  });
  return out;
}

export const timelineSeconds = (phases: Phase[]) => phases.reduce((a, p) => a + p.durationMs, 0) / 1000;
/** Rounded routine length in minutes (at least 1). */
export const routineMinutes = (exercises: BodyExercise[]) => Math.max(1, Math.round(timelineSeconds(buildTimeline(exercises)) / 60));
