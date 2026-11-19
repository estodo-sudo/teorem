import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen } from '@/components';
import { NumberStepper } from '@/features/camps/core/ui';
import { cleanAnswers, SELF_RATING, selfRatingQuestions } from '@/features/training/strengthV2';
import { KEGEL_TRACKS } from '@/features/training/tracks';
import { goBack } from '@/lib/nav';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Aylık öz değerlendirme (SPEC_KEGEL_V2 §10): 2–3 questions for the active track, 0–10 each. These are
 * the app's own simple questions — clearly labelled as not a licensed clinical scale.
 */
export default function SelfRatingScreen() {
  const { t: tr } = useTranslation();
  const track = useTrainingStore((s) => s.training.track);
  const questions = selfRatingQuestions(track);
  const [answers, setAnswers] = useState<Record<string, number>>(() => Object.fromEntries(questions.map((q) => [q.id, 5])));
  const trackTitle = KEGEL_TRACKS.find((x) => x.id === track)?.title ?? '';

  const save = () => {
    useKegelStore.getState().addSelfRating({ track, answers: cleanAnswers(track, answers) });
    goBack('/(tabs)/progress');
  };

  return (
    <Screen footer={<Button label={tr('common.save')} size="lg" variant="accent" onPress={save} />}>
      <Header title={SELF_RATING.title} onBack={() => goBack('/(tabs)/progress')} />
      <AppText muted>{SELF_RATING.intro}</AppText>
      <AppText variant="small" weight="800" muted>
        {tr('kegel.selfRating.track', { track: trackTitle })}
      </AppText>
      {questions.map((q) => (
        <Card key={q.id} style={{ gap: 10 }}>
          <AppText variant="h3">{q.text}</AppText>
          <NumberStepper label={q.text} value={answers[q.id] ?? 5} min={0} max={10} quick={[0, 5, 10]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="small" muted>
              0 · {q.minLabel}
            </AppText>
            <AppText variant="small" muted>
              10 · {q.maxLabel}
            </AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
