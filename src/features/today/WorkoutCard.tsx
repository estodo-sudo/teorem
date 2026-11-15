import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, useTheme } from '@/components';
import { PLAN_LENGTH_DAYS } from '@/config/app';
import { openGated } from '@/features/purchases/useGate';
import { buildTodaySession } from '@/features/training/service';
import { todayPlanDay } from '@/features/training/plan';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';

export function WorkoutCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const perDay = useSettingsStore((s) => s.settings.sessionsPerDay);
  const today = toDateKey();
  const doneCount = useHistoryStore((s) => s.workouts.filter((w) => w.date === today && w.completed).length);
  const session = buildTodaySession(training, today);
  const day = todayPlanDay(training, today) + 1;
  const done = doneCount > 0;
  const start = () => openGated('workout', { pathname: '/workout/[sessionId]', params: { sessionId: today } });

  return (
    <Card style={{ gap: 14, backgroundColor: t.colors.primary, borderColor: t.colors.primary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="small" weight="700" color={t.colors.primaryText} style={{ opacity: 0.8 }}>
          {tr('today.workout.plan', { plan: training.planNumber, day, total: PLAN_LENGTH_DAYS })}
        </AppText>
        {perDay > 1 ? (
          <AppText variant="small" weight="700" color={t.colors.primaryText}>
            {tr('today.workout.sessions', { done: Math.min(doneCount, perDay), total: perDay })}
          </AppText>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {done ? (
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.success, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" color="#FFFFFF" size={26} strokeWidth={3} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="h2" color={t.colors.primaryText}>
            {done ? tr('today.workout.doneTitle') : tr('today.workout.title')}
          </AppText>
          <AppText color={t.colors.primaryText} style={{ opacity: 0.85 }}>
            {tr('today.workout.meta', { min: Math.max(1, Math.round(session.plannedSec / 60)), level: session.level })}
          </AppText>
        </View>
      </View>
      {training.repeatNextDay && !done ? (
        <AppText variant="small" color={t.colors.primaryText} style={{ opacity: 0.85 }}>
          {tr('today.workout.repeat')}
        </AppText>
      ) : null}
      {done ? (
        <Button label={tr('today.workout.again')} variant="secondary" icon="play" onPress={start} />
      ) : (
        <Button label={tr('common.start')} size="lg" variant="accent" icon="play" onPress={start} testID="start-workout" />
      )}
    </Card>
  );
}
