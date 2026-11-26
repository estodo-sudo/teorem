import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

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

/** Light points orbiting the halo (aesthetic pass 2026-11-25). */
const ORBIT_DOTS = 12;
/** Orbit speed in rad/ms: drifting when relaxed, quick while squeezing. */
const ORBIT_SLOW = 0.00022;
const ORBIT_FAST = 0.0016;
/** A squeeze sends two waves out from the ring; letting go draws one soft wave in. */
const WAVE_MS = 1100;
const WAVE_GAP_MS = 220;
const RELEASE_WAVE_MS = 1300;
/** Warm white of the orbit points and the ring's glowing head. */
const SPARK = '#FFE9E1';

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
  // Aesthetic pass (2026-11-25): waves, orbit, a softer bloom; none of them with "reduce motion".
  const wave1 = useSharedValue(1);
  const wave2 = useSharedValue(1);
  const releaseWave = useSharedValue(1);
  const squeezeAmt = useSharedValue(0);
  const orbit = useSharedValue(0);
  const wasSqueezing = useRef(false);

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

  // Waves: out on every squeeze start, one soft wave in when letting go.
  useEffect(() => {
    squeezeAmt.value = withTiming(squeezing ? 1 : 0, { duration: squeezing ? 400 : 600 });
    if (!reduce && squeezing) {
      const out = { duration: WAVE_MS, easing: Easing.out(Easing.cubic) };
      wave1.value = 0;
      wave1.value = withTiming(1, out);
      wave2.value = 1;
      wave2.value = withDelay(WAVE_GAP_MS, withSequence(withTiming(0, { duration: 0 }), withTiming(1, out)));
    } else if (!reduce && wasSqueezing.current && !paused && !finished) {
      releaseWave.value = 0;
      releaseWave.value = withTiming(1, { duration: RELEASE_WAVE_MS, easing: Easing.out(Easing.sin) });
    }
    wasSqueezing.current = squeezing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squeezing, reduce, phaseKey]);

  // Orbit: a frame clock on the UI thread; it speeds up with the squeeze and stops when paused.
  const orbitClock = useFrameCallback((f) => {
    const dt = Math.min(64, f.timeSincePreviousFrame ?? 16);
    orbit.value = (orbit.value + dt * (ORBIT_SLOW + (ORBIT_FAST - ORBIT_SLOW) * squeezeAmt.value)) % (Math.PI * 2);
  }, false);
  useEffect(() => {
    orbitClock.setActive(!reduce && !paused && !finished);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, paused, finished]);

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
  // Soft bloom beyond the halo, as large as the squeeze.
  const bloomStyle = useAnimatedStyle(() => {
    const grown = Math.min(1, Math.max(0, (scale.value - RELAXED) / (1 - RELAXED)));
    return { opacity: haloOpacity.value * (0.15 + 0.5 * grown), transform: [{ scale: 0.8 + 0.25 * grown }] };
  });
  const waveFrom = (disc / 2 + 10) / (size / 2);
  const wave1Style = useAnimatedStyle(() => ({ opacity: wave1.value >= 1 ? 0 : (1 - wave1.value) * 0.75, transform: [{ scale: waveFrom + (1.12 - waveFrom) * wave1.value }] }));
  const wave2Style = useAnimatedStyle(() => ({ opacity: wave2.value >= 1 ? 0 : (1 - wave2.value) * 0.75, transform: [{ scale: waveFrom + (1.12 - waveFrom) * wave2.value }] }));
  const releaseStyle = useAnimatedStyle(() => ({ opacity: releaseWave.value >= 1 ? 0 : Math.sin(releaseWave.value * Math.PI) * 0.45, transform: [{ scale: 1.02 - (1.02 - waveFrom) * releaseWave.value }] }));
  // The progress ring's glowing head.
  const headProps = useAnimatedProps(() => {
    const a = -Math.PI / 2 + ring.value * Math.PI * 2;
    return { cx: size / 2 + Math.cos(a) * ringR, cy: size / 2 + Math.sin(a) * ringR, opacity: ring.value > 0.005 && ring.value < 0.995 && !paused ? 1 : 0 };
  });
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
      {!reduce ? (
        <>
          {/* Bloom: a wide, faint glow that swells with the squeeze. */}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size * 1.35, height: size * 1.35, left: -size * 0.175, top: -size * 0.175 }, bloomStyle]}>
            <Svg width={size * 1.35} height={size * 1.35}>
              <Defs>
                <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
                  <Stop offset="0.45" stopColor={halo} stopOpacity={0.55} />
                  <Stop offset="1" stopColor={halo} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={size * 0.675} cy={size * 0.675} r={size * 0.675} fill="url(#bloom)" />
            </Svg>
          </Animated.View>
          {/* Waves: two out on a squeeze, one in on letting go. */}
          <Animated.View pointerEvents="none" style={[styles.wave, { width: size, height: size, borderRadius: size / 2, borderColor: halo }, wave1Style]} />
          <Animated.View pointerEvents="none" style={[styles.wave, { width: size, height: size, borderRadius: size / 2, borderColor: halo }, wave2Style]} />
          <Animated.View pointerEvents="none" style={[styles.wave, { width: size, height: size, borderRadius: size / 2, borderColor: SPARK, borderWidth: 2 }, releaseStyle]} />
          {/* Orbit: light points on the halo's rim. */}
          {Array.from({ length: ORBIT_DOTS }, (_, i) => (
            <OrbitDot key={i} index={i} size={size} orbit={orbit} scale={scale} squeeze={squeezeAmt} />
          ))}
        </>
      ) : null}
      {/* Band, track and progress ring around the centre. */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx={size / 2} cy={size / 2} r={ringR} stroke={gap} strokeWidth={stroke + 10} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={ringR} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={ringR} stroke={colors.ring} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} animatedProps={ringProps} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        {/* glowing head of the ring */}
        <AnimatedCircle r={9} fill={SPARK} fillOpacity={0.28} animatedProps={headProps} />
        <AnimatedCircle r={4} fill={SPARK} animatedProps={headProps} />
      </Svg>
      {/* Centre disc in the phase colour (fixed size), with a soft highlight. */}
      <Animated.View style={[{ width: disc, height: disc, borderRadius: disc / 2, overflow: 'hidden' }, discStyle]}>
        <Svg width={disc} height={disc} pointerEvents="none">
          <Defs>
            <RadialGradient id="discShade" cx="68%" cy="78%" r="70%">
              <Stop offset="0" stopColor="#000" stopOpacity={0.24} />
              <Stop offset="1" stopColor="#000" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="disc" cx="42%" cy="36%" r="64%">
              <Stop offset="0" stopColor={colors.highlight} stopOpacity={0.5} />
              <Stop offset="1" stopColor={colors.highlight} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={disc / 2} cy={disc / 2} r={disc / 2} fill="url(#disc)" />
          {/* glossy finish: a soft shade low right, a small specular light, a thin inner rim */}
          <Circle cx={disc / 2} cy={disc / 2} r={disc / 2} fill="url(#discShade)" />
          <Ellipse cx={disc * 0.36} cy={disc * 0.27} rx={disc * 0.13} ry={disc * 0.07} fill="#fff" opacity={0.22} transform={`rotate(-28 ${disc * 0.36} ${disc * 0.27})`} />
          <Circle cx={disc / 2} cy={disc / 2} r={disc / 2 - 1.5} stroke="#fff" strokeOpacity={0.16} strokeWidth={1.5} fill="none" />
        </Svg>
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

/** One light point on the halo's rim: brighter, closer and faster while squeezing. */
function OrbitDot({ index, size, orbit, scale, squeeze }: { index: number; size: number; orbit: SharedValue<number>; scale: SharedValue<number>; squeeze: SharedValue<number> }) {
  const big = index % 3 === 0;
  const d = big ? 7 : 4.5;
  const style = useAnimatedStyle(() => {
    const grown = Math.min(1, Math.max(0, (scale.value - RELAXED) / (1 - RELAXED)));
    const hs = 0.67 + 0.33 * grown;
    const a = orbit.value * (index % 2 ? 1 : 0.82) + (index * Math.PI * 2) / ORBIT_DOTS;
    const r = (size / 2) * hs * (0.93 - 0.05 * Math.sin(orbit.value * 3 + index));
    return {
      opacity: (0.28 + 0.62 * squeeze.value) * (big ? 1 : 0.8),
      transform: [{ translateX: Math.cos(a) * r }, { translateY: Math.sin(a) * r }, { scale: 0.8 + 0.5 * squeeze.value }],
    };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: size / 2 - d / 2, top: size / 2 - d / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: SPARK }, style]} />;
}

const styles = StyleSheet.create({
  wave: { position: 'absolute', borderWidth: 3 },
});
