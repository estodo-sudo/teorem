import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Screen, useTheme } from '@/components';
import { ScalePressable } from '@/components/ui';
import { useStreak } from '@/features/gamification/service';
import { DailyGoalCard } from '@/features/today/DailyGoalCard';
import { StreakBadge } from '@/features/today/StreakBadge';
import { TodayExtras } from '@/features/today/TodayExtras';
import { FitnessCard, RelaxCard, ThisWeek } from '@/features/today/WeekSections';
import { WorkoutCard } from '@/features/today/WorkoutCard';
import { todayWeekIndex } from '@/features/training/plan';
import { FunctionalTasksCard } from '@/features/training/RoadmapViews';
import { toDateKey } from '@/lib/date';
import { useTrainingStore } from '@/stores/trainingStore';

function greetingKey(hour: number) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

/**
 * Günüm (SPEC_V4 §A.2): greeting with streak and level chips · today's workout · this week (moved from
 * the old Antrenman tab) · the Bugün checklist · Kasık Fitness · Rahatla · "Senin için".
 */
export default function Today() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const streak = useStreak();
  const training = useTrainingStore((s) => s.training);
  const level = training.level;
  const now = new Date();
  const dateLabel = now.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen contentStyle={{ gap: t.space.xxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
        <View style={{ flex: 1 }}>
          <AppText variant="footnote" muted>
            {dateLabel}
          </AppText>
          <AppText variant="title1" accessibilityRole="header">
            {tr(`today.greeting.${greetingKey(now.getHours())}`)}
          </AppText>
        </View>
        <StreakBadge count={streak.current} doneToday={streak.doneToday} onPress={() => router.push('/(tabs)/progress')} />
        <ScalePressable onPress={() => router.push('/achievements')} accessibilityRole="button" accessibilityLabel={tr('today.levelChip', { level })} style={{ minHeight: t.touch, justifyContent: 'center' }}>
          <View style={{ height: 36, paddingHorizontal: t.space.md, borderRadius: t.radius.pill, backgroundColor: t.tokens.muted, justifyContent: 'center' }}>
            <AppText variant="footnote" style={{ fontWeight: '600' }}>
              {tr('today.levelChip', { level })}
            </AppText>
          </View>
        </ScalePressable>
      </View>
      <WorkoutCard />
      <ThisWeek />
      <FunctionalTasksCard track={training.track} weekIndex={todayWeekIndex(training, toDateKey())} />
      <DailyGoalCard />
      <FitnessCard />
      <RelaxCard />
      <TodayExtras />
    </Screen>
  );
}
