import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import type { ExerciseType } from '@/types';

import { sphereTarget, type SphereTone } from './sphereMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface SphereColors {
  neutral: string;
  accent: string;
  cool: string;
  breath: string;
  ring: string;
  track: string;
  paused: string;
  /** Soft glow behind the sphere (ui-v3). */
  glow: string;
  /** Lighter centre of the radial highlight. */
  highlight: string;
}

interface Props {
  size: number;
  phase: { kind: string; stage?: number; durationMs: number; variant?: string };
  exerciseType?: ExerciseType;
  /** Changes on every phase start (phase index). */
  phaseKey: number;
  /** Time already spent in the phase when (re)started — for resume. */
  elapsedMs: number;
  paused: boolean;
  /** Session finished normally: the ring closes and the circle fades. */
  finished?: boolean;
  colors: SphereColors;
  /** Seconds shown in the middle (not scaled with the circle). */
  children?: ReactNode;
}

const toneColor = (tone: SphereTone, c: SphereColors) => (tone === 'accent' ? c.accent : tone === 'cool' ? c.cool : tone === 'breath' ? c.breath : c.neutral);

/**
 * Centre circle with the v1 animation (user decision): it grows when squeezing and shrinks when
 * relaxing, with a smooth in-out curve, and changes colour. Slow squeeze / slow release take the
 * whole phase. A thin ring around it fills over each phase. With "reduce motion" on, the size stays
 * and only colour and opacity change; the ring keeps counting down.
 * ui-v3 look: radial highlight, 3 px ring and a soft glow (brighter on squeeze, out on release).
 */
export function MuscleSphere({ size, phase, exerciseType, phaseKey, elapsedMs, paused, finished, colors, children }: Props) {
  const reduce = useReducedMotion();
  const target = sphereTarget(phase, exerciseType);
  const color = toneColor(target.tone, colors);

  const scale = useSharedValue(target.scale);
  const opacity = useSharedValue(0.9);
  const ring = useSharedValue(0);
  const fill = useSharedValue(color);
  // ui-v3: a soft glow — brighter while squeezing, out when relaxing. Purely visual; the motion above is unchanged.
  const glowTarget = target.tone === 'accent' ? 0.32 : target.tone === 'cool' ? 0 : 0.16;
  const glow = useSharedValue(glowTarget);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(ring);
    cancelAnimation(opacity);
    cancelAnimation(glow);
    if (paused) {
      glow.value = withTiming(0, { duration: 250 });
      return;
    }
    if (finished) {
      ring.value = withTiming(1, { duration: 250 });
      opacity.value = withDelay(300, withTiming(0.2, { duration: 600 }));
      glow.value = withTiming(0, { duration: 600 });
      return;
    }
    const remaining = Math.max(0, phase.durationMs - elapsedMs);
    ring.value = phase.durationMs > 0 ? Math.min(1, elapsedMs / phase.durationMs) : 1;
    ring.value = withTiming(1, { duration: remaining, easing: Easing.linear });
    // On resume, finish the move in the time that is left.
    const move = elapsedMs > 50 ? Math.max(150, Math.min(target.moveMs - elapsedMs, remaining)) : target.moveMs;
    fill.value = withTiming(color, { duration: Math.min(500, move) });
    glow.value = withTiming(glowTarget, { duration: Math.min(600, move) });
    if (reduce) {
      scale.value = 1;
      opacity.value = withTiming(target.opacity, { duration: Math.min(500, move) });
    } else {
      opacity.value = withTiming(0.9, { duration: 200 });
      scale.value = withTiming(target.scale, { duration: move, easing: target.easing === 'inOutSine' ? Easing.inOut(Easing.sin) : Easing.inOut(Easing.cubic) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey, paused, finished, reduce]);

  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - ring.value) }));
  const circleStyle = useAnimatedStyle(() => ({ backgroundColor: paused ? colors.paused : fill.value, opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ backgroundColor: fill.value, opacity: glow.value, transform: [{ scale: scale.value * 1.14 }] }));
  const inner = size - 2 * (stroke + 14);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={colors.ring} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} animatedProps={ringProps} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: inner, height: inner, borderRadius: inner / 2 }, glowStyle]} />
      <Animated.View style={[{ width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden' }, circleStyle]}>
        {/* Radial highlight: lighter centre fading into the phase colour at the edge. */}
        <Svg width={inner} height={inner} pointerEvents="none">
          <Defs>
            <RadialGradient id="orb" cx="42%" cy="38%" r="62%">
              <Stop offset="0" stopColor={colors.highlight} stopOpacity={0.55} />
              <Stop offset="1" stopColor={colors.highlight} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={inner / 2} cy={inner / 2} r={inner / 2} fill="url(#orb)" />
        </Svg>
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}
