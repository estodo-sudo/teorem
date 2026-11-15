import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Screen, useTheme } from '@/components';
import { useStreak } from '@/features/gamification/service';
import { StreakFlame } from '@/features/today/StreakFlame';
import { TodayExtras } from '@/features/today/TodayExtras';
import { WorkoutCard } from '@/features/today/WorkoutCard';
import { useTrainingStore } from '@/stores/trainingStore';

function greetingKey(hour: number) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

export default function Today() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const streak = useStreak();
  const level = useTrainingStore((s) => s.training.level);
  const now = new Date();
  const dateLabel = now.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <AppText variant="small" muted>
            {dateLabel}
          </AppText>
          <AppText variant="h1" accessibilityRole="header">
            {tr(`today.greeting.${greetingKey(now.getHours())}`)}
          </AppText>
        </View>
        <StreakFlame count={streak.current} doneToday={streak.doneToday} />
        <Pressable
          onPress={() => router.push('/achievements')}
          accessibilityRole="button"
          accessibilityLabel={tr('common.level', { level })}
          style={{ backgroundColor: t.colors.accent, height: 40, minWidth: 40, paddingHorizontal: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText weight="800" color={t.colors.accentText}>
            {tr('today.levelShort', { level })}
          </AppText>
        </Pressable>
      </View>
      <WorkoutCard />
      <TodayExtras />
    </Screen>
  );
}
