import { CYCLE_DAYS, PLAN_LENGTH_DAYS } from '@/config/app';
import type { KegelExerciseType } from '@/types';

/**
 * The Kegel moves taught over the 180-day plan (user decision 2026-11-26). Each one is taught in a mini
 * lesson right after Tur 1 on its day (before Tur 2), like Yavaş Sıkma on day 1:
 *
 *  day  1  Yavaş Sıkma        slowly up, short hold at the top, let go
 *  day 11  Basamaklı Sıkma    ⅓ → ⅔ → full (the third step is the full squeeze), let go
 *  day 16  Basamaklı Bırakma  slowly up to full, then let go in three steps: ⅔ → ⅓ → 0
 *  day 24  Çift Zirve         full → down to half → full again → let go
 *  day 32  Hızlı Yarım Sıkma  quick squeezes that only go half way (1 s half / 1 s let go)
 *  day 45  Yarım Uzun Tutma   squeeze half way and hold it long
 *  day 55  Dalga              full → half → full → down to half and hold it long → let go
 *
 * A new move never removes the earlier ones. The latest learned move is in every round (Tur 1 and
 * Tur 2) until the next one is learned; the earlier new moves take turns in Tur 2, one a day in order.
 * Yavaş Sıkma stays where it always was, at the heart of Tur 2. Pure.
 */
export type MoveId = 'elevator' | 'step_up' | 'step_down' | 'double_peak' | 'half_quick' | 'half_hold' | 'wave';

export interface MoveDef {
  id: MoveId;
  /** 1-based plan day whose Tur 1 is followed by this move's lesson. */
  day: number;
}

export const MOVE_PROGRAM: readonly MoveDef[] = [
  { id: 'elevator', day: 1 },
  { id: 'step_up', day: 11 },
  { id: 'step_down', day: 16 },
  { id: 'double_peak', day: 24 },
  { id: 'half_quick', day: 32 },
  { id: 'half_hold', day: 45 },
  { id: 'wave', day: 55 },
];

export const MOVE_IDS: ReadonlySet<string> = new Set(MOVE_PROGRAM.map((m) => m.id));
/** The moves added on 2026-11-26 (Yavaş Sıkma is older). */
export const NEW_MOVE_TYPES: ReadonlySet<KegelExerciseType> = new Set(['step_up', 'step_down', 'double_peak', 'half_quick', 'half_hold', 'wave']);

/** 1-based day across the plan and the cycles after it: plan 1 day 1 = 1, the first cycle's day 1 = 181. */
export const absoluteDay = (planNumber: number, planDay: number) => (planNumber <= 1 ? 0 : PLAN_LENGTH_DAYS + (planNumber - 2) * CYCLE_DAYS) + Math.max(0, planDay) + 1;

/**
 * The endless 7-day cycle after the 180 days (2026-11-26): each day one move is the focus, in both
 * rounds; Tur 2 also repeats another one, so every move comes twice a week. Day 7 is the light day
 * (Tur 1 one cycle shorter) with Yavaş Sıkma and no repeat.
 */
export const CYCLE_FOCUS: readonly MoveId[] = ['step_up', 'step_down', 'double_peak', 'half_quick', 'half_hold', 'wave', 'elevator'];
const CYCLE_NEW = CYCLE_FOCUS.slice(0, 6);

