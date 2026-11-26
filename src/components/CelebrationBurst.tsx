import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

/**
 * A one-off burst around a finished ring (aesthetic pass 2026-11-25): two soft rings and a scatter of
 * sparks fly out once, then fade. Same visual language as the animated sign-up art. Nothing with
 * "reduce motion". Decorative: hidden from screen readers.
 */
const SPARKS = 16;
const COLORS = ['#3FA79D', '#6CCFC4', '#E8A33D', '#F0B65A'];

export function CelebrationBurst({ size, delay = 450, play = true }: { size: number; delay?: number; play?: boolean }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce || !play) return;
    t.value = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [reduce, play, delay, t]);
  if (reduce || !play) return null;
  const box = size * 2.2;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', width: box, height: box, left: (size - box) / 2, top: (size - box) / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Ring t={t} size={size} lag={0} color={COLORS[0]!} />
      <Ring t={t} size={size} lag={0.15} color={COLORS[2]!} />
      {Array.from({ length: SPARKS }, (_, i) => (
        <Spark key={i} t={t} index={i} size={size} />
      ))}
    </View>
  );
}

function Ring({ t, size, lag, color }: { t: SharedValue<number>; size: number; lag: number; color: string }) {
  const style = useAnimatedStyle(() => {
    const k = Math.min(1, Math.max(0, (t.value - lag) / (1 - lag)));
    return { opacity: k <= 0 || k >= 1 ? 0 : (1 - k) * 0.7, transform: [{ scale: 0.9 + 1.0 * k }] };
  });
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: color }, style]} />;
}

function Spark({ t, index, size }: { t: SharedValue<number>; index: number; size: number }) {
  // A fixed, even spread with a little variety per spark (no randomness: the same every time).
  const a = (index / SPARKS) * Math.PI * 2 + (index % 2 ? 0.12 : -0.08);
  const reach = size * (0.72 + 0.28 * ((index * 7) % 5) * 0.25);
  const d = index % 4 === 0 ? 8 : 5;
  const style = useAnimatedStyle(() => {
    const k = t.value;
    return {
      opacity: k <= 0 || k >= 1 ? 0 : k < 0.2 ? k * 5 : 1 - (k - 0.2) / 0.8,
      transform: [{ translateX: Math.cos(a) * reach * k }, { translateY: Math.sin(a) * reach * k + 10 * k * k }, { scale: 1 - 0.4 * k }],
    };
  });
  return <Animated.View style={[{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: COLORS[index % COLORS.length] }, style]} />;
}
