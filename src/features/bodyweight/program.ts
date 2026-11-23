/**
 * Aletsiz Fitness (user request 2026-11-22): 11 categories; every category except Isınma has three
 * programmes — Toparla (30 days, 3 workouts a week), Geliştir (60 days, 4 a week), Güçlendir (90 days,
 * 5 a week). A workout is a circuit: each move for `workSec`, `restSec` between moves, `rounds` times,
 * `roundRestSec` between rounds. Phases make the weeks harder; every 4th week of the longer
 * programmes is a lighter week (one round less). Days run in a 7-day cycle; `trainDays` are the
 * workout days in it (0-based), the rest are rest days. Pure.
 */

export type CategoryId = 'karin' | 'gogus' | 'sirt' | 'omuz' | 'kol' | 'bacak' | 'kalca' | 'baldir' | 'tamVucut' | 'kardiyo' | 'isinma';
export type ProgramId = 'toparla' | 'gelistir' | 'guclendir';

export interface Workout {
  /** Workout letter within the phase (A, B, C), rotated session by session. */
  id: string;
  moves: string[];
  workSec: number;
  restSec: number;
  rounds: number;
  roundRestSec: number;
}

export interface Phase {
  /** 1-based weeks, inclusive. */
  fromWeek: number;
  toWeek: number;
  workouts: Workout[];
}

export interface Program {
  id: ProgramId;
  days: 30 | 60 | 90;
  /** Workout days in each 7-day cycle (0-based). */
  trainDays: number[];
  phases: Phase[];
  /** Every n-th week is lighter: one round less (min 1). */
  lightEvery?: number;
}

export interface CategoryDef {
  id: CategoryId;
  icon: string;
  /** Programmes in order (empty while the category is being prepared). */
  programs: Program[];
}

export const PROGRAM_ORDER: ProgramId[] = ['toparla', 'gelistir', 'guclendir'];

export const COUNTDOWN_SEC = 5;

export const weekOf = (day: number) => Math.floor((day - 1) / 7) + 1;
export const isTrainDay = (p: Program, day: number) => p.trainDays.includes((day - 1) % 7);
export const isLightWeek = (p: Program, week: number) => Boolean(p.lightEvery && week % p.lightEvery === 0 && week * 7 < p.days);

/** Workout days of the programme, in order (1-based day numbers). */
export const trainDayList = (p: Program) => Array.from({ length: p.days }, (_, i) => i + 1).filter((d) => isTrainDay(p, d));

export type DayPlan = { day: number; week: number; kind: 'rest' } | { day: number; week: number; kind: 'workout'; session: number; light: boolean; workout: Workout };

export function phaseOf(p: Program, week: number): Phase {
  return p.phases.find((ph) => week >= ph.fromWeek && week <= ph.toWeek) ?? p.phases[p.phases.length - 1]!;
}

/** What day `day` (1-based) of the programme is. Workouts rotate A, B, (C) within their phase. */
export function dayPlan(p: Program, day: number): DayPlan {
  const week = weekOf(day);
  if (!isTrainDay(p, day)) return { day, week, kind: 'rest' };
  const list = trainDayList(p);
  const session = list.indexOf(day) + 1;
  const phase = phaseOf(p, week);
  const firstInPhase = list.findIndex((d) => weekOf(d) >= phase.fromWeek);
  const base = phase.workouts[(list.indexOf(day) - firstInPhase) % phase.workouts.length]!;
  const light = isLightWeek(p, week);
  return { day, week, kind: 'workout', session, light, workout: light ? { ...base, rounds: Math.max(1, base.rounds - 1) } : base };
}

/** Seconds of a workout including the start countdown. */
export function workoutSec(w: Workout): number {
  const perRound = w.moves.length * w.workSec + (w.moves.length - 1) * w.restSec;
  return COUNTDOWN_SEC + w.rounds * perRound + (w.rounds - 1) * w.roundRestSec;
}

export interface WorkoutPhase {
  kind: 'countdown' | 'work' | 'rest';
  durationMs: number;
  /** Index into the flattened move list (round × moves); -1 for the countdown. */
  exerciseIndex: number;
  exerciseId: string;
  round: number;
}

/** Timed phases for the player: countdown, then each round's moves with rests between. */
export function workoutPhases(w: Workout): WorkoutPhase[] {
  const out: WorkoutPhase[] = [{ kind: 'countdown', durationMs: COUNTDOWN_SEC * 1000, exerciseIndex: -1, exerciseId: w.moves[0] ?? '', round: 1 }];
  let i = 0;
  for (let r = 1; r <= w.rounds; r++) {
    w.moves.forEach((m, k) => {
      out.push({ kind: 'work', durationMs: w.workSec * 1000, exerciseIndex: i, exerciseId: m, round: r });
      const last = k === w.moves.length - 1;
      const rest = last ? (r < w.rounds ? w.roundRestSec : 0) : w.restSec;
      // A rest shows what comes next.
      if (rest > 0) out.push({ kind: 'rest', durationMs: rest * 1000, exerciseIndex: i + 1, exerciseId: last ? w.moves[0]! : w.moves[k + 1]!, round: last ? r + 1 : r });
      i++;
    });
  }
  return out;
}

// ---------------------------------------------------------------- progress

/** A started programme: start date and the days done (day → date key). */
export interface ProgramProgress {
  programId: ProgramId;
  startedAt: string;
  done: Record<number, string>;
}

/**
 * Where the user is. Workouts go in order, one per calendar day at most; a rest day passes by itself
 * once a new calendar day has begun after the last workout. Returns the day to show and whether its
 * workout can be done today.
 */
export function currentDay(p: Program, pr: ProgramProgress, today: string): { day: number; finished: boolean; ready: boolean; lastDone?: string } {
  let lastDone: string | undefined;
  for (let d = 1; d <= p.days; d++) {
    if (pr.done[d]) {
      lastDone = pr.done[d];
      continue;
    }
    if (!isTrainDay(p, d)) {
      // A rest day: over once the day after the last workout has started.
      if (lastDone && lastDone < today) {
        lastDone = undefined;
        continue;
      }
      if (!lastDone) continue;
      return { day: d, finished: false, ready: false, lastDone };
    }
    return { day: d, finished: false, ready: !lastDone || lastDone < today, ...(lastDone ? { lastDone } : {}) };
  }
  return { day: p.days, finished: true, ready: false, ...(lastDone ? { lastDone } : {}) };
}

/** Workouts done out of all workout days. */
export function programDone(p: Program, pr: ProgramProgress): { done: number; total: number } {
  const list = trainDayList(p);
  return { done: list.filter((d) => pr.done[d]).length, total: list.length };
}
