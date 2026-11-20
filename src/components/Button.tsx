import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { useTheme } from './useTheme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'info' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  style,
  accessibilityHint,
  testID,
}: Props) {
  const t = useTheme();
  const bg = {
    primary: t.colors.primary,
    accent: t.colors.accent,
    info: t.colors.info,
    secondary: t.colors.surfaceAlt,
    ghost: 'transparent',
    danger: t.colors.danger,
  }[variant];
  const fg = {
    primary: t.colors.primaryText,
    accent: t.colors.accentText,
    info: t.colors.infoText,
    secondary: t.colors.text,
    ghost: t.colors.primary,
    danger: t.tokens.destructiveForeground,
  }[variant];
  const height = size === 'lg' ? 60 : t.touch;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          backgroundColor: bg,
          borderRadius: t.radius.lg,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? 0 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} color={fg} size={size === 'lg' ? 22 : 20} /> : null}
          <AppText
            variant={size === 'lg' ? 'h3' : 'body'}
            weight="700"
            color={fg}
            style={icon ? { marginLeft: t.space.sm } : undefined}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
