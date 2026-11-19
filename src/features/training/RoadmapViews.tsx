import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Dialog, Icon, useTheme } from '@/components';
import { formatDuration, toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useKegelStore } from '@/stores/kegelStore';

import { generateSession } from './generateSession';
import { positionCard } from './player/playerUi';
import { deloadOnPlanDay, tasksForDay, type RoadmapNode } from './roadmap';
import { strengthFallingTwoWeeks } from './schedule';
import type { TrainingState, TrackId } from '@/types';

/** A node on the roadmap path: filled when done, a pulsing ring today, faded later (§8). */
export function DayNode({ node, size = 48, onPress }: { node: RoadmapNode; size?: number; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (node.state === 'today') pulse.value = withRepeat(withSequence(withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })), -1);
  }, [node.state, pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - pulse.value), transform: [{ scale: 1 + 0.45 * pulse.value }] }));
  const done = node.state === 'done';
  const today = node.state === 'today';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tr(done ? 'training.dayDone' : today ? 'training.dayToday' : 'training.dayTodo', { day: node.day + 1 })}
      hitSlop={6}
      style={{ width: Math.max(48, size), height: Math.max(48, size), alignItems: 'center', justifyContent: 'center' }}
    >
      {today ? <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: t.colors.accent }, ring]} /> : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? t.colors.accent : today ? t.colors.surface : t.colors.surfaceAlt,
          borderWidth: today ? 3 : 0,
          borderColor: t.colors.accent,
          opacity: node.state === 'future' ? 0.55 : 1,
        }}
      >
        {done ? (
          <Icon name="check" color={t.colors.accentText} size={20} strokeWidth={3} />
        ) : (
          <AppText weight={today ? '800' : '600'} muted={!today}>
            {node.day + 1}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

/** Tap a day → its session: blocks, length, positions and a small preview (§8). */
export function DayPreview({ visible, day, week, training, onClose }: { visible: boolean; day: number; week: number; training: TrainingState; onClose: () => void }) {
  const { t: tr } = useTranslation();
  const hypertonic = useKegelStore((s) => s.profile?.hypertonicFlag ?? false);
  const falling = useHistoryStore((h) => strengthFallingTwoWeeks(h.strengthTests));
  // Same deload rule as the real session (plan week 4, or an early deload this week).
  const deload = deloadOnPlanDay(training, toDateKey(), day, falling);
  const s = generateSession({ track: training.track, level: training.level, durationPreset: training.durationPreset, dayIndex: day, weekIndex: week, hypertonic, seed: `preview-${day}`, deload });
  const positions = [...new Set(s.blocks.map((b) => b.position))];
  return (
    <Dialog visible={visible} title={tr('training.preview.title', { day: day + 1 })} onDismiss={onClose} actions={[{ label: tr('common.close'), variant: 'primary', onPress: onClose }]}>
      <View style={{ gap: 6 }}>
        <AppText weight="700">
          {tr('training.preview.meta', { time: formatDuration(s.plannedSec), count: s.contractions })}
          {s.deload ? ` · ${tr('today.workout.deload')}` : ''}
        </AppText>
        <AppText variant="small" muted>
          {positions.map((p) => `${positionCard(p).emoji} ${positionCard(p).title}`).join('  ·  ')}
        </AppText>
        {s.blocks.map((b, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <AppText variant="small">
              {positionCard(b.position).emoji} {tr(`exercise.${b.type}.name`)} ×{b.reps}
            </AppText>
            <AppText variant="small" muted>
              {b.slowSec ? tr('player.nextSlow', { slow: b.slowSec, top: (b.holdSec ?? 0) - b.slowSec }) : b.holdSec !== undefined ? tr('player.nextDetail', { hold: b.holdSec, rest: b.restSec }) : tr('player.nextRelease')}
            </AppText>
          </View>
        ))}
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
    <Card style={{ gap: 8 }}>
      <AppText variant="h3">{tr('training.functional.title')}</AppText>
      <AppText variant="small" muted>
        {tr('training.functional.hint')}
      </AppText>
      {tasks.map((task) => {
        const on = done.some((d) => d.date === today && d.taskId === task.id && d.done);
        return (
          <Pressable
            key={task.id}
            onPress={() => useKegelStore.getState().setFunctionalTask(today, task.id, !on)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${task.title}. ${task.text}`}
            style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: t.radius.md, backgroundColor: on ? t.colors.surfaceAlt : 'transparent', opacity: pressed ? 0.8 : 1 })}
          >
            <AppText variant="h2">{task.emoji}</AppText>
            <View style={{ flex: 1 }}>
              <AppText weight="700" style={on ? { textDecorationLine: 'line-through' } : undefined}>
                {task.title}
              </AppText>
              <AppText variant="small" muted>
                {task.text}
              </AppText>
            </View>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: on ? t.colors.success : t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>{on ? <Icon name="check" color="#FFFFFF" size={16} /> : null}</View>
          </Pressable>
        );
      })}
    </Card>
  );
}
