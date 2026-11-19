import { createRng, shuffle } from '@/lib/random';
import type { DurationPreset, KegelExerciseType, Position, TrackId } from '@/types';

import { ENDURANCE_FROM_LEVEL, HYPERTONIC_HOLD_CAP_SEC, clampLevel, getLevel, type LevelParams } from './levels';
import { CONTRACTION_TYPES, DURATION_SEC, KEGEL_CUES, MAIN_BLOCKS, TRACK_SEQUENCE, positionsFor } from './tracks';
import type { GeneratedSession, Phase, SessionBlock, SessionExercise } from './types';

export const COUNTDOWN_SEC = 3;
export const TRANSITION_SEC = 4;
/** A change of position (e.g. lying → standing) gets a longer transition with the position card (§5, §7.2). */
export const POSITION_CHANGE_SEC = 8;
const transitionSec = (blocks: SessionBlock[], i: number) => (i > 0 && blocks[i - 1]!.position !== blocks[i]!.position ? POSITION_CHANGE_SEC : TRANSITION_SEC);
/** Release block rep: loosen (3 s) -> let go fully (6 s). No breathing commands. */
export const RELEASE_SETTLE_SEC = 3;
export const RELEASE_LETGO_SEC = 6;
export const RELEASE_REP_SEC = RELEASE_SETTLE_SEC + RELEASE_LETGO_SEC;
/** Slow squeeze -> hold -> slow release ("elevator" id kept for saved data): each slow phase 3–6 s by level. */
export const slowSecFor = (level: number) => 3 + Math.round((3 * (clampLevel(level) - 1)) / 29);
export const KNACK_PRE_MS = 500;
export const KNACK_COUGH_MS = 1500;
export const KNACK_REST_SEC = 6;
/** Deload week: 20 % fewer contractions (§6.4). */
export const DELOAD_FACTOR = 0.8;
/** Total length stays within ±10 % of the preset (§6.4). */
export const DURATION_TOLERANCE = 0.1;
/** Hypertonic profile: at least 40 % of the session is release (§6.4). */
export const HYPERTONIC_RELEASE_SHARE = 0.4;

export const REP_RANGE: Record<KegelExerciseType, [number, number]> = {
  slow_hold: [5, 10],
  quick_flick: [5, 15],
  max_contraction: [3, 10],
  elevator: [2, 5],
  endurance: [1, 2],
  knack: [3, 5],
  release: [2, 6],
  breath: [2, 6],
};

const ms = (s: number) => Math.round(s * 1000);

/** The lighter (deload) week is plan week 4: plan days 22–30 (0-based 21–29), as the roadmap shows. */
export const isScheduledDeloadDay = (planDay: number) => Math.min(3, Math.floor(Math.max(0, planDay) / 7)) === 3;

export interface SessionInput {
  track: TrackId;
  level: number;
  durationPreset: DurationPreset;
  /** 0-based day in the plan (rotates the block order). */
  dayIndex: number;
  /** 0-based programme week (positions, deload). */
  weekIndex: number;
  hypertonic: boolean;
  seed: string;
  /** Overrides the schedule (e.g. an early deload after falling strength tests). */
  deload?: boolean;
}

/** Per-rep shape of one block. */
interface Shape {
  holdSec?: number;
  restSec: number;
  slowSec?: number;
  repSec: number;
}

function shape(type: KegelExerciseType, p: LevelParams, holdCap: number): Shape {
  switch (type) {
    case 'slow_hold': {
      const hold = Math.min(p.holdSec, holdCap);
      const rest = Math.max(hold, Math.ceil(hold * p.restFactor));
      return { holdSec: hold, restSec: rest, repSec: hold + rest };
    }
    case 'quick_flick':
      return { holdSec: 1, restSec: 1, repSec: 2 };
    case 'max_contraction': {
      const hold = Math.min(p.maxHoldSec, holdCap);
      return { holdSec: hold, restSec: 2 * hold, repSec: 3 * hold };
    }
    case 'elevator': {
      // Slowly squeeze, short hold at the top, slowly let go, then rest as long as the squeeze.
      const slow = slowSecFor(p.level);
      const contract = slow + p.elevatorTopSec;
      return { holdSec: contract, restSec: contract, slowSec: slow, repSec: 2 * contract + slow };
    }
    case 'endurance':
      return { holdSec: p.enduranceSec, restSec: p.enduranceSec, repSec: 2 * p.enduranceSec };
    case 'knack':
      return { holdSec: (KNACK_PRE_MS + KNACK_COUGH_MS) / 1000, restSec: KNACK_REST_SEC, repSec: (KNACK_PRE_MS + KNACK_COUGH_MS) / 1000 + KNACK_REST_SEC };
    case 'release':
    case 'breath':
      return { restSec: RELEASE_LETGO_SEC, repSec: RELEASE_REP_SEC };
  }
}

