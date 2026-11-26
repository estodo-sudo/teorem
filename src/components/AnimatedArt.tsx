import { useEffect, useId, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { artPhase, type AnimatedArtName } from './artLoop';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useLive } from '@/lib/useLive';

/**
 * Looping animated illustrations for sign-up and the tutorial (2026-11-25). Designed and previewed in
 * Remotion (reels project, src/AppArt.tsx); the same drawing code runs here on react-native-svg, so it
 * costs no asset bytes and stays sharp. Every picture is a pure function of the loop phase p (0–1), which
 * makes each loop seamless. With "reduce motion" on, a still frame is shown. Decorative: hidden from
 * screen readers. Colours read on light and dark backgrounds.
 */
const K = { petrol: '#3FA79D', petrolHi: '#6CCFC4', petrolDeep: '#1E6B66', amber: '#E8A33D', mist: '#9AA2A9', red: '#E0605A', green: '#3FB37F' };
const TAU = Math.PI * 2;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Linear map of x from [a, b] to [0, 1], clamped. */
const ramp = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
const ease = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** `core: false` leaves the middle empty for something drawn over it (the logo on the welcome screen). */
type Draw = (p: number, id: (name: string) => string, opts: { core: boolean }) => ReactNode;

/** Breathing sphere: squeeze (smaller, brighter) and release, ripples, orbiting sparks, a lifting hammock. */
const welcome: Draw = (p, id) => {
  const squeeze = (1 - Math.cos(p * TAU)) / 2;
  const r = 52 - 9 * squeeze;
  const lift = 10 * squeeze;
  return (
    <>
      <Circle cx={120} cy={112} r={100} fill={`url(#${id('halo')})`} opacity={0.6 + 0.4 * squeeze} />
      {[0, 1, 2].map((i) => {
        const q = (p * 2 + i / 3) % 1;
        return <Circle key={i} cx={120} cy={112} r={56 + q * 60} fill="none" stroke={K.petrol} strokeWidth={2.4 * (1 - q)} opacity={0.55 * (1 - q)} />;
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = p * TAU * (i % 2 ? 1 : -1) + (i * TAU) / 5;
        const d = 78 + 8 * Math.sin(p * TAU * 2 + i);
        return <Circle key={`s${i}`} cx={120 + Math.cos(a) * d} cy={112 + Math.sin(a) * d * 0.9} r={i % 2 ? 3 : 4.5} fill={i === 2 ? K.amber : K.petrolHi} opacity={0.85} />;
      })}
      <Circle cx={120} cy={112} r={r} fill={`url(#${id('orb')})`} />
      <Ellipse cx={104} cy={94} rx={r * 0.32} ry={r * 0.2} fill="#fff" opacity={0.28} />
      <Path d={`M58 ${172 - lift} Q120 ${206 - lift * 2.6} 182 ${172 - lift}`} fill="none" stroke={K.petrol} strokeWidth={7} strokeLinecap="round" />
      {[0, 1].map((i) => (
        <Path key={i} d={`M${112 + i * 16} ${222 - lift * 1.5} l0 -14 m-6 6 l6 -6 l6 6`} stroke={K.amber} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={squeeze} />
      ))}
    </>
  );
};

