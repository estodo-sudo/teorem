import { useCallback, useEffect, useState } from 'react';
import { cancelAnimation, Easing, ReduceMotion, runOnJS, useAnimatedReaction, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useSettingsStore } from '@/stores/settingsStore';

import { playIntroTaps } from './haptics';
import { createIntroSound } from './sound';
import { LOOP_MS, sceneIndexAt, SCENES, TOTAL_MS, TRACKS } from './timeline';

/** From this time on the closing buttons can be pressed. */
const BUTTONS_AT = TRACKS.buttons[0][0];

/**
 * Play / pause / seek for the anatomy animation. Time is one shared value that runs on the UI thread
 * (a linear `withTiming` to the end); the JS side only hears about scene changes, never single frames.
 * The clock ignores the system "reduce motion" setting on purpose: that setting changes what is drawn
 * (`poseAtReduced`), not how fast time passes.
 *
 * `pulse` is scene 8's endless glow loop (0 → 1 → 0 every 3 s); it keeps going after the 50 s while
 * playing. Vibration follows the clock: it starts with play and stops at once on pause or seek.
 */
export function useTimeline({
  autoPlay = true,
  haptics = true,
  sound = true,
  startAt = 0,
}: {
  autoPlay?: boolean;
  haptics?: boolean;
  /** false: never play sound (still frames, screen-reader step mode). */
  sound?: boolean;
  /** Dev frames: start (paused) here. */
  startAt?: number;
} = {}) {
  const time = useSharedValue(startAt);
  const pulse = useSharedValue(0);
  const [playing, setPlaying] = useState(autoPlay);
  /** Bumped on every (re)start, so the clock and the vibration restart even when already playing. */
  const [runId, setRunId] = useState(0);
  const [scene, setScene] = useState(0);
  const [buttonsOn, setButtonsOn] = useState(false);
  const [looping, setLooping] = useState(false);
  const vibrate = useSettingsStore((s) => s.settings.hapticStrength > 0) && haptics;
  const audible = useSettingsStore((s) => s.settings.introSound !== false) && sound;
  const [audio] = useState(createIntroSound);
  useEffect(() => {
    if (sound) audio.preload();
    return () => audio.dispose();
  }, [audio, sound]);

  useEffect(() => {
    if (!playing) {
      cancelAnimation(time);
      return;
    }
    const from = time.get();
    time.set(
      withTiming(TOTAL_MS, { duration: Math.max(0, TOTAL_MS - from), easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (done) => {
        // The drawing stops at 50 s, but scene 8's glow loop goes on: keep "playing".
        if (done) runOnJS(setLooping)(true);
      }),
    );
    const stopTaps = playIntroTaps(from, vibrate);
    if (audible) audio.play(from);
    return () => {
      stopTaps();
      audio.pause();
    };
  }, [playing, runId, time, vibrate, audible, audio]);

  // Scene 8's loop runs while playing (also after the end), and stops with a pause.
  const loopOn = playing && (scene === SCENES.length - 1 || looping);
  useEffect(() => {
    if (!loopOn) {
      cancelAnimation(pulse);
      return;
    }
    pulse.set(withRepeat(withTiming(1, { duration: LOOP_MS / 2, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }), -1, true));
  }, [loopOn, pulse]);

  useAnimatedReaction(
    () => [sceneIndexAt(time.value), time.value >= BUTTONS_AT ? 1 : 0] as const,
    (now, before) => {
      if (!before || now[0] !== before[0]) runOnJS(setScene)(now[0]);
      if (!before || now[1] !== before[1]) runOnJS(setButtonsOn)(now[1] === 1);
    },
  );

  const restart = useCallback(() => {
    cancelAnimation(time);
    time.set(0);
    pulse.set(0);
    setLooping(false);
    setPlaying(true);
    setRunId((n) => n + 1);
  }, [pulse, time]);
  /** Resume. At the end this only restarts scene 8's glow loop; watching again is `restart`. */
  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);
  /** Jump to a time and stay paused there (no vibration). */
  const seek = useCallback(
    (ms: number) => {
      setPlaying(false);
      cancelAnimation(time);
      time.set(Math.min(TOTAL_MS, Math.max(0, ms)));
    },
    [time],
  );

  const finished = looping;
  return { time, pulse, playing, scene, buttonsOn, finished, play, pause, toggle, seek, restart };
}
