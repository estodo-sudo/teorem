import type { ExerciseType } from '@/types';

/**
 * The centre circle (v1 behaviour, user decision): it GROWS when you squeeze and SHRINKS when you let
 * go, and changes colour — squeeze colour while squeezing, grey while relaxing. Slow squeeze / slow
 * release grow and shrink over the whole phase so "slowly" is visible. Pure data; MuscleSphere plays it.
 */
export type SphereTone = 'neutral' | 'accent' | 'cool' | 'breath';
export type SphereEasing = 'inOutCubic' | 'inOutSine';

export interface SphereTarget {
  /** Circle scale (1 = fully squeezed, 0.55 = relaxed). */
  scale: number;
  tone: SphereTone;
  /** How long the move takes (ms). */
  moveMs: number;
  easing: SphereEasing;
  /** Reduced motion: opacity carries the change instead of the size. */
  opacity: number;
}

export const SQUEEZED = 1;
export const RELAXED = 0.55;
export const NEUTRAL = 0.62;

/** v1 timing for ordinary phases: quick, at most 0.9 s. */
export const quickMs = (phaseMs: number) => Math.min(phaseMs * 0.8, 900);
/** Letting go is faster than squeezing (user request 2026-11-22): the circle drops in at most 0.25 s. */
export const releaseMs = (phaseMs: number) => Math.min(phaseMs * 0.4, 250);

/** A phase of the 180-day plan's moves: squeeze strength now and just before (0 = let go). */
type LevelPhase = { kind: string; durationMs: number; variant?: string; level?: number; fromLevel?: number };

/** Circle size for a squeeze strength (0 = relaxed … 1 = full). */
export const scaleForLevel = (level: number) => RELAXED + (SQUEEZED - RELAXED) * Math.min(1, Math.max(0, level));

const near = (a: number, b: number) => Math.abs(a - b) < 0.02;

/**
 * Word for a step of a 180-day-plan move (i18n key under player.phase): going up "⅓ SIK" / "⅔ SIK" /
 * "YARIM SIK" / "TAM SIK", coming down "⅔'E İN" / "⅓'E İN" / "YARIYA İN", staying "TUT" / "YARIMDA TUT".
 * A long step (4 s or more) turns into the hold word after 1.2 s. Null for other phases.
 */
export function levelWord(phase: LevelPhase, elapsedMs = 0): string | null {
  if (phase.kind !== 'contract' || phase.level === undefined || phase.variant === 'slowUp') return null;
  const level = phase.level;
  const from = phase.fromLevel ?? 0;
  const hold = near(level, 1) ? 'hold' : 'holdHalf';
  if (near(level, from) || (phase.durationMs >= 4000 && elapsedMs >= 1200)) return hold;
  if (level > from) return near(level, 1) ? 'full' : near(level, 0.5) ? 'half' : level > 0.5 ? 'twoThirds' : 'third';
  return near(level, 0.5) ? 'downHalf' : level > 0.5 ? 'downTwoThirds' : 'downThird';
}

export function sphereTarget(phase: { kind: string; stage?: number; durationMs: number; variant?: string; level?: number; fromLevel?: number }, _type?: ExerciseType): SphereTarget {
  const t = (scale: number, tone: SphereTone, moveMs: number, easing: SphereEasing = 'inOutCubic', opacity = 1): SphereTarget => ({ scale, tone, moveMs: Math.max(150, Math.round(moveMs)), easing, opacity });
  switch (phase.kind) {
    case 'contract':
      // Slow squeeze: grows over the whole phase.
      if (phase.variant === 'slowUp') return t(SQUEEZED, 'accent', phase.durationMs, 'inOutSine');
      if (phase.stage) return t([0.72, 0.86, 1][phase.stage - 1]!, 'accent', 600);
      // A step of a 180-day-plan move: the circle grows or settles to that strength.
      if (phase.level !== undefined) return t(scaleForLevel(phase.level), 'accent', Math.min(phase.durationMs * 0.8, (phase.fromLevel ?? 0) > phase.level ? 700 : 600));
      return t(SQUEEZED, 'accent', quickMs(phase.durationMs));
    case 'cough':
      return t(SQUEEZED, 'accent', quickMs(phase.durationMs));
    case 'release':
      // Slow release: shrinks over the whole phase, still the squeeze colour (the muscle lowers gently).
      if (phase.variant === 'slowDown') return t(RELAXED, 'accent', phase.durationMs, 'inOutSine', 0.75);
      return t(phase.stage === 2 ? 0.86 : 0.72, 'accent', 600);
    case 'transition':
      // "Dinlen" between exercises: the circle lets go and stays relaxed.
      return t(RELAXED, 'cool', releaseMs(phase.durationMs), 'inOutCubic', 0.5);
    case 'relax':
    case 'rest':
      if (phase.variant === 'settle') return t(0.72, 'cool', 600, 'inOutCubic', 0.7);
      if (phase.variant === 'letGo') return t(RELAXED, 'cool', phase.durationMs * 0.8, 'inOutSine', 0.5);
      return t(RELAXED, 'cool', releaseMs(phase.durationMs), 'inOutCubic', 0.5);
    case 'inhale':
      return t(SQUEEZED, 'breath', phase.durationMs, 'inOutSine', 0.85);
    case 'exhale':
      return t(RELAXED, 'breath', phase.durationMs, 'inOutSine', 0.6);
    default:
      return t(NEUTRAL, 'neutral', 500, 'inOutCubic', 0.8);
  }
}

/** The squeeze turns into "TUT" once the circle has grown (§7.1). */
export const HOLD_LABEL_AFTER_MS = 600;

/** Word for the phase (i18n key under player.phase). */
export function sphereWord(phase: { kind: string; stage?: number; durationMs: number; variant?: string; level?: number; fromLevel?: number }, elapsedMs: number, exerciseType?: ExerciseType): string {
  const step = levelWord(phase, elapsedMs);
  if (step) return step;
  switch (phase.variant) {
    case 'slowUp':
      return 'slowSqueeze';
    case 'top':
      return 'hold';
    case 'slowDown':
      return 'slowRelease';
    case 'settle':
      return 'settle';
    case 'letGo':
      return 'release';
  }
  if (phase.kind === 'contract' && !phase.stage && exerciseType !== 'knack' && phase.durationMs >= 2000 && elapsedMs >= HOLD_LABEL_AFTER_MS) return 'hold';
  // "Bırak" only while the circle shrinks from squeezed to relaxed; the rest of the pause is "Dinlen".
  if ((phase.kind === 'relax' || phase.kind === 'rest' || phase.kind === 'transition') && phase.durationMs > 1000) return elapsedMs < Math.max(700, releaseMs(phase.durationMs)) ? 'release' : 'rest';
  // Short let-go (hızlı sık-bırak, after a yavaş sıkma): "Bırak".
  if (phase.kind === 'relax') return 'release';
  return phase.kind;
}
