import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Screen, useTheme } from '@/components';
import { Button, Card, SegmentedSteps } from '@/components/ui';
import { generateMoveDemo } from '@/features/training/generateSession';
import { MOVE_IDS, withLearned, type MoveId } from '@/features/training/moves';
import { MoveLoop } from '@/features/training/MoveLoop';
import { WorkoutPlayer } from '@/features/training/player/WorkoutPlayer';
import { useTrainingStore } from '@/stores/trainingStore';

type Step = 'learn' | 'practice' | 'check';
const ORDER: Step[] = ['learn', 'practice', 'check'];
type NewMove = Exclude<MoveId, 'elevator'>;

/**
 * A new move's mini lesson (180-day plan, 2026-11-26), the same three steps as the yavaş sıkma lesson:
 * it opens by itself after Tur 1 on the move's day (11, 16, 24, 32, 45, 55), before Tur 2 —
 * 1 learn: the move's name, the circle doing it on a loop with the step word, and its steps;
 * 2 practice: a few guided reps in the real player (words on, vibration by strength; not recorded);
 * 3 check: three questions → "Hazırım" learns the move and starts Tur 2 (which now has it), or try again.
 * "Tur 2'yi sonra yap" leaves without learning it; the lesson comes again after the next Tur 1.
 */
export default function MoveIntroScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { first, move: raw } = useLocalSearchParams<{ first?: string; move?: string }>();
  const move = (MOVE_IDS.has(raw ?? '') && raw !== 'elevator' ? raw : 'step_up') as NewMove;
  const name = tr(`exercise.${move}.name`);
  const [step, setStep] = useState<Step>('learn');
  const [runKey, setRunKey] = useState(0);
  const practice = useMemo(() => generateMoveDemo(move), [move]);

  const startRound2 = () => {
    const training = useTrainingStore.getState().training;
    useTrainingStore.getState().update({ movesLearned: withLearned(training, move) });
    router.replace({ pathname: '/workout/[sessionId]', params: { sessionId: 'round2', ...(first ? { first } : {}) } });
  };
  // Later: to Tur 1's summary when we came from it, else home.
  const later = () => (first ? router.replace({ pathname: '/workout/feedback', params: { id: first } }) : router.replace('/'));
  const bar = <SegmentedSteps total={ORDER.length} current={ORDER.indexOf(step)} label={tr('moveIntro.progress', { step: ORDER.indexOf(step) + 1, total: ORDER.length })} />;

  if (step === 'practice') {
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        {bar}
        <AppText variant="h2">{tr('moveIntro.practiceTitle', { name })}</AppText>
        <AppText muted>{tr('moveIntro.practiceHint')}</AppText>
        <View
          style={{
            flex: 1,
            backgroundColor: t.dark ? t.player.bg : t.tokens.card,
            borderRadius: t.radius.lg,
            borderWidth: t.dark ? 0 : t.border.thin,
            borderColor: t.tokens.border,
            padding: t.space.lg,
          }}
        >
          <WorkoutPlayer key={runKey} session={practice} minimal forceLabels onDone={() => setStep('check')} />
        </View>
      </Screen>
    );
  }

  if (step === 'check') {
    return (
      <Screen
        footer={
          <View style={{ gap: t.space.sm }}>
            <Button label={tr('moveIntro.ready')} icon="play" size="lg" onPress={startRound2} fullWidth testID="move-intro-go" />
            <Button
              label={tr('moveIntro.again')}
              variant="secondary"
              size="lg"
              onPress={() => {
                setRunKey((k) => k + 1);
                setStep('practice');
              }}
              fullWidth
            />
          </View>
        }
      >
        {bar}
        <Animated.View entering={FadeInRight.duration(320)} style={{ gap: t.space.lg, marginTop: t.space.lg }}>
          <AppText variant="title1" accessibilityRole="header">
            {tr('moveIntro.checkTitle')}
          </AppText>
          <Card style={{ padding: t.space.gutter, gap: t.space.md }}>
            {(tr(`moveIntro.moves.${move}.checkItems`, { returnObjects: true }) as string[]).map((c, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'flex-start' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: t.tokens.primary, marginTop: 1 }} />
                <AppText variant="body" style={{ flex: 1 }}>
                  {c}
                </AppText>
              </View>
            ))}
          </Card>
          <AppText variant="footnote" muted>
            {tr('moveIntro.checkNote')}
          </AppText>
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={{ gap: t.space.sm }}>
          <Button label={tr('moveIntro.tryIt')} icon="play" size="lg" onPress={() => setStep('practice')} fullWidth testID="move-intro-practice" />
          <Button label={tr('moveIntro.later')} variant="ghost" onPress={later} fullWidth />
        </View>
      }
    >
      {bar}
      <View style={{ gap: t.space.xs, marginTop: t.space.lg }}>
        <AppText variant="caption" muted>
          {tr('moveIntro.kicker')}
        </AppText>
        <AppText variant="title1" accessibilityRole="header">
          {tr('moveIntro.title', { name })}
        </AppText>
        <AppText variant="body" muted>
          {tr(`exercise.${move}.desc`)}
        </AppText>
      </View>
      <MoveLoop move={move} />
      <Card style={{ padding: t.space.gutter, gap: t.space.md }}>
        {(tr(`moveIntro.moves.${move}.steps`, { returnObjects: true }) as string[]).map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'flex-start' }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.tokens.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="footnote" weight="700" color={t.tokens.primary}>
                {i + 1}
              </AppText>
            </View>
            <AppText variant="body" style={{ flex: 1 }}>
              {s}
            </AppText>
          </View>
        ))}
      </Card>
      <AppText variant="footnote" muted>
        {tr('moveIntro.note', { name })}
      </AppText>
    </Screen>
  );
}
