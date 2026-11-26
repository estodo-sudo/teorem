import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Screen, useTheme } from '@/components';
import { Button, Card, SegmentedSteps } from '@/components/ui';
import { generateSlowDemo } from '@/features/training/generateSession';
import { MuscleSphere } from '@/features/training/player/MuscleSphere';
import { sphereWord } from '@/features/training/player/sphereMotion';
import { WorkoutPlayer } from '@/features/training/player/WorkoutPlayer';
import { useTrainingStore } from '@/stores/trainingStore';

type Step = 'learn' | 'practice' | 'check';
const ORDER: Step[] = ['learn', 'practice', 'check'];

/**
 * Yavaş sıkma mini lesson (2026-11-25): the first time someone finishes Tur 1 it opens by itself and
 * gets them used to the new move before Tur 2 —
 * 1 learn: what yavaş sıkma is, the circle showing it on a loop and three steps;
 * 2 practice: three guided reps in the real player (words on, vibration on; not recorded);
 * 3 check: "Yavaşça sıkabildin mi?" → start Tur 2, or try the practice again.
 * "Tur 2'yi sonra yap" leaves without starting (the lesson comes again next time).
 */
export default function Round2IntroScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const steps = tr('round.intro.steps', { returnObjects: true }) as string[];
  const [step, setStep] = useState<Step>('learn');
  const [runKey, setRunKey] = useState(0);
  const practice = useMemo(() => generateSlowDemo(), []);

  const startRound2 = () => {
    useTrainingStore.getState().update({ round2IntroDone: true });
    router.replace({ pathname: '/workout/[sessionId]', params: { sessionId: 'round2', ...(first ? { first } : {}) } });
  };
  // Later: to Tur 1's summary when we came from it, else home.
  const later = () => (first ? router.replace({ pathname: '/workout/feedback', params: { id: first } }) : router.replace('/'));
  const bar = <SegmentedSteps total={ORDER.length} current={ORDER.indexOf(step)} label={tr('round.intro.progress', { step: ORDER.indexOf(step) + 1, total: ORDER.length })} />;

  if (step === 'practice') {
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        {bar}
        <AppText variant="h2">{tr('round.intro.practiceTitle')}</AppText>
        <AppText muted>{tr('round.intro.practiceHint')}</AppText>
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
            <Button label={tr('round.intro.ready')} icon="play" size="lg" onPress={startRound2} fullWidth testID="round2-intro-go" />
            <Button
              label={tr('round.intro.again')}
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
            {tr('round.intro.checkTitle')}
          </AppText>
          <Card style={{ padding: t.space.gutter, gap: t.space.md }}>
            {(tr('round.intro.checkItems', { returnObjects: true }) as string[]).map((c, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'flex-start' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: t.tokens.primary, marginTop: 1 }} />
                <AppText variant="body" style={{ flex: 1 }}>
                  {c}
                </AppText>
              </View>
            ))}
          </Card>
          <AppText variant="footnote" muted>
            {tr('round.intro.checkNote')}
          </AppText>
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={{ gap: t.space.sm }}>
          <Button label={tr('round.intro.tryIt')} icon="play" size="lg" onPress={() => setStep('practice')} fullWidth testID="round2-intro-practice" />
          <Button label={tr('round.intro.later')} variant="ghost" onPress={later} fullWidth />
        </View>
      }
    >
      {bar}
      <View style={{ gap: t.space.xs, marginTop: t.space.lg }}>
        <AppText variant="caption" muted>
          {tr('round.intro.kicker')}
        </AppText>
        <AppText variant="title1" accessibilityRole="header">
          {tr('round.intro.title')}
        </AppText>
      </View>
      <SlowDemo />
      <Card style={{ padding: t.space.gutter, gap: t.space.md }}>
        {steps.map((s, i) => (
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
        {tr('round.intro.note')}
      </AppText>
    </Screen>
  );
}

/** The circle doing yavaş sıkma on a loop, with the word under it. */
function SlowDemo() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const phases = useMemo(() => generateSlowDemo().phases.filter((p) => p.kind !== 'countdown' && p.rep === 1), []);
  const [i, setI] = useState(0);
  const [key, setKey] = useState(0);
  const phase = phases[i % phases.length]!;
  useEffect(() => {
    const id = setTimeout(() => {
      setI((x) => (x + 1) % phases.length);
      setKey((k) => k + 1);
    }, phase.durationMs);
    return () => clearTimeout(id);
  }, [key, phase.durationMs, phases.length]);
  const f = t.player;
  const colors = { neutral: f.idle, accent: f.orbEdge, cool: f.relax, breath: t.tokens.breathe, ring: f.text, track: f.track, paused: f.paused, glow: f.glow, highlight: f.orbCenter, halo: f.halo, gap: f.bg };
  return (
    <View style={{ alignItems: 'center', gap: t.space.sm, paddingVertical: t.space.lg, borderRadius: t.radius.lg, backgroundColor: f.bg }} accessible accessibilityLabel={tr('round.intro.demoA11y')}>
      <MuscleSphere size={180} phase={phase} exerciseType="elevator" phaseKey={key} elapsedMs={0} paused={false} colors={colors} />
      <AppText variant="title3" weight="600" color={f.text}>
        {tr(`player.phase.${sphereWord(phase, phase.variant === 'top' ? 1000 : 0, 'elevator')}`)}
      </AppText>
    </View>
  );
}
