import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

import type { HapticStrength } from '@/types';

import { hapticPattern, type Cue, type IosHapticCall } from './hapticPatterns';

export type { Cue } from './hapticPatterns';

const IMPACT: Record<string, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  soft: Haptics.ImpactFeedbackStyle.Soft,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
};
const NOTIFY: Record<string, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

const timers = new Set<ReturnType<typeof setTimeout>>();

function runIos(call: IosHapticCall) {
  const fire = () => {
    if (call.type === 'impact') void Haptics.impactAsync(IMPACT[call.style]);
    else if (call.type === 'notification') void Haptics.notificationAsync(NOTIFY[call.style]);
    else void Haptics.selectionAsync();
  };
  if (call.delayMs <= 0) fire();
  else {
    const t = setTimeout(() => {
      timers.delete(t);
      fire();
    }, call.delayMs);
    timers.add(t);
  }
}

/** Plays a semantic haptic cue honouring the user's strength setting. */
export function playCue(cue: Cue, strength: HapticStrength) {
  try {
    const p = hapticPattern(cue, strength, Platform.OS);
    if (p.platform === 'ios') p.calls.forEach(runIos);
    else if (p.platform === 'android') Vibration.vibrate(p.pattern);
  } catch {
    // Haptics are best-effort; never crash the workout.
  }
}

/** Stops any pending/ongoing vibration (e.g. when pausing). */
export function cancelHaptics() {
  timers.forEach(clearTimeout);
  timers.clear();
  if (Platform.OS === 'android') Vibration.cancel();
}
