import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from './useTheme';

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  actions: DialogAction[];
  onDismiss?: () => void;
}

/**
 * Modal dialog. The title and the actions stay visible; the message and any
 * content in between scroll when they do not fit (long forms on small phones).
 */
export function Dialog({ visible, title, message, children, actions, onDismiss }: Props) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <Pressable
        style={[styles.backdrop, { backgroundColor: t.colors.overlay }]}
        onPress={onDismiss}
        accessibilityLabel={title}
        accessible={false}
      >
        <Pressable
          style={[styles.card, { backgroundColor: t.colors.surface, borderRadius: t.radius.xl }]}
          onPress={() => {}}
          accessibilityViewIsModal
        >
          <AppText variant="h2" accessibilityRole="header">
            {title}
          </AppText>
          {message || children ? (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              {message ? <AppText muted>{message}</AppText> : null}
              {children}
            </ScrollView>
          ) : null}
          <View style={{ gap: 10, marginTop: t.space.sm }}>
            {actions.map((a) => (
              <Button key={a.label} label={a.label} onPress={a.onPress} variant={a.variant ?? 'secondary'} />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, paddingVertical: 48 },
  card: { padding: 24, gap: 12, maxHeight: '100%' },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { gap: 12 },
});
