import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../AppText';
import { useTheme } from '../useTheme';
import { Button, type ButtonVariant } from './Button';
import { shouldCloseSheet } from './sheetRules';

export { shouldCloseSheet };


/**
 * shadcn/ui Sheet (bottom): slides up, closes on the backdrop, the handle drag or the back button.
 * With "reduce motion" on it fades instead of sliding.
 */
export function Sheet({ visible, onClose, title, description, children }: { visible: boolean; onClose: () => void; title?: string; description?: string; children?: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduce = useReducedMotion();
  // Stay mounted while the closing animation runs (state derived during render, not in an effect).
  const [mounted, setMounted] = useState(visible);
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setMounted(true);
  }
  const y = useSharedValue(height);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      y.value = reduce ? 0 : height;
      y.value = withTiming(0, { duration: t.motion.slow });
      fade.value = withTiming(1, { duration: t.motion.normal });
    } else {
      fade.value = withTiming(0, { duration: t.motion.normal });
      y.value = withTiming(reduce ? 0 : height, { duration: t.motion.normal }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useMemo(() => sheetPan(y, onClose, reduce, t.motion.normal), [onClose, reduce, t.motion.normal, y]);

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: reduce ? fade.value : 1 }));
  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));
  if (!mounted) return null;
  return (
    <Modal transparent visible onRequestClose={onClose} statusBarTranslucent animationType="none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.tokens.overlay }, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={title ? `${title} — kapat` : 'Kapat'} />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        style={[styles.panel, { backgroundColor: t.tokens.card, borderTopLeftRadius: t.radius.xl, borderTopRightRadius: t.radius.xl, paddingBottom: Math.max(insets.bottom, t.space.lg), maxHeight: height * 0.9, ...t.shadow.lg }, panel]}
      >
        <View {...pan.panHandlers} style={{ alignItems: 'center', paddingVertical: t.space.md, minHeight: t.touch / 2 + t.space.md }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: t.tokens.border }} />
        </View>
        <View style={{ paddingHorizontal: t.space.xl, gap: t.space.md }}>
          {title ? (
            <AppText style={{ ...t.type.heading, color: t.tokens.cardForeground }} accessibilityRole="header">
              {title}
            </AppText>
          ) : null}
          {description ? <AppText style={{ ...t.type.body, color: t.tokens.mutedForeground }}>{description}</AppText> : null}
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}

/** Drag-to-close responder (outside the component: it moves the shared value from gesture callbacks). */
function sheetPan(y: SharedValue<number>, onClose: () => void, reduce: boolean, settleMs: number) {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
    onPanResponderMove: (_, g) => {
      if (!reduce) y.value = Math.max(0, g.dy);
    },
    onPanResponderRelease: (_, g) => {
      if (shouldCloseSheet(g.dy, g.vy)) onClose();
      else y.value = withTiming(0, { duration: settleMs });
    },
  });
}

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
}

/** shadcn/ui Dialog: centred card with a title, text and up to three actions. */
export function Dialog({ visible, onClose, title, description, children, actions }: { visible: boolean; onClose?: () => void; title: string; description?: string; children?: ReactNode; actions: DialogAction[] }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withTiming(visible ? 1 : 0, { duration: t.motion.normal });
  }, [visible, s, t.motion.normal]);
  const card = useAnimatedStyle(() => ({ opacity: s.value, transform: reduce ? [] : [{ scale: 0.96 + 0.04 * s.value }] }));
  if (!visible) return null;
  return (
    <Modal transparent visible onRequestClose={onClose} statusBarTranslucent animationType="fade">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: t.tokens.overlay, alignItems: 'center', justifyContent: 'center', padding: t.space.xl }]}>
        {onClose ? <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" /> : null}
        <Animated.View accessibilityViewIsModal style={[{ width: '100%', maxWidth: 420, backgroundColor: t.tokens.card, borderRadius: t.radius.lg, padding: t.space.xl, gap: t.space.md, ...t.shadow.lg }, card]}>
          <AppText style={{ ...t.type.heading, color: t.tokens.cardForeground }} accessibilityRole="header">
            {title}
          </AppText>
          {description ? <AppText style={{ ...t.type.body, color: t.tokens.mutedForeground }}>{description}</AppText> : null}
          {children}
          <View style={{ gap: t.space.sm, marginTop: t.space.xs }}>
            {actions.map((a) => (
              <Button key={a.label} label={a.label} onPress={a.onPress} variant={a.variant ?? 'outline'} fullWidth />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
