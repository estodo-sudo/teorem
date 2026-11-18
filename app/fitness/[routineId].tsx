import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, ProgressBar, ProgressRing, Screen, useTheme } from '@/components';
import { PostureArt } from '@/features/fitness/PostureArt';
import { getExercise, getRoutine, routineDurationSec, routinePhases, type FitnessPhase } from '@/features/fitness/routines';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { activeTime, currentPhase, progress, remainingInPhase, type PlayerEvent } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { formatDuration, toDateKey } from '@/lib/date';
import { makeId } from '@/lib/random';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { goBack } from '@/lib/nav';

export default function FitnessRoutine() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const routine = getRoutine(routineId ?? '');
  const { t: tr } = useTranslation();
  const [started, setStarted] = useState(false);
  if (!routine) {
    return (
      <Screen>
        <Header />
        <AppText>{tr('fitness.notFound')}</AppText>
      </Screen>
    );
  }
  if (!started) {
    return (
      <Screen footer={<Button label={tr('common.start')} size="lg" variant="accent" icon="play" onPress={() => setStarted(true)} />}>
        <Header title={tr('fitness.routineTitle', { name: routine.name })} close />
        <AppText muted>{tr('fitness.overview', { count: routine.steps.length, min: Math.round(routineDurationSec(routine) / 60) })}</AppText>
        {routine.steps.map((s, i) => {
          const ex = getExercise(s.exerciseId)!;
          return (
            <Card key={`${s.exerciseId}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppText weight="800" muted style={{ width: 22 }}>
                {i + 1}
              </AppText>
              <View style={{ flex: 1 }}>
                <AppText weight="700">{ex.name}</AppText>
                <AppText variant="small" muted>
                  {s.restSec > 0 ? tr('fitness.stepMeta', { work: s.workSec, rest: s.restSec }) : tr('fitness.stepMetaLast', { work: s.workSec })}
                </AppText>
              </View>
            </Card>
          );
        })}
        <AppText variant="small" muted>
          {tr('fitness.safety')}
        </AppText>
      </Screen>
    );
  }
  return <FitnessPlayer routineId={routine.id} />;
}

function FitnessPlayer({ routineId }: { routineId: string }) {
  useSafeKeepAwake();
  const t = useTheme();
  const { t: tr } = useTranslation();
  const routine = getRoutine(routineId)!;
  const phases = useMemo(() => routinePhases(routine), [routine]);
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const [confirm, setConfirm] = useState(false);
  const saved = useRef(false);
  const onEvents = useCallback(
    (events: PlayerEvent<FitnessPhase>[]) => {
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
    player.start();
    return () => cancelHaptics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status === 'completed' && !saved.current) {
      saved.current = true;
      const sec = Math.round(activeTime(state, Date.now()) / 1000);
      if (sec >= 30) {
        useHistoryStore.getState().addFitnessLog({ id: makeId('f_'), date: toDateKey(), routineId, durationSec: sec });
      }
    }
  }, [state, routineId]);

  const phase = currentPhase(state);
  const ex = phase ? getExercise(phase.exerciseId) : undefined;
  const nextWork = phases.slice(state.index + 1).find((p) => p.kind === 'work' && p.exerciseIndex !== phase?.exerciseIndex);
  const nextEx = nextWork ? getExercise(nextWork.exerciseId) : undefined;
  const remain = remainingInPhase(state, now);
  const ringValue = phase ? remain / phase.durationMs : 0;
  const paused = state.status === 'paused';

  if (state.status === 'completed') {
    return (
      <Screen footer={<Button label={tr('common.done')} size="lg" variant="accent" onPress={() => goBack()} />}>
        <View style={{ alignItems: 'center', gap: 12, marginTop: 60 }}>
          <AppText variant="display">{state.endedEarly ? '👍' : '🏅'}</AppText>
          <AppText variant="h1" center>
            {state.endedEarly ? tr('fitness.partial') : tr('fitness.done')}
          </AppText>
          <AppText muted center>
            {tr('fitness.doneMeta', { time: formatDuration(activeTime(state, now) / 1000) })}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="small" weight="700" color={t.colors.accent}>
            {phase?.kind === 'work' ? tr('fitness.work') : phase?.kind === 'rest' ? tr('fitness.rest') : tr('player.getReady')}
          </AppText>
          <AppText variant="small" muted>
            {tr('fitness.stepOf', { n: Math.max(1, (phase?.exerciseIndex ?? 0) + 1), total: routine.steps.length })}
          </AppText>
        </View>
        <ProgressBar value={progress(state, now)} accessibilityLabel={tr('player.progress')} />
      </View>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <AppText variant="h1" center>
          {phase?.kind === 'work' ? ex?.name : tr('fitness.nextUp', { name: ex?.name ?? '' })}
        </AppText>
        {ex ? <PostureArt posture={ex.posture} size={130} /> : null}
      </View>
      <View style={{ alignItems: 'center' }}>
        <ProgressRing size={150} stroke={12} value={ringValue} color={phase?.kind === 'work' ? t.colors.accent : t.colors.breathe}>
          <AppText variant="display" accessibilityLiveRegion="polite">
            {Math.ceil(remain / 1000)}
          </AppText>
        </ProgressRing>
      </View>
      {ex ? (
        <Card style={{ gap: 4 }}>
          <AppText>{ex.desc}</AppText>
          <AppText variant="small" muted>
            💡 {ex.cue}
          </AppText>
        </Card>
      ) : null}
      {nextEx && phase?.kind === 'work' ? (
        <AppText variant="small" muted center>
          {tr('fitness.next', { name: nextEx.name })}
        </AppText>
      ) : null}
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('player.skip')} onPress={player.skip} style={styles.icon}>
          <Icon name="skip" color={t.colors.text} size={28} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? tr('player.resume') : tr('player.pause')}
          onPress={paused ? player.resume : player.pause}
          style={[styles.main, { backgroundColor: t.colors.accent }]}
        >
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
