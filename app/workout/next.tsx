import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme, type IconName } from '@/components';
import { CelebrationBurst } from '@/components/CelebrationBurst';
import { Button, Card, IconTile } from '@/components/ui';
import { absoluteDay, cycleMoves, learnedMoves, roundMoves } from '@/features/training/moves';
import { isCycle, todayPlanPosition } from '@/features/training/plan';
import { buildTodaySession, lessonRoute } from '@/features/training/service';
import { useKegelLock } from '@/features/training/useKegelLock';
import { toDateKey } from '@/lib/date';
import { useTrainingStore } from '@/stores/trainingStore';
import type { KegelExerciseType } from '@/types';

const ICON: Partial<Record<KegelExerciseType, IconName>> = { elevator: 'layers', quick_flick: 'pulse', slow_hold: 'clock', step_up: 'trendUp', step_down: 'trendDown', double_peak: 'mountain', half_quick: 'zap', half_hold: 'hourglass', wave: 'waves' };

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
  const pos = todayPlanPosition(training, toDateKey());
  const moves = isCycle(pos.planNumber) ? cycleMoves(learnedMoves(training), pos.planDay, 2) : roundMoves(learnedMoves(training), absoluteDay(pos.planNumber, pos.planDay), 2);

  // A lesson due today comes first (yavaş sıkma the first time, a new move on its day).
  const startRound2 = () => router.replace(lessonRoute(training, id) ?? { pathname: '/workout/[sessionId]', params: { sessionId: 'round2', first: id } });
  const finish = () => router.replace({ pathname: '/workout/feedback', params: { id } });

  return (
    <Screen
      footer={
        <View style={{ gap: t.space.sm }}>
          {/* The countdown shows only on Günüm's "Başla" (2026-11-25). */}
          {lock.locked ? null : <Button label={tr('round.start', { min: minutes })} icon="play" size="lg" onPress={startRound2} fullWidth testID="start-round2" />}
          <Button label={tr('round.finish')} variant="secondary" size="lg" onPress={finish} fullWidth />
        </View>
      }
    >
      <View style={{ alignItems: 'center', gap: t.space.md, marginTop: t.space.xxl }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* a one-off burst for the finished round (aesthetic pass 2026-11-25) */}
          <CelebrationBurst size={t.tile.lg} delay={250} />
          <IconTile icon="success" tone="kegel" size="lg" round />
        </View>
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
              {/* 180-day plan: the move learned last (in every round) and today's review of an earlier one */}
              {type === moves.latest || type === moves.review ? (
                <AppText variant="footnote" muted>
                  {tr(type === moves.latest ? 'round.latest' : 'round.review')}
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
