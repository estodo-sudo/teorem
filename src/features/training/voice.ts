import * as Speech from 'expo-speech';

import { CONTENT_LANGUAGE } from '@/i18n/content';
import { localeOf } from '@/i18n/languages';
import type { ExerciseType } from '@/types';

import { levelWord } from './player/sphereMotion';

/**
 * Sesli koç (SPEC_KEGEL_V2 §7.4): short phase commands with the device's own text-to-speech in the app
 * language (expo-speech, offline). When the device has no voice for that language the option is hidden.
 */

let turkishVoice: string | null | undefined;

const LOCALE = localeOf(CONTENT_LANGUAGE);

/** Finds a voice for the app language once (null = none on this device). */
export async function findTurkishVoice(): Promise<string | null> {
  if (turkishVoice !== undefined) return turkishVoice;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const tr = voices.find((v) => v.language?.toLowerCase().replace('_', '-').startsWith(CONTENT_LANGUAGE));
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
    Speech.speak(text, { language: LOCALE, voice: turkishVoice, rate: 1.05 });
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
export function voiceKeyForPhase(phase: { kind: string; stage?: number; durationMs: number; variant?: string; level?: number; fromLevel?: number }, exerciseType?: ExerciseType): string | null {
  // 180-day-plan moves: say the step ("üçte bir sık", "yarıya in" …); a 1 s half squeeze is too short.
  const step = levelWord(phase);
  if (step) return phase.durationMs >= 2000 ? step : null;
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
