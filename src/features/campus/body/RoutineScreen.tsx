import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Dialog, Header, ProgressBar, ProgressRing, Screen, useTheme } from '@/components';
import { tint } from '@/features/campus/shared/ui';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { currentPhase, exerciseOutcomes, progress, remainingInPhase, type PlayerEvent, type PlayerState } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { goBack } from '@/lib/nav';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useCampusStore } from '@/stores/campusStore';
import { useSettingsStore } from '@/stores/settingsStore';

import { BODY } from './content';
import { buildTimeline, routineMinutes, type BodyId, type Phase } from './logic';
import { ExerciseRow, ExerciseSteps, useDosage } from './ui';

/** Guided daily routine: an overview, then each exercise with a get-ready / hold / rest timer. */
export function BodyRoutineScreen({ id }: { id: BodyId }) {
  const { t: tr } = useTranslation();
  const c = BODY[id];
  const [started, setStarted] = useState(false);
  const back = () => goBack(`/campus/${id}`);

  if (!started) {
    return (
      <Screen footer={<Button label={tr('body.routine.start')} icon="play" size="lg" variant="accent" onPress={() => setStarted(true)} />}>
        <Header title={tr('body.routine.title')} close onBack={back} />
        <AppText variant="h2" accessibilityRole="header">
          {tr('body.routine.overview', {
            count: c.exercises.length,
            minutes: routineMinutes(c.exercises),
          })}
        </AppText>
        <AppText muted>{tr('body.routine.overviewHint')}</AppText>
        <View style={{ gap: 8 }}>
          {c.exercises.map((e, i) => (
            <ExerciseRow key={e.id} ex={e} n={i + 1} />
          ))}
        </View>
      </Screen>
    );
  }
  return <RoutinePlayer id={id} onExit={back} />;
}

