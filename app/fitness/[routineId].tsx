import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, ProgressBar, ProgressRing, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { FitnessDemo, FitnessFigure } from '@/features/fitness/FitnessFigure';
import { motionAt, repsIn, type MoveSpec } from '@/features/fitness/motion';
import { getExercise, getMove, getRoutine, routineDurationSec, routinePhases, routineRounds, type FitnessExercise, type FitnessPhase, type RoutineStep } from '@/features/fitness/routines';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { activeTime, currentPhase, progress, remainingInPhase, type PlayerEvent, type PlayerState } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { formatDuration, toDateKey } from '@/lib/date';
import { goBack } from '@/lib/nav';
import { makeId } from '@/lib/random';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Kasık Fitness routine (big update 2026-11-22: "ilk açtığımda ne yapacağımı bilemedim"). Before
 * starting: how it works, then the moves by round (Isınma, Güç, Esneme); each opens to a moving figure,
 * the start position, numbered steps, a tip and the usual mistake. While playing: the figure moves at
 * the real tempo with a big word (KALDIR / TUT / İNDİR …), the rep, the side, and a short tap on every
 * step; the 15 s rest shows the next move already moving, with its steps.
 */
export default function FitnessRoutine() {
  const t = useTheme();
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const routine = getRoutine(routineId ?? '');
  const { t: tr } = useTranslation();
  const [started, setStarted] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  if (!routine) {
    return (
      <Screen>
        <Header />
        <AppText>{tr('fitness.notFound')}</AppText>
      </Screen>
    );
  }
  if (started) return <FitnessPlayer routineId={routine.id} />;
  const rounds = routineRounds(routine);
  const how = tr('fitness.how', { returnObjects: true }) as string[];
  return (
    <Screen footer={<Button label={tr('common.start')} size="lg" variant="accent" icon="play" onPress={() => setStarted(true)} testID="fitness-start" />}>
      <Header title={tr('fitness.routineTitle', { name: routine.name })} close />
      <AppText muted>{tr('fitness.overview', { count: routine.steps.length, rounds: rounds.length, min: Math.round(routineDurationSec(routine) / 60) })}</AppText>

      <Card style={{ padding: t.space.gutter, gap: t.space.sm }}>
        <AppText variant="bodyStrong">{tr('fitness.howTitle')}</AppText>
        {how.map((line, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-start' }}>
            <Icon name="check" size="sm" color={t.tokens.primary} />
            <AppText variant="callout" style={{ flex: 1 }}>
              {line}
            </AppText>
          </View>
        ))}
      </Card>

      {rounds.map((r) => (
        <View key={r.round} style={{ gap: t.space.sm }}>
          <View style={{ gap: 2, marginTop: t.space.sm }}>
            <AppText variant="title3" accessibilityRole="header">
              {tr('fitness.roundTitle', { n: r.round, name: tr(`fitness.rounds.${r.round}.name`) })}
            </AppText>
            <AppText variant="footnote" muted>
              {tr(`fitness.rounds.${r.round}.hint`)}
            </AppText>
          </View>
          {r.steps.map(({ step, index }) => (
            <MoveCard key={index} n={index + 1} step={step} open={open === index} onToggle={() => setOpen(open === index ? null : index)} />
          ))}
        </View>
      ))}
      <AppText variant="small" muted>
        {tr('fitness.safety')}
      </AppText>
    </Screen>
  );
}

/** "36 sn · 6 tekrar", "40 sn · her taraf 5 tekrar", "42 sn tut". */
function useStepMeta() {
  const { t: tr } = useTranslation();
  return (step: RoutineStep, move: MoveSpec | undefined) => {
    if (!move) return tr('fitness.metaWork', { sec: step.workSec });
    if (move.kind === 'hold') return tr('fitness.metaHold', { sec: step.workSec });
    const reps = repsIn(move, step.workSec * 1000);
    return move.sides ? tr('fitness.metaSides', { sec: step.workSec, reps }) : tr('fitness.metaReps', { sec: step.workSec, reps });
  };
}

