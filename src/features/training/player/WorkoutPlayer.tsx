import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AppText, Dialog, Icon, ProgressBar, useTheme, type IconName } from '@/components';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useSettingsStore } from '@/stores/settingsStore';

import { cueForPhase } from '../hapticPatterns';
import { cancelHaptics, playCue } from '../haptics';
import { playSound, prepareSounds, releaseSounds, soundForPhaseStart } from '../sounds';
import type { GeneratedSession, Phase } from '../types';
import { BreathCircle } from './BreathCircle';
import { activeTime, currentPhase, exerciseOutcomes, progress, remainingInPhase, type PlayerEvent } from './machine';
import { usePlayer } from './usePlayer';

export interface PlayerResult {
  actualSec: number;
  endedEarly: boolean;
  outcomes: { completed: boolean; skipped: boolean }[];
}

interface Props {
  session: GeneratedSession;
  onDone: (result: PlayerResult) => void;
  /** Hide skip/finish controls (tutorial trial). */
  minimal?: boolean;
  /** Force words visible (tutorial) regardless of discreet setting. */
  forceLabels?: boolean;
}

export function WorkoutPlayer({ session, onDone, minimal, forceLabels }: Props) {
  useSafeKeepAwake();
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width } = useWindowDimensions();
  const settings = useSettingsStore((s) => s.settings);
  const discreet = settings.discreetPlayer && !forceLabels;
  const doneRef = useRef(false);
  const [interrupted, setInterrupted] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (settings.soundCues) prepareSounds();
    return () => {
      cancelHaptics();
      releaseSounds();
    };
  }, [settings.soundCues]);

  const onEvents = useCallback(
    (events: PlayerEvent<Phase>[]) => {
      const strength = settings.hapticStrength;
      for (const e of events) {
        if (e.type === 'phaseStart') {
          const cue = cueForPhase(e.phase);
          if (cue) playCue(cue, strength);
          if (settings.soundCues && e.phase.durationMs >= 1000) {
            const snd = soundForPhaseStart(e.phase.kind, e.phase.stage);
            if (snd) playSound(snd);
          }
        } else if (e.type === 'second') {
          // Light tick each second while holding a squeeze (not on stage changes).
          if (e.phase.kind === 'contract' && e.phase.durationMs >= 2000 && e.second * 1000 < e.phase.durationMs) {
            playCue('contractTick', strength);
          }
          if (e.phase.kind === 'countdown') playCue('countdownTick', strength);
        } else if (e.type === 'exerciseComplete') {
          playCue('exerciseEnd', strength);
        } else if (e.type === 'completed') {
          if (!e.endedEarly) {
            playCue('sessionEnd', strength);
            if (settings.soundCues) playSound('done');
          }
        }
      }
    },
    [settings.hapticStrength, settings.soundCues],
  );

  const player = usePlayer(session.phases, onEvents);
  const { state, now } = player;

  // Auto-start on mount.
  useEffect(() => {
    player.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Report completion exactly once.
  useEffect(() => {
    if (state.status === 'completed' && !doneRef.current) {
      doneRef.current = true;
      onDone({
        actualSec: Math.round(activeTime(state, Date.now()) / 1000),
        endedEarly: state.endedEarly,
        outcomes: exerciseOutcomes(state, session.exercises.length),
      });
    }
  }, [state, onDone, session.exercises.length]);

  // Auto-pause when the app goes to background; ask on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const s = player.getState();
      if (next !== 'active' && s.status === 'running') {
        player.pause();
        cancelHaptics();
        setInterrupted(true);
      }
    });
    return () => sub.remove();
  }, [player]);

  const phase = currentPhase(state) ?? session.phases[session.phases.length - 1]!;
  const exercise = phase.exerciseIndex >= 0 ? session.exercises[phase.exerciseIndex] : undefined;
  const remainingMs = remainingInPhase(state, now);
  const circleSize = Math.min(width * 0.68, 300);
  const visual = useMemo(() => phaseVisual(phase, t.colors), [phase, t.colors]);

  const label = phaseLabel(phase, tr);
  const exerciseName =
    phase.kind === 'countdown'
      ? tr('player.getReady')
      : phase.kind === 'transition' && phase.nextType
        ? tr('player.next', { name: tr(`exercise.${phase.nextType}.name`) })
        : exercise
          ? tr(`exercise.${exercise.type}.name`)
          : '';
  const counter =
    phase.rep > 0
      ? phase.sets > 1
        ? tr('player.setRep', { set: phase.set, sets: phase.sets, rep: phase.rep, reps: phase.reps })
        : exercise?.type === 'pulse'
          ? tr('player.block', { rep: phase.rep, reps: phase.reps })
          : tr('player.rep', { rep: phase.rep, reps: phase.reps })
      : '';
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const paused = state.status === 'paused';

  return (
    <View style={styles.flex}>
      {/* Top: exercise, counter, overall progress */}
      <View style={{ gap: 8 }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            {!discreet ? (
              <AppText variant="h3" numberOfLines={1}>
                {exerciseName}
              </AppText>
            ) : null}
            {!discreet && counter ? (
              <AppText muted accessibilityLiveRegion="polite">
                {counter}
              </AppText>
            ) : null}
          </View>
          <IconButton icon="help" label={tr('player.help')} onPress={() => setHelpOpen(true)} color={t.colors.textMuted} />
        </View>
        <ProgressBar value={progress(state, now)} accessibilityLabel={tr('player.progress')} />
      </View>

      {/* Center: circle */}
      <View style={styles.center} accessible accessibilityLabel={`${label}. ${secondsLeft}`} accessibilityLiveRegion="assertive">
        <BreathCircle
          size={circleSize}
          target={visual.scale}
          durationMs={visual.animMs(phase.durationMs)}
          color={paused ? t.colors.locked : visual.color}
          animKey={state.index}
          ringColor={t.colors.border}
        />
        <View style={[StyleSheet.absoluteFill, styles.centerText]} pointerEvents="none">
          {phase.durationMs >= 1000 && !paused ? (
            <AppText variant="display" color="#FFFFFF" center style={styles.shadow}>
              {secondsLeft}
            </AppText>
          ) : null}
        </View>
      </View>
      <View style={{ minHeight: 64, justifyContent: 'center' }}>
        {!discreet ? (
          <AppText variant="display" center color={paused ? t.colors.textMuted : visual.color === t.colors.relax ? t.colors.text : visual.color}>
            {paused ? tr('player.paused') : label}
          </AppText>
        ) : null}
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {!minimal ? (
          <IconButton icon="skip" label={tr('player.skip')} onPress={player.skip} color={t.colors.text} />
        ) : (
          <View style={{ width: 64 }} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? tr('player.resume') : tr('player.pause')}
          onPress={paused ? player.resume : player.pause}
          style={({ pressed }) => [
            styles.mainBtn,
            { backgroundColor: t.colors.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Icon name={paused ? 'play' : 'pause'} color={t.colors.accentText} size={34} />
        </Pressable>
        {!minimal ? (
          <IconButton icon="stop" label={tr('player.finish')} onPress={() => setConfirmFinish(true)} color={t.colors.text} />
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      <Dialog
        visible={interrupted}
        title={tr('player.interruptedTitle')}
        message={tr('player.interruptedBody')}
        actions={[
          {
            label: tr('player.resume'),
            variant: 'accent',
            onPress: () => {
              setInterrupted(false);
              player.resume();
            },
          },
          {
            label: tr('player.restart'),
            onPress: () => {
              setInterrupted(false);
              player.start();
            },
          },
          {
            label: tr('player.finish'),
            variant: 'ghost',
            onPress: () => {
              setInterrupted(false);
              player.finish();
            },
          },
        ]}
      />
      <Dialog
        visible={confirmFinish}
        title={tr('player.finishTitle')}
        message={tr('player.finishBody')}
        onDismiss={() => setConfirmFinish(false)}
        actions={[
          { label: tr('player.finish'), variant: 'danger', onPress: () => (setConfirmFinish(false), player.finish()) },
          { label: tr('player.keepGoing'), onPress: () => setConfirmFinish(false) },
        ]}
      />
      <Dialog
        visible={helpOpen}
        title={tr('player.helpTitle')}
        onDismiss={() => setHelpOpen(false)}
        actions={[{ label: tr('common.done'), variant: 'primary', onPress: () => setHelpOpen(false) }]}
      >
        <View style={{ gap: 8 }}>
          {(tr('player.helpTips', { returnObjects: true }) as string[]).map((tip) => (
            <AppText key={tip}>• {tip}</AppText>
          ))}
          <View style={[styles.warn, { backgroundColor: t.dark ? '#3A2414' : '#FFF1E6', borderRadius: t.radius.md }]}>
            <AppText weight="700" color={t.colors.danger}>
              {tr('player.painWarning')}
            </AppText>
          </View>
        </View>
      </Dialog>
    </View>
  );
}

function IconButton({ icon, label, onPress, color }: { icon: IconName; label: string; onPress: () => void; color: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} color={color} size={28} />
    </Pressable>
  );
}

function phaseLabel(phase: Phase, tr: TFunction): string {
  if (phase.kind === 'contract' && phase.stage) return tr('player.stage', { stage: phase.stage });
  return tr(`player.phase.${phase.kind}`);
}

interface Visual {
  scale: number;
  color: string;
  animMs: (durationMs: number) => number;
}

function phaseVisual(phase: Phase, c: { contract: string; relax: string; breathe: string; primary: string }): Visual {
  const quick = (d: number) => Math.min(d * 0.8, 900);
  switch (phase.kind) {
    case 'contract':
      if (phase.stage) return { scale: [0.72, 0.86, 1][phase.stage - 1]!, color: c.contract, animMs: () => 600 };
      return { scale: 1, color: c.contract, animMs: quick };
    case 'release':
      return { scale: phase.stage === 2 ? 0.86 : 0.72, color: c.contract, animMs: () => 600 };
    case 'relax':
    case 'rest':
      return { scale: 0.55, color: c.relax, animMs: quick };
    case 'inhale':
      return { scale: 1, color: c.breathe, animMs: (d) => d };
    case 'exhale':
      return { scale: 0.55, color: c.breathe, animMs: (d) => d };
    case 'countdown':
    case 'transition':
    default:
      return { scale: 0.62, color: c.primary, animMs: () => 500 };
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'space-between' },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  centerText: { alignItems: 'center', justifyContent: 'center' },
  shadow: { textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12 },
  mainBtn: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  warn: { padding: 12, marginTop: 4 },
});
