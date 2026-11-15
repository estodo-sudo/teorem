import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/** Optional soft tone cues (off by default). Respects the silent switch. */
export type SoundCue = 'contract' | 'relax' | 'done' | 'breathe';

const SOURCES: Record<SoundCue, number> = {
  /* eslint-disable @typescript-eslint/no-require-imports */
  contract: require('../../../assets/sounds/contract.wav'),
  relax: require('../../../assets/sounds/relax.wav'),
  done: require('../../../assets/sounds/done.wav'),
  breathe: require('../../../assets/sounds/breathe.wav'),
  /* eslint-enable @typescript-eslint/no-require-imports */
};

let players: Partial<Record<SoundCue, AudioPlayer>> = {};
let configured = false;

export function prepareSounds() {
  if (!configured) {
    configured = true;
    void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }
  (Object.keys(SOURCES) as SoundCue[]).forEach((k) => {
    if (!players[k]) {
      try {
        players[k] = createAudioPlayer(SOURCES[k]);
      } catch {
        // ignore — sound is optional
      }
    }
  });
}

export function playSound(cue: SoundCue) {
  const p = players[cue];
  if (!p) return;
  try {
    void p.seekTo(0);
    p.play();
  } catch {
    // ignore
  }
}

export function releaseSounds() {
  Object.values(players).forEach((p) => {
    try {
      p?.remove();
    } catch {
      // ignore
    }
  });
  players = {};
}

export function soundForPhaseStart(kind: string, stage?: number): SoundCue | null {
  if (kind === 'contract' && (!stage || stage === 1)) return 'contract';
  if (kind === 'relax' || kind === 'rest') return 'relax';
  if (kind === 'inhale') return 'breathe';
  return null;
}
