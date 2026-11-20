import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { useTheme } from '../useTheme';
import { ScalePressable } from './pressable';

const TRACK_W = 48;
const TRACK_H = 28;
const KNOB = 22;

/** shadcn/ui Switch: animated track and knob; the whole row (label + description) is the target. */
export function Switch({ value, onChange, label, description, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    p.value = reduce ? (value ? 1 : 0) : withTiming(value ? 1 : 0, { duration: t.motion.normal });
  }, [value, reduce, p, t.motion.normal]);
  const on = t.tokens.primary;
  const off = t.tokens.input;
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [off, on]) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * (TRACK_W - KNOB - 6) }] }));
  return (
    <ScalePressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      accessibilityHint={description}
      style={{ minHeight: t.touch, flexDirection: 'row', alignItems: 'center', gap: t.space.md, opacity: disabled ? 0.5 : 1 }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ ...t.type.body, fontWeight: '600', color: t.tokens.foreground }}>{label}</AppText>
        {description ? <AppText style={{ ...t.type.small, color: t.tokens.mutedForeground }}>{description}</AppText> : null}
      </View>
      <Animated.View style={[{ width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2, padding: 3, justifyContent: 'center' }, track]}>
        <Animated.View style={[{ width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: t.tokens.card, ...t.shadow.sm }, knob]} />
      </Animated.View>
    </ScalePressable>
  );
}

/** shadcn/ui Checkbox with its label as part of the target. */
export function Checkbox({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const t = useTheme();
  return (
    <ScalePressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      accessibilityHint={description}
      style={{ minHeight: t.touch, flexDirection: 'row', alignItems: 'center', gap: t.space.md, opacity: disabled ? 0.5 : 1 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: t.radius.sm - 2,
          borderWidth: t.border.thick,
          borderColor: checked ? t.tokens.primary : t.tokens.input,
          backgroundColor: checked ? t.tokens.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Icon name="check" size="sm" color={t.tokens.primaryForeground} strokeWidth={3} /> : null}
      </View>
      <Labels label={label} description={description} />
    </ScalePressable>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

/** shadcn/ui RadioGroup: one choice from a list. */
export function RadioGroup<T extends string>({ value, onChange, options, label }: { value: T | null; onChange: (v: T) => void; options: RadioOption<T>[]; label: string }) {
  const t = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: t.space.xs }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <ScalePressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            accessibilityHint={o.description}
            style={{ minHeight: t.touch, flexDirection: 'row', alignItems: 'center', gap: t.space.md }}
          >
            <View style={{ width: 24, height: 24, borderRadius: t.radius.md, borderWidth: t.border.thick, borderColor: on ? t.tokens.primary : t.tokens.input, alignItems: 'center', justifyContent: 'center' }}>
              {on ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.tokens.primary }} /> : null}
            </View>
            <Labels label={o.label} description={o.description} />
          </ScalePressable>
        );
      })}
    </View>
  );
}

function Labels({ label, description }: { label: string; description?: string }): ReactNode {
  const t = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText style={{ ...t.type.body, color: t.tokens.foreground }}>{label}</AppText>
      {description ? <AppText style={{ ...t.type.small, color: t.tokens.mutedForeground }}>{description}</AppText> : null}
    </View>
  );
}