/** Target: dashed rings turn, an arrow flies in and lands with a ripple; goal dots orbit. */
const goals: Draw = (p, id) => {
  const fly = ease(ramp(p, 0.08, 0.36));
  const hit = ramp(p, 0.36, 0.7);
  const out = 1 - ramp(p, 0.86, 1);
  const ax = lerp(236, 128, fly);
  const ay = lerp(10, 112, fly);
  return (
    <>
      <Circle cx={120} cy={120} r={96} fill={`url(#${id('halo')})`} />
      {[84, 60, 36].map((rr, i) => (
        <Circle key={rr} cx={120} cy={120} r={rr} fill="none" stroke={i === 1 ? K.petrolHi : K.petrol} strokeWidth={i === 0 ? 3 : 5} strokeDasharray={i === 0 ? '10 8' : undefined} transform={`rotate(${(i % 2 ? -1 : 1) * p * 360} 120 120)`} opacity={0.9 - i * 0.1} />
      ))}
      <Circle cx={120} cy={120} r={14} fill={K.amber} />
      <Circle cx={120} cy={120} r={14 + hit * 50} fill="none" stroke={K.amber} strokeWidth={3 * (1 - hit)} opacity={1 - hit} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * TAU) / 6 + p * TAU;
        return <Circle key={i} cx={120 + Math.cos(a) * 104} cy={120 + Math.sin(a) * 104} r={5} fill={i % 3 === 0 ? K.amber : K.petrolHi} />;
      })}
      <G opacity={out} transform={`translate(${ax} ${ay}) rotate(135)`}>
        <Line x1={0} y1={0} x2={0} y2={62} stroke={K.petrol} strokeWidth={5} strokeLinecap="round" />
        <Path d="M0 -4 L-8 12 L8 12 Z" fill={K.petrol} transform="rotate(180 0 4)" />
        <Path d="M0 52 l-9 12 M0 52 l9 12 M0 44 l-9 12 M0 44 l9 12" stroke={K.amber} strokeWidth={3} strokeLinecap="round" />
      </G>
    </>
  );
};

/** 30-day plan: a calendar of 30 dots fills in, the last one sparks, then it fades and starts again. */
const plan: Draw = (p) => {
  const fill = 30 * ramp(p, 0.05, 0.7);
  const fade = 1 - ramp(p, 0.9, 1);
  const spark = ramp(p, 0.7, 0.86);
  return (
    <>
      <Rect x={34} y={42} width={172} height={160} rx={22} fill="none" stroke={K.petrol} strokeWidth={4} />
      <Path d="M34 78 H206" stroke={K.petrol} strokeWidth={4} />
      {[72, 168].map((x) => (
        <Rect key={x} x={x - 4} y={30} width={8} height={24} rx={4} fill={K.petrolDeep} />
      ))}
      {Array.from({ length: 30 }, (_, i) => {
        const cx = 58 + (i % 6) * 25;
        const cy = 98 + Math.floor(i / 6) * 23;
        const on = clamp01(fill - i);
        return (
          <G key={i}>
            <Circle cx={cx} cy={cy} r={7} fill="none" stroke={K.mist} strokeWidth={2} opacity={0.6} />
            {on * fade > 0 ? <Circle cx={cx} cy={cy} r={7 * on * fade} fill={i === 29 ? K.amber : K.petrol} /> : null}
          </G>
        );
      })}
      <G opacity={spark * fade} transform={`translate(183 190) scale(${0.6 + 0.4 * spark})`}>
        <Circle r={20} fill={K.amber} />
        <Path d="M-9 0 l6 7 l12 -13" stroke="#fff" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * TAU) / 6;
        const d = 24 + spark * 18;
        return <Circle key={i} cx={183 + Math.cos(a) * d} cy={190 + Math.sin(a) * d} r={2.6} fill={K.amber} opacity={spark * (1 - spark) * 4 * fade} />;
      })}
    </>
  );
};

/** Consent: a shield, its check drawing in and a light sweep; a soft dashed ring breathes. */
const consentBreathe = (p: number) => (1 - Math.cos(p * TAU)) / 2;
const consent: Draw = (p, id, { core }) => {
  const draw = ease(ramp(p, 0.1, 0.4)) * (1 - ramp(p, 0.9, 1));
  const sweep = lerp(-1, 1, ramp(p, 0.45, 0.75));
  const breathe = consentBreathe(p);
  const shield = 'M120 30 L186 54 V112 C186 158 156 190 120 206 C84 190 54 158 54 112 V54 Z';
  return (
    <>
      <Circle cx={120} cy={118} r={92 + breathe * 8} fill={`url(#${id('halo')})`} />
      <Circle cx={120} cy={118} r={104 + breathe * 6} fill="none" stroke={K.petrol} strokeWidth={2} strokeDasharray="4 10" transform={`rotate(${p * 90} 120 118)`} opacity={0.7} />
      {core ? (
        <>
          <Path d={shield} fill={`url(#${id('orb')})`} />
          <G clipPath={`url(#${id('shield')})`}>
            <Rect x={60 + sweep * 120} y={10} width={40} height={220} fill={`url(#${id('shine')})`} transform="rotate(20 120 120)" />
          </G>
          <Path d="M92 116 l20 20 l38 -42" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset={100 * (1 - draw)} />
        </>
      ) : null}
    </>
  );
};
const SHIELD = 'M120 30 L186 54 V112 C186 158 156 190 120 206 C84 190 54 158 54 112 V54 Z';

