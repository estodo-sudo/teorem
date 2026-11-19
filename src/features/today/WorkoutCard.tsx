import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Icon, Segmented, useTheme } from '@/components';
import { PLAN_LENGTH_DAYS } from '@/config/app';
import { openGated } from '@/features/purchases/useGate';
import { generateMicroSet } from '@/features/training/generateSession';
import { todayPlanDay, todayWeekIndex } from '@/features/training/plan';
import { capStatus, isOnVacation, sessionAllowed } from '@/features/training/schedule';
import { buildTodaySession, contractionsToday } from '@/features/training/service';
import { DURATION_ORDER } from '@/features/training/tracks';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { DurationPreset } from '@/types';

/**
 * Today's Kegel card (SPEC_KEGEL_V2 §6.2, §6.3, §11.5): duration chips (Quick / Standard / Full),
 * start, the daily target (main session + micro sets) and a one-minute micro set. Over the daily
 * contraction cap more sessions lock ("enough for today"); a release session still opens.
 */
export function WorkoutCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const workouts = useHistoryStore((s) => s.workouts);
  const hypertonic = useKegelStore((s) => s.profile?.hypertonicFlag ?? false);
  const painFlag = useKegelStore((s) => s.profile?.painFlag ?? false);
  const [capOpen, setCapOpen] = useState(false);
  const todays = workouts.filter((w) => w.date === today);
  const doneCount = todays.filter((w) => w.completed).length;
  const mainDone = todays.some((w) => w.completed && !w.isMicro);
  const session = buildTodaySession(training, today);
  const micro = generateMicroSet({ track: training.track, level: training.level, hypertonic, seed: `${today}-micro`, weekIndex: todayWeekIndex(training, today) });
  const used = contractionsToday(workouts, today);
  const cap = capStatus(used, training.level);
  const day = todayPlanDay(training, today) + 1;
  const preset = training.nextPresetOnce ?? training.durationPreset;
  const onVacation = isOnVacation(today, training.vacation);

  const go = (sessionId: string, contractions: number) => {
    if (!sessionAllowed(used, contractions, training.level)) return setCapOpen(true);
    openGated('workout', { pathname: '/workout/[sessionId]', params: { sessionId } });
  };
  const setPreset = (p: DurationPreset) => {
    const st = useTrainingStore.getState();
    st.update({ durationPreset: p, nextPresetOnce: undefined, suggestShorter: undefined });
  };

  return (
    <Card style={{ gap: 14, backgroundColor: t.colors.primary, borderColor: t.colors.primary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="small" weight="700" color={t.colors.primaryText} style={{ opacity: 0.8 }}>
          {tr('today.workout.plan', { plan: training.planNumber, day, total: PLAN_LENGTH_DAYS })}
        </AppText>
        <AppText variant="small" weight="700" color={t.colors.primaryText} accessibilityLabel={tr('today.workout.targetA11y', { done: doneCount, total: training.dailyTarget })}>
          {tr('today.workout.sessions', { done: Math.min(doneCount, training.dailyTarget), total: training.dailyTarget })}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {mainDone ? (
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.success, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" color="#FFFFFF" size={26} strokeWidth={3} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="h2" color={t.colors.primaryText}>
            {mainDone ? tr('today.workout.doneTitle') : tr('today.workout.title')}
          </AppText>
          <AppText color={t.colors.primaryText} style={{ opacity: 0.85 }}>
            {tr('today.workout.meta', { min: Math.max(1, Math.round(session.plannedSec / 60)), level: session.level })}
            {session.deload ? ` · ${tr('today.workout.deload')}` : ''}
          </AppText>
        </View>
      </View>

      {!mainDone ? (
        <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.md }}>
          <Segmented<DurationPreset> accessibilityLabel={tr('today.workout.duration')} value={preset} onChange={setPreset} options={DURATION_ORDER.map((p) => ({ value: p, label: tr(`training.preset.${p}`) }))} />
        </View>
      ) : null}
      {training.suggestShorter && !mainDone ? (
        <AppText variant="small" color={t.colors.primaryText} style={{ opacity: 0.85 }}>
          {tr('today.workout.shorterHint')}
        </AppText>
      ) : null}
      {training.returnNotice && training.returnNotice.date === today ? (
        <AppText variant="small" weight="700" color={t.colors.primaryText} accessibilityRole="alert">
          {tr(`kegel.return.${training.returnNotice.kind}`, { count: training.returnNotice.days })}
        </AppText>
      ) : null}
      {onVacation ? (
        <AppText variant="small" weight="700" color={t.colors.primaryText}>
          🏖️ {tr('kegel.vacation.cardNote')}
        </AppText>
      ) : null}
      {painFlag ? (
        <AppText variant="small" weight="700" color={t.colors.primaryText} accessibilityRole="alert">
          ⚠️ {tr('kegel.painNotice')}
        </AppText>
      ) : null}
      {training.repeatNextDay && !mainDone ? (
        <AppText variant="small" color={t.colors.primaryText} style={{ opacity: 0.85 }}>
          {tr('today.workout.repeat')}
        </AppText>
      ) : null}

      {mainDone ? (
        <Button label={tr('today.workout.again')} variant="secondary" icon="play" onPress={() => go(today, session.contractions)} />
      ) : (
        <Button label={tr('common.start')} size="lg" variant="accent" icon="play" onPress={() => go(today, session.contractions)} testID="start-workout" />
      )}
      <Button label={tr('today.workout.micro', { sec: micro.plannedSec })} variant="secondary" icon="pulse" onPress={() => go('micro', micro.contractions)} />
      {cap.locked ? (
        <AppText variant="small" color={t.colors.primaryText} style={{ opacity: 0.85 }}>
          {tr('today.workout.capReached')}
        </AppText>
      ) : null}

      <Dialog
        visible={capOpen}
        title={tr('today.workout.capTitle')}
        message={tr('today.workout.capBody')}
        onDismiss={() => setCapOpen(false)}
        actions={[
          { label: tr('today.workout.capRelease'), variant: 'accent', onPress: () => (setCapOpen(false), openGated('workout', { pathname: '/workout/[sessionId]', params: { sessionId: 'release' } })) },
          { label: tr('common.close'), onPress: () => setCapOpen(false) },
        ]}
      />
    </Card>
  );
}
