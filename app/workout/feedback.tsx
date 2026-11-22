import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme, type IconName } from '@/components';
import { Button, Card, IconTile, Progress, ScalePressable, StatRow, uiHaptic } from '@/components/ui';
import { useStreak } from '@/features/gamification/service';
import { playCue } from '@/features/training/haptics';
import { submitFeedback, type FeedbackOutcome } from '@/features/training/service';
import { dailyProgress, levelOutlook } from '@/features/training/summary';
import { formatDuration, toDateKey } from '@/lib/date';
import { goHome } from '@/lib/nav';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { Feedback } from '@/types';

/** "Nasıldı?" choices (§7.5): neutral Lucide icons. */
const OPTIONS: { value: Feedback; icon: IconName }[] = [
  { value: 'easy', icon: 'feather' },
  { value: 'ok', icon: 'thumbsUp' },
  { value: 'hard', icon: 'mountain' },
  { value: 'failed', icon: 'circleSlash' },
];

const ACircle = Animated.createAnimatedComponent(Circle);

/**
 * Session end — ui-v3 (SPEC_UI_V3 §7.5). Top: the completion ring + "Tamamlandı" + three small stats.
 * Then two numbered questions, both required: "Nasıldı?" (four big cards, 2×2) and the technique. After saving: the
 * "Yarın: Seviye 1 → 2" row, the daily target and one primary "Bitir". Behaviour unchanged
 * (SPEC_KEGEL_V2 §7.5): feedback drives the level; micro sets skip the questions.
 */
export default function FeedbackScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useHistoryStore((s) => s.workouts.find((w) => w.id === id));
  const [choice, setChoice] = useState<Feedback | null>(null);
  const [technique, setTechnique] = useState<'sure' | 'unsure' | null>(null);
  const [outcome, setOutcome] = useState<FeedbackOutcome | null>(null);

  if (!workout) {
    return (
      <Screen footer={<Button label={tr('feedback.finish')} size="lg" onPress={goHome} fullWidth />}>
        <View />
      </Screen>
    );
  }

  const micro = Boolean(workout.isMicro);
  const asking = !outcome && !micro;
  const options = workout.completed ? OPTIONS : OPTIONS.filter((o) => o.value === 'hard' || o.value === 'failed');
  // Both questions must be answered before saving; the screen says so and counts the answers.
  const answered = (choice ? 1 : 0) + (technique ? 1 : 0);
  const ready = answered === 2;
  const submit = () => {
    if (!ready || !choice || !id) return;
    setOutcome(submitFeedback(id, choice, technique ?? undefined) ?? null);
  };

  return (
    <Screen
      contentStyle={{ gap: t.space.xxl }}
      footer={
        asking ? (
          <Button label={ready ? tr('feedback.submit') : tr('feedback.answerLeft', { done: answered })} size="lg" disabled={!ready} onPress={submit} fullWidth />
        ) : (
          <Button label={tr('feedback.finish')} size="lg" onPress={goHome} fullWidth />
        )
      }
    >
      <Completion completed={workout.completed} micro={micro} />
      <Card style={{ padding: t.space.lg }}>
        <StatRow
          stats={[
            { label: tr('feedback.duration'), value: formatDuration(workout.actualSec) },
            { label: tr('feedback.summary.contractions'), value: String(workout.contractions ?? 0) },
            { label: tr('feedback.summary.longest'), value: tr('feedback.summary.sec', { count: workout.longestHoldSec ?? 0 }) },
          ]}
        />
      </Card>

      {asking ? (
        <>
          <AppText variant="callout" weight="600" color={t.tokens.primary}>
            {tr('feedback.twoQuestions')}
          </AppText>
          <View style={{ gap: t.space.md }}>
            <StepHeader n={1} title={tr('feedback.howWas')} done={!!choice} />
            <View accessibilityRole="radiogroup" accessibilityLabel={tr('feedback.question')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md }}>
              {options.map((o) => (
                <BigChoice key={o.value} icon={o.icon} label={tr(`feedback.option.${o.value}.label`)} hint={tr(`feedback.option.${o.value}.hint`)} selected={choice === o.value} onPress={() => setChoice(o.value)} />
              ))}
            </View>
          </View>

          <View style={{ gap: t.space.md }}>
            <StepHeader n={2} title={tr('feedback.technique.question')} done={!!technique} />
            <View accessibilityRole="radiogroup" accessibilityLabel={tr('feedback.technique.question')} style={{ flexDirection: 'row', gap: t.space.md }}>
              {(['sure', 'unsure'] as const).map((v) => (
                <BigChoice key={v} compact icon={v === 'sure' ? 'target' : 'thought'} label={tr(`feedback.technique.${v}`)} selected={technique === v} onPress={() => setTechnique(v)} />
              ))}
            </View>
            {technique === 'unsure' ? <TechniqueTips /> : null}
          </View>
          <AppText variant="footnote" muted>
            {tr('feedback.note')}
          </AppText>
        </>
      ) : (
        <Outcome outcome={outcome} />
      )}
    </Screen>
  );
}

