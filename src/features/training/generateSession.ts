import { createRng, shuffle } from '@/lib/random';
import type { KegelExerciseType } from '@/types';

import { clampLevel, getLevel, REST_SEC, ROUND2_ORDER, SLOW_PAUSE_SEC, SLOW_TOP_SEC, SLOW_UP_SEC, slowReps, type LevelParams } from './levels';
import { moveShape, type MoveId, type RoundMoves } from './moves';
import { CONTRACTION_TYPES, KEGEL_CUES } from './tracks';
import type { GeneratedSession, Phase, SessionBlock, SessionExercise } from './types';

/**
 * Kegel session (user decision 2026-11-22), modelled on three exercises:
 *
 *  Tur 1  (uzun sıkma → dinlen → hızlı sık-bırak → dinlen) × cycles → uzun sıkma
 *  Tur 2  yavaş sıkma → dinlen → hızlı sık-bırak → dinlen → yavaş sıkma → dinlen → uzun sıkma, optional after Tur 1
 *
 * 180-day plan (2026-11-26): the latest learned move (moves.ts) is added to both rounds — in Tur 1
 * before the last uzun sıkma, in Tur 2 after the first yavaş sıkma — and one earlier move, in turns,
 * before the last uzun sıkma of Tur 2.
 *
 * Uzun sıkma is one continuous squeeze; hızlı sık-bırak is 1 s squeeze / 1 s let go; yavaş sıkma is
 * slowly up (3 s), 0.5 s at the top, let go and wait 1 s. "Dinlen" (5 s) is the pause between exercises
 * (a `transition` phase). Saved exercise ids stay: slow_hold = uzun sıkma, quick_flick = hızlı
 * sık-bırak, elevator = yavaş sıkma. Pure and deterministic.
 */

export const COUNTDOWN_SEC = 3;
export { REST_SEC };
/** Release session rep (after pain / over the daily cap): loosen 3 s → let go fully 6 s. */
export const RELEASE_SETTLE_SEC = 3;
export const RELEASE_LETGO_SEC = 6;
export const RELEASE_REP_SEC = RELEASE_SETTLE_SEC + RELEASE_LETGO_SEC;

export type Round = 1 | 2;

export interface SessionInput {
  level: number;
  seed: string;
  /** 1 = Tur 1 (the daily session), 2 = Tur 2 (adds yavaş sıkma). */
  round?: Round;
  /** 0-based day in the plan and programme week (stored with the session only). */
  dayIndex?: number;
  weekIndex?: number;
  /** Plan week 4 ("Toparlanma") or an early deload: Tur 1 has one cycle less (at least 1). */
  deload?: boolean;
  /** Learned moves added to this round (moves.ts → roundMoves). */
  moves?: RoundMoves;
}

const ms = (s: number) => Math.round(s * 1000);
const POSITION = 'lying' as const;

function pickCues(type: KegelExerciseType, rng: () => number): string[] {
  const fits = KEGEL_CUES.filter((c) => c.types.includes(type) || (CONTRACTION_TYPES.has(type) && c.types.includes('all')));
  return shuffle(
    rng,
    fits.map((c) => c.id),
  ).slice(0, 4);
}

/** Uzun sıkma: one squeeze held for the whole block. */
const longBlock = (p: LevelParams, rng: () => number): SessionBlock => ({ type: 'slow_hold', position: POSITION, holdSec: p.holdSec, restSec: 0, reps: 1, cueSet: pickCues('slow_hold', rng), role: 'main' });
/** Hızlı sık-bırak: 1 s squeeze / 1 s let go for `quickSec`. */
const quickBlock = (p: LevelParams, rng: () => number): SessionBlock => ({ type: 'quick_flick', position: POSITION, holdSec: 1, restSec: 1, reps: p.quickSec / 2, cueSet: pickCues('quick_flick', rng), role: 'main' });
/** Yavaş sıkma: slowly up, short hold at the top, let go, wait. */
const slowBlock = (p: LevelParams, rng: () => number): SessionBlock => ({
  type: 'elevator',
  position: POSITION,
  holdSec: SLOW_UP_SEC + SLOW_TOP_SEC,
  slowSec: SLOW_UP_SEC,
  restSec: SLOW_PAUSE_SEC,
  reps: slowReps(p.slowBlockSec),
  cueSet: pickCues('elevator', rng),
  role: 'main',
});

