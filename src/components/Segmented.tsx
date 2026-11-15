import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from './useTheme';

interface Props<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel?: string;
}

export function Segmented<T extends string | number>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.wrap, { backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.md }]}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            style={[
              styles.item,
              {
                minHeight: 44,
                borderRadius: t.radius.sm,
                backgroundColor: active ? t.colors.surface : 'transparent',
              },
            ]}
          >
            <AppText variant="small" weight={active ? '700' : '500'} muted={!active}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 4, gap: 4 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