/** Find the muscle: the drop's stream runs, then "pause" bars stop it. */
const find: Draw = (p, id) => {
  const stop = p < 0.5 ? ramp(p, 0.4, 0.5) : 1 - ramp(p, 0.88, 0.96);
  const drop = 'M120 24 C146 64 168 92 168 122 a48 48 0 0 1 -96 0 C72 92 94 64 120 24Z';
  const s = 1 - 0.05 * stop;
  return (
    <>
      <Circle cx={120} cy={120} r={98} fill={`url(#${id('halo')})`} />
      <Path d={drop} fill={`url(#${id('orb')})`} transform={`translate(${120 - 120 * s} ${120 - 120 * s}) scale(${s})`} />
      <Ellipse cx={104} cy={104} rx={12} ry={18} fill="#fff" opacity={0.25} />
      {[0, 1, 2, 3].map((i) => {
        const q = (p * 4 + i / 4) % 1;
        return <Ellipse key={i} cx={120} cy={178 + q * 56} rx={4.5} ry={7} fill={K.petrol} opacity={(1 - stop) * (1 - q)} />;
      })}
      <G opacity={stop} transform={`translate(120 124) scale(${0.7 + 0.3 * stop})`}>
        <Rect x={-22} y={-24} width={14} height={48} rx={5} fill="#fff" />
        <Rect x={8} y={-24} width={14} height={48} rx={5} fill="#fff" />
      </G>
    </>
  );
};

/** Technique: only the pelvic floor works; belly, buttocks and legs stay still. */
const technique: Draw = (p, id) => {
  const squeeze = (1 - Math.cos(p * TAU)) / 2;
  return (
    <>
      <Circle cx={120} cy={120} r={98} fill={`url(#${id('halo')})`} opacity={0.5 + 0.5 * squeeze} />
      {[
        [48, 60],
        [192, 60],
        [120, 214],
      ].map(([x, y], i) => (
        <G key={i} transform={`translate(${x} ${y})`} opacity={0.85}>
          <Circle r={17} fill="none" stroke={K.red} strokeWidth={3} />
          <Path d="M-7 -7 L7 7 M7 -7 L-7 7" stroke={K.red} strokeWidth={3.5} strokeLinecap="round" />
        </G>
      ))}
      <Circle cx={120} cy={122 - 12 * squeeze} r={46 - 8 * squeeze} fill={`url(#${id('orb')})`} />
      <Circle cx={120} cy={122 - 12 * squeeze} r={54 + 18 * squeeze} fill="none" stroke={K.petrolHi} strokeWidth={3} opacity={squeeze * 0.8} />
      <Path d={`M80 ${176 - 8 * squeeze} Q120 ${194 - 22 * squeeze} 160 ${176 - 8 * squeeze}`} fill="none" stroke={K.petrol} strokeWidth={6} strokeLinecap="round" />
      <G opacity={squeeze} transform={`translate(120 ${118 - 14 * squeeze})`}>
        <Path d="M-9 4 l9 -9 l9 9" stroke="#fff" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <G transform="translate(196 186)" opacity={0.4 + 0.6 * squeeze}>
        <Circle r={16} fill={K.green} />
        <Path d="M-7 0 l5 6 l10 -11" stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </>
  );
};