/** Completion ring that closes (static with "reduce motion"), a check, the title and the streak chip. */
function Completion({ completed, micro }: { completed: boolean; micro: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reduce = useReducedMotion();
  const streak = useStreak();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const today = toDateKey();
  const firstToday = useHistoryStore((s) => s.workouts.filter((w) => w.date === today && w.completed).length === 1);
  const size = 112;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(reduce ? 1 : 0);
  const pop = useSharedValue(reduce ? 1 : 0.6);
  useEffect(() => {
    if (!reduce) {
      p.value = withTiming(completed ? 1 : 0.6, { duration: 700, easing: Easing.out(Easing.cubic) });
      pop.value = withDelay(500, withSpring(1, { damping: 10, stiffness: 180 }));
    }
    const id = setTimeout(() => playCue('tap', strength), 600);
    return () => clearTimeout(id);
  }, [p, pop, reduce, completed, strength]);
  const arc = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  const check = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const title = micro ? tr('feedback.summary.microTitle') : completed ? tr('feedback.completeTitle') : tr('feedback.partialShort');
  return (
    <View style={{ alignItems: 'center', gap: t.space.md, marginTop: t.space.lg }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={title}>
        <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.tokens.muted} strokeWidth={stroke} fill="none" />
          <ACircle cx={size / 2} cy={size / 2} r={r} stroke={t.tokens.primary} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} animatedProps={arc} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </Svg>
        <Animated.View style={[{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }, check]}>
          <Icon name={completed ? 'check' : 'pause'} size={44} color={t.tokens.primary} strokeWidth={2.25} />
        </Animated.View>
      </View>
      <AppText variant="title1" center accessibilityRole="header">
        {title}
      </AppText>
      <View accessible accessibilityLabel={tr('today.streakA11y', { count: streak.current })} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs, height: 32, paddingHorizontal: t.space.md, borderRadius: t.radius.pill, backgroundColor: t.tokens.highlightSoft }}>
        <Icon name="flame" size="sm" color={t.tokens.highlight} />
        <AppText variant="footnote" tabular style={{ fontWeight: '600' }}>
          {tr('today.streakDays', { count: streak.current })}
        </AppText>
        {completed && firstToday ? (
          <AppText variant="footnote" muted>
            {tr('feedback.streakPlus')}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Header of one of the two questions: a numbered badge (1 / 2) that turns into a filled check once
 * answered, the question, and "Birini seç" → "Seçildi" under it, so it is clear there are two places
 * to choose and which one is still open.
 */
function StepHeader({ n, title, done }: { n: number; title: string; done: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const k = t.tokens;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }} accessible accessibilityRole="header" accessibilityLabel={`${tr('feedback.stepOf', { n })}. ${title}. ${done ? tr('feedback.picked') : tr('feedback.pickOne')}`}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? k.success : k.primarySoft,
          borderWidth: done ? 0 : t.border.medium,
          borderColor: k.primary,
        }}
      >
        {done ? (
          <Icon name="check" size={18} color={k.card} strokeWidth={2.5} />
        ) : (
          <AppText variant="callout" weight="700" color={k.primary}>
            {n}
          </AppText>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="title3">{title}</AppText>
        <AppText variant="footnote" weight="600" color={done ? k.success : k.mutedForeground}>
          {done ? tr('feedback.picked') : tr('feedback.pickOne')}
        </AppText>
      </View>
    </View>
  );
}

