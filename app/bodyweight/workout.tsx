import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, ProgressBar, ProgressRing, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { getCategory, getExercise, getProgram } from '@/features/bodyweight/catalog';
import { dayPlan, workoutPhases, type WorkoutPhase } from '@/features/bodyweight/program';
import { HowTo, WorkView } from '@/features/bodyweight/ui';
import { FitnessDemo } from '@/features/fitness/FitnessFigure';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { activeTime, currentPhase, progress, remainingInPhase, type PlayerEvent } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { formatDuration, toDateKey } from '@/lib/date';
import { goBack } from '@/lib/nav';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useBodyweightStore } from '@/stores/bodyweightStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Aletsiz Fitness workout player: a 5 s countdown, then each round's moves. While working, the figure
 * moves at the real tempo with the big word, rep, side and seconds left; in the rests the next move
 * already moves, with its start position and steps. Finishing marks the day done.
 */
export default function BodyweightWorkout() {
  useSafeKeepAwake();
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { category, day: dayParam, routine } = useLocalSearchParams<{ category: string; day?: string; routine?: string }>();
  const c = getCategory(category ?? '');
  const isRoutine = routine === '1' && Boolean(c?.routine);
  const progressRec = useBodyweightStore((s) => (c ? s.active[c.id] : undefined));
  const program = c && progressRec && !isRoutine ? getProgram(c, progressRec.programId) : undefined;
  const day = Number(dayParam);
  const plan = program && day > 0 ? dayPlan(program, day) : undefined;
  const workout = isRoutine ? c?.routine : plan?.kind === 'workout' ? plan.workout : undefined;
  const phases = useMemo(() => (workout ? workoutPhases(workout) : []), [workout]);
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const [confirm, setConfirm] = useState(false);
  const saved = useRef(false);

  const onEvents = useCallback(
    (events: PlayerEvent<WorkoutPhase>[]) => {
      for (const e of events) {
        if (e.type === 'phaseStart') playCue(e.phase.kind === 'work' ? 'contractStart' : 'relaxStart', strength);
        else if (e.type === 'second' && e.phase.kind !== 'work' && e.phase.durationMs - e.second * 1000 <= 3000 && e.phase.durationMs - e.second * 1000 > 0) playCue('countdownTick', strength);
        else if (e.type === 'completed' && !e.endedEarly) playCue('sessionEnd', strength);
      }
    },
    [strength],
  );
  const player = usePlayer(phases, onEvents);
  const { state, now } = player;
  useEffect(() => {
    if (phases.length) player.start();
    return () => cancelHaptics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status === 'completed' && !state.endedEarly && !saved.current && c && !isRoutine) {
      saved.current = true;
      useBodyweightStore.getState().completeDay(c.id, day, toDateKey());
    }
  }, [state.status, state.endedEarly, c, day, isRoutine]);

  if (!c || !workout) {
    return (
      <Screen>
        <Header />
        <AppText>{tr('bodyweight.notFound')}</AppText>
      </Screen>
    );
  }

  if (state.status === 'completed') {
    return (
      <Screen footer={<Button label={tr('common.done')} size="lg" variant="accent" onPress={() => goBack()} />}>
        <View style={{ alignItems: 'center', gap: 12, marginTop: 60 }}>
          <IconTile icon={state.endedEarly ? 'thumbsUp' : 'medal'} tone="campus" size="lg" round />
          <AppText variant="h1" center>
            {state.endedEarly ? tr('bodyweight.partial') : isRoutine ? tr('bodyweight.warmupDoneTitle') : tr('bodyweight.doneTitle', { day })}
          </AppText>
          <AppText muted center>
            {isRoutine ? (state.endedEarly ? null : tr('bodyweight.warmupDoneBody')) : state.endedEarly ? tr('bodyweight.partialBody') : tr('bodyweight.doneBody')}
          </AppText>
          <AppText muted center>
            {tr('fitness.doneMeta', { time: formatDuration(activeTime(state, now) / 1000) })}
          </AppText>
        </View>
      </Screen>
    );
  }

  const phase = currentPhase(state);
  const ex = phase ? getExercise(c, phase.exerciseId) : undefined;
  const move = phase ? c.moves[phase.exerciseId] : undefined;
  const remain = remainingInPhase(state, now);
  const paused = state.status === 'paused';
  const working = phase?.kind === 'work';
  const moveNo = phase ? (Math.max(0, phase.exerciseIndex) % workout.moves.length) + 1 : 1;

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="small" weight="700" color={t.colors.accent}>
            {isRoutine ? tr(`bodyweight.categories.${c.id}`) : tr('bodyweight.roundOf', { r: Math.min(phase?.round ?? 1, workout.rounds), n: workout.rounds })}
          </AppText>
          <AppText variant="small" muted>
            {tr('bodyweight.moveOf', { k: moveNo, n: workout.moves.length })}
          </AppText>
        </View>
        <ProgressBar value={progress(state, now)} accessibilityLabel={tr('player.progress')} />
      </View>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <AppText variant="h2" center accessibilityRole="header">
          {working ? ex?.name : tr('fitness.nextUp', { name: ex?.name ?? '' })}
        </AppText>
        {move && phase ? (
          working ? (
            <WorkView move={move} state={state} paused={paused} durationMs={phase.durationMs} strength={strength} remain={remain} />
          ) : (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <FitnessDemo move={move} width={250} paused={paused} />
              <ProgressRing size={84} stroke={8} value={phase.durationMs ? remain / phase.durationMs : 0} color={t.colors.breathe}>
                <AppText variant="h2" accessibilityLiveRegion="polite">
                  {Math.ceil(remain / 1000)}
                </AppText>
              </ProgressRing>
              <AppText variant="small" muted center>
                {phase.kind === 'rest' ? tr('fitness.restHint') : tr('fitness.getReadyHint')}
              </AppText>
            </View>
          )
        ) : null}
        {ex ? (
          <Card style={{ padding: 14, gap: 4 }}>
            <HowTo ex={ex} compact={working} />
          </Card>
        ) : null}
      </ScrollView>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('player.skip')} onPress={phase && phase.kind !== 'work' ? player.skipPhase : player.skip} style={styles.icon}>
          <Icon name="skip" color={t.colors.text} size={28} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={paused ? tr('player.resume') : tr('player.pause')} onPress={paused ? player.resume : player.pause} style={[styles.main, { backgroundColor: t.colors.accent }]}>
          <Icon name={paused ? 'play' : 'pause'} color={t.colors.accentText} size={30} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('player.finish')} onPress={() => setConfirm(true)} style={styles.icon}>
          <Icon name="stop" color={t.colors.text} size={28} />
        </Pressable>
      </View>
      <Dialog
        visible={confirm}
        title={tr('fitness.finishTitle')}
        onDismiss={() => setConfirm(false)}
        actions={[
          { label: tr('player.finish'), variant: 'danger', onPress: () => (setConfirm(false), player.finish()) },
          { label: tr('player.keepGoing'), onPress: () => setConfirm(false) },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  icon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  main: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
});
