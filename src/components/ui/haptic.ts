import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/stores/settingsStore';

/**
 * UI press feedback (§3.6): `selection` for choices, `light` for the main action. Silent when the user
 * turned vibration off (haptic strength 0). Never touches the Kegel vibration engine.
 */
export function uiHaptic(kind: 'selection' | 'light'): void {
  const strength = useSettingsStore.getState().settings.hapticStrength;
  if (strength === 0) return;
  try {
    if (kind === 'selection') void Haptics.selectionAsync().catch(() => undefined);
    // Follows the strength setting: Light → light, Normal → medium, Strong → heavy (2026-11-23).
    else void Haptics.impactAsync(strength === 1 ? Haptics.ImpactFeedbackStyle.Light : strength === 3 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  } catch {
    // web / unsupported device: no feedback
  }
}
