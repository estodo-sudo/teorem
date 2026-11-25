import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme, type IconName } from '@/components';
import { Button, Card, IconTile } from '@/components/ui';
import { buildTodaySession } from '@/features/training/service';
import { useKegelLock } from '@/features/training/useKegelLock';
import { useTrainingStore } from '@/stores/trainingStore';
import type { KegelExerciseType } from '@/types';

const ICON: Partial<Record<KegelExerciseType, IconName>> = { elevator: 'layers', quick_flick: 'pulse', slow_hold: 'clock' };

/**
 * After Tur 1: "Tur 1 tamamlandı" and the choice to go on with Tur 2 (adds yavaş sıkma) or finish.
 * The first time, Tur 2 starts with a short introduction. Feedback is asked once, after the last round.
 */
export default function NextRoundScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const training = useTrainingStore((s) => s.training);
  const round2 = buildTodaySession(training, undefined, { round: 2 });
  const lock = useKegelLock();
  const minutes = Math.max(1, Math.round(round2.plannedSec / 60));
  // Tur 2's exercises in order (2026-11-23: yavaş, hızlı, yavaş, uzun).
  const order = round2.blocks.map((b) => b.type);

  const startRound2 = () => (training.round2IntroDone ? router.replace({ pathname: '/workout/[sessionId]', params: { sessionId: 'round2', first: id } }) : router.replace({ pathname: '/workout/round2-intro', params: { first: id } }));
  const finish = () => router.replace({ pathname: '/workout/feedback', params: { id } });

  return (
    <Screen
      footer={
        <View style={{ gap: t.space.sm }}>
          {lock.locked ? (
            <Button label={lock.left} size="lg" disabled onPress={() => undefined} fullWidth accessibilityHint={tr('kegel.lock.hint')} />
          ) : (
            <Button label={tr('round.start', { min: minutes })} icon="play" size="lg" onPress={startRound2} fullWidth testID="start-round2" />
          )}
          <Button label={tr('round.finish')} variant="secondary" size="lg" onPress={finish} fullWidth />
        </View>
      }
    >
      <View style={{ alignItems: 'center', gap: t.space.md, marginTop: t.space.xxl }}>
        <IconTile icon="success" tone="kegel" size="lg" round />
        <AppText variant="title1" center accessibilityRole="header">
          {tr('round.doneTitle')}
        </AppText>
        <AppText variant="body" muted center>
          {tr('round.offer', { min: minutes })}
        </AppText>
      </View>
      <Card style={{ padding: t.space.gutter, gap: t.space.md }}>
        <AppText variant="bodyStrong">{tr('round.contents')}</AppText>
        {order.map((type, i) => (
          <View key={`${type}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
            <IconTile icon={ICON[type] ?? 'pulse'} tone="kegel" />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">
                {i + 1}. {tr(`exercise.${type}.name`)}
              </AppText>
              {type === 'elevator' && order.indexOf(type) === i ? (
                <AppText variant="footnote" muted>
                  {tr('round.new')}
                </AppText>
              ) : null}
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'center' }}>
          <Icon name="info" size="sm" color={t.tokens.mutedForeground} />
          <AppText variant="footnote" muted style={{ flex: 1 }}>
            {tr('round.restNote')}
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}