function RoutinePlayer({ id, onExit }: { id: BodyId; onExit: () => void }) {
  useSafeKeepAwake();
  const t = useTheme();
  const { t: tr } = useTranslation();
  const dose = useDosage();
  const c = BODY[id];
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const phases = useMemo(() => buildTimeline(c.exercises), [c.exercises]);
  const [result, setResult] = useState<{ done: number; total: number } | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const onEvents = useCallback(
    (events: PlayerEvent<Phase>[], state: PlayerState<Phase>) => {
      for (const e of events) {
        if (e.type === 'phaseStart') {
          if (e.phase.kind === 'hold') playCue('contractStart', strength);
          else if (e.phase.kind === 'rest') playCue('relaxStart', strength);
          else playCue('tap', strength);
        } else if (e.type === 'second' && e.phase.kind === 'prep' && e.second > 0) {
          playCue('countdownTick', strength);
        } else if (e.type === 'completed') {
          const done = exerciseOutcomes(state, c.exercises.length).filter((o) => o.completed).length;
          if (done > 0) useCampusStore.getState().logBodySession(id, done, c.exercises.length);
          if (!e.endedEarly) playCue('sessionEnd', strength);
          setResult({ done, total: c.exercises.length });
        }
      }
    },
    [strength, c.exercises.length, id],
  );
  const player = usePlayer(phases, onEvents);
  const { state, now } = player;
  useEffect(() => {
    player.start();
    return () => cancelHaptics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (result) {
    const full = result.done === result.total;
    return (
      <Screen footer={<Button label={tr('body.routine.back')} size="lg" variant="primary" onPress={onExit} />}>
        <Header title={tr('body.routine.title')} close onBack={onExit} />
        <View style={{ alignItems: 'center', gap: 10, marginTop: 40 }}>
          <AppText variant="display">{full ? '🎉' : result.done > 0 ? '👏' : '🌱'}</AppText>
          <AppText variant="h1" center accessibilityRole="header">
            {full ? tr('body.routine.doneTitle') : tr('body.routine.partialTitle')}
          </AppText>
          <AppText muted center>
            {result.done > 0
              ? tr('body.routine.doneBody', {
                  done: result.done,
                  total: result.total,
                })
              : tr('body.routine.noneBody')}
          </AppText>
          {result.done > 0 && result.done * 2 < result.total ? (
            <AppText variant="small" muted center>
              {tr('body.routine.halfNote')}
            </AppText>
          ) : null}
        </View>
      </Screen>
    );
  }

  const phase = currentPhase(state);
  if (!phase) return null;
  const ex = c.exercises[phase.exerciseIndex]!;
  const leftMs = remainingInPhase(state, now);
  const left = Math.ceil(leftMs / 1000);
  const phaseFrac = phase.durationMs ? 1 - leftMs / phase.durationMs : 1;
  const paused = state.status === 'paused';
  const color = phase.kind === 'hold' ? t.colors.accent : phase.kind === 'rest' ? t.colors.success : t.colors.primary;
  const label = phase.kind === 'hold' ? tr('body.routine.hold') : phase.kind === 'rest' ? tr('body.routine.rest') : tr('body.routine.prep');
  const sideLabel = phase.side === null ? null : phase.side === 0 ? tr('body.routine.side1') : tr('body.routine.side2');

  return (
    <Screen
      scroll={false}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label={paused ? tr('body.routine.resume') : tr('body.routine.pause')} icon={paused ? 'play' : 'pause'} variant="secondary" onPress={paused ? player.resume : player.pause} style={{ flex: 1 }} />
          <Button label={tr('body.routine.skip')} icon="skip" variant="secondary" onPress={player.skip} style={{ flex: 1 }} />
        </View>
      }
    >
      <Header
        title={tr('body.routine.exOf', {
          n: phase.exerciseIndex + 1,
          total: c.exercises.length,
        })}
        close
        onBack={() => {
          player.pause();
          setConfirmEnd(true);
        }}
      />
      <ProgressBar value={progress(state, now)} height={6} accessibilityLabel={tr('body.routine.progress')} />
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <AppText variant="h1" center accessibilityRole="header">
            {ex.emoji} {ex.title}
          </AppText>
          <AppText variant="small" muted center>
            {dose(ex)}
          </AppText>
        </View>

        <View style={{ alignItems: 'center', gap: 10 }}>
          <ProgressRing size={190} stroke={14} value={phaseFrac} color={color} trackColor={tint(color, '26')}>
            <View style={{ alignItems: 'center' }} accessible accessibilityLiveRegion="polite" accessibilityLabel={`${label} ${left}`}>
              <AppText variant="tiny" weight="800" color={color} style={{ letterSpacing: 1 }}>
                {label.toLocaleUpperCase('tr')}
              </AppText>
              <AppText variant="display" style={{ fontSize: 56, lineHeight: 64 }}>
                {left}
              </AppText>
              {phase.kind !== 'prep' && ex.reps > 1 ? (
                <AppText variant="small" weight="700" muted>
                  {tr('body.routine.rep', { n: phase.rep, total: ex.reps })}
                </AppText>
              ) : null}
            </View>
          </ProgressRing>
          {sideLabel ? (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: t.radius.pill,
                backgroundColor: tint(t.colors.primary, '1A'),
              }}
            >
              <AppText variant="small" weight="800" color={t.colors.primary}>
                {sideLabel}
              </AppText>
            </View>
          ) : null}
          {paused ? (
            <AppText weight="800" color={t.colors.warning}>
              {tr('body.routine.paused')}
            </AppText>
          ) : null}
        </View>

        <View
          style={{
            padding: 14,
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <ExerciseSteps ex={ex} />
        </View>
        <AppText variant="tiny" muted center>
          {tr('body.routine.painNote')}
        </AppText>
      </ScrollView>

      <Dialog
        visible={confirmEnd}
        title={tr('body.routine.endTitle')}
        message={tr('body.routine.endBody')}
        onDismiss={() => {
          setConfirmEnd(false);
          player.resume();
        }}
        actions={[
          {
            label: tr('body.routine.endConfirm'),
            variant: 'danger',
            onPress: () => {
              setConfirmEnd(false);
              player.finish();
            },
          },
          {
            label: tr('body.routine.endCancel'),
            variant: 'ghost',
            onPress: () => {
              setConfirmEnd(false);
              player.resume();
            },
          },
        ]}
      />
    </Screen>
  );
}