/** Phases of one rep. */
function repPhases(b: SessionBlock, i: number, rep: number): Phase[] {
  const base = { exerciseIndex: i, rep, reps: b.reps, set: 1, sets: 1 };
  const ph = (kind: Phase['kind'], sec: number, variant?: Phase['variant']): Phase => ({ kind, durationMs: ms(sec), ...base, ...(variant ? { variant } : {}) });
  switch (b.type) {
    case 'elevator': {
      const slow = b.slowSec ?? 4;
      const top = b.holdSec! - slow;
      return [ph('contract', slow, 'slowUp'), ph('contract', top, 'top'), ph('release', slow, 'slowDown'), ph('relax', b.restSec)];
    }
    case 'knack':
      return [ph('contract', KNACK_PRE_MS / 1000), ph('cough', KNACK_COUGH_MS / 1000), ph('relax', b.restSec)];
    case 'release':
    case 'breath':
      return [ph('rest', RELEASE_SETTLE_SEC, 'settle'), ph('relax', RELEASE_LETGO_SEC, 'letGo')];
    default:
      return [ph('contract', b.holdSec!), ph('relax', b.restSec)];
  }
}

const repSecOf = (b: SessionBlock) =>
  b.type === 'release' || b.type === 'breath' ? RELEASE_REP_SEC : b.type === 'elevator' ? b.holdSec! + (b.slowSec ?? 4) + b.restSec : b.type === 'knack' ? (KNACK_PRE_MS + KNACK_COUGH_MS) / 1000 + b.restSec : b.holdSec! + b.restSec;
const isContraction = (b: SessionBlock) => CONTRACTION_TYPES.has(b.type);
const blockSec = (b: SessionBlock) => b.reps * repSecOf(b);

/** Contractions in a list of blocks (one per rep of a contraction type). */
export const contractionCount = (blocks: SessionBlock[]) => blocks.reduce((n, b) => n + (isContraction(b) ? b.reps : 0), 0);

function pickCues(type: KegelExerciseType, rng: () => number): string[] {
  const fits = KEGEL_CUES.filter((c) => c.types.includes(type) || (CONTRACTION_TYPES.has(type) && c.types.includes('all')));
  return shuffle(
    rng,
    fits.map((c) => c.id),
  ).slice(0, 4);
}

function assemble(meta: Omit<GeneratedSession, 'exercises' | 'phases' | 'plannedSec' | 'contractions'>): GeneratedSession {
  const phases: Phase[] = [{ kind: 'countdown', durationMs: ms(COUNTDOWN_SEC), exerciseIndex: -1, rep: 0, reps: 0, set: 1, sets: 1 }];
  meta.blocks.forEach((b, i) => {
    if (i > 0) phases.push({ kind: 'transition', durationMs: ms(transitionSec(meta.blocks, i)), exerciseIndex: i, rep: 0, reps: b.reps, set: 1, sets: 1, nextType: b.type });
    for (let r = 1; r <= b.reps; r++) phases.push(...repPhases(b, i, r));
  });
  const exercises: SessionExercise[] = meta.blocks.map((b) => ({ type: b.type, reps: b.reps, sets: 1, contractSec: b.holdSec ?? 0, relaxSec: b.restSec }));
  return { ...meta, exercises, phases, plannedSec: Math.round(phases.reduce((a, p) => a + p.durationMs, 0) / 1000), contractions: contractionCount(meta.blocks) };
}

const fixedSec = (blocks: SessionBlock[]) => COUNTDOWN_SEC + blocks.reduce((a, _, i) => a + (i > 0 ? transitionSec(blocks, i) : 0), 0);
const totalSec = (blocks: SessionBlock[]) => fixedSec(blocks) + blocks.reduce((a, b) => a + blockSec(b), 0);

/** How far each block's rest may grow to fill the time (never below the squeeze; quick flicks keep their rhythm). */
const restCeiling = (b: SessionBlock) => {
  const hold = b.holdSec ?? 0;
  switch (b.type) {
    case 'slow_hold':
    case 'endurance':
    case 'max_contraction':
    case 'elevator':
      return 2 * hold;
    case 'knack':
      return KNACK_REST_SEC + 2;
    default:
      return b.restSec;
  }
};

/**
 * Builds a Kegel v2 session (SPEC_KEGEL_V2 §6). Pure and deterministic for the same input.
 *
 * 3–5 main blocks (the track's mix); no breathing warm-up or cool-down (user decision). The duration preset
 * sets the length (±10 %); the level only sets intensity. Every block rests at least as long as it
 * contracts. A deload week has 20 % fewer contractions; a hypertonic profile holds ≤ 5 s and spends
 * at least 40 % of the time releasing and breathing.
 */
