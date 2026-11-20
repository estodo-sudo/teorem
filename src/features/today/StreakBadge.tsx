import { useEffect, useRef } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';
import { ScalePressable } from '@/components/ui';

/**
 * Streak chip — ui-v3 (§7.1.1): amber flame (the one place amber lives) + "N gün" on a muted pill.
 * Pops briefly when the count goes up (a spring is allowed for celebrations; static with "reduce motion").
 */
export function StreakBadge({ count, doneToday, onPress }: { count: number; doneToday: boolean; onPress?: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current && !reduce) s.value = withSequence(withTiming(1.12, { duration: t.motion.fast }), withSpring(1, { damping: 10, stiffness: 180 }));
    prev.current = count;
  }, [count, reduce, s, t.motion.fast]);
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const lit = count > 0 || doneToday;
  return (
    <ScalePressable onPress={onPress} accessibilityRole="button" accessibilityLabel={tr('today.streakA11y', { count })} style={{ minHeight: t.touch, justifyContent: 'center' }}>
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs, height: 36, paddingHorizontal: t.space.md, borderRadius: t.radius.pill, backgroundColor: lit ? t.tokens.highlightSoft : t.tokens.muted }, pop]}>
        <Icon name="flame" size="sm" color={lit ? t.tokens.highlight : t.tokens.subtle} />
        <AppText variant="footnote" tabular style={{ fontWeight: '600' }}>
          {tr('today.streakDays', { count })}
        </AppText>
      </Animated.View>
    </ScalePressable>
  );
}
