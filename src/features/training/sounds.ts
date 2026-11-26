import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/** Optional soft tone cues (off by default). Respects the silent switch. */
/** v2 (SPEC_KEGEL_V2 §7.4): rising tone = squeeze, falling tone = release, tick = second. */
export type SoundCue = 'contract' | 'relax' | 'done' | 'breathe' | 'rise' | 'fall' | 'tick';

const SOURCES: Record<SoundCue, number> = {
  contract: require('../../../assets/sounds/contract.wav'),
  relax: require('../../../assets/sounds/relax.wav'),
  done: require('../../../assets/sounds/done.wav'),
  breathe: require('../../../assets/sounds/breathe.wav'),
  rise: require('../../../assets/sounds/rise.wav'),
  fall: require('../../../assets/sounds/fall.wav'),
  tick: require('../../../assets/sounds/tick.wav'),
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

export function soundForPhaseStart(kind: string, stage?: number, variant?: string, level?: number, fromLevel?: number): SoundCue | null {
  if (variant === 'top' || variant === 'settle') return null;
  // a step of a 180-day-plan move: up = rising tone, down = falling tone, staying = nothing
  if (kind === 'contract' && level !== undefined && fromLevel) return Math.abs(level - fromLevel) < 0.02 ? null : level > fromLevel ? 'rise' : 'fall';
  if (variant === 'slowDown') return 'fall';
  if ((kind === 'contract' || kind === 'cough') && (!stage || stage === 1)) return 'rise';
  if (kind === 'relax' || kind === 'rest') return 'fall';
  if (kind === 'inhale') return 'breathe';
  return null;
}