// ---------------------------------------------------------------- camps (round 6, 2026-11-25), each in its tone
const SKY = { main: '#3B8DAE', hi: '#8CCBE3', deep: '#21607A' };
/** Sigarasız Kamp: two lungs breathe in clean air; streams flow in, small leaves drift up. */
const smokefree: Draw = (p) => {
  const breath = (1 - Math.cos(p * TAU)) / 2;
  const s = 0.94 + 0.08 * breath;
  const lobe = 'M113 76 C 84 66 56 98 54 134 C 52 164 70 182 94 180 C 110 178 114 162 114 142 Z';
  return (
    <>
      <Circle cx={120} cy={124} r={96} fill={SKY.hi} opacity={0.18 + 0.12 * breath} />
      {[0, 1, 2].map((i) => (
        <Path key={i} d={`M${70 + i * 50} 18 C ${80 + i * 50} 40, ${100 + i * 20} 44, 120 58`} stroke={SKY.hi} strokeWidth={4} strokeLinecap="round" fill="none" strokeDasharray="10 12" strokeDashoffset={-p * 88} opacity={0.5 + 0.5 * breath} />
      ))}
      <G transform={`translate(${120 - 120 * s} ${124 - 124 * s}) scale(${s})`}>
        <Path d="M120 40 L120 80 M120 80 C 115 90 110 94 102 100 M120 80 C 125 90 130 94 138 100" stroke={SKY.hi} strokeWidth={7} strokeLinecap="round" fill="none" />
        <Path d={lobe} fill={SKY.main} />
        <Path d={lobe} fill={SKY.main} transform="translate(240 0) scale(-1 1)" />
        <Ellipse cx={82} cy={116} rx={9} ry={20} fill="#fff" opacity={0.22} />
        <Ellipse cx={158} cy={116} rx={9} ry={20} fill="#fff" opacity={0.22} />
      </G>
      {[0, 1, 2, 3].map((i) => {
        const q = (p + i / 4) % 1;
        const x = 40 + ((i * 53) % 160);
        return <Ellipse key={`l${i}`} cx={x + Math.sin(q * TAU) * 8} cy={214 - q * 190} rx={5} ry={2.6} fill={K.green} opacity={Math.sin(q * Math.PI) * 0.8} transform={`rotate(${q * 220 + i * 40} ${x} ${214 - q * 190})`} />;
      })}
    </>
  );
};

const INDIGO = { main: '#6466C9', hi: '#A9AAEE', deep: '#3E3F8F' };
/** Odak Kampı: a steady centre; scattered urges drift outward and fade while calm rings breathe. */
const focus: Draw = (p) => {
  const calm = (1 - Math.cos(p * TAU)) / 2;
  return (
    <>
      {[92, 70, 48].map((r, i) => (
        <Circle key={r} cx={120} cy={120} r={r + calm * 4 * (3 - i)} fill="none" stroke={INDIGO.hi} strokeWidth={2} opacity={0.35 + 0.15 * i} />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const q = (p * 1 + i / 9) % 1;
        const a = (i * TAU) / 9 + q * 1.2;
        const d = 30 + q * 90;
        return <Circle key={i} cx={120 + Math.cos(a) * d} cy={120 + Math.sin(a) * d} r={5 - q * 3} fill={i % 3 === 0 ? K.amber : INDIGO.main} opacity={(1 - q) * 0.85} />;
      })}
      <Circle cx={120} cy={120} r={26 + calm * 3} fill={INDIGO.main} />
      <Circle cx={120} cy={120} r={10} fill="#fff" opacity={0.9} />
      <Circle cx={112} cy={110} r={6} fill="#fff" opacity={0.25} />
    </>
  );
};

