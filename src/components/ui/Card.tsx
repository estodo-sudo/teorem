import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { useTheme } from '../useTheme';
import { ScalePressable } from './pressable';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Makes the whole card tappable (press scale, button role). */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Raised (shadow md) — only for floating elements; cards are flat with a 1 px border (§3.5). */
  elevated?: boolean;
}

/** shadcn/ui Card: Card > CardHeader (CardTitle, CardDescription) > CardContent > CardFooter. */
export function Card({ children, style, onPress, accessibilityLabel, elevated }: CardProps) {
  const t = useTheme();
  const base: ViewStyle = { backgroundColor: t.tokens.card, borderColor: t.tokens.border, borderWidth: elevated ? 0 : t.border.thin, borderRadius: t.radius.lg, overflow: 'hidden', ...(elevated ? t.shadow.md : t.shadow.none) };
  if (onPress) {
    return (
      <ScalePressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={[base, { minHeight: t.touch }, style]}>
        {children}
      </ScalePressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function CardHeader({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ padding: t.space.gutter, paddingBottom: t.space.sm, gap: t.space.xs }, style]}>{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <AppText style={{ ...t.type.title3, color: t.tokens.cardForeground }} accessibilityRole="header">
      {children}
    </AppText>
  );
}

export function CardDescription({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <AppText style={{ ...t.type.callout, color: t.tokens.mutedForeground }}>{children}</AppText>;
}

export function CardContent({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ paddingHorizontal: t.space.gutter, paddingVertical: t.space.sm, gap: t.space.md }, style]}>{children}</View>;
}

export function CardFooter({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ padding: t.space.gutter, paddingTop: t.space.sm, flexDirection: 'row', gap: t.space.sm, alignItems: 'center' }, style]}>{children}</View>;
}