/** A big selection card: icon tile, label, optional hint; selected = soft fill + primary border + check. */
function BigChoice({ icon, label, hint, selected, onPress, compact }: { icon: IconName; label: string; hint?: string; selected: boolean; onPress: () => void; compact?: boolean }) {
  const t = useTheme();
  const k = t.tokens;
  return (
    <ScalePressable
      onPress={() => {
        if (!selected) uiHaptic('selection');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      style={{ flexBasis: '47%', flexGrow: 1, minHeight: compact ? 64 : 128, padding: t.space.lg, gap: t.space.sm, borderRadius: t.radius.lg, borderWidth: selected ? t.border.medium : t.border.thin, borderColor: selected ? k.primary : k.border, backgroundColor: selected ? k.primarySoft : k.card, flexDirection: compact ? 'row' : 'column', alignItems: compact ? 'center' : 'flex-start' }}
    >
      <IconTile icon={icon} background={selected ? k.card : undefined} />
      <View style={{ flex: compact ? 1 : undefined, gap: 2 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        {hint ? (
          <AppText variant="footnote" muted>
            {hint}
          </AppText>
        ) : null}
      </View>
      {selected ? (
        <View style={{ position: 'absolute', right: t.space.md, top: t.space.md }}>
          <Icon name="check" size="md" color={k.primary} />
        </View>
      ) : null}
    </ScalePressable>
  );
}

/** "Not sure about the technique" → short tips, in one list. */
function TechniqueTips() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const tips = tr('feedback.technique.tips', { returnObjects: true }) as { title: string; text: string }[];
  return (
    <Card style={{ paddingHorizontal: t.space.lg }}>
      {tips.map((tip, i) => (
        <View key={tip.title} style={{ gap: 2, paddingVertical: t.space.md, borderTopWidth: i ? t.border.thin : 0, borderTopColor: t.tokens.border }}>
          <AppText variant="bodyStrong">{tip.title}</AppText>
          <AppText variant="footnote" muted>
            {tip.text}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

/** After saving: tomorrow's level row and the daily target. */
function Outcome({ outcome }: { outcome: FeedbackOutcome | null }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const workouts = useHistoryStore((s) => s.workouts);
  const target = useTrainingStore((s) => s.training.dailyTarget);
  const daily = dailyProgress(workouts, toDateKey(), target);
  const outlook = outcome ? levelOutlook(outcome) : null;
  return (
    <View style={{ gap: t.space.md }}>
      {outcome && outlook ? (
        <Card style={{ padding: t.space.gutter, gap: t.space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
            <IconTile icon={outlook === 'up' ? 'trendUp' : outlook === 'down' ? 'trendDown' : 'calendar'} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" muted>
                {tr('feedback.tomorrowRow')}
              </AppText>
              <AppText variant="title3">{tr(`feedback.outlook.${outlook}.title`, { from: outcome.before, to: outcome.after, level: outcome.after })}</AppText>
            </View>
          </View>
          <AppText variant="callout" muted>
            {tr(`feedback.outlook.${outlook}.body`, { level: outcome.after })}
          </AppText>
        </Card>
      ) : null}

      <Card style={{ padding: t.space.gutter, gap: t.space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="bodyStrong">{tr('feedback.summary.daily')}</AppText>
          <AppText variant="bodyStrong" tabular>
            {tr('feedback.summary.dailyCount', { done: daily.done, target: daily.target })}
          </AppText>
        </View>
        <Progress value={daily.done / Math.max(1, daily.target)} label={tr('feedback.summary.daily')} />
        <AppText variant="footnote" muted>
          {daily.reached ? tr('feedback.summary.dailyDone') : tr('feedback.summary.dailyLeft', { count: daily.target - daily.done })}
        </AppText>
      </Card>
    </View>
  );
}
