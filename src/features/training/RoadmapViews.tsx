import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useLive } from '@/lib/useLive';
import { AppText, Icon, useTheme } from '@/components';
import { Card, Dialog, IconTile, ScalePressable } from '@/components/ui';
import { formatDuration, toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useKegelStore } from '@/stores/kegelStore';

import { generateSession } from './generateSession';
import { absoluteDay, cycleMoves, learnedMoves, plannedLearned, roundMoves } from './moves';
import { isCycle, todayPlanPosition } from './plan';
import { blockText } from './player/playerUi';
import { deloadOnPlanDay, tasksForDay, type RoadmapNode } from './roadmap';
import { strengthFallingTwoWeeks } from './schedule';
import type { TrainingState, TrackId } from '@/types';

/**
 * A day on the plan path (SPEC_UI_V3 §7.3): done = primary fill + check, today = primary ring with a
 * light pulse (static with "reduce motion"), later = muted with the day number. 44 px, 48 px touch area.
 */
export function DayNode({ node, size = 44, onPress, deload }: { node: RoadmapNode; size?: number; onPress: () => void; deload?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reduce = useReducedMotion();
  const live = useLive();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!live) {
      cancelAnimation(pulse);
      return;
    }
    if (node.state === 'today' && !reduce) pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })), -1);
  }, [node.state, pulse, reduce, live]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - pulse.value), transform: [{ scale: 1 + 0.3 * pulse.value }] }));
  const done = node.state === 'done';
  const today = node.state === 'today';
  const k = t.tokens;
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tr(done ? 'training.dayDone' : today ? 'training.dayToday' : 'training.dayTodo', { day: node.day + 1 })}${deload ? `, ${tr('training.deloadDay')}` : ''}`}
      hitSlop={Math.max(0, (t.touch - size) / 2)}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {today ? <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: t.radius.pill, borderWidth: t.border.thick, borderColor: k.primary }, ring]} /> : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: t.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? k.primary : today ? k.card : k.muted,
          borderWidth: today ? t.border.thick : 0,
          borderColor: k.primary,
        }}
      >
        {done ? (
          <Icon name="check" color={k.primaryForeground} size="md" strokeWidth={2.5} />
        ) : (
          <AppText variant="footnote" tabular style={{ fontWeight: today ? '600' : '500', color: today ? k.foreground : k.mutedForeground }}>
            {node.day + 1}
          </AppText>
        )}
      </View>
      {deload && !done ? (
        <View style={{ position: 'absolute', right: -2, top: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: k.card, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="leaf" size={12} color={t.tone.mind.fg} />
        </View>
      ) : null}
    </ScalePressable>
  );
}

/** Tap a day → its session (§8): the blocks as a numbered vertical stepper. */
export function DayPreview({ visible, day, cycle = false, week, training, onClose }: { visible: boolean; day: number; cycle?: boolean; week: number; training: TrainingState; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const falling = useHistoryStore((h) => strengthFallingTwoWeeks(h.strengthTests));
  // Same lighter-week rule as the real session (plan week 4, or an early deload this week).
  const deload = deloadOnPlanDay(training, toDateKey(), day, falling, cycle);
  // Tur 1 of that day with the moves learned by then: today's real ones, other days as planned. A cycle
  // day (after the 180 days) has its own moves, from the moves learned so far.
  const today = toDateKey();
  const pos = todayPlanPosition(training, today);
  const abs = cycle ? 0 : absoluteDay(1, day);
  const isToday = cycle ? isCycle(pos.planNumber) && pos.planDay === day : !isCycle(pos.planNumber) && pos.planDay === day;
  const learned = isToday || cycle ? learnedMoves(training) : plannedLearned(abs);
  const moves = cycle ? cycleMoves(learned.length ? learned : plannedLearned(Number.MAX_SAFE_INTEGER), day, 1) : roundMoves(learned, abs, 1);
  const s = generateSession({ level: training.level, dayIndex: day, weekIndex: week, seed: `preview-${cycle ? 'c' : ''}${day}`, deload, moves });
  return (
    <Dialog
      visible={visible}
      title={cycle ? tr('training.cycleDayLabel', { day: day + 1 }) : tr('training.preview.title', { day: day + 1 })}
      description={`${tr('training.preview.meta', { time: formatDuration(s.plannedSec), count: s.contractions })}${s.deload ? ` · ${tr('today.workout.deload')}` : ''}`}
      onClose={onClose}
      actions={[{ label: tr('common.close'), variant: 'secondary', onPress: onClose }]}
    >
      <View style={{ gap: t.space.md }}>
        <View accessibilityRole="list">
          {s.blocks.map((b, i) => {
            const last = i === s.blocks.length - 1;
            const { title, detail } = blockText(b, tr);
            const tone = b.type === 'release' || b.type === 'breath' ? t.tone.mind : t.tone.kegel;
            return (
              <View key={i} style={{ flexDirection: 'row', gap: t.space.md }} accessible accessibilityLabel={`${i + 1}. ${title}. ${detail}`}>
                <View style={{ alignItems: 'center', width: 28 }}>
                  <View style={{ width: 28, height: 28, borderRadius: t.radius.pill, backgroundColor: tone.soft, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="caption" tabular style={{ fontWeight: '600', color: tone.fg }}>
                      {i + 1}
                    </AppText>
                  </View>
                  {!last ? <View style={{ flex: 1, width: t.border.thin, backgroundColor: t.tokens.border, marginVertical: 2 }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: last ? 0 : t.space.md, gap: 2 }}>
                  <AppText variant="bodyStrong">{title}</AppText>
                  <AppText variant="footnote" muted>
                    {detail}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Dialog>
  );
}

/** Functional everyday tasks for today (from week 6), ticked with one tap (§5, §8). */
export function FunctionalTasksCard({ track, weekIndex }: { track: TrackId; weekIndex: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const today = toDateKey();
  const tasks = tasksForDay(track, weekIndex, today);
  const done = useKegelStore((s) => s.functionalTasks);
  if (!tasks.length) return null;
  return (
    <View style={{ gap: t.space.md }}>
      <View style={{ gap: t.space.xs }}>
        <AppText variant="title2" accessibilityRole="header">
          {tr('training.functional.title')}
        </AppText>
        <AppText variant="footnote" muted>
          {tr('training.functional.hint')}
        </AppText>
      </View>
      <Card style={{ paddingHorizontal: t.space.lg }}>
        {tasks.map((task, i) => {
          const on = done.some((d) => d.date === today && d.taskId === task.id && d.done);
          return (
            <ScalePressable
              key={task.id}
              onPress={() => useKegelStore.getState().setFunctionalTask(today, task.id, !on)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${task.title}. ${task.text}`}
              style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md, borderTopWidth: i ? t.border.thin : 0, borderTopColor: t.tokens.border }}
            >
              <IconTile icon={task.icon} tone={task.tone ?? 'kegel'} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" style={{ color: on ? t.tokens.mutedForeground : t.tokens.foreground }}>
                  {task.title}
                </AppText>
                <AppText variant="footnote" muted>
                  {task.text}
                </AppText>
              </View>
              <View style={{ width: 24, height: 24, borderRadius: t.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.tokens.primary : 'transparent', borderWidth: t.border.medium, borderColor: on ? t.tokens.primary : t.tokens.subtle }}>
                {on ? <Icon name="check" size={14} color={t.tokens.primaryForeground} /> : null}
              </View>
            </ScalePressable>
          );
        })}
      </Card>
    </View>
  );
}
