import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface Props {
  size: number;
  /** Target scale 0..1 and how long to reach it. */
  target: number;
  durationMs: number;
  color: string;
  /** Re-trigger key (phase index). */
  animKey: number;
  ringColor: string;
}

/** The big pulsating circle used by the Kegel player and breathing tool. */
export function BreathCircle({ size, target, durationMs, color, animKey, ringColor }: Props) {
  const scale = useSharedValue(target);
  useEffect(() => {
    scale.value = withTiming(target, {
      duration: Math.max(150, durationMs),
      easing: Easing.inOut(Easing.cubic),
    });
  }, [animKey, target, durationMs, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, borderWidth: 2, borderColor: ringColor, opacity: 0.5 }]} />
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.9 }, style]} />
    </View>
  );
}
