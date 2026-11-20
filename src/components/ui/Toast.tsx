import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { useTheme } from '../useTheme';

export type ToastTone = 'default' | 'success' | 'destructive';
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

const ToastContext = createContext<(t: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastTone }) => void>(() => undefined);

/** Shows a short message at the bottom; screen readers announce it. */
export const useToast = () => useContext(ToastContext);

export const TOAST_MS = 3200;

/** Wrap the app once: <ToastProvider>…</ToastProvider>. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const seq = useRef(0);
  const show = useCallback((x: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastTone }) => {
    seq.current += 1;
    setItem({ id: seq.current, tone: x.tone ?? 'default', title: x.title, description: x.description });
    AccessibilityInfo.announceForAccessibility(x.description ? `${x.title}. ${x.description}` : x.title);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {item ? <ToastView key={item.id} item={item} onDone={() => setItem(null)} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: t.motion.normal });
    const hide = setTimeout(() => (p.value = withTiming(0, { duration: t.motion.normal })), TOAST_MS);
    const done = setTimeout(onDone, TOAST_MS + t.motion.normal + 50);
    return () => (clearTimeout(hide), clearTimeout(done));
  }, [p, onDone, t.motion.normal]);
  const style = useAnimatedStyle(() => ({ opacity: p.value, transform: reduce ? [] : [{ translateY: (1 - p.value) * 24 }] }));
  const icon: IconName = item.tone === 'success' ? 'success' : item.tone === 'destructive' ? 'alert' : 'info';
  const accent = item.tone === 'success' ? t.tokens.success : item.tone === 'destructive' ? t.tokens.destructive : t.tokens.primary;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: t.space.lg, right: t.space.lg, bottom: insets.bottom + t.space.xxl }}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[{ flexDirection: 'row', gap: t.space.md, alignItems: 'flex-start', padding: t.space.lg, borderRadius: t.radius.lg, backgroundColor: t.tokens.card, borderWidth: t.border.thin, borderColor: t.tokens.border, ...t.shadow.lg }, style]}
      >
        <Icon name={icon} size="md" color={accent} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={{ ...t.type.body, fontWeight: '700', color: t.tokens.cardForeground }}>{item.title}</AppText>
          {item.description ? <AppText style={{ ...t.type.small, color: t.tokens.mutedForeground }}>{item.description}</AppText> : null}
        </View>
      </Animated.View>
    </View>
  );
}
