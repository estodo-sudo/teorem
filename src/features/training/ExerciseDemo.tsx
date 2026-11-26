import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useLive } from '@/lib/useLive';
import { useTheme } from '@/components';
import type { KegelExerciseType } from '@/types';

/** Squeeze / release timing of each exercise's short demo loop (ms), the same rhythm as the player. */
const RHYTHM: Record<KegelExerciseType, { up: number; hold: number; down: number; rest: number; peak: number }> = {
  slow_hold: { up: 700, hold: 1600, down: 900, rest: 900, peak: 1 },
  quick_flick: { up: 150, hold: 100, down: 250, rest: 350, peak: 1 },
  max_contraction: { up: 400, hold: 1200, down: 600, rest: 900, peak: 1.05 },
  elevator: { up: 2200, hold: 600, down: 2200, rest: 600, peak: 1 },
  endurance: { up: 700, hold: 2600, down: 900, rest: 700, peak: 0.9 },
  knack: { up: 200, hold: 700, down: 500, rest: 900, peak: 1 },
  release: { up: 900, hold: 300, down: 1800, rest: 600, peak: 0.75 },
  breath: { up: 1600, hold: 200, down: 2400, rest: 300, peak: 0.85 },
  // the moves of the 180-day plan (a single grow/shrink loop; the lesson shows their steps)
  step_up: { up: 2400, hold: 600, down: 500, rest: 900, peak: 1 },
  step_down: { up: 1500, hold: 400, down: 2400, rest: 600, peak: 1 },
  double_peak: { up: 500, hold: 900, down: 600, rest: 900, peak: 1 },
  half_quick: { up: 150, hold: 100, down: 250, rest: 350, peak: 0.78 },
  half_hold: { up: 600, hold: 2600, down: 800, rest: 800, peak: 0.78 },
  wave: { up: 600, hold: 1400, down: 900, rest: 700, peak: 0.9 },
};

/**
 * A small looping demo of an exercise's rhythm (SPEC_UI_V3 §7.2 "kısa animasyonlu anlatım"): the circle
 * grows on the squeeze and shrinks on the release, like the Kas Küresi. With "reduce motion" it stays still.
 */
export function ExerciseDemo({ type, size = 120 }: { type: KegelExerciseType; size?: number }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const live = useLive();
  const scale = useSharedValue(0.6);
  const r = RHYTHM[type];
  const calm = type === 'release' || type === 'breath';
  useEffect(() => {
    cancelAnimation(scale);
    if (reduce || !live) {
      scale.value = 0.8;
      return;
    }
    const ease = Easing.inOut(Easing.cubic);
    scale.value = withRepeat(
      withSequence(withTiming(r.peak, { duration: r.up, easing: ease }), withTiming(r.peak, { duration: r.hold }), withTiming(0.6, { duration: r.down, easing: ease }), withTiming(0.6, { duration: r.rest })),
      -1,
    );
    return () => cancelAnimation(scale);
  }, [type, reduce, r, scale, live]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const tone = calm ? t.tone.mind : t.tone.kegel;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size * 0.7, height: size * 0.7, borderRadius: size, backgroundColor: tone.fg }, style]} />
    </View>
  );
}
