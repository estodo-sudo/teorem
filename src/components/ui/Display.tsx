import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { useTheme } from '../useTheme';
import { capsLetterSpacing } from '@/config/theme';
import { uiHaptic } from './haptic';
import { ScalePressable } from './pressable';
import { useTranslation } from 'react-i18next';
import { localeOf } from '@/i18n/languages';

// ---------------------------------------------------------------- Tabs

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

/** SegmentedControl (§5): short labels; the selected item is a surface with a 1 px border (no shadow). Labels wrap, never truncate. */
export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: TabItem<T>[]; label: string }) {
  const t = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: 'row', backgroundColor: t.tokens.muted, borderRadius: t.radius.md, padding: t.space.xs, gap: t.space.xs }}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <ScalePressable
            key={it.value}
            onPress={() => {
              if (!on) uiHaptic('selection');
              onChange(it.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={it.label}
            style={{
              flex: 1,
              minHeight: t.touch - 2 * t.space.xs,
              paddingHorizontal: t.space.xs,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: t.radius.sm,
              backgroundColor: on ? t.tokens.card : 'transparent',
              borderWidth: t.border.thin,
              borderColor: on ? t.tokens.border : 'transparent',
            }}
            hitSlop={t.space.xs}
          >
            <AppText style={{ ...t.type.callout, fontWeight: on ? '600' : '500', color: on ? t.tokens.foreground : t.tokens.mutedForeground }} center>
              {it.label}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------- Progress

/** shadcn/ui Progress: animated bar (0..1). */
export function Progress({ value, label, tone = 'primary' }: { value: number; label: string; tone?: 'primary' | 'accent' | 'success' | 'highlight' }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const w = useSharedValue(0);
  const v = Math.min(1, Math.max(0, value));
  useEffect(() => {
    w.value = reduce ? v : withTiming(v, { duration: t.motion.slow });
  }, [v, reduce, w, t.motion.slow]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }} style={{ height: 6, borderRadius: 3, backgroundColor: t.tokens.muted, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 3, backgroundColor: t.tokens[tone] }, fill]} />
    </View>
  );
}

// ---------------------------------------------------------------- Badge

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'highlight';

/** shadcn/ui Badge. */
export function Badge({ label, variant = 'default', icon }: { label: string; variant?: BadgeVariant; icon?: IconName }) {
  const t = useTheme();
  const k = t.tokens;
  const c = {
    default: [k.primarySoft, k.primary, k.primarySoft],
    secondary: [k.muted, k.foreground, k.muted],
    outline: ['transparent', k.foreground, k.border],
    destructive: [k.destructiveSoft, k.destructive, k.destructiveSoft],
    success: [k.successSoft, k.success, k.successSoft],
    // amber badge: soft amber background with normal text (amber is never a text colour)
    highlight: [k.highlightSoft, k.foreground, k.highlightSoft],
  }[variant];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space.xs,
        paddingHorizontal: t.space.sm,
        paddingVertical: 2,
        borderRadius: t.radius.pill,
        backgroundColor: c[0],
        borderWidth: t.border.thin,
        borderColor: c[2],
      }}
    >
      {icon ? <Icon name={icon} size={12} color={c[1]} /> : null}
      <AppText style={{ ...t.type.caption, fontWeight: '600', color: c[1] }}>{label}</AppText>
    </View>
  );
}

// ---------------------------------------------------------------- Separator

export function Separator({ vertical, style }: { vertical?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View accessibilityElementsHidden importantForAccessibility="no" style={[vertical ? { width: t.border.thin, alignSelf: 'stretch' } : { height: t.border.thin, alignSelf: 'stretch' }, { backgroundColor: t.tokens.border }, style]} />;
}

// ---------------------------------------------------------------- Skeleton

/** shadcn/ui Skeleton: a soft pulsing block while content loads (static with "reduce motion"). */
export function Skeleton({ width = '100%', height = 16, radius }: { width?: number | `${number}%`; height?: number; radius?: number }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const o = useSharedValue(0.6);
  useEffect(() => {
    if (!reduce) o.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.6, { duration: 700 })), -1);
  }, [reduce, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no" style={[{ width, height, borderRadius: radius ?? t.radius.sm, backgroundColor: t.tokens.muted }, style]} />;
}

// ---------------------------------------------------------------- small helpers

/** Section label used across screens (caption, muted, upper case). */
export function Label({ children }: { children: ReactNode }) {
  const t = useTheme();
  const { i18n } = useTranslation();
  // Locale-aware capitals (Turkish dotted İ), not textTransform.
  const text = typeof children === 'string' ? children.toLocaleUpperCase(localeOf(i18n.language)) : children;
  return <AppText style={{ ...t.type.caption, color: t.tokens.mutedForeground, letterSpacing: capsLetterSpacing }}>{text}</AppText>;
}
