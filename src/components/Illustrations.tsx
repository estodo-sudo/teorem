import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useTheme } from './useTheme';

/**
 * Original abstract, non-explicit illustrations (placeholder art).
 * Anatomically respectful: the pelvic floor is shown as a simple "hammock"
 * inside a stylised bowl.
 */

/** Dark "viewer" panel: the translucent 3D bones need a dark ground in the light theme too. */
const VIEWER = { from: '#1B2230', to: '#0B0E14' } as const;

/**
 * 3D pelvis with the pelvic floor muscle (Blender render, transparent webp): translucent bone, the red
 * muscle slung underneath. Used on the tutorial's "Pelvik taban kası nedir?" page.
 */
export function PelvicFloor3D({ size = 300 }: { size?: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={tr('tutorial.what.artAlt')}
      style={{ width: size, height: size * 0.82, borderRadius: t.radius.lg, overflow: 'hidden', backgroundColor: VIEWER.to, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width="100%" height="100%" style={{ position: 'absolute' }} viewBox="0 0 100 82" preserveAspectRatio="none">
        <Ellipse cx={50} cy={40} rx={60} ry={50} fill={VIEWER.from} />
      </Svg>
      <Image source={require('../../assets/art/pelvic-floor.webp')} style={{ width: size * 0.92, height: size * 0.92 * 0.814 }} contentFit="contain" />
    </View>
  );
}

export function PelvicFloorArt({ size = 220, highlight = true }: { size?: number; highlight?: boolean }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 240 180" accessibilityRole="image">
      {/* bowl (pelvis, stylised) */}
      <Path
        d="M20 30 C 30 120, 80 160, 120 160 C 160 160, 210 120, 220 30"
        stroke={t.colors.textMuted}
        strokeWidth={10}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M20 30 C 60 50, 180 50, 220 30" stroke={t.colors.border} strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* hammock (pelvic floor muscles) */}
      <Path
        d="M45 95 C 80 140, 160 140, 195 95"
        stroke={highlight ? t.colors.accent : t.colors.textMuted}
        strokeWidth={14}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M70 112 C 100 128, 140 128, 170 112" stroke={t.colors.contract} strokeOpacity={0.5} strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* lift arrows */}
      <Path d="M120 150 L120 128 M112 136 L120 128 L128 136" stroke={t.colors.primary} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FindMuscleArt({ size = 200 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 200 160" accessibilityRole="image">
      <Path d="M100 15 C 130 60, 150 85, 150 110 a50 50 0 0 1 -100 0 C 50 85, 70 60, 100 15z" fill={t.colors.breathe} opacity={0.85} />
      <Rect x={82} y={88} width={12} height={40} rx={4} fill={t.tokens.card} />
      <Rect x={106} y={88} width={12} height={40} rx={4} fill={t.tokens.card} />
    </Svg>
  );
}

export function TechniqueArt({ size = 200 }: { size?: number }) {
  const t = useTheme();
  const ok = t.colors.success;
  const no = t.colors.danger;
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 200 160" accessibilityRole="image">
      <G>
        <Circle cx={100} cy={30} r={16} fill={t.colors.textMuted} />
        <Path d="M70 60 h60 l-8 50 h-44z" fill={t.colors.surfaceAlt} stroke={t.colors.textMuted} strokeWidth={3} />
        <Ellipse cx={100} cy={112} rx={22} ry={7} fill={t.colors.accent} />
        <Path d="M78 112 L70 150 M122 112 L130 150" stroke={t.colors.textMuted} strokeWidth={6} strokeLinecap="round" />
      </G>
      <Path d="M20 70 l8 8 l14 -16" stroke={ok} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M160 50 l20 20 M180 50 l-20 20" stroke={no} strokeWidth={5} strokeLinecap="round" />
      <Path d="M160 100 l20 20 M180 100 l-20 20" stroke={no} strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}

export function VibrationArt({ size = 200 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 200 160" accessibilityRole="image">
      <Rect x={72} y={20} width={56} height={110} rx={12} fill={t.colors.primary} />
      <Rect x={80} y={32} width={40} height={80} rx={4} fill={t.colors.surface} />
      <Circle cx={100} cy={72} r={14} fill={t.colors.accent} />
      {[0, 1].map((i) => (
        <G key={i}>
          <Path d={`M${58 - i * 14} ${50 - i * 6} q -10 25 0 50`} stroke={t.colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d={`M${142 + i * 14} ${50 - i * 6} q 10 25 0 50`} stroke={t.colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}

export function PlanArt({ size = 220, level }: { size?: number; level: number }) {
  const t = useTheme();
  const bars = [0.3, 0.42, 0.5, 0.62, 0.72, 0.86, 1];
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 220 130" accessibilityRole="image" accessibilityLabel={`Level ${level}`}>
      {bars.map((h, i) => (
        <Rect
          key={i}
          x={10 + i * 30}
          y={120 - h * 100}
          width={20}
          height={h * 100}
          rx={6}
          fill={i === 0 ? t.colors.accent : t.colors.primary}
          opacity={i === 0 ? 1 : 0.35 + i * 0.09}
        />
      ))}
    </Svg>
  );
}
