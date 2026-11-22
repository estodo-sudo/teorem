import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Screen, useTheme } from '@/components';
import { Button, Card } from '@/components/ui';
import { generateSlowDemo } from '@/features/training/generateSession';
import { MuscleSphere } from '@/features/training/player/MuscleSphere';
import { sphereWord } from '@/features/training/player/sphereMotion';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Shown once, before the first Tur 2: what yavaş sıkma is (slowly up ~3 s, 0.5 s at the top, let go,
 * 1 s pause), with the circle showing it on a loop, and how Tur 2 is built. Then Tur 2 starts.
 */
export default function Round2IntroScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const steps = tr('round.intro.steps', { returnObjects: true }) as string[];

  const start = () => {
    useTrainingStore.getState().update({ round2IntroDone: true });
    router.replace({ pathname: '/workout/[sessionId]', params: { sessionId: 'round2', ...(first ? { first } : {}) } });
  };

  return (
    <Screen footer={<Button label={tr('round.intro.go')} icon="play" size="lg" onPress={start} fullWidth testID="round2-intro-go" />}>
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
