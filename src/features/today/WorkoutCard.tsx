import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Button, Card, IconTile, Ring, ScalePressable, Sheet } from '@/components/ui';
import { PLAN_LENGTH_DAYS } from '@/config/app';
import { appImage } from '@/content/images';
import { generateMicroSet } from '@/features/training/generateSession';
import { todayPlanDay } from '@/features/training/plan';
import { blockText } from '@/features/training/player/playerUi';
import { capStatus, isOnVacation } from '@/features/training/schedule';
import { buildTodaySession, contractionsToday } from '@/features/training/service';
import type { SessionBlock } from '@/features/training/types';
import { useSessionStarter } from '@/features/training/useSessionStarter';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { KegelExerciseType } from '@/types';

import { PhotoBackground } from './PhotoCard';
import { workoutCoverId } from './weekdayCover';

/** Neutral icon per exercise (Lucide). */
const BLOCK_ICON: Record<KegelExerciseType, IconName> = { slow_hold: 'clock', quick_flick: 'pulse', max_contraction: 'target', elevator: 'layers', endurance: 'clock', knack: 'wind', release: 'leaf', breath: 'wind' };

/**
 * Today's Kegel card — ui-v3 (SPEC_UI_V3 §7.1): one layer. Day / track kicker, title, the daily target
 * ring, the duration control, a one-line summary (the exercises open in a sheet), the primary "Başla"
 * and two small secondary actions (micro set, breathing). Behaviour unchanged (SPEC_KEGEL_V2 §6.2, §6.3,
 * §11.5): micro set, daily target, the contraction cap ("enough for today" → release session), notices.
 */
