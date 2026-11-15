import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

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
          {message ? <AppText muted>{message}</AppText> : null}
          {children}
          <View style={{ gap: 10, marginTop: 8 }}>
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
  backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { padding: 24, gap: 12 },
});
