import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { chooseTrack, saveScreening, SCREENING } from '@/features/training/kegelProfile';
import type { ScreeningResult } from '@/features/training/schedule';
import { goBack } from '@/lib/nav';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Kas profili taraması (SPEC_KEGEL_V2 §2): 8 yes/no questions about the last month, one per screen.
 * Not a diagnosis — it only suggests a programme. ≥ 2 "yes" in the first 7 → the relaxation track is
 * suggested (the user chooses). Any pain answer → "stop if it hurts" before every session.
 * `from=onboarding` continues to the tutorial afterwards.
 */
export default function ScreeningScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const onboarding = from === 'onboarding';
  const Q = SCREENING.questions;
  const [step, setStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => Q.map(() => null));
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const R = SCREENING.result;

  const leave = () => (onboarding ? router.replace('/tutorial') : goBack('/(tabs)/profile'));
  const skip = () => {
    useKegelStore.getState().skipScreening(new Date().toISOString());
    leave();
  };
  const answer = (v: boolean) => {
    const next = answers.map((a, i) => (i === step ? v : a));
    setAnswers(next);
    if (step < Q.length - 1) setStep(step + 1);
    else setResult(saveScreening(next.map((a) => a === true)));
  };

  if (result) {
    const relax = result.suggestTrack === 'relax';
    const dribble = answers[7] === true;
    const current = useTrainingStore.getState().training.track;
    return (
      <Screen
        footer={
          relax && current !== 'relax' ? (
            <>
              <Button label={tr('kegel.screening.startRelax')} size="lg" variant="accent" onPress={() => (chooseTrack('relax'), leave())} />
              <Button label={tr('kegel.screening.keepTrack')} variant="ghost" onPress={leave} />
            </>
          ) : (
            <Button label={tr('common.continue')} size="lg" variant="accent" onPress={leave} />
          )
        }
      >
        <View style={{ gap: t.space.md, marginTop: t.space.xl }}>
          <IconTile icon={relax ? 'leaf' : 'success'} tone="kegel" size="lg" round />
          <AppText variant="h1">{relax ? R.relaxTitle : R.okTitle}</AppText>
          <AppText variant="h3" weight="500">
            {relax ? R.relaxText : R.okText}
          </AppText>
          {relax ? <AppText muted>{R.relaxNote}</AppText> : null}
          {dribble ? (
            <Card>
              <AppText>{R.dribbleText}</AppText>
            </Card>
          ) : null}
          {result.painFlag ? (
            <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.danger }}>
              <AppText weight="700" color={t.colors.danger}>
                {R.painNotice}
              </AppText>
            </Card>
          ) : null}
        </View>
      </Screen>
    );
  }

  if (step < 0) {
    return (
      <Screen
        footer={
          <>
            <Button label={tr('common.start')} size="lg" variant="accent" onPress={() => setStep(0)} />
            <Button label={tr('kegel.screening.skip')} variant="ghost" onPress={skip} />
          </>
        }
      >
        {onboarding ? <View style={{ height: 48 }} /> : <Header onBack={() => goBack('/(tabs)/profile')} />}
        <View style={{ gap: t.space.md, marginTop: t.space.sm }}>
          <IconTile icon="compass" tone="kegel" size="lg" round />
          <AppText variant="h1">{SCREENING.title}</AppText>
          <AppText variant="h3" weight="500">
            {SCREENING.intro}
          </AppText>
        </View>
      </Screen>
    );
  }

  const q = Q[step]!;
  return (
    <Screen>
      <View style={{ gap: t.space.md }}>
        <Header onBack={() => setStep(step - 1)} />
        <ProgressBar value={(step + 1) / Q.length} accessibilityLabel={tr('kegel.screening.progress', { step: step + 1, total: Q.length })} />
        <AppText variant="small" muted>
          {tr('kegel.screening.progress', { step: step + 1, total: Q.length })}
        </AppText>
      </View>
      <AppText variant="h2" style={{ marginTop: t.space.lg }}>
        {q.text}
      </AppText>
      {q.note ? <AppText muted>{q.note}</AppText> : null}
      <View style={{ gap: 10, marginTop: t.space.sm }} accessibilityRole="radiogroup">
        <ChoiceCard icon="thumbsUp" label={tr('common.yes')} selected={answers[step] === true} onPress={() => answer(true)} />
        <ChoiceCard icon="thumbsDown" label={tr('common.no')} selected={answers[step] === false} onPress={() => answer(false)} />
      </View>
    </Screen>
  );
}