/** A move in the list: name and timing; opens to the moving figure and how to do it. */
function MoveCard({ n, step, open, onToggle }: { n: number; step: RoutineStep; open: boolean; onToggle: () => void }) {
  const t = useTheme();
  const ex = getExercise(step.exerciseId)!;
  const move = getMove(step.exerciseId);
  const meta = useStepMeta();
  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: t.touch }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.tokens.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="footnote" weight="700" color={t.tokens.primary}>
            {n}
          </AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="700">{ex.name}</AppText>
          <AppText variant="small" muted>
            {meta(step, move)}
          </AppText>
        </View>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron" color={t.tokens.mutedForeground} size={18} />
        </View>
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
          {move ? (
            <View style={{ alignItems: 'center', borderRadius: t.radius.lg, backgroundColor: t.tokens.muted, paddingVertical: 8 }}>
              <FitnessDemo move={move} width={260} />
            </View>
          ) : null}
          <HowTo ex={ex} />
        </View>
      ) : null}
    </Card>
  );
}

/** Works · start position · numbered steps · tip · usual mistake. */
function HowTo({ ex, compact }: { ex: FitnessExercise; compact?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      {!compact ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="target" size="sm" color={t.tokens.primary} />
          <AppText variant="footnote" weight="600" color={t.tokens.primary} style={{ flex: 1 }}>
            {tr('fitness.works', { target: ex.target })}
          </AppText>
        </View>
      ) : null}
      <View style={{ gap: 2 }}>
        <AppText variant="footnote" weight="700" muted>
          {tr('fitness.setup')}
        </AppText>
        <AppText variant="callout">{ex.setup}</AppText>
      </View>
      <View style={{ gap: 6 }}>
        {ex.steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <AppText variant="callout" weight="700" color={t.tokens.primary} style={{ width: 18 }}>
              {i + 1}.
            </AppText>
            <AppText variant="callout" style={{ flex: 1 }}>
              {s}
            </AppText>
          </View>
        ))}
      </View>
      {!compact ? (
        <>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="bulb" size="sm" color={t.tokens.mutedForeground} />
            <AppText variant="footnote" muted style={{ flex: 1 }}>
              {ex.tip}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="alert" size="sm" color={t.tokens.destructive} />
            <AppText variant="footnote" style={{ flex: 1, color: t.tokens.destructive }}>
              {ex.mistake}
            </AppText>
          </View>
        </>
      ) : null}
    </View>
  );
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

  // Leaving the app pauses the routine (2026-11-24: the clock ran on and moves were missed on return).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && player.getState().status === 'running') {
        player.pause();
        cancelHaptics();
      }
    });
    return () => sub.remove();
  }, [player]);

  // "Bitir?" pauses the routine while it is open; "Devam" resumes it (2026-11-24: it kept running behind).
  const pausedForDialog = useRef(false);
  const askFinish = () => {
    pausedForDialog.current = player.getState().status === 'running';
    if (pausedForDialog.current) player.pause();
    setConfirm(true);
  };
  const keepGoing = () => {
    setConfirm(false);
    if (pausedForDialog.current) player.resume();
    pausedForDialog.current = false;
  };

  useEffect(() => {
    if (state.status === 'completed' && !saved.current) {
      saved.current = true;
      const sec = Math.round(activeTime(state, Date.now()) / 1000);
      // Logged when it ran to the end, or after at least 30 s when ended early (2026-11-23 fix).
      if (!state.endedEarly || sec >= 30) {
        useHistoryStore.getState().addFitnessLog({ id: makeId('f_'), date: toDateKey(), routineId, durationSec: sec });
      }
    }
  }, [state, routineId]);

  const phase = currentPhase(state);
  const ex = phase ? getExercise(phase.exerciseId) : undefined;
  const move = phase ? getMove(phase.exerciseId) : undefined;
  const step = phase && phase.exerciseIndex >= 0 ? routine.steps[phase.exerciseIndex] : routine.steps[0];
  const remain = remainingInPhase(state, now);
  const paused = state.status === 'paused';
  const working = phase?.kind === 'work';

  if (state.status === 'completed') {
    return (
      <Screen footer={<Button label={tr('common.done')} size="lg" variant="accent" onPress={() => goBack()} />}>
        <View style={{ alignItems: 'center', gap: 12, marginTop: 60 }}>
          <IconTile icon={state.endedEarly ? 'thumbsUp' : 'medal'} tone="kegel" size="lg" round />
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
            {step ? tr('fitness.roundTitle', { n: step.round, name: tr(`fitness.rounds.${step.round}.name`) }) : ''}
          </AppText>
          <AppText variant="small" muted>
            {tr('fitness.stepOf', { n: Math.max(1, (phase?.exerciseIndex ?? 0) + 1), total: routine.steps.length })}
          </AppText>
        </View>
        <ProgressBar value={progress(state, now)} accessibilityLabel={tr('player.progress')} />
      </View>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <AppText variant="h2" center accessibilityRole="header">
          {working ? ex?.name : tr('fitness.nextUp', { name: ex?.name ?? '' })}
        </AppText>
        {move && phase && step ? (
          working ? (
            <WorkView move={move} state={state} paused={paused} durationMs={phase.durationMs} strength={strength} remain={remain} />
          ) : (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <FitnessDemo move={move} width={240} paused={paused} />
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
        <Pressable accessibilityRole="button" accessibilityLabel={tr('player.finish')} onPress={askFinish} style={styles.icon}>
          <Icon name="stop" color={t.colors.text} size={28} />
        </Pressable>
      </View>
      <Dialog
        visible={confirm}
        title={tr('fitness.finishTitle')}
        onDismiss={keepGoing}
        actions={[
          { label: tr('player.finish'), variant: 'danger', onPress: () => ((pausedForDialog.current = false), setConfirm(false), player.finish()) },
          { label: tr('player.keepGoing'), onPress: keepGoing },
        ]}
      />
    </Screen>
  );
}

/**
 * While working: the figure at the real tempo (its own 40 ms clock, smoother than the player's tick),
 * the big word, rep and side, the seconds left. A light tap on every new word; a longer one at the
 * side change.
 */
function WorkView({ move, state, paused, durationMs, strength, remain }: { move: MoveSpec; state: PlayerState<FitnessPhase>; paused: boolean; durationMs: number; strength: 0 | 1 | 2 | 3; remain: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setClock(Date.now()), 40);
    return () => clearInterval(id);
  }, [paused]);
  // A paused player freezes its own time, so the clock value does not matter then.
  const elapsed = Math.max(0, durationMs - remainingInPhase(state, clock));
  const m = motionAt(move, elapsed, durationMs);
  const lastStep = useRef(m.stepKey);
  const lastSide = useRef(m.side);
  useEffect(() => {
    // A longer cue only for a real side change, not on every rep of an alternating move.
    if (m.side !== lastSide.current && !move.alternate) playCue('blockChange', strength);
    else if (m.stepKey !== lastStep.current) playCue('tap', strength);
    lastStep.current = m.stepKey;
    lastSide.current = m.side;
  }, [m.stepKey, m.side, strength, move.alternate]);
  const sideJustChanged = move.sides && !move.alternate && m.side === 2 && elapsed - durationMs / 2 < 2500;
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <FitnessFigure move={move} pose={m.pose} mirrored={m.side === 2} width={280} />
      <AppText variant="display" center color={t.colors.accent} accessibilityLiveRegion="polite" style={{ fontSize: 40, lineHeight: 48 }}>
        {tr(`fitness.tempo.${m.word}`)}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <AppText variant="callout" weight="700" muted>
          {move.kind === 'hold' ? tr('fitness.holdOn') : tr('fitness.rep', { rep: m.rep, reps: m.reps })}
        </AppText>
        {move.sides ? (
          <AppText variant="callout" weight="700" color={sideJustChanged ? t.colors.accent : t.tokens.mutedForeground}>
            {sideJustChanged ? tr('fitness.switchSide') : tr('fitness.side', { n: m.side })}
          </AppText>
        ) : null}
        <AppText variant="callout" weight="700" muted tabular>
          {tr('fitness.secLeft', { sec: Math.ceil(remain / 1000) })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  icon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  main: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
});
