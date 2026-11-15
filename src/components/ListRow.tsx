import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { useTheme } from './useTheme';

interface Props {
  label: string;
  value?: string;
  description?: string;
  icon?: IconName;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}

export function ListRow({ label, value, description, icon, onPress, right, danger }: Props) {
  const t = useTheme();
  const content = (
    <View style={[styles.row, { minHeight: 56, borderBottomColor: t.colors.border }]}>
      {icon ? (
        <View style={{ marginRight: 12 }}>
          <Icon name={icon} color={danger ? t.colors.danger : t.colors.primary} size={22} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText weight="600" color={danger ? t.colors.danger : undefined}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="small" muted>
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText muted style={{ marginLeft: 8 }}>
          {value}
        </AppText>
      ) : null}
      {right}
      {onPress && !right ? <Icon name="chevron" color={t.colors.textMuted} size={18} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {content}
    </Pressable>
  );
}

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: IconName;
}

export function SwitchRow({ label, description, value, onChange, icon }: SwitchRowProps) {
  const t = useTheme();
  return (
    <ListRow
      label={label}
      description={description}
      icon={icon}
      right={
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ true: t.colors.accent, false: t.colors.surfaceAlt }}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
