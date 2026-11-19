import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { useStreak } from '@/features/gamification/service';
import { playCue } from '@/features/training/haptics';
import { submitFeedback, type FeedbackOutcome } from '@/features/training/service';
import { dailyProgress, levelOutlook } from '@/features/training/summary';
import { shorterPreset } from '@/features/training/tracks';
import { formatDuration, toDateKey } from '@/lib/date';
import { goHome } from '@/lib/nav';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { Feedback } from '@/types';

const OPTIONS: { value: Feedback; emoji: string }[] = [
  { value: 'easy', emoji: '😌' },
  { value: 'ok', emoji: '👍' },
  { value: 'hard', emoji: '😤' },
  { value: 'failed', emoji: '🛑' },
];

/**
 * Session end v2 (SPEC_KEGEL_V2 §7.5): completion animation (streak flame +1) → feedback (4 big
 * cards) and an optional "how was your technique?" → summary (duration, contractions, hold time,
 * longest hold), tomorrow's level and the daily target. Trophies celebrate through the global
 * Celebration layer. Micro sets skip the questions.
 */
export default function FeedbackScreen() {
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useHistoryStore((s) => s.workouts.find((w) => w.id === id));
  const [choice, setChoice] = useState<Feedback | null>(null);
  const [technique, setTechnique] = useState<'sure' | 'unsure' | null>(null);
  const [outcome, setOutcome] = useState<FeedbackOutcome | null>(null);

  const micro = Boolean(workout?.isMicro);
  const options = workout?.completed ? OPTIONS : OPTIONS.filter((o) => o.value === 'hard' || o.value === 'failed');

  const submit = () => {
    if (!choice || !id) return;
    setOutcome(submitFeedback(id, choice, technique ?? undefined) ?? null);
  };

  if (!workout) {
    return (
      <Screen footer={<Button label={tr('common.continue')} size="lg" variant="accent" onPress={goHome} />}>
        <View />
      </Screen>
    );
  }

  if (outcome || micro) return <Summary workoutId={workout.id} outcome={outcome} />;

  return (
    <Screen footer={<Button label={tr('feedback.submit')} size="lg" variant="accent" disabled={!choice} onPress={submit} />}>
      <View style={{ alignItems: 'center', gap: 8, marginTop: 16 }}>
        <CompletionFlame completed={workout.completed} />
        <AppText variant="h1" center>
          {workout.completed ? tr('feedback.doneTitle') : tr('feedback.partialTitle')}
        </AppText>
      </View>
      <AppText variant="h2" style={{ marginTop: 12 }}>
        {tr('feedback.question')}
      </AppText>
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {options.map((o) => (
          <ChoiceCard key={o.value} emoji={o.emoji} label={tr(`feedback.option.${o.value}.label`)} description={tr(`feedback.option.${o.value}.hint`)} selected={choice === o.value} onPress={() => setChoice(o.value)} />
        ))}
      </View>

      <AppText variant="h3" style={{ marginTop: 8 }}>
        {tr('feedback.technique.question')}
      </AppText>
      <View style={{ flexDirection: 'row', gap: 10 }} accessibilityRole="radiogroup">
        {(['sure', 'unsure'] as const).map((v) => (
          <View key={v} style={{ flex: 1 }}>
            <ChoiceCard emoji={v === 'sure' ? '🎯' : '🤔'} label={tr(`feedback.technique.${v}`)} selected={technique === v} onPress={() => setTechnique(technique === v ? null : v)} />
          </View>
        ))}
      </View>
      {technique === 'unsure' ? <TechniqueTips /> : null}

      <AppText variant="small" muted>
        {tr('feedback.note')}
      </AppText>
    </Screen>
  );
}

