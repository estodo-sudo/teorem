/**
 * Kegel v2 levels 1..30 (SPEC_KEGEL_V2 §6.2): a level raises INTENSITY, never the session length —
 * the length is the user's duration preset. Pure data derived from the level.
 *
 * holdSec        slow hold length (3 → 10 s)
 * restFactor     hold rest = hold × factor (2.0 → 1.0, i.e. 1:2 → 1:1)
 * maxHoldSec     max-strength contraction (3 → 5 s), rest 1:2
 * enduranceSec   one long moderate hold (0 below level 5, then 10 → 30 s)
 * elevatorTopSec hold at the top floor (2 → 5 s)
 * sessionCap     max contractions in one session
 */
export interface LevelParams {
  level: number;
  holdSec: number;
  restFactor: number;
  maxHoldSec: number;
  enduranceSec: number;
  elevatorTopSec: number;
  sessionCap: number;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 30;

/** Level at which the endurance block can appear. */
export const ENDURANCE_FROM_LEVEL = 5;

/** Hold ceiling for a tense (hypertonic) pelvic floor and the relaxation track (§2, §6.4). */
export const HYPERTONIC_HOLD_CAP_SEC = 5;

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
}

const lerp = (a: number, b: number, l: number) => a + ((b - a) * (l - 1)) / (MAX_LEVEL - 1);

function build(level: number): LevelParams {
  return {
    level,
    holdSec: Math.round(lerp(3, 10, level)),
    restFactor: Math.round(lerp(2, 1, level) * 100) / 100,
    maxHoldSec: Math.round(lerp(3, 5, level)),
    enduranceSec: level < ENDURANCE_FROM_LEVEL ? 0 : Math.round(10 + (20 * (level - ENDURANCE_FROM_LEVEL)) / (MAX_LEVEL - ENDURANCE_FROM_LEVEL)),
    elevatorTopSec: Math.round(lerp(2, 5, level)),
    sessionCap: 40 + 2 * level,
  };
}

export const LEVELS: readonly LevelParams[] = Array.from({ length: MAX_LEVEL }, (_, i) => build(i + 1));

export function getLevel(level: number): LevelParams {
  return LEVELS[clampLevel(level) - 1] as LevelParams;
}

/** Max contractions in one session at this level. */
export const sessionContractionCap = (level: number) => getLevel(level).sessionCap;

/** Max contractions in one day (main session + micro sets); above it only a release session opens (§11.5). */
export const dailyContractionCap = (level: number) => 2 * sessionContractionCap(level) + 40;

/** Starting level derived from onboarding experience answer. */
export function startingLevelFor(experience: 'none' | 'some' | 'regular' | null): number {
  switch (experience) {
    case 'regular':
      return 5;
    case 'some':
      return 3;
    default:
      return 1;
  }
}
