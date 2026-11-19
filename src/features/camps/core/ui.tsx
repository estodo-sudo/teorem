import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, useTheme } from '@/components';
import { tint } from '@/features/campus/shared/ui';

/** Shared camp UI. */

/** Big −/+ number picker with optional quick values. */
export function NumberStepper({ value, onChange, min, max, step = 1, unit, quick, label }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string; quick?: number[]; label: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  const btn = (sign: 1 | -1) => {
    const disabled = sign > 0 ? value >= max : value <= min;
    return (
      <Pressable
        onPress={() => set(value + sign * step)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${sign > 0 ? tr('camps.ui.plus') : tr('camps.ui.minus')}`}
        style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: t.colors.border, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}
      >
        <AppText variant="h2">{sign > 0 ? '+' : '−'}</AppText>
      </Pressable>
    );
  };
  return (
    <View style={{ gap: 14, alignItems: 'center' }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ now: value, min, max, text: unit ? `${value} ${unit}` : String(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? step : -step))}
      >
        {btn(-1)}
        <View style={{ minWidth: 110, alignItems: 'center' }}>
          <AppText variant="display" style={{ lineHeight: 54 }}>
            {value}
          </AppText>
          {unit ? (
            <AppText weight="700" muted>
              {unit}
            </AppText>
          ) : null}
        </View>
        {btn(1)}
      </View>
      {quick ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {quick.map((q) => {
            const selected = q === value;
            return (
              <Pressable
                key={q}
                onPress={() => set(q)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={unit ? `${q} ${unit}` : String(q)}
                style={{
                  minWidth: 52,
                  minHeight: 48,
                  paddingHorizontal: 12,
                  borderRadius: t.radius.pill,
                  borderWidth: 1.5,
                  borderColor: selected ? t.colors.primary : t.colors.border,
                  backgroundColor: selected ? tint(t.colors.primary, '1F') : t.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText weight="700" color={selected ? t.colors.primary : t.colors.text}>
                  {q}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** Simple vertical bars (stats). `labels` under some bars; null values show an empty slot. */
export function MiniBars({ values, labels, color, height = 90, a11y, valueLabels }: { values: (number | null)[]; labels?: (string | null)[]; color?: string; height?: number; a11y: string; valueLabels?: boolean }) {
  const t = useTheme();
  const max = Math.max(1, ...values.map((v) => v ?? 0));
  const c = color ?? t.colors.primary;
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 3 }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
            {valueLabels && v !== null ? (
              <AppText variant="tiny" muted numberOfLines={1}>
                {String(v).replace('.', ',')}
              </AppText>
            ) : null}
            <View
              style={{
                width: '100%',
                maxWidth: 28,
                height: v === null ? 2 : Math.max(v ? 4 : 2, (v / max) * (height - (valueLabels ? 16 : 0))),
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                backgroundColor: v === null ? t.colors.surfaceAlt : v ? c : t.colors.surfaceAlt,
              }}
            />
          </View>
        ))}
      </View>
      {labels ? (
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {labels.map((l, i) => (
            <AppText key={i} variant="tiny" muted center style={{ flex: 1 }} numberOfLines={1}>
              {l ?? ''}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}
