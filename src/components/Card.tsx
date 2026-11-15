import { Pressable, View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from './useTheme';

interface Props extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
}

export function Card({ onPress, padded = true, style, children, accessibilityLabel, ...rest }: Props) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: padded ? t.spacing(4) : 0,
    borderWidth: 1,
    borderColor: t.colors.border,
  };
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}
