import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import type { ExerciseType } from '@/types';

import { RELAXED, sphereTarget, type SphereTone } from './sphereMotion';

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
  /** The halo that grows around the centre while squeezing (defaults to `accent`). */
  halo?: string;
  /** The band between the centre and the halo (the screen background). */
  gap?: string;
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
  /** Session finished normally: the ring closes and the halo fades. */
  finished?: boolean;
  colors: SphereColors;
  /**
   * Progress ring as fractions: where it is now and where it ends with this phase. Default: this phase
   * (elapsed → full). The player passes the whole exercise for hızlı sık-bırak and yavaş sıkma, so the
   * ring runs smoothly over the exercise instead of spinning on every short step.
   */
  ring?: { from: number; to: number };
  /** Count and word drawn in the centre (not scaled). */
  children?: ReactNode;
}

const toneColor = (tone: SphereTone, c: SphereColors) => (tone === 'accent' ? c.accent : tone === 'cool' ? c.cool : tone === 'breath' ? c.breath : c.neutral);

/** Halo trembles while squeezing: how far it moves (px) and how much it breathes in scale. */
const SHAKE_PX = 2.2;
const SHAKE_SCALE = 0.014;

/**
 * Kas çemberi (user decision 2026-11-22, modelled on the reference app): a centre disc of fixed size
 * in the phase colour holds the count and the word, with the progress ring right around it. Behind it
 * a soft halo GROWS while squeezing and TREMBLES for as long as the squeeze lasts (the phone vibrates
 * at the same time), then shrinks back and stills when letting go. Yavaş sıkma grows the halo over the
 * whole slow squeeze. With "reduce motion" the halo neither moves nor trembles; colour and opacity
 * carry the change and the ring keeps counting.
 */
export function MuscleSphere({ size, phase, exerciseType, phaseKey, elapsedMs, paused, finished, colors, ring: ringRange, children }: Props) {
  const reduce = useReducedMotion();
  const target = sphereTarget(phase, exerciseType);
  const color = toneColor(target.tone, colors);
  const squeezing = target.tone === 'accent' && !paused && !finished;

  const scale = useSharedValue(target.scale);
  const haloOpacity = useSharedValue(0.5);
  const ring = useSharedValue(0);
  const fill = useSharedValue(color);
  const shakeA = useSharedValue(0);
  const shakeB = useSharedValue(0);
  const shaking = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(ring);
    cancelAnimation(haloOpacity);
    // Trembling stops with `squeezing` (below).
    if (paused) return;
    if (finished) {
      ring.value = withTiming(1, { duration: 250 });
      scale.value = withTiming(RELAXED, { duration: 600 });
      haloOpacity.value = withDelay(200, withTiming(0.15, { duration: 600 }));
      return;
    }
    const remaining = Math.max(0, phase.durationMs - elapsedMs);
    const from = ringRange ? ringRange.from : phase.durationMs > 0 ? Math.min(1, elapsedMs / phase.durationMs) : 1;
    const to = ringRange ? ringRange.to : 1;
    ring.value = from;
    ring.value = withTiming(to, { duration: remaining, easing: Easing.linear });
    // On resume, finish the move in the time that is left.
    const move = elapsedMs > 50 ? Math.max(150, Math.min(target.moveMs - elapsedMs, remaining)) : target.moveMs;
    fill.value = withTiming(color, { duration: Math.min(500, move) });
    haloOpacity.value = withTiming(target.tone === 'accent' ? 1 : 0.55, { duration: Math.min(500, move) });
    scale.value = reduce ? 0.8 : withTiming(target.scale, { duration: move, easing: target.easing === 'inOutSine' ? Easing.inOut(Easing.sin) : Easing.inOut(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey, paused, finished, reduce]);

  // Tremble while squeezing: two quick out-of-step oscillations so it looks alive, not mechanical.
  useEffect(() => {
    if (squeezing && !reduce) {
      shaking.value = withTiming(1, { duration: 120 });
      shakeA.value = withRepeat(withSequence(withTiming(1, { duration: 38 }), withTiming(-1, { duration: 76 }), withTiming(0, { duration: 38 })), -1);
      shakeB.value = withRepeat(withSequence(withTiming(-1, { duration: 47 }), withTiming(1, { duration: 94 }), withTiming(0, { duration: 47 })), -1);
    } else {
      shaking.value = withTiming(0, { duration: 160 });
      cancelAnimation(shakeA);
      cancelAnimation(shakeB);
      shakeA.value = withTiming(0, { duration: 160 });
      shakeB.value = withTiming(0, { duration: 160 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squeezing, reduce, phaseKey]);

  const stroke = 4;
  const disc = Math.round(size * 0.5);
  const ringR = disc / 2 + 7;
  const circumference = 2 * Math.PI * ringR;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - ring.value) }));
  const haloStyle = useAnimatedStyle(() => {
    // Trembles more the bigger it has grown (yavaş sıkma builds up to it).
    const grown = Math.min(1, Math.max(0, (scale.value - RELAXED) / (1 - RELAXED)));
    const k = shaking.value * (0.35 + 0.65 * grown);
    // Relaxed: a slim rim just outside the ring (a touch wider, user request); squeezed: the full size.
    const hs = 0.67 + 0.33 * grown;
    return {
      opacity: haloOpacity.value,
      transform: [{ translateX: shakeA.value * SHAKE_PX * k }, { translateY: shakeB.value * SHAKE_PX * k }, { scale: hs * (1 + shakeB.value * SHAKE_SCALE * k) }],
    };
  });
  const discStyle = useAnimatedStyle(() => ({ backgroundColor: paused ? colors.paused : fill.value }));
  const halo = colors.halo ?? colors.accent;
  const gap = colors.gap ?? 'transparent';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Halo: a radial glow, rasterised once and moved as a texture (smooth on phones). */}
      <Animated.View renderToHardwareTextureAndroid shouldRasterizeIOS pointerEvents="none" style={[StyleSheet.absoluteFill, haloStyle]}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              {/* Dense (user request): solid red to 70 %, then a short soft edge. */}
              <Stop offset="0.7" stopColor={halo} stopOpacity={1} />
              <Stop offset="0.88" stopColor={halo} stopOpacity={0.85} />
              <Stop offset="1" stopColor={halo} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#halo)" />
        </Svg>
      </Animated.View>
      {/* Band, track and progress ring around the centre. */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx={size / 2} cy={size / 2} r={ringR} stroke={gap} strokeWidth={stroke + 10} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={ringR} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={ringR} stroke={colors.ring} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} animatedProps={ringProps} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      {/* Centre disc in the phase colour (fixed size), with a soft highlight. */}
      <Animated.View style={[{ width: disc, height: disc, borderRadius: disc / 2, overflow: 'hidden' }, discStyle]}>
        <Svg width={disc} height={disc} pointerEvents="none">
          <Defs>
            <RadialGradient id="disc" cx="42%" cy="36%" r="64%">
              <Stop offset="0" stopColor={colors.highlight} stopOpacity={0.5} />
              <Stop offset="1" stopColor={colors.highlight} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={disc / 2} cy={disc / 2} r={disc / 2} fill="url(#disc)" />
        </Svg>
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}
