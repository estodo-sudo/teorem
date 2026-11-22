import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import { ambientVolume, soundPlan } from './soundPlan';
import { SOUND, TOTAL_MS, type IntroSoundId } from './timeline';

/**
 * Sound of the anatomy animation: the ambient loop plus the cues of `timeline.ts` (SOUND), played in
 * step with the clock. `play(from)` starts everything from a time (a cue already under way is joined
 * part way through), `pause()` stops it at once, `dispose()` frees the players.
 * Sound is optional: any player error is swallowed and the animation goes on silently.
 */

const SOURCES: Record<IntroSoundId | 'ambient', number> = {
  ambient: require('../../../assets/sounds/intro/ambient.wav'),
  tick: require('../../../assets/sounds/intro/tick.wav'),
  chime: require('../../../assets/sounds/intro/chime.wav'),
};

const safe = (f: () => void) => {
  try {
    f();
  } catch {
    // sound is optional
  }
};

const safeGet = <T,>(f: () => T): T | undefined => {
  try {
    return f();
  } catch {
    return undefined;
  }
};

export function createIntroSound() {
  const players: Partial<Record<keyof typeof SOURCES, AudioPlayer>> = {};
  let timers: ReturnType<typeof setTimeout>[] = [];
  let configured = false;
  /** What is playing now: animation time `from` at wall-clock `since` (null when paused). */
  let running: { from: number; since: number } | null = null;

  const player = (id: keyof typeof SOURCES): AudioPlayer | undefined => {
    if (!players[id]) safe(() => (players[id] = createAudioPlayer(SOURCES[id])));
    return players[id];
  };
  const start = (id: keyof typeof SOURCES, offsetMs: number) =>
    safe(() => {
      const p = player(id);
      if (!p) return;
      void p.seekTo(offsetMs / 1000).catch(() => undefined);
      p.play();
    });

  const stopAll = () => {
    timers.forEach(clearTimeout);
    timers = [];
    Object.values(players).forEach((p) => safe(() => p?.pause()));
  };
  const pause = () => {
    running = null;
    stopAll();
  };

  const play = (from: number) => {
    stopAll();
    running = { from, since: Date.now() };
    if (!configured) {
      configured = true;
      // Follows the silent switch, and mixes with other audio instead of stopping it.
      void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
    }
    const plan = soundPlan(from);
    if (plan.ambient) {
      const amb = player('ambient');
      safe(() => {
        if (!amb) return;
        amb.loop = true;
        amb.volume = ambientVolume(from);
      });
      start('ambient', plan.ambient.offsetMs);
      // Fade the ambient out over the last seconds, then stop it.
      for (let t = Math.max(from, SOUND.ambient.fadeFrom); t <= TOTAL_MS; t += 250) {
        timers.push(setTimeout(() => safe(() => amb && (amb.volume = ambientVolume(t))), t - from));
      }
      timers.push(setTimeout(() => safe(() => amb?.pause()), TOTAL_MS - from));
    }
    for (const c of plan.cues) {
      if (c.inMs === 0) start(c.id, c.offsetMs);
      else timers.push(setTimeout(() => start(c.id, 0), c.inMs));
    }
  };

  // Web: a browser blocks sound until the person has touched the page (for example when the page was
  // opened or reloaded directly). Then the first touch or key press starts the sound where the
  // animation is now. In the app the screen is always reached by a tap, and phones have no such rule.
  const onGesture = () => {
    if (!running) return;
    const amb = players.ambient;
    if (amb && safeGet(() => amb.playing)) return;
    play(running.from + (Date.now() - running.since));
  };
  const web = Platform.OS === 'web' && typeof document !== 'undefined';
  if (web) {
    document.addEventListener('pointerdown', onGesture, true);
    document.addEventListener('keydown', onGesture, true);
  }

  const dispose = () => {
    pause();
    if (web) {
      document.removeEventListener('pointerdown', onGesture, true);
      document.removeEventListener('keydown', onGesture, true);
    }
    Object.values(players).forEach((p) => safe(() => p?.remove()));
  };

  // Load the players ahead so the first cue starts on time.
  const preload = () => (Object.keys(SOURCES) as (keyof typeof SOURCES)[]).forEach((id) => player(id));

  return { play, pause, dispose, preload };
}
