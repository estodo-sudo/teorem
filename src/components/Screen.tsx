import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from './useTheme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  footer?: ReactNode;
}

export function Screen({ children, scroll = true, edges = ['top'], contentStyle, footer }: Props) {
  const t = useTheme();
  const pad: ViewStyle = { padding: t.space.gutter, paddingBottom: t.space.xxxl, gap: t.space.xl };
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: t.colors.background }]}>
      {t.dark ? <BottomGlow /> : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, pad, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: t.space.gutter, paddingBottom: t.space.lg, gap: t.space.sm }}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * Dark mode (user request 2026-11-26): the page is almost black and a faint light rises from the bottom
 * edge to about the middle of the screen — a soft, cool white at most 16 % strong, so the page stays dark.
 */
export const GLOW = { color: '#D8EFEA', bottomOpacity: 0.16, from: 0.45 } as const;

function BottomGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset={String(GLOW.from)} stopColor={GLOW.color} stopOpacity={0} />
            <Stop offset="0.8" stopColor={GLOW.color} stopOpacity={GLOW.bottomOpacity * 0.4} />
            <Stop offset="1" stopColor={GLOW.color} stopOpacity={GLOW.bottomOpacity} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#screenGlow)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
