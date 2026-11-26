import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

/**
 * Background music for Kasık Fitness (user request 2026-11-26: a simple "dım tıs tak" beat while the
 * routine runs; changed the same day at the user's pick): "Synthwave House Loop" by Fupi, CC0
 * (opengameart.org/content/synthwave-house-loop), a 50 s seamless loop re-encoded to AAC. It plays only while the workout runs, pauses with it and stops when
 * the screen closes. It mixes with other audio and follows the silent switch; any audio error is
 * swallowed (music is optional).
 */
const SOURCE = require('../../../assets/sounds/fitness/music.m4a');
/** Under the phone's own volume: a backing beat, not a soundtrack. */
export const MUSIC_VOLUME = 0.45;

export function useWorkoutMusic(playing: boolean) {
  const player = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    try {
      void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
      const p = createAudioPlayer(SOURCE);
      p.loop = true;
      p.volume = MUSIC_VOLUME;
      player.current = p;
    } catch {
      player.current = null;
    }
    return () => {
      try {
        player.current?.remove();
      } catch {
        // ignore
      }
      player.current = null;
    };
  }, []);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    try {
      if (playing) p.play();
      else p.pause();
    } catch {
      // ignore
    }
  }, [playing]);
}
