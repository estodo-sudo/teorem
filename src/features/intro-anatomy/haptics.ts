import * as Haptics from 'expo-haptics';

import { HAPTIC } from './timeline';

/**
 * Vibration of the contraction, hold and release (SPEC_ANIMASYON_PELVIK §6). The taps are a plain list
 * of times worked out from `timeline.ts`; playing them schedules only the taps still ahead of the
 * current time, and the returned function cancels them at once (pause, skip, leaving the screen).
 */

/** `light`: contraction taps; `soft`: the very light taps of the hold and the release. */
export type IntroTap = { at: number; kind: 'light' | 'soft' };

/** Every tap of the animation, in time order. */
export function introTaps(): IntroTap[] {
  const out: IntroTap[] = [];
  const { contract: c, hold: h, release: r } = HAPTIC;
  for (let t = c.start; t < c.end; ) {
    out.push({ at: t, kind: 'light' });
    t += t >= c.fastFrom ? c.fastGap : c.gap;
  }
  for (let t = h.start; t < h.end; t += h.gap) out.push({ at: t, kind: 'soft' });
  for (let t = r.start; t < r.end; ) {
    out.push({ at: t, kind: 'soft' });
    t += r.fromGap + ((r.toGap - r.fromGap) * (t - r.start)) / (r.end - r.start);
  }
  return out;
}

const TAPS = introTaps();

/**
 * Plays the taps from `fromMs` on, in real time. Nothing plays when the user turned vibration off
 * (`enabled` false). Returns a cancel function.
 */
export function playIntroTaps(fromMs: number, enabled: boolean): () => void {
  if (!enabled) return () => undefined;
  const timers = TAPS.filter((p) => p.at >= fromMs).map((p) =>
    setTimeout(() => {
      try {
        const style = p.kind === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft;
        void Haptics.impactAsync(style).catch(() => undefined);
      } catch {
        // web or a device without vibration
      }
    }, p.at - fromMs),
  );
  return () => timers.forEach(clearTimeout);
}