export function generateSession(input: SessionInput): GeneratedSession {
  const lvl = clampLevel(input.level);
  const p = getLevel(lvl);
  const { track, durationPreset: preset, hypertonic } = input;
  const dayIndex = Math.max(0, Math.floor(input.dayIndex));
  const weekIndex = Math.max(0, Math.floor(input.weekIndex));
  const deload = input.deload ?? isScheduledDeloadDay(dayIndex);
  const rng = createRng(`${input.seed}|${track}|${lvl}|${preset}|${dayIndex}|${weekIndex}|${hypertonic ? 1 : 0}`);
  const target = DURATION_SEC[preset];
  const capped = hypertonic || track === 'relax';
  let holdCap = capped ? HYPERTONIC_HOLD_CAP_SEC : Infinity;
  if (track === 'surgery') holdCap = Math.min(holdCap, 3 + weekIndex); // gentle start, +1 s per week
  const n = MAIN_BLOCKS[preset];

  // Main block types: the track's rotation, interleaved with release blocks for a tense pelvic floor.
  const seq = TRACK_SEQUENCE[track];
  let types = Array.from({ length: n }, (_, i) => seq[(dayIndex + i) % seq.length]!);
  if (hypertonic && track !== 'relax') types = types.map((t, i) => (i % 2 === 1 ? 'release' : t));
  const fixed = COUNTDOWN_SEC + (n - 1) * TRANSITION_SEC;
  const perBlock = (target - fixed) / n;
  types = types.map((t) => {
    if (t === 'endurance' && (lvl < ENDURANCE_FROM_LEVEL || capped)) return 'slow_hold';
    if (t === 'elevator' && capped) return 'slow_hold';
    // A block whose minimum does not fit this preset becomes a slow hold.
    const s = shape(t, p, holdCap);
    return REP_RANGE[t][0] * s.repSec > perBlock * 1.5 ? 'slow_hold' : t;
  });

  const positions = positionsFor(track, weekIndex);
  const main: SessionBlock[] = types.map((type, i) => {
    const s = shape(type, p, holdCap);
    const [min, max] = REP_RANGE[type];
    let reps = Math.min(max, Math.max(min, Math.floor(perBlock / s.repSec)));
    if (deload && CONTRACTION_TYPES.has(type)) reps = Math.max(1, Math.round(reps * DELOAD_FACTOR));
    const position: Position = positions[Math.floor((i * positions.length) / n)]!;
    return { type, position, ...(s.holdSec !== undefined ? { holdSec: s.holdSec } : {}), restSec: s.restSec, reps, ...(s.slowSec ? { slowSec: s.slowSec } : {}), cueSet: pickCues(type, rng), role: 'main' as const };
  });

  // Session contraction cap: trim the block with the most contractions.
  const cap = p.sessionCap;
  while (contractionCount(main) > cap) {
    const b = main.filter((x) => isContraction(x) && x.reps > 1).sort((a, c) => c.reps - a.reps)[0];
    if (!b) break;
    b.reps -= 1;
  }

  const blocks: SessionBlock[] = [...main];

  // Fill the time left: more reps where allowed (release blocks first for a tense pelvic floor; no
  // extra contractions in a deload week), then extra cool-down breaths.
  const order = [...main].sort((a, b) => Number(hypertonic) * (Number(isContraction(a)) - Number(isContraction(b))));
  // 1) more reps up to the normal maximum, 2) longer rests (never below the squeeze), 3) reps up to
  // twice the maximum.
  const growReps = (limit: (b: SessionBlock) => number) => {
    for (let changed = true; changed;) {
      changed = false;
      for (const b of order) {
        const gap = target - totalSec(blocks);
        const grow = !isContraction(b) || (!deload && contractionCount(main) < cap);
        if (grow && b.reps < limit(b) && repSecOf(b) <= gap) {
          b.reps += 1;
          changed = true;
        }
      }
    }
  };
  growReps((b) => REP_RANGE[b.type][1]);
  for (let changed = true; changed;) {
    changed = false;
    for (const b of order) {
      if (!isContraction(b) || b.restSec + 1 > restCeiling(b) || b.reps > target - totalSec(blocks)) continue;
      b.restSec += 1;
      changed = true;
    }
  }
  growReps((b) => 2 * REP_RANGE[b.type][1]);
  // 4) Still short (contraction cap, deload week): a gentle release block at the end — rest, not more
  // squeezing. No breathing commands.
  const gapLeft = target - totalSec(blocks) - TRANSITION_SEC;
  if (gapLeft >= RELEASE_REP_SEC / 2) {
    const last = main[main.length - 1]!;
    blocks.push({ type: 'release', position: last.position, restSec: RELEASE_LETGO_SEC, reps: Math.max(1, Math.round(gapLeft / RELEASE_REP_SEC)), cueSet: pickCues('release', rng), role: 'cooldown' });
  }
  // 5) Tense pelvic floor: at least 40 % of the time is release — swap squeeze reps for release reps.
  if (hypertonic) {
    const calm = () => blocks.filter((b) => !isContraction(b)).reduce((t, b) => t + blockSec(b), 0);
    let rel = blocks.find((b) => b.type === 'release');
    if (!rel) {
      rel = { type: 'release', position: main[main.length - 1]!.position, restSec: RELEASE_LETGO_SEC, reps: 1, cueSet: pickCues('release', rng), role: 'cooldown' };
      blocks.push(rel);
    }
    for (let guard = 0; calm() < HYPERTONIC_RELEASE_SHARE * totalSec(blocks) && guard < 200; guard++) {
      const b = blocks.filter((x) => isContraction(x) && x.reps > 1).sort((x, y) => blockSec(y) - blockSec(x))[0];
      if (!b) break;
      b.reps -= 1;
      while (target - totalSec(blocks) >= RELEASE_REP_SEC) rel.reps += 1;
    }
  }
  // Too long (minimum reps of long blocks): trim the longest main block.
  while (totalSec(blocks) > target * (1 + DURATION_TOLERANCE * 0.8)) {
    const b = main.filter((x) => x.reps > 1).sort((a, c) => blockSec(c) - blockSec(a))[0];
    if (!b) break;
    b.reps -= 1;
  }

  return assemble({ id: `${input.seed}-${track}-L${lvl}-${preset}-D${dayIndex}-W${weekIndex}`, seed: input.seed, level: lvl, dayIndex, weekIndex, track, durationPreset: preset, deload, isMicro: false, blocks });
}

