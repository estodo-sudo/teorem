import { router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, useTheme } from '@/components';

import { useOdakLockStore } from './lockStore';

/** Two-finger swipe this far down leaves the camp. */
export const QUICK_EXIT_DY = 80;

/** Quick exit: locks the camp and goes straight to the app's home screen. */
export function quickExit() {
  useOdakLockStore.getState().lock();
  if (router.canDismiss()) router.dismissAll();
  router.replace('/');
}

/** Is this a two-finger downward swipe (more down than sideways)? */
export const isTwoFingerDown = (touches: number, dx: number, dy: number) => touches >= 2 && dy > 12 && Math.abs(dx) < dy;

/** Wraps camp screens: a two-finger swipe down anywhere triggers the quick exit. */
export function QuickExitArea({ children }: { children: ReactNode }) {
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) => isTwoFingerDown(g.numberActiveTouches, g.dx, g.dy),
        onPanResponderRelease: (_, g) => {
          if (g.dy >= QUICK_EXIT_DY) quickExit();
        },
      }),
    [],
  );
  return (
    <View style={{ flex: 1 }} {...responder.panHandlers}>
      {children}
    </View>
  );
}

/** Corner button of the quick exit (in every camp header). */
export function QuickExitButton() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Pressable onPress={quickExit} accessibilityRole="button" accessibilityLabel={tr('odak.exit.button')} hitSlop={8} style={{ width: t.touch, height: t.touch, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="home" color={t.colors.text} size={24} />
    </Pressable>
  );
}
