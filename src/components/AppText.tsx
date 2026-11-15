import { Text, type TextProps } from 'react-native';

import { useTheme } from './useTheme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'tiny';

interface Props extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  center?: boolean;
}

const defaultWeight: Record<Variant, Props['weight']> = {
  display: '800',
  h1: '800',
  h2: '700',
  h3: '700',
  body: '400',
  small: '400',
  tiny: '500',
};

export function AppText({
  variant = 'body',
  muted,
  color,
  weight,
  center,
  style,
  ...rest
}: Props) {
  const t = useTheme();
  const size = t.font[variant];
  return (
    <Text
      maxFontSizeMultiplier={variant === 'display' ? 1.4 : 1.8}
      style={[
        {
          color: color ?? (muted ? t.colors.textMuted : t.colors.text),
          fontSize: size,
          lineHeight: Math.round(size * (variant === 'display' ? 1.1 : 1.35)),
          fontWeight: weight ?? defaultWeight[variant],
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}
