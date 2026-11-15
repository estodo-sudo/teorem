import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Screen, useTheme } from '@/components';
import { submitFeedback } from '@/features/training/service';
import { formatDuration } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { Feedback } from '@/types';

const OPTIONS: { value: Feedback; emoji: string }[] = [
  { value: 'easy', emoji: '😌' },
  { value: 'ok', emoji: '👍' },
  { value: 'hard', emoji: '😤' },
  { value: 'failed', emoji: '🛑' },
];

export default function FeedbackScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useHistoryStore((s) => s.workouts.find((w) => w.id === id));
  const levelBefore = useTrainingStore.getState().training.level;
  const [choice, setChoice] = useState<Feedback | null>(null);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);

  const options = workout?.completed ? OPTIONS : OPTIONS.filter((o) => o.value === 'hard' || o.value === 'failed');

  const submit = () => {
    if (!choice || !id) return;
    submitFeedback(id, choice);
    setResult({ before: levelBefore, after: useTrainingStore.getState().training.level });
  };

  if (result) {
    const key = result.after > result.before ? 'up' : result.after < result.before ? 'down' : 'same';
    return (
      <Screen
        footer={<Button label={tr('common.continue')} size="lg" variant="accent" onPress={() => router.replace('/')} />}
      >
        <View style={{ alignItems: 'center', gap: 12, marginTop: 40 }}>
          <AppText variant="display">{key === 'up' ? '🚀' : key === 'down' ? '🌱' : '✅'}</AppText>
          <AppText variant="h1" center>
            {tr(`feedback.result.${key}.title`, { level: result.after })}
          </AppText>
          <AppText muted center>
            {tr(`feedback.result.${key}.body`, { level: result.after })}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={<Button label={tr('feedback.submit')} size="lg" variant="accent" disabled={!choice} onPress={submit} />}
    >
      <View style={{ alignItems: 'center', gap: 8, marginTop: 24 }}>
        <AppText variant="display">{workout?.completed ? '🎉' : '💪'}</AppText>
        <AppText variant="h1" center>
          {workout?.completed ? tr('feedback.doneTitle') : tr('feedback.partialTitle')}
        </AppText>
        {workout ? (
          <Card style={{ flexDirection: 'row', gap: 24, marginTop: 8 }}>
            <Stat label={tr('feedback.duration')} value={formatDuration(workout.actualSec)} />
            <Stat label={tr('feedback.level')} value={String(workout.level)} />
          </Card>
        ) : null}
      </View>
      <AppText variant="h2" style={{ marginTop: 16 }}>
        {tr('feedback.question')}
      </AppText>
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {options.map((o) => (
          <ChoiceCard
            key={o.value}
            emoji={o.emoji}
            label={tr(`feedback.option.${o.value}.label`)}
            description={tr(`feedback.option.${o.value}.hint`)}
            selected={choice === o.value}
            onPress={() => setChoice(o.value)}
          />
        ))}
      </View>
      <AppText variant="small" muted style={{ color: t.colors.textMuted }}>
        {tr('feedback.note')}
      </AppText>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="small" muted>
        {label}
      </AppText>
    </View>
  );
}
