import { CYCLE_DAYS, LEGACY_PLAN_LENGTH_DAYS, PLAN_LENGTH_DAYS } from '@/config/app';
import type { DailyTarget, DurationPreset, Feedback, TrackId, TrainingState } from '@/types';

import { adjustLevel } from './adjustLevel';
import { clampLevel } from './levels';
import { MOVE_IDS } from './moves';
import { levelLocked, planWeekNumber } from './schedule';

/** Days in plan `planNumber`: the 180-day plan first, then 7-day cycles for ever. */
export const planLengthOf = (planNumber: number) => (planNumber <= 1 ? PLAN_LENGTH_DAYS : CYCLE_DAYS);
/** Whether plan `planNumber` is one of the endless 7-day cycles after the 180 days. */
export const isCycle = (planNumber: number) => planNumber >= 2;
/** Plan number and day for `days` days done in all (the 180 days, then 7-day cycles). */
export function positionFromDays(days: number): { planNumber: number; planDayIndex: number } {
  const d = Math.max(0, Math.floor(days));
  if (d < PLAN_LENGTH_DAYS) return { planNumber: 1, planDayIndex: d };
  return { planNumber: 2 + Math.floor((d - PLAN_LENGTH_DAYS) / CYCLE_DAYS), planDayIndex: (d - PLAN_LENGTH_DAYS) % CYCLE_DAYS };
}
/** Days done in all before plan `planNumber`, day `planDay`. */
export const daysBefore = (planNumber: number, planDay: number) => (planNumber <= 1 ? 0 : PLAN_LENGTH_DAYS + (planNumber - 2) * CYCLE_DAYS) + Math.max(0, planDay);

const TRACKS: TrackId[] = ['general', 'erection', 'control', 'bladder', 'surgery', 'relax'];
const PRESETS: DurationPreset[] = ['quick', 'standard', 'full'];