/** A learned move as a block: its steps per rep and the reps at this level. */
export function moveBlock(id: MoveId, p: LevelParams, rng: () => number): SessionBlock {
  if (id === 'elevator') return slowBlock(p, rng);
  const { steps, reps } = moveShape(id, p.level);
  const sum = (on: boolean) => steps.reduce((a, s) => a + ((s.level > 0) === on ? s.sec : 0), 0);
  return { type: id, position: POSITION, steps, holdSec: sum(true), restSec: sum(false), reps, cueSet: pickCues(id, rng), role: 'main' };
}

/** Blocks of a round at a level (with the learned moves of the 180-day plan). */
export function roundBlocks(round: Round, p: LevelParams, rng: () => number, deload = false, moves: RoundMoves = {}): SessionBlock[] {
  const blocks: SessionBlock[] = [];
  if (round === 1) {
    const cycles = deload ? Math.max(1, p.cycles - 1) : p.cycles;
    for (let c = 0; c < cycles; c++) blocks.push(longBlock(p, rng), quickBlock(p, rng));
    if (moves.latest) blocks.push(moveBlock(moves.latest, p, rng));
    blocks.push(longBlock(p, rng));
  } else {
    ROUND2_ORDER.forEach((b, i) => {
      if (b === 'long' && moves.review) blocks.push(moveBlock(moves.review, p, rng));
      blocks.push(b === 'slow' ? slowBlock(p, rng) : b === 'quick' ? quickBlock(p, rng) : longBlock(p, rng));
      if (i === 0 && moves.latest) blocks.push(moveBlock(moves.latest, p, rng));
    });
  }
  return blocks;
}

/** Phases of one rep. */
function repPhases(b: SessionBlock, i: number, rep: number): Phase[] {
  const base = { exerciseIndex: i, rep, reps: b.reps, set: 1, sets: 1 };
  const ph = (kind: Phase['kind'], sec: number, variant?: Phase['variant']): Phase => ({ kind, durationMs: ms(sec), ...base, ...(variant ? { variant } : {}) });
  if (b.steps) {
    // A move of the 180-day plan: each step squeezes to its level (a slow one grows over the step);
    // level 0 lets go fully. Every rep starts from a let-go muscle.
    let prev = 0;
    return b.steps.map((s) => {
      const p: Phase = s.level > 0 ? { ...ph('contract', s.sec, s.ramp ? 'slowUp' : undefined), level: s.level, fromLevel: prev } : { ...ph('relax', s.sec), fromLevel: prev };
      prev = s.level;
      return p;
    });
  }
  switch (b.type) {
    case 'elevator':
      return [ph('contract', b.slowSec ?? SLOW_UP_SEC, 'slowUp'), ph('contract', (b.holdSec ?? SLOW_UP_SEC + SLOW_TOP_SEC) - (b.slowSec ?? SLOW_UP_SEC), 'top'), ph('relax', b.restSec)];
    case 'release':
    case 'breath':
      return [ph('rest', RELEASE_SETTLE_SEC, 'settle'), ph('relax', RELEASE_LETGO_SEC, 'letGo')];
    default:
      return b.restSec > 0 ? [ph('contract', b.holdSec!), ph('relax', b.restSec)] : [ph('contract', b.holdSec!)];
  }
}

const isContraction = (b: SessionBlock) => CONTRACTION_TYPES.has(b.type);

/** Contractions in a list of blocks (one per rep of a contraction type). */
export const contractionCount = (blocks: SessionBlock[]) => blocks.reduce((n, b) => n + (isContraction(b) ? b.reps : 0), 0);

type Meta = Omit<GeneratedSession, 'exercises' | 'phases' | 'plannedSec' | 'contractions'>;

