import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/stores/settingsStore';

/**
 * UI press feedback (§3.6): `selection` for choices, `light` for the main action. Silent when the user
 * turned vibration off (haptic strength 0). Never touches the Kegel vibration engine.
 */
export function uiHaptic(kind: 'selection' | 'light'): void {
  if (useSettingsStore.getState().settings.hapticStrength === 0) return;
  try {
    if (kind === 'selection') void Haptics.selectionAsync().catch(() => undefined);
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  } catch {
    // web / unsupported device: no feedback
  }
}
