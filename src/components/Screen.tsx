import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
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
  const pad: ViewStyle = { padding: t.spacing(5), paddingBottom: t.spacing(10), gap: t.spacing(4) };
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: t.colors.background }]}>
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
        <View style={{ paddingHorizontal: t.spacing(5), paddingBottom: t.spacing(4), gap: 10 }}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
