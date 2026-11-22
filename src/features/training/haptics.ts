import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

import { kegelHapticsNative as native } from '../../../modules/kegel-haptics';
import type { HapticStrength } from '@/types';

import { androidWaveform, hapticEvents, iosFallbackCalls, onOffPattern, phaseVibration, scaleEvents, type Cue, type HapticEvent, type IosImpact } from './hapticPatterns';

export type { Cue } from './hapticPatterns';

/**
 * Plays the vibration language (SPEC_KEGEL_V2 §7.4).
 *  - Android: the kegel-haptics module plays amplitude waveforms (real rising / falling ramps); without
 *    amplitude control an on/off pattern; without the module (Expo Go) RN Vibration.
 *  - iOS: expo-haptics timed impacts (built in and reliable; no untested native code).
 * If the module ever fails, it is switched off for the rest of the session and the fallback plays.
 */

const IMPACT: Record<IosImpact, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  soft: Haptics.ImpactFeedbackStyle.Soft,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
};

const timers = new Set<ReturnType<typeof setTimeout>>();

const safe = <T>(f: () => T, fallback: T): T => {
  try {
    return f();
  } catch {
    return fallback;
  }
};

let support: { native: boolean; amplitude: boolean } | null = null;
/** What this device can do (cached). */
export function hapticSupport(): { native: boolean; amplitude: boolean } {
  if (!support) {
    const nativeOk = Boolean(native && safe(() => native!.isSupported(), false));
    support = { native: nativeOk, amplitude: nativeOk && safe(() => native!.hasAmplitudeControl(), false) };
  }
  return support;
}

function iosFallback(events: HapticEvent[]) {
  for (const c of iosFallbackCalls(events)) {
    const fire = () => void Haptics.impactAsync(IMPACT[c.style]).catch(() => undefined);
    if (c.delayMs <= 0) fire();
    else {
      const t = setTimeout(() => {
        timers.delete(t);
        fire();
      }, c.delayMs);
      timers.add(t);
    }
  }
}

/** Plays a semantic haptic cue honouring the user's strength setting. */
export function playCue(cue: Cue, strength: HapticStrength) {
  playEvents(hapticEvents(cue, strength));
}

/**
 * Kegel phase vibration: vibrates for as long as the phase squeezes (see `phaseVibration`), silent
 * otherwise. Stops whatever was playing first, so let-go and rest phases cut it off cleanly.
 */
export function vibrateForPhase(phase: { kind: string; durationMs: number; variant?: string }, strength: HapticStrength, fromMs = 0) {
  cancelHaptics();
  playEvents(scaleEvents(phaseVibration(phase, fromMs), strength));
}

function playEvents(events: HapticEvent[]) {
  if (!events.length) return;
  try {
    if (Platform.OS === 'ios') return iosFallback(events);
    if (Platform.OS !== 'android') return;
    const s = hapticSupport();
    if (s.native) {
      try {
        if (s.amplitude) {
          const w = androidWaveform(events);
          if (w.timings.length) native!.vibrateWaveform(w.timings, w.amplitudes);
        } else native!.vibratePattern(onOffPattern(events));
        return;
      } catch {
        // The module failed: use the plain vibration from now on.
        support = { native: false, amplitude: false };
      }
    }
    Vibration.vibrate(onOffPattern(events));
  } catch {
    // Haptics are best-effort; never crash the workout.
  }
}

/** Stops any pending/ongoing vibration (e.g. when pausing). */
export function cancelHaptics() {
  timers.forEach(clearTimeout);
  timers.clear();
  try {
    if (hapticSupport().native) native!.cancel();
    else if (Platform.OS === 'android') Vibration.cancel();
  } catch {
    // ignore
  }
}
