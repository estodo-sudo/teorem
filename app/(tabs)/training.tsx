import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Screen, useTheme } from '@/components';
import { PlanGrid } from '@/features/training/PlanGrid';
import { advancedToday, todayPlanDay } from '@/features/training/plan';
import { TrainingFitnessSection } from '@/features/fitness/TrainingFitnessSection';
import { WorkoutCard } from '@/features/today/WorkoutCard';
import { toDateKey } from '@/lib/date';
import { useTrainingStore } from '@/stores/trainingStore';
import type { ExerciseType } from '@/types';

const TYPES: ExerciseType[] = ['hold', 'quick', 'elevator', 'pulse', 'endurance', 'relax'];

export default function TrainingTab() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const todayIdx = todayPlanDay(training, today);
  const completedDays = advancedToday(training, today) ? todayIdx + 1 : training.planDayIndex;

  return (
    <Screen>
      <AppText variant="h1" accessibilityRole="header">
        {tr('training.title')}
      </AppText>
      <WorkoutCard />
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="h3">{tr('training.planTitle', { plan: training.planNumber })}</AppText>
          <AppText muted>{tr('training.planProgress', { done: completedDays })}</AppText>
        </View>
        <PlanGrid completedDays={completedDays} todayIndex={todayIdx} />
        <AppText variant="small" muted>
          {tr('training.planHint')}
        </AppText>
      </Card>
      <AppText variant="h2" style={{ marginTop: 8 }}>
        {tr('training.exercisesTitle')}
      </AppText>
      <View style={{ gap: 10 }}>
        {TYPES.map((type) => (
          <Card key={type} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 10, alignSelf: 'stretch', borderRadius: 5, backgroundColor: type === 'relax' ? t.colors.breathe : t.colors.contract }} />
            <View style={{ flex: 1 }}>
              <AppText weight="700">{tr(`exercise.${type}.name`)}</AppText>
              <AppText variant="small" muted>
                {tr(`exercise.${type}.desc`)}
              </AppText>
            </View>
          </Card>
        ))}
      </View>
      <TrainingFitnessSection />
    </Screen>
  );
}