const SAND = { main: '#8A7A5C', hi: '#C9B994' };
const WATER = { main: '#5FB0D8', hi: '#A8DAF0' };
/** Alkolsüz Kamp: a glass of water whose surface sways, bubbles rising, a lemon slice on the rim. */
const alcoholfree: Draw = (p) => {
  const w = Math.sin(p * TAU) * 4;
  const level = 92;
  const surface = `M76 ${level + w} Q 98 ${level - 6 - w} 120 ${level} T 164 ${level - w} L 158 196 Q 157 204 149 204 L 91 204 Q 83 204 82 196 Z`;
  return (
    <>
      <Circle cx={120} cy={130} r={94} fill={WATER.hi} opacity={0.18} />
      <Path d={surface} fill={WATER.main} opacity={0.85} />
      {[0, 1, 2, 3, 4].map((i) => {
        const q = (p * 1.5 + i / 5) % 1;
        const x = 96 + ((i * 17) % 50);
        return <Circle key={i} cx={x + Math.sin(q * TAU * 2) * 3} cy={196 - q * 96} r={2.2 + (i % 2)} fill="#fff" opacity={Math.sin(q * Math.PI) * 0.8} />;
      })}
      <Path d="M72 58 L82 198 Q 83 210 95 210 L145 210 Q 157 210 158 198 L168 58" stroke={SAND.main} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M72 58 L168 58" stroke={SAND.hi} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      <G transform={`rotate(${-12 + w} 166 60)`}>
        <Circle cx={166} cy={60} r={20} fill={K.amber} />
        <Circle cx={166} cy={60} r={15} fill="#F6D77A" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Line key={i} x1={166} y1={60} x2={166 + Math.cos((i * TAU) / 6) * 14} y2={60 + Math.sin((i * TAU) / 6) * 14} stroke={K.amber} strokeWidth={1.5} />
        ))}
      </G>
    </>
  );
};

/** The still frame shown with "reduce motion" (loop lengths: artLoop.ts). */
const ART: Record<AnimatedArtName, { draw: Draw; still: number }> = {
  welcome: { draw: welcome, still: 0.5 },
  goals: { draw: goals, still: 0.5 },
  plan: { draw: plan, still: 0.8 },
  consent: { draw: consent, still: 0.5 },
  find: { draw: find, still: 0.6 },
  technique: { draw: technique, still: 0.5 },
  smokefree: { draw: smokefree, still: 0.5 },
  focus: { draw: focus, still: 0.35 },
  alcoholfree: { draw: alcoholfree, still: 0.3 },
};

export type { AnimatedArtName } from './artLoop';
/** Frames per second the picture is redrawn at (plenty for these soft motions). */
const FPS = 30;

/**
 * Art that can hold something in its middle (2026-11-26): the first screen (consent) shows the app logo
 * inside the turning ring of dots instead of the shield with the tick. Centre in the 240 × 240 drawing,
 * box size, and how it breathes with the ring.
 */
const CENTER: Partial<Record<AnimatedArtName, { x: number; y: number; box: number; scale: (p: number) => number }>> = {
  consent: { x: 120, y: 118, box: 120, scale: (p) => 1 + 0.05 * consentBreathe(p) },
};

/** `center`: drawn in the middle of the art instead of its core (only for names in CENTER). */
export function AnimatedArt({ name, size = 180, center }: { name: AnimatedArtName; size?: number; center?: ReactNode }) {
  const reduce = useReducedMotion();
  // Battery (round 8): no redraws while the app is in the background or the screen isn't focused.
  const live = useLive();
  const art = ART[name]!;
  const [p, setP] = useState(art.still);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (n: string) => `${n}${uid}`;

  useEffect(() => {
    if (reduce || !live) return;
    const start = Date.now();
    let last = 0;
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      if (now - last >= 1000 / FPS) {
        last = now;
        setP(artPhase(name, now - start));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [name, reduce, live]);

  const phase = reduce ? art.still : p;
  const slot = center ? CENTER[name] : undefined;
  const unit = size / 240;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 240 240">
        <Defs>
          <RadialGradient id={id('orb')} cx="42%" cy="38%" r="65%">
            <Stop offset="0" stopColor={K.petrolHi} />
            <Stop offset="0.55" stopColor={K.petrol} />
            <Stop offset="1" stopColor={K.petrolDeep} />
          </RadialGradient>
          <RadialGradient id={id('halo')} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={K.petrol} stopOpacity={0.35} />
            <Stop offset="1" stopColor={K.petrol} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={id('shine')} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#fff" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
          <ClipPath id={id('shield')}>
            <Path d={SHIELD} />
          </ClipPath>
        </Defs>
        {art.draw(phase, id, { core: !slot })}
      </Svg>
      {slot ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (slot.x - slot.box / 2) * unit,
            top: (slot.y - slot.box / 2) * unit,
            width: slot.box * unit,
            height: slot.box * unit,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: slot.scale(phase) }],
          }}
        >
          {center}
        </View>
      ) : null}
    </View>
  );
}
