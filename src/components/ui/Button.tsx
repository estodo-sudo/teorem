import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { useTheme } from '../useTheme';
import { uiHaptic } from './haptic';
import { ScalePressable } from './pressable';

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  /** primary (= default) is the one main action per screen; secondary, outline, ghost, destructive. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  /** Icon after the label instead of before. */
  iconRight?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

/** Button (§5): heights 52 / 44 / 36, text 16 / 600, radius 14. Every size keeps a ≥ 48 px touch area. */
export function Button({ label, onPress, variant = 'default', size = 'md', icon, iconRight, disabled, loading, fullWidth, style, accessibilityHint, testID }: ButtonProps) {
  const t = useTheme();
  const k = t.tokens;
  const main = { bg: k.primary, fg: k.primaryForeground, border: k.primary };
  const colors: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    default: main,
    primary: main,
    secondary: { bg: k.muted, fg: k.foreground, border: k.muted },
    outline: { bg: k.card, fg: k.foreground, border: k.border },
    ghost: { bg: 'transparent', fg: k.primary, border: 'transparent' },
    destructive: { bg: k.destructive, fg: k.destructiveForeground, border: k.destructive },
  };
  // Disabled gets its own colours: the press animation owns `opacity`, so dimming alone would not show.
  const c = disabled && variant !== 'ghost' ? { bg: k.muted, fg: k.mutedForeground, border: k.muted } : colors[variant];
  const h = { sm: 36, md: 44, lg: 52 }[size];
  const px = { sm: t.space.md, md: t.space.lg, lg: t.space.gutter }[size];
  const text = size === 'sm' ? t.type.callout : t.type.body;
  const iconEl = icon ? <Icon name={icon} color={c.fg} size={size === 'sm' ? 'sm' : 'md'} /> : null;
  const isMain = variant === 'default' || variant === 'primary';
  return (
    <ScalePressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
      disabled={disabled || loading}
      onPress={() => {
        uiHaptic(isMain ? 'light' : 'selection');
        onPress();
      }}
      // Compact buttons keep a 48 px touch area.
      hitSlop={h < t.touch ? (t.touch - h) / 2 : undefined}
      style={[styles.base, { minHeight: h, paddingHorizontal: px, backgroundColor: c.bg, borderColor: c.border, borderWidth: t.border.thin, borderRadius: t.radius.button }, fullWidth && styles.full, style]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} accessibilityLabel={label} />
      ) : (
        <View style={[styles.row, { gap: t.space.sm, paddingVertical: t.space.sm }]}>
          {!iconRight ? iconEl : null}
          <AppText style={{ ...text, color: c.fg, fontWeight: '600', flexShrink: 1 }} center>
            {label}
          </AppText>
          {iconRight ? iconEl : null}
        </View>
      )}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