/** Micro set (§6.3): 30–60 s, e.g. 5 slow + 5 quick; a tense pelvic floor gets release + gentle holds. */
export function generateMicroSet(input: { track: TrackId; level: number; hypertonic: boolean; seed: string; weekIndex?: number }): GeneratedSession {
  const lvl = clampLevel(input.level);
  const p = getLevel(lvl);
  const rng = createRng(`${input.seed}|micro|${input.track}|${lvl}`);
  const position = positionsFor(input.track, input.weekIndex ?? 0)[0]!;
  const gentle = input.hypertonic || input.track === 'relax';
  const hold = Math.min(p.holdSec, gentle ? 3 : 4);
  const slow: SessionBlock = { type: 'slow_hold', position, holdSec: hold, restSec: hold, reps: gentle ? 3 : 5, cueSet: pickCues('slow_hold', rng), role: 'main' };
  const blocks: SessionBlock[] = gentle
    ? [{ type: 'release', position, restSec: RELEASE_LETGO_SEC, reps: 3, cueSet: pickCues('release', rng), role: 'main' }, slow]
    : [slow, { type: 'quick_flick', position, holdSec: 1, restSec: 1, reps: 5, cueSet: pickCues('quick_flick', rng), role: 'main' }];
  return assemble({ id: `${input.seed}-micro-${input.track}-L${lvl}`, seed: input.seed, level: lvl, dayIndex: 0, weekIndex: input.weekIndex ?? 0, track: input.track, durationPreset: 'quick', deload: false, isMicro: true, blocks });
}

/** Release-only session: what still opens once the daily contraction cap is reached (§11.5) or after pain. */
export function generateReleaseSession(seed: string): GeneratedSession {
  const rng = createRng(`${seed}|release`);
  const block: SessionBlock = { type: 'release', position: 'lying', restSec: RELEASE_LETGO_SEC, reps: 8, cueSet: pickCues('release', rng), role: 'main' };
  return assemble({ id: `${seed}-release`, seed, level: 1, dayIndex: 0, weekIndex: 0, track: 'relax', durationPreset: 'quick', deload: false, isMicro: true, blocks: [block] });
}

/** Short trial set used by the tutorial: 3 × (3 s squeeze / 3 s relax). */
export function generateTrialSession(): GeneratedSession {
  const blocks: SessionBlock[] = [{ type: 'slow_hold', position: 'lying', holdSec: 3, restSec: 3, reps: 3, cueSet: [], role: 'main' }];
  return assemble({ id: 'trial', seed: 'trial', level: 1, dayIndex: 0, weekIndex: 0, track: 'general', durationPreset: 'quick', deload: false, isMicro: true, blocks });
}
