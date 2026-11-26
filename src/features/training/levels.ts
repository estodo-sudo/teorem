import { MAX_MOVE_BLOCK_REPS } from './moves';

/**
 * Kegel levels 1..30 (user decision 2026-11-22). A session has three exercises:
 *
 *  Uzun sıkma       one continuous squeeze                 12 → 20 s
 *  Hızlı sık-bırak  1 s squeeze / 1 s let go, as a block   30 → 60 s
 *  Yavaş sıkma      (Tur 2 only) slowly up 3 s, hold 0.5 s at the top, let go, wait 1 s; as a block 33 → 60 s
 *
 * with a 5 s "Dinlen" between the exercises. Tur 1 repeats (uzun, hızlı) `cycles` times and ends with
 * one more uzun sıkma. 2026-11-23 ("3 dk → 2 dk, sıkma süreleri değil egzersiz sayısı azalsın"): the
 * squeeze times stay, every level has one (uzun, hızlı) cycle less — 2 cycles (5 exercises, ≈ 2 min)
 * up to level 14, 3 cycles (7 exercises, ≈ 5 min at level 30) from level 15. Tur 2 (optional) is
 * yavaş, hızlı, yavaş, uzun — 4 exercises instead of 2 × (yavaş, hızlı, uzun), same squeeze times:
 * ≈ 2 min at level 1 (was ≈ 3), ≈ 3.5 min at level 30 (was ≈ 5). Pure data derived from the level.
 */
export interface LevelParams {
  level: number;
  /** Uzun sıkma: one continuous squeeze (s). */
  holdSec: number;
  /** Hızlı sık-bırak block length (s, even: 1 s squeeze + 1 s let go per rep). */
  quickSec: number;
  /** Yavaş sıkma block length in Tur 2 (s, target; whole reps are used). */
  slowBlockSec: number;
  /** Tur 1 cycles of (uzun, hızlı). */
  cycles: number;
  /** Contractions in Tur 1 + Tur 2 at this level (with room for the learned moves of the 180-day plan). */
  sessionCap: number;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 30;

/** "Dinlen" between exercises (user decision: 5 s). */
export const REST_SEC = 5;
/** Yavaş sıkma rep: slowly up, a short hold at the top, then let go and wait. */
export const SLOW_UP_SEC = 3;
export const SLOW_TOP_SEC = 0.5;
export const SLOW_PAUSE_SEC = 1;
export const SLOW_REP_SEC = SLOW_UP_SEC + SLOW_TOP_SEC + SLOW_PAUSE_SEC;
/** Tur 1 (uzun, hızlı) cycles: 2 below this level, 3 from it on. */
export const BASE_CYCLES = 2;
export const EXTRA_CYCLE_FROM_LEVEL = 15;
/** Tur 2 in order (2026-11-23: "Tur 2 de 2 dk"; was 2 × (yavaş, hızlı, uzun)). */
export const ROUND2_ORDER = ['slow', 'quick', 'slow', 'long'] as const;

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
}

const lerp = (a: number, b: number, l: number) => a + ((b - a) * (l - 1)) / (MAX_LEVEL - 1);

/** Whole yavaş sıkma reps in a block of `sec` seconds. */
export const slowReps = (sec: number) => Math.max(1, Math.round(sec / SLOW_REP_SEC));

function build(level: number): LevelParams {
  const holdSec = Math.round(lerp(12, 20, level));
  const quickSec = 2 * Math.round(lerp(15, 30, level));
  const slowBlockSec = Math.round(lerp(33, 60, level));
  const cycles = level < EXTRA_CYCLE_FROM_LEVEL ? BASE_CYCLES : BASE_CYCLES + 1;
  const flicks = quickSec / 2;
  const round1 = cycles + 1 + cycles * flicks;
  const round2 = ROUND2_ORDER.reduce((n, b) => n + (b === 'slow' ? slowReps(slowBlockSec) : b === 'quick' ? flicks : 1), 0);
  // 180-day plan: up to three move blocks more (the latest in Tur 1 and Tur 2, one review in Tur 2).
  return { level, holdSec, quickSec, slowBlockSec, cycles, sessionCap: round1 + round2 + 3 * MAX_MOVE_BLOCK_REPS };
}

export const LEVELS: readonly LevelParams[] = Array.from({ length: MAX_LEVEL }, (_, i) => build(i + 1));

export function getLevel(level: number): LevelParams {
  return LEVELS[clampLevel(level) - 1] as LevelParams;
}

/** Contractions in Tur 1 + Tur 2 at this level. */
export const sessionContractionCap = (level: number) => getLevel(level).sessionCap;

/** Max contractions in one day (the session twice + a micro set); above it only a release session opens (§11.5). */
export const dailyContractionCap = (level: number) => 2 * sessionContractionCap(level) + 40;

/**
 * Starting level: always 1 (user request 2026-11-23: after "Verilerimi ve hesabımı sil" everything starts
 * from zero). The experience answer is kept in the profile but no longer skips levels; feedback raises the
 * level quickly for someone who already knows the exercise, and it can be set in Ayarlar.
 */
export function startingLevelFor(_experience: 'none' | 'some' | 'regular' | null): number {
  return 1;
}
