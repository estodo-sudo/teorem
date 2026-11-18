import type { ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, ProgressBar, Screen, useTheme } from '@/components';
import { FindMuscleArt, PelvicFloorArt, TechniqueArt, VibrationArt } from '@/components/Illustrations';
import { generateTrialSession } from '@/features/training/generateSession';
import { playCue } from '@/features/training/haptics';
import { WorkoutPlayer } from '@/features/training/player/WorkoutPlayer';
import { useProfileStore } from '@/stores/profileStore';
import { goBack as safeBack } from '@/lib/nav';
import { useSettingsStore } from '@/stores/settingsStore';

type Step = 'what' | 'find' | 'technique' | 'vibration' | 'trial' | 'check' | 'tips';
const ORDER: Step[] = ['what', 'find', 'technique', 'vibration', 'trial', 'check'];

export default function Tutorial() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const [step, setStep] = useState<Step>('what');
  const [trialKey, setTrialKey] = useState(0);
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const trial = useMemo(() => generateTrialSession(), []);
  const idx = step === 'tips' ? ORDER.indexOf('check') : ORDER.indexOf(step);

  const done = () => {
    if (replay) {
      safeBack();
      return;
    }
    useProfileStore.getState().update({ tutorialDone: true });
    router.replace('/paywall');
  };

  const goBack = () => {
    if (step === 'tips') return setStep('check');
    if (idx === 0) return replay ? safeBack() : undefined;
    setStep(ORDER[idx - 1]!);
  };

  if (step === 'trial') {
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        <AppText variant="h2">{tr('tutorial.trial.title')}</AppText>
        <AppText muted>{tr('tutorial.trial.body')}</AppText>
        <WorkoutPlayer key={trialKey} session={trial} minimal forceLabels onDone={() => setStep('check')} />
      </Screen>
    );
  }

  const content: Record<Exclude<Step, 'trial'>, { art?: ReactNode; title: string; body: string[]; cta: string; warn?: string }> = {
    what: { art: <PelvicFloorArt />, title: tr('tutorial.what.title'), body: tr('tutorial.what.body', { returnObjects: true }) as string[], cta: tr('tutorial.understood') },
    find: {
      art: <FindMuscleArt />,
      title: tr('tutorial.find.title'),
      body: tr('tutorial.find.body', { returnObjects: true }) as string[],
      warn: tr('tutorial.find.warn'),
      cta: tr('tutorial.understood'),
    },
    technique: {
      art: <TechniqueArt />,
      title: tr('tutorial.technique.title'),
      body: tr('tutorial.technique.body', { returnObjects: true }) as string[],
      warn: tr('tutorial.technique.warn'),
      cta: tr('tutorial.understood'),
    },
    vibration: { art: <VibrationArt />, title: tr('tutorial.vibration.title'), body: tr('tutorial.vibration.body', { returnObjects: true }) as string[], cta: tr('tutorial.vibration.cta') },
    check: { title: tr('tutorial.check.title'), body: [tr('tutorial.check.body')], cta: tr('tutorial.check.yes') },
    tips: { title: tr('tutorial.tips.title'), body: tr('tutorial.tips.body', { returnObjects: true }) as string[], cta: tr('tutorial.tips.retry') },
  };
  const c = content[step];

  const onCta = () => {
    if (step === 'check') return done();
    if (step === 'tips') {
      setTrialKey((k) => k + 1);
      return setStep('trial');
    }
    setStep(ORDER[idx + 1]!);
  };

  return (
    <Screen
      footer={
        <>
          <Button label={c.cta} size="lg" variant="accent" onPress={onCta} />
          {step === 'check' ? <Button label={tr('tutorial.check.unsure')} variant="secondary" onPress={() => setStep('tips')} /> : null}
          {replay && step !== 'check' ? <Button label={tr('tutorial.close')} variant="ghost" onPress={() => safeBack()} /> : null}
        </>
      }
    >
      <View style={{ gap: 12 }}>
        <Header onBack={goBack} title={tr('tutorial.header')} />
        <ProgressBar value={(idx + 1) / ORDER.length} accessibilityLabel={tr('onboarding.progress', { step: idx + 1, total: ORDER.length })} />
      </View>
      {c.art ? <View style={{ alignItems: 'center', marginVertical: 8 }}>{c.art}</View> : <AppText variant="display" center style={{ marginTop: 24 }}>{step === 'check' ? '🤔' : '💡'}</AppText>}
      <AppText variant="h1" accessibilityRole="header">
        {c.title}
      </AppText>
      {c.body.map((p) => (
        <AppText key={p} variant="body">
          {p}
        </AppText>
      ))}
      {c.warn ? (
        <Card style={{ backgroundColor: t.dark ? '#3A2414' : '#FFF1E6', borderColor: t.colors.accent }}>
          <AppText weight="700">⚠️ {c.warn}</AppText>
        </Card>
      ) : null}
      {step === 'vibration' ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button style={{ flex: 1 }} label={tr('tutorial.vibration.trySqueeze')} variant="primary" onPress={() => playCue('contractStart', strength || 2)} />
          <Button style={{ flex: 1 }} label={tr('tutorial.vibration.tryRelax')} variant="secondary" onPress={() => playCue('relaxStart', strength || 2)} />
        </View>
      ) : null}
    </Screen>
  );
}
