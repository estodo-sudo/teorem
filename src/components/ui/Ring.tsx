import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '../AppText';
import { useTheme } from '../useTheme';

const ACircle = Animated.createAnimatedComponent(Circle);

/** Metric ring (from the 21st Activity Card): track + coloured arc, value and unit in the middle. */
export function Ring({ value, label, center, unit, color, size = 88, stroke = 6 }: { value: number; label: string; center: string; unit?: string; color?: string; size?: number; stroke?: number }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const v = Math.min(1, Math.max(0, value));
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = reduce ? v : withTiming(v, { duration: t.motion.slow * 2, easing: Easing.out(Easing.cubic) });
  }, [v, reduce, p, t.motion.slow]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  return (
    <View style={{ alignItems: 'center', gap: t.space.sm }} accessible accessibilityRole="progressbar" accessibilityLabel={`${label}: ${center}${unit ? ` ${unit}` : ''}`} accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.tokens.muted} strokeWidth={stroke} fill="none" />
          <ACircle cx={size / 2} cy={size / 2} r={r} stroke={color ?? t.tokens.primary} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c} ${c}`} animatedProps={arc} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </Svg>
        <AppText tabular style={{ ...t.type.title3, color: t.tokens.cardForeground }} numberOfLines={1} adjustsFontSizeToFit>
          {center}
        </AppText>
        {unit ? <AppText style={{ ...t.type.caption, color: t.tokens.mutedForeground }}>{unit}</AppText> : null}
      </View>
      {label ? (
        <AppText style={{ ...t.type.footnote, color: t.tokens.mutedForeground }} center>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}
