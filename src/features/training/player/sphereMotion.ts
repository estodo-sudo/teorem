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

export function sphereTarget(phase: { kind: string; stage?: number; durationMs: number; variant?: string }, _type?: ExerciseType): SphereTarget {
  const t = (scale: number, tone: SphereTone, moveMs: number, easing: SphereEasing = 'inOutCubic', opacity = 1): SphereTarget => ({ scale, tone, moveMs: Math.max(150, Math.round(moveMs)), easing, opacity });
  switch (phase.kind) {
    case 'contract':
      // Slow squeeze: grows over the whole phase.
      if (phase.variant === 'slowUp') return t(SQUEEZED, 'accent', phase.durationMs, 'inOutSine');
      if (phase.stage) return t([0.72, 0.86, 1][phase.stage - 1]!, 'accent', 600);
      return t(SQUEEZED, 'accent', quickMs(phase.durationMs));
    case 'cough':
      return t(SQUEEZED, 'accent', quickMs(phase.durationMs));
    case 'release':
      // Slow release: shrinks over the whole phase, still the squeeze colour (the muscle lowers gently).
      if (phase.variant === 'slowDown') return t(RELAXED, 'accent', phase.durationMs, 'inOutSine', 0.75);
      return t(phase.stage === 2 ? 0.86 : 0.72, 'accent', 600);
    case 'relax':
    case 'rest':
      if (phase.variant === 'settle') return t(0.72, 'cool', 600, 'inOutCubic', 0.7);
      if (phase.variant === 'letGo') return t(RELAXED, 'cool', phase.durationMs * 0.8, 'inOutSine', 0.5);
      return t(RELAXED, 'cool', quickMs(phase.durationMs), 'inOutCubic', 0.5);
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
export function sphereWord(phase: { kind: string; stage?: number; durationMs: number; variant?: string }, elapsedMs: number, exerciseType?: ExerciseType): string {
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
  // After a slow release the muscle is already down: the pause is a rest, not another "let go".
  if (phase.kind === 'relax' && exerciseType === 'elevator') return 'rest';
  if ((phase.kind === 'relax' || phase.kind === 'rest') && phase.durationMs > 1000) return 'release';
  return phase.kind;
}
