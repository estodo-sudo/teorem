import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';

/** Streak pill with a gently "breathing" flame when the streak is alive. */
export function StreakFlame({ count, doneToday }: { count: number; doneToday: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const s = useSharedValue(1);
  useEffect(() => {
    if (count > 0) {
      s.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 700 })),
        -1,
      );
    } else s.value = 1;
  }, [count, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const color = count > 0 ? (doneToday ? t.colors.accent : t.colors.warning) : t.colors.textMuted;
  return (
    <View
      accessible
      accessibilityLabel={tr('today.streakA11y', { count })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1, paddingHorizontal: 12, height: 40, borderRadius: 20 }}
    >
      <Animated.View style={style}>
        <Icon name="flame" color={color} size={22} />
      </Animated.View>
      <AppText weight="800">{count}</AppText>
    </View>
  );
}