/** Countdown, then each block with a 5 s "Dinlen" before it (not before the first). */
function assemble(meta: Meta, restSec = REST_SEC): GeneratedSession {
  const phases: Phase[] = [{ kind: 'countdown', durationMs: ms(COUNTDOWN_SEC), exerciseIndex: -1, rep: 0, reps: 0, set: 1, sets: 1 }];
  meta.blocks.forEach((b, i) => {
    if (i > 0) phases.push({ kind: 'transition', durationMs: ms(restSec), exerciseIndex: i, rep: 0, reps: b.reps, set: 1, sets: 1, nextType: b.type });
    for (let r = 1; r <= b.reps; r++) phases.push(...repPhases(b, i, r));
  });
  const exercises: SessionExercise[] = meta.blocks.map((b) => ({ type: b.type, reps: b.reps, sets: 1, contractSec: b.holdSec ?? 0, relaxSec: b.restSec || restSec }));
  return { ...meta, exercises, phases, plannedSec: Math.round(phases.reduce((a, p) => a + p.durationMs, 0) / 1000), contractions: contractionCount(meta.blocks) };
}

const base = (id: string, seed: string, level: number, extra: Partial<Meta> = {}): Omit<Meta, 'blocks'> => ({
  id,
  seed,
  level,
  dayIndex: 0,
  weekIndex: 0,
  track: 'general',
  durationPreset: 'standard',
  deload: false,
  isMicro: false,
  round: 1,
  ...extra,
});

/** Today's session: Tur 1, or Tur 2 when `round` is 2. */
export function generateSession(input: SessionInput): GeneratedSession {
  const lvl = clampLevel(input.level);
  const round: Round = input.round ?? 1;
  const rng = createRng(`${input.seed}|L${lvl}|R${round}`);
  const deload = round === 1 && Boolean(input.deload);
  const moves = input.moves ?? {};
  const blocks = roundBlocks(round, getLevel(lvl), rng, deload, moves);
  const dayIndex = Math.max(0, Math.floor(input.dayIndex ?? 0));
  const weekIndex = Math.max(0, Math.floor(input.weekIndex ?? 0));
  const tag = [moves.latest, moves.review].filter(Boolean).join('+');
  return assemble({ ...base(`${input.seed}-L${lvl}-R${round}-D${dayIndex}${deload ? '-light' : ''}${tag ? `-M${tag}` : ''}`, input.seed, lvl, { dayIndex, weekIndex, round, deload }), blocks });
}

/** Release-only session: what still opens once the daily contraction cap is reached (§11.5) or after pain. */
export function generateReleaseSession(seed: string): GeneratedSession {
  const rng = createRng(`${seed}|release`);
  const block: SessionBlock = { type: 'release', position: POSITION, restSec: RELEASE_LETGO_SEC, reps: 8, cueSet: pickCues('release', rng), role: 'main' };
  return assemble({ ...base(`${seed}-release`, seed, 1, { track: 'relax', isMicro: true }), blocks: [block] });
}

/** Short trial set used by the tutorial: 3 × (3 s squeeze / 3 s let go). */
export function generateTrialSession(): GeneratedSession {
  const blocks: SessionBlock[] = [{ type: 'slow_hold', position: POSITION, holdSec: 3, restSec: 3, reps: 3, cueSet: [], role: 'main' }];
  return assemble({ ...base('trial', 'trial', 1, { isMicro: true }), blocks });
}

/** Practice in a move's lesson (180-day plan): a few reps at level 1 (two, six quick ones, or one long one). */
export function generateMoveDemo(id: Exclude<MoveId, 'elevator'>): GeneratedSession {
  const rng = createRng(`move-demo-${id}`);
  const reps = id === 'half_quick' ? 6 : id === 'half_hold' || id === 'wave' ? 1 : 2;
  return assemble({ ...base(`move-demo-${id}`, `move-demo-${id}`, 1, { isMicro: true, round: 2 }), blocks: [{ ...moveBlock(id, getLevel(1), rng), reps }] });
}

/** Tur 2 introduction demo: 3 yavaş sıkma reps, as in Tur 2. */
export function generateSlowDemo(): GeneratedSession {
  const rng = createRng('slow-demo');
  return assemble({ ...base('slow-demo', 'slow-demo', 1, { isMicro: true, round: 2 }), blocks: [{ ...slowBlock(getLevel(1), rng), reps: 3 }] });
}
