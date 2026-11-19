import * as Speech from 'expo-speech';

import type { ExerciseType } from '@/types';

/**
 * Sesli koç (SPEC_KEGEL_V2 §7.4): short phase commands with the device's own Turkish text-to-speech
 * (expo-speech, offline). When the device has no Turkish voice the option is hidden.
 */

let turkishVoice: string | null | undefined;

/** Finds a Turkish voice once (null = none on this device). */
export async function findTurkishVoice(): Promise<string | null> {
  if (turkishVoice !== undefined) return turkishVoice;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const tr = voices.find((v) => v.language?.toLowerCase().replace('_', '-').startsWith('tr'));
    turkishVoice = tr ? tr.identifier : null;
  } catch {
    turkishVoice = null;
  }
  return turkishVoice;
}

export function speak(text: string) {
  if (!turkishVoice) return;
  try {
    void Speech.stop();
    Speech.speak(text, { language: 'tr-TR', voice: turkishVoice, rate: 1.05 });
  } catch {
    // voice is optional
  }
}

export function stopSpeech() {
  try {
    void Speech.stop();
  } catch {
    // ignore
  }
}

/** Voice line key for a phase start (i18n `player.voice.*`); none for very short phases. */
export function voiceKeyForPhase(phase: { kind: string; stage?: number; durationMs: number; variant?: string }, exerciseType?: ExerciseType): string | null {
  switch (phase.variant) {
    case 'slowUp':
      return 'slowSqueeze';
    case 'top':
      return 'hold';
    case 'slowDown':
      return 'slowRelease';
    case 'settle':
      return null;
    case 'letGo':
      return 'release';
  }
  switch (phase.kind) {
    case 'contract':
      if (phase.stage) return `floor${phase.stage}`;
      return phase.durationMs >= 2000 ? 'squeeze' : null;
    case 'cough':
      return 'cough';
    case 'relax':
    case 'rest':
      // After a slow release the "let go" was already said.
      if (exerciseType === 'elevator') return null;
      return phase.durationMs >= 2000 ? 'release' : null;
    case 'inhale':
      return 'inhale';
    case 'exhale':
      return exerciseType === 'release' ? 'letGo' : 'exhale';
    default:
      return null;
  }
}