export function WorkoutCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const workouts = useHistoryStore((s) => s.workouts);
  const painFlag = useKegelStore((s) => s.profile?.painFlag ?? false);
  const [blocksOpen, setBlocksOpen] = useState(false);
  const todays = workouts.filter((w) => w.date === today);
  const doneCount = todays.filter((w) => w.completed).length;
  const mainDone = todays.some((w) => w.completed && !w.isMicro);
  const session = buildTodaySession(training, today);
  const micro = generateMicroSet({ level: training.level, seed: `${today}-micro` });
  const used = contractionsToday(workouts, today);
  const cap = capStatus(used, training.level);
  const day = todayPlanDay(training, today) + 1;
  const onVacation = isOnVacation(today, training.vacation);
  const blocks = session.blocks;
  const minutes = Math.max(1, Math.round(session.plannedSec / 60));
  const target = training.dailyTarget;

  const { go, dialog } = useSessionStarter();
  // Cover photo (user request 2026-11-23): a couple on a bed, sharp at the top and blurred towards the
  // bottom (baked into the file), with a dark veil so the white text stays readable in both themes.
  // A different photo every weekday: Monday 1 … Sunday 7, then Monday 1 again.
  const cover = appImage(workoutCoverId(new Date()));
  const fg = cover ? t.focus.text : undefined;
  const soft = cover ? t.focus.icon : t.tokens.mutedForeground;

  const notices: { key: string; text: string; tone: 'alert' | 'info' }[] = [];
  if (training.returnNotice && training.returnNotice.date === today) notices.push({ key: 'return', text: tr(`kegel.return.${training.returnNotice.kind}`, { count: training.returnNotice.days }), tone: 'info' });
  if (onVacation) notices.push({ key: 'vacation', text: tr('kegel.vacation.cardNote'), tone: 'info' });
  if (painFlag) notices.push({ key: 'pain', text: tr('kegel.painNotice'), tone: 'alert' });
  if (training.repeatNextDay && !mainDone) notices.push({ key: 'repeat', text: tr('today.workout.repeat'), tone: 'info' });
  if (cap.locked) notices.push({ key: 'cap', text: tr('today.workout.capReached'), tone: 'info' });

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {cover ? <PhotoBackground image={cover} id="workoutVeil" /> : null}
      <View style={{ padding: t.space.gutter, gap: t.space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
          <View style={{ flex: 1, gap: t.space.xs }}>
            <AppText variant="caption" muted={!cover} color={cover ? soft : undefined}>
              {tr('today.workout.dayKicker', { day, total: PLAN_LENGTH_DAYS })}
              {session.deload ? ` · ${tr('today.workout.deload')}` : ''}
            </AppText>
            <AppText variant="title2" accessibilityRole="header" color={fg}>
              {mainDone ? tr('today.workout.doneTitle') : tr('today.workout.title')}
            </AppText>
          </View>
          <Ring size={56} label="" center={`${Math.min(doneCount, target)}/${target}`} value={doneCount / Math.max(1, target)} trackColor={cover ? t.veil.bold : undefined} textColor={fg} />
        </View>

        {/* Room for the photo between the title and the actions. */}
        {cover ? <View style={{ height: 150 }} /> : null}

        <ScalePressable
          onPress={() => setBlocksOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${tr('today.workout.summary', { count: blocks.length, min: minutes })}. ${tr('today.workout.summaryA11y')}`}
          style={{ minHeight: t.touch, flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}
        >
          <Icon name="layers" size="md" color={soft} />
          <AppText variant="callout" muted={!cover} color={fg} style={{ flex: 1 }}>
            {tr('today.workout.summary', { count: blocks.length, min: minutes })}
          </AppText>
          <Icon name="chevron" size="md" color={cover ? soft : t.tokens.subtle} />
        </ScalePressable>

        {notices.length ? (
          <View style={{ gap: t.space.sm }}>
            {notices.map((n) => (
              <View key={n.key} style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-start' }} accessibilityRole={n.tone === 'alert' ? 'alert' : undefined}>
                <Icon name={n.tone === 'alert' ? 'alert' : 'info'} size="sm" color={n.tone === 'alert' ? t.tokens.destructive : soft} />
                <AppText variant="footnote" style={{ flex: 1, color: n.tone === 'alert' ? t.tokens.destructive : (fg ?? t.tokens.mutedForeground) }}>
                  {n.text}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ gap: t.space.sm }}>
          {mainDone ? (
            <Button label={tr('today.workout.again')} variant="secondary" icon="play" size="lg" onPress={() => go(today, session.contractions)} fullWidth />
          ) : (
            <Button label={tr('common.start')} size="lg" icon="play" onPress={() => go(today, session.contractions)} testID="start-workout" fullWidth />
          )}
          {/* The "Nefes · 1 dk" button was removed (user request 2026-11-22); the micro set stays. */}
          <Button label={tr('today.workout.microShort')} accessibilityHint={tr('today.workout.microHint', { sec: micro.plannedSec })} icon="pulse" variant="secondary" size="sm" onPress={() => go('micro', micro.contractions)} fullWidth />
        </View>

        <Sheet visible={blocksOpen} onClose={() => setBlocksOpen(false)} title={tr('today.workout.contents')} description={tr('today.workout.contentsCount', { count: blocks.length })}>
          <View accessibilityRole="list">
            {blocks.map((b, i) => (
              <Animated.View key={`${session.id}-${i}`} entering={FadeInDown.delay(Math.min(i, t.motion.staggerMax) * t.motion.stagger).duration(t.motion.normal).reduceMotion(ReduceMotion.System)}>
                <BlockRow block={b} divider={i > 0} />
              </Animated.View>
            ))}
          </View>
        </Sheet>

        {dialog}
      </View>
    </Card>
  );
}

/** One exercise row: icon tile, name and reps, timing and position. */
function BlockRow({ block, divider }: { block: SessionBlock; divider?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { title, detail } = blockText(block, tr);
  const calm = block.type === 'release' || block.type === 'breath';
  return (
    <View
      accessibilityRole="text"
      accessible
      accessibilityLabel={`${title}. ${detail}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md, borderTopWidth: divider ? t.border.thin : 0, borderTopColor: t.tokens.border }}
    >
      <IconTile icon={BLOCK_ICON[block.type]} tone={calm ? 'mind' : 'kegel'} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="footnote" muted>
          {detail}
        </AppText>
      </View>
    </View>
  );
}