export const defaultTraining = (): TrainingState => ({
  level: 1,
  consecutiveOk: 0,
  planDayIndex: 0,
  planNumber: 1,
  lastAdvancedDate: null,
  repeatNextDay: false,
  track: 'general',
  durationPreset: 'standard',
  dailyTarget: 2,
  weekIndex: 0,
  dayIndex: 0,
  consecutiveHard: 0,
  lastDeloadWeek: -1,
  freezeTokens: 2,
  freezeMonth: null,
  planLength: PLAN_LENGTH_DAYS,
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const int = (v: unknown, fallback: number, min = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.floor(v)) : fallback);
const dateKey = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/**
 * v1 → v2 migration and sanitising (SPEC_KEGEL_V2 §14): the level and plan position are kept,
 * track = general, preset = standard; the programme week is derived from the plans done so far.
 * Accepts anything (stored state, an imported backup) and always returns a valid state.
 */
export function migrateTraining(raw: unknown): TrainingState {
  const d = defaultTraining();
  if (!isObj(raw)) return d;
  // Plans saved before 2026-11-26 were 30 days long: the days done so far carry over onto the 180-day
  // plan (plan 2 day 5 of the old plan = day 35 now) and, past 180, into the 7-day cycles — once; the
  // result is saved with planLength.
  const savedNumber = int(raw.planNumber, 1, 1);
  const days =
    raw.planLength === PLAN_LENGTH_DAYS
      ? daysBefore(savedNumber, Math.min(planLengthOf(savedNumber) - 1, int(raw.planDayIndex, 0)))
      : (savedNumber - 1) * LEGACY_PLAN_LENGTH_DAYS + Math.min(LEGACY_PLAN_LENGTH_DAYS - 1, int(raw.planDayIndex, 0));
  const { planNumber, planDayIndex } = positionFromDays(days);
  const weekIndex = int(raw.weekIndex, Math.floor(days / 7));
  const vacation = isObj(raw.vacation) && dateKey(raw.vacation.from) && dateKey(raw.vacation.to) ? { from: raw.vacation.from as string, to: raw.vacation.to as string } : undefined;
  const lock = dateKey(raw.levelLockUntil);
  return {
    level: clampLevel(int(raw.level, 1, 1)),
    consecutiveOk: int(raw.consecutiveOk, 0),
    planDayIndex,
    planNumber,
    lastAdvancedDate: dateKey(raw.lastAdvancedDate) ?? null,
    repeatNextDay: raw.repeatNextDay === true,
    track: TRACKS.includes(raw.track as TrackId) ? (raw.track as TrackId) : d.track,
    durationPreset: PRESETS.includes(raw.durationPreset as DurationPreset) ? (raw.durationPreset as DurationPreset) : d.durationPreset,
    dailyTarget: ([1, 2, 3, 4] as const).includes(raw.dailyTarget as DailyTarget) ? (raw.dailyTarget as DailyTarget) : d.dailyTarget,
    weekIndex,
    dayIndex: Math.min(6, int(raw.dayIndex, days % 7)),
    consecutiveHard: int(raw.consecutiveHard, 0),
    // Plan-week number of the last deload (-1 = none yet).
    lastDeloadWeek: typeof raw.lastDeloadWeek === 'number' && Number.isFinite(raw.lastDeloadWeek) ? Math.max(-1, Math.floor(raw.lastDeloadWeek)) : -1,
    freezeTokens: Math.min(2, int(raw.freezeTokens, 2)),
    freezeMonth: typeof raw.freezeMonth === 'string' && /^\d{4}-\d{2}$/.test(raw.freezeMonth) ? raw.freezeMonth : null,
    ...(vacation ? { vacation } : {}),
    ...(lock ? { levelLockUntil: lock } : {}),
    ...(raw.round2IntroDone === true ? { round2IntroDone: true } : {}),
    planLength: PLAN_LENGTH_DAYS,
    ...(Array.isArray(raw.movesLearned) ? { movesLearned: learnedFrom(raw.movesLearned) } : {}),
    ...(PRESETS.includes(raw.nextPresetOnce as DurationPreset) ? { nextPresetOnce: raw.nextPresetOnce as DurationPreset } : {}),
    ...(Array.isArray(raw.frozenDays) ? { frozenDays: (raw.frozenDays as unknown[]).filter((d): d is string => Boolean(dateKey(d))).slice(-62) } : {}),
    ...(dateKey(raw.lastReturnCheck) ? { lastReturnCheck: raw.lastReturnCheck as string } : {}),
    ...(isObj(raw.returnNotice) && ['gentle', 'rewarm', 'frozen'].includes(raw.returnNotice.kind as string) && dateKey(raw.returnNotice.date)
      ? { returnNotice: { kind: raw.returnNotice.kind as 'gentle' | 'rewarm' | 'frozen', date: raw.returnNotice.date as string, days: int(raw.returnNotice.days, 0) } }
      : {}),
  };
}

/** Known move ids only, each once, in the order given. */
function learnedFrom(v: unknown[]): string[] {
  return v.filter((x, i): x is string => typeof x === 'string' && MOVE_IDS.has(x) && v.indexOf(x) === i);
}

/** The plan day (0-based) that today's main session belongs to. */
export function todayPlanDay(t: TrainingState, today: string): number {
  if (t.lastAdvancedDate === today) {
    // Already advanced today → extra sessions replay today's day (the last day of the plan just finished).
    return t.planDayIndex === 0 ? planLengthOf(t.planNumber - 1) - 1 : t.planDayIndex - 1;
  }
  return t.planDayIndex;
}

/** Plan number and plan day of today's main session (extra sessions keep the finished day's plan). */
export function todayPlanPosition(t: TrainingState, today: string): { planNumber: number; planDay: number } {
  const planDay = todayPlanDay(t, today);
  // Just rolled over to the next plan today → the finished day belonged to the previous plan.
  const planNumber = t.lastAdvancedDate === today && t.planDayIndex === 0 ? Math.max(1, t.planNumber - 1) : t.planNumber;
  return { planNumber, planDay };
}

/** Programme week of today's main session (extra sessions keep the week of the finished day). */
export function todayWeekIndex(t: TrainingState, today: string): number {
  return t.lastAdvancedDate === today && t.dayIndex === 0 ? Math.max(0, t.weekIndex - 1) : t.weekIndex;
}

/** Whether the plan was already advanced (main session done) today. */
export function advancedToday(t: TrainingState, today: string): boolean {
  return t.lastAdvancedDate === today;
}

export interface SessionOutcome {
  date: string;
  feedback: Feedback;
  completionRate?: number;
  pauses?: number;
  skippedBlocks?: number;
  /** The session ran in a deload week (remembered so the schedule moves on). */
  deload?: boolean;
  /** This session already moved the plan on when it finished (recordWorkout). */
  advancedPlan?: boolean;
}

/**
 * Moves the plan (the 180 days, then the 7-day cycles) and the programme week one day on, once per date. Called when a main session
 * finishes (2026-11-23 fix: it used to wait for the "Nasıldı?" answers, so leaving that screen kept the
 * plan on the same day).
 */
export function advancePlan(t: TrainingState, date: string): TrainingState {
  if (t.lastAdvancedDate === date) return t;
  let day = t.planDayIndex + 1;
  let plan = t.planNumber;
  // the 180-day plan, then a 7-day cycle after another
  if (day >= planLengthOf(plan)) {
    day = 0;
    plan += 1;
  }
  return { ...t, planDayIndex: day, planNumber: plan, lastAdvancedDate: date, repeatNextDay: false, dayIndex: (t.dayIndex + 1) % 7, weekIndex: t.weekIndex + (t.dayIndex + 1 >= 7 ? 1 : 0) };
}

/** Takes today's advance back ("Tamamlayamadım" after the plan already moved on), so the day repeats. */
export function undoAdvance(t: TrainingState, date: string): TrainingState {
  if (t.lastAdvancedDate !== date) return t;
  const rolled = t.planDayIndex === 0;
  return {
    ...t,
    planDayIndex: rolled ? planLengthOf(t.planNumber - 1) - 1 : t.planDayIndex - 1,
    planNumber: rolled ? Math.max(1, t.planNumber - 1) : t.planNumber,
    lastAdvancedDate: null,
    dayIndex: (t.dayIndex + 6) % 7,
    weekIndex: t.dayIndex === 0 ? Math.max(0, t.weekIndex - 1) : t.weekIndex,
  };
}

/**
 * Applies a finished main session to the training state: level adjustment v2 + (once per day)
 * advancing the plan and the programme week. "Could not finish" repeats the day.
 */
export function applySessionResult(t: TrainingState, result: SessionOutcome): TrainingState {
  const adj = adjustLevel(
    { level: t.level, consecutiveOk: t.consecutiveOk, consecutiveHard: t.consecutiveHard ?? 0 },
    { feedback: result.feedback, completionRate: result.completionRate, pauses: result.pauses, skippedBlocks: result.skippedBlocks, locked: levelLocked(result.date, t.levelLockUntil) },
  );
  const next: TrainingState = { ...t, level: adj.level, consecutiveOk: adj.consecutiveOk, consecutiveHard: adj.consecutiveHard };
  // One session length now: "hard" keeps the level (two in a row → down), no shorter preset.
  delete next.suggestShorter;
  if (result.deload) {
    const pos = todayPlanPosition(t, result.date);
    next.lastDeloadWeek = planWeekNumber(pos.planNumber, pos.planDay);
  }
  delete next.nextPresetOnce;
  if (adj.repeatDay) {
    // Only this session's own advance is taken back (not one made by an earlier session today).
    return { ...(result.advancedPlan ? undoAdvance(next, result.date) : next), repeatNextDay: true };
  }
  return advancePlan(next, result.date);
}

/** Non-punishing return after missed days (§6.6): the level goes down by the policy's delta. */
export function applyReturn(t: TrainingState, levelDelta: 0 | -1 | -2): TrainingState {
  return levelDelta === 0 ? t : { ...t, level: clampLevel(t.level + levelDelta), consecutiveOk: 0, consecutiveHard: 0 };
}

/** Manual level change from settings. */
export function setManualLevel(t: TrainingState, level: number): TrainingState {
  return { ...t, level: clampLevel(level), consecutiveOk: 0, consecutiveHard: 0 };
}