/** What the learned moves add to a round on day `day` (0..6) of a cycle; a move not learned yet is left out. */
export function cycleMoves(learned: readonly MoveId[], day: number, round: 1 | 2): RoundMoves {
  const d = ((day % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS;
  const has = (id: MoveId) => learned.includes(id);
  const focus = has(CYCLE_FOCUS[d]!) ? CYCLE_FOCUS[d]! : learned[learned.length - 1];
  if (!focus) return {};
  if (round === 1) return { latest: focus };
  const again = d < 6 ? CYCLE_NEW[(d + 3) % 6]! : undefined;
  const review = again && has(again) && again !== focus ? again : undefined;
  return { ...(focus !== 'elevator' ? { latest: focus } : {}), ...(review ? { review } : {}) };
}

/**
 * Moves learned so far, in programme order. Yavaş Sıkma counts once its Tur 2 lesson was done — or once
 * any later move was learned (they only come after it), so the list never has a gap at the start.
 */
export function learnedMoves(t: { round2IntroDone?: boolean; movesLearned?: string[] }): MoveId[] {
  const got = new Set((t.movesLearned ?? []).filter((id) => MOVE_IDS.has(id)));
  if (t.round2IntroDone || got.size > 0) got.add('elevator');
  return MOVE_PROGRAM.filter((m) => got.has(m.id)).map((m) => m.id);
}

/**
 * The lesson due after today's Tur 1: the first move not learned yet whose day has come. Moves are
 * learned in order, so someone who is behind gets them one a day, never two at once.
 */
export function lessonDue(t: { round2IntroDone?: boolean; movesLearned?: string[] }, day: number): MoveId | null {
  const learned = new Set(learnedMoves(t));
  const next = MOVE_PROGRAM.find((m) => !learned.has(m.id));
  return next && next.day <= day ? next.id : null;
}

/** Moves someone on schedule has learned before Tur 1 of `day` (each lesson comes after Tur 1 of its day). */
export const plannedLearned = (day: number): MoveId[] => MOVE_PROGRAM.filter((m) => m.day < day).map((m) => m.id);

/** Adds a move to the learned list (kept in programme order, each once). */
export function withLearned(t: { round2IntroDone?: boolean; movesLearned?: string[] }, id: MoveId): string[] {
  const all = new Set([...(t.movesLearned ?? []), id]);
  return MOVE_PROGRAM.filter((m) => all.has(m.id) && m.id !== 'elevator').map((m) => m.id);
}

export type MoveRowState = 'current' | 'learned' | 'next' | 'locked';

/** Where each move of the 180-day plan stands for someone on `day` (İlerleme → Hareketlerin). */
export function moveRows(learned: readonly MoveId[], day: number): { id: MoveId; day: number; state: MoveRowState; daysLeft: number }[] {
  const latest = learned[learned.length - 1];
  const nextId = MOVE_PROGRAM.find((m) => !learned.includes(m.id))?.id;
  return MOVE_PROGRAM.map((m) => ({
    id: m.id,
    day: m.day,
    state: m.id === latest ? 'current' : learned.includes(m.id) ? 'learned' : m.id === nextId ? 'next' : 'locked',
    daysLeft: Math.max(0, m.day - day),
  }));
}

export interface RoundMoves {
  /** The latest learned move: in both rounds until the next one is learned. */
  latest?: MoveId;
  /** Tur 2 only: one of the earlier new moves, taking turns day by day. */
  review?: MoveId;
}

/**
 * What the learned moves add to a round on `day` (1-based absolute day). Tur 2 already has Yavaş
 * Sıkma, so while it is the latest move it adds nothing there; it never comes as a review either.
 */
export function roundMoves(learned: readonly MoveId[], day: number, round: 1 | 2): RoundMoves {
  const latest = learned[learned.length - 1];
  if (!latest) return {};
  if (round === 1) return { latest };
  const pool = learned.filter((id) => id !== 'elevator' && id !== latest);
  // In order, starting again from the first earlier move each time a new one is learned, so none is
  // left out longer than the others: with three earlier moves each comes every third day.
  const since = day - (MOVE_PROGRAM.find((m) => m.id === latest)?.day ?? 1);
  const review = pool.length ? pool[((since % pool.length) + pool.length) % pool.length] : undefined;
  return { ...(latest !== 'elevator' ? { latest } : {}), ...(review ? { review } : {}) };
}

// ---------------------------------------------------------------- how each move goes

/** One step of a rep: squeeze to `level` (0 = let go fully) over `sec`; `ramp` = slowly, over the whole step. */
export interface MoveStep {
  level: number;
  sec: number;
  ramp?: boolean;
}

export const THIRD = 1 / 3;
export const TWO_THIRDS = 2 / 3;
export const HALF = 0.5;

const lerp = (a: number, b: number, level: number) => Math.round(a + ((b - a) * (Math.min(30, Math.max(1, level)) - 1)) / 29);

export interface MoveBlockShape {
  steps: MoveStep[];
  reps: number;
}

/** Steps of one rep and the reps in a block, at a level (1..30). */
export function moveShape(id: Exclude<MoveId, 'elevator'>, level: number): MoveBlockShape {
  switch (id) {
    case 'step_up':
      return { steps: [{ level: THIRD, sec: 2 }, { level: TWO_THIRDS, sec: 2 }, { level: 1, sec: 2 }, { level: 0, sec: 3 }], reps: lerp(3, 5, level) };
    case 'step_down':
      return { steps: [{ level: 1, sec: 3, ramp: true }, { level: 1, sec: 1 }, { level: TWO_THIRDS, sec: 2 }, { level: THIRD, sec: 2 }, { level: 0, sec: 2 }], reps: lerp(3, 5, level) };
    case 'double_peak':
      return { steps: [{ level: 1, sec: 2 }, { level: HALF, sec: 2 }, { level: 1, sec: 2 }, { level: 0, sec: 3 }], reps: lerp(3, 5, level) };
    case 'half_quick':
      return { steps: [{ level: HALF, sec: 1 }, { level: 0, sec: 1 }], reps: lerp(10, 20, level) };
    case 'half_hold':
      return { steps: [{ level: HALF, sec: lerp(10, 16, level) }, { level: 0, sec: 4 }], reps: 2 };
    case 'wave':
      return { steps: [{ level: 1, sec: 2 }, { level: HALF, sec: 2 }, { level: 1, sec: 2 }, { level: HALF, sec: lerp(6, 10, level) }, { level: 0, sec: 3 }], reps: lerp(2, 3, level) };
  }
}

/** Most contractions one block of a new move can have (the longest at level 30). */
export const MAX_MOVE_BLOCK_REPS = Math.max(...(['step_up', 'step_down', 'double_peak', 'half_quick', 'half_hold', 'wave'] as const).map((id) => moveShape(id, 30).reps));