/** The streak flame springs in and the count goes up by one on the first finished session of the day. */
function CompletionFlame({ completed }: { completed: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const streak = useStreak();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const today = toDateKey();
  const firstToday = useHistoryStore((s) => s.workouts.filter((w) => w.date === today && w.completed).length === 1);
  const scale = useSharedValue(0.4);
  const plus = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 160 });
    plus.value = withDelay(350, withTiming(1, { duration: 350 }));
    const id = setTimeout(() => playCue('tap', strength), 380);
    return () => clearTimeout(id);
  }, [scale, plus, strength]);
  const flame = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const plusStyle = useAnimatedStyle(() => ({ opacity: plus.value, transform: [{ translateY: (1 - plus.value) * 10 }] }));
  const count = streak.current;
  return (
    <View accessible accessibilityLabel={tr('today.streakA11y', { count })} style={{ alignItems: 'center', height: 120, justifyContent: 'center' }}>
      <Animated.View style={[{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.dark ? t.colors.surfaceAlt : '#FFF1E6', alignItems: 'center', justifyContent: 'center' }, flame]}>
        <Icon name="flame" color={completed ? t.colors.accent : t.colors.warning} size={52} />
      </Animated.View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <AppText variant="h2">{count}</AppText>
        {completed && firstToday ? (
          <Animated.View style={plusStyle}>
            <AppText weight="800" color={t.colors.accent}>
              +1
            </AppText>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

/** "Not sure about the technique" → short tip cards (common mistakes). */
function TechniqueTips() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const tips = tr('feedback.technique.tips', { returnObjects: true }) as { title: string; text: string }[];
  return (
    <View style={{ gap: 8 }}>
      {tips.map((tip) => (
        <Card key={tip.title} style={{ gap: 4, borderLeftWidth: 4, borderLeftColor: t.colors.breathe }}>
          <AppText weight="800">{tip.title}</AppText>
          <AppText variant="small" muted>
            {tip.text}
          </AppText>
        </Card>
      ))}
    </View>
  );
}

function Summary({ workoutId, outcome }: { workoutId: string; outcome: FeedbackOutcome | null }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const workout = useHistoryStore((s) => s.workouts.find((w) => w.id === workoutId))!;
  const workouts = useHistoryStore((s) => s.workouts);
  const target = useTrainingStore((s) => s.training.dailyTarget);
  const preset = useTrainingStore((s) => s.training.durationPreset);
  const [shortened, setShortened] = useState(false);
  const daily = dailyProgress(workouts, toDateKey(), target);
  const outlook = outcome ? levelOutlook(outcome) : null;
  const shorter = shorterPreset(preset);

  return (
    <Screen footer={<Button label={tr('common.continue')} size="lg" variant="accent" onPress={goHome} />}>
      <AppText variant="h1" style={{ marginTop: 16 }}>
        {workout.isMicro ? tr('feedback.summary.microTitle') : tr('feedback.summary.title')}
      </AppText>
      <Card style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 }}>
        <Stat label={tr('feedback.duration')} value={formatDuration(workout.actualSec)} />
        <Stat label={tr('feedback.summary.contractions')} value={String(workout.contractions ?? 0)} />
        <Stat label={tr('feedback.summary.holdTotal')} value={tr('feedback.summary.sec', { count: Math.round(workout.holdSec ?? 0) })} />
        <Stat label={tr('feedback.summary.longest')} value={tr('feedback.summary.sec', { count: workout.longestHoldSec ?? 0 })} />
      </Card>

      {outcome && outlook ? (
        <Card style={{ gap: 8 }}>
          <AppText variant="small" weight="800" muted>
            {tr('feedback.summary.tomorrow')}
          </AppText>
          <AppText variant="h2">{tr(`feedback.outlook.${outlook}.title`, { from: outcome.before, to: outcome.after, level: outcome.after })}</AppText>
          <AppText muted>{tr(`feedback.outlook.${outlook}.body`, { level: outcome.after })}</AppText>
          {outlook === 'sameShorter' && shorter !== preset ? (
            shortened ? (
              <AppText weight="700" color={t.colors.success}>
                {tr('feedback.outlook.shortened', { preset: tr(`training.preset.${shorter}`) })}
              </AppText>
            ) : (
              <Button label={tr('feedback.outlook.shorten', { preset: tr(`training.preset.${shorter}`) })} variant="secondary" onPress={() => (useTrainingStore.getState().update({ durationPreset: shorter }), setShortened(true))} />
            )
          ) : null}
        </Card>
      ) : null}

      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText weight="800">{tr('feedback.summary.daily')}</AppText>
          <AppText weight="800">{tr('feedback.summary.dailyCount', { done: daily.done, target: daily.target })}</AppText>
        </View>
        <ProgressBar value={Math.min(1, daily.done / Math.max(1, daily.target))} accessibilityLabel={tr('feedback.summary.daily')} />
        <AppText variant="small" muted>
          {daily.reached ? tr('feedback.summary.dailyDone') : tr('feedback.summary.dailyLeft', { count: daily.target - daily.done })}
        </AppText>
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%', alignItems: 'center' }}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="small" muted center>
        {label}
      </AppText>
    </View>
  );
}
