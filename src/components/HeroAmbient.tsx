import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { useLive } from '@/lib/useLive';

/**
 * Living background for the camps' dark hero cards (round 6, 2026-11-25): two soft glows drift slowly
 * and a few light motes rise and fade, on one UI-thread clock. Purely decorative, behind the content,
 * never touchable; with "reduce motion" it stands still. `glow` is the camp tone (a light tint of it).
 */
const LOOP_MS = 14000;
const MOTES = [
  { x: 0.12, size: 4, speed: 1, phase: 0 },
  { x: 0.3, size: 3, speed: 1.4, phase: 0.35 },
  { x: 0.52, size: 5, speed: 0.8, phase: 0.6 },
  { x: 0.7, size: 3, speed: 1.2, phase: 0.15 },
  { x: 0.86, size: 4, speed: 0.9, phase: 0.8 },
  { x: 0.42, size: 2.5, speed: 1.6, phase: 0.5 },
];

export function HeroAmbient({ glow }: { glow: string }) {
  const reduce = useReducedMotion();
  // Battery (round 8): the loop runs only while the card can be seen.
  const live = useLive();
  const clock = useSharedValue(0.25);
  useEffect(() => {
    if (reduce || !live) {
      cancelAnimation(clock);
      return;
    }
    // go on from where it stopped
    const from = clock.value % 1;
    clock.value = withTiming(1, { duration: LOOP_MS * (1 - from), easing: Easing.linear }, (done) => {
      if (done) {
        clock.value = 0;
        clock.value = withRepeat(withTiming(1, { duration: LOOP_MS, easing: Easing.linear }), -1);
      }
    });
    return () => cancelAnimation(clock);
  }, [reduce, live, clock]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Glow clock={clock} color={glow} size={240} from={[0.72, -0.35]} to={[0.55, -0.2]} phase={0} />
      <Glow clock={clock} color={glow} size={180} from={[-0.22, 0.55]} to={[-0.08, 0.7]} phase={0.5} />
      {MOTES.map((m, i) => (
        <Mote key={i} clock={clock} {...m} />
      ))}
    </View>
  );
}

/** A soft round glow that sways between two spots (fractions of the card) and back. */
function Glow({ clock, color, size, from, to, phase }: { clock: SharedValue<number>; color: string; size: number; from: [number, number]; to: [number, number]; phase: number }) {
  const style = useAnimatedStyle(() => {
    const k = (1 - Math.cos(((clock.value + phase) % 1) * Math.PI * 2)) / 2;
    return {
      left: `${(from[0] + (to[0] - from[0]) * k) * 100}%`,
      top: `${(from[1] + (to[1] - from[1]) * k) * 100}%`,
      opacity: 0.16 + 0.1 * k,
      transform: [{ scale: 0.92 + 0.12 * k }],
    };
  });
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

/** A small light mote rising from the bottom and fading out near the top. */
function Mote({ clock, x, size, speed, phase }: { clock: SharedValue<number>; x: number; size: number; speed: number; phase: number }) {
  const style = useAnimatedStyle(() => {
    const k = (clock.value * speed + phase) % 1;
    return {
      left: `${x * 100}%`,
      top: `${(1 - k) * 100}%`,
      opacity: Math.sin(k * Math.PI) * 0.55,
      transform: [{ translateX: Math.sin(k * Math.PI * 4 + phase * 6) * 6 }],
    };
  });
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFFFFF' }, style]} />;
}
