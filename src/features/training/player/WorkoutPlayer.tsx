import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AppText, Dialog, Icon, useTheme, type IconName } from '@/components';
import { lightTheme } from '@/config/theme';
import { IconTile } from '@/components/ui';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ExerciseType, KegelExerciseType, Position } from '@/types';

import { cancelHaptics, playCue, vibrateForPhase } from '../haptics';
import { NEW_MOVE_TYPES } from '../moves';
import { playSound, prepareSounds, releaseSounds, soundForPhaseStart } from '../sounds';
import type { GeneratedSession, Phase, SessionBlock } from '../types';
import { findTurkishVoice, speak, stopSpeech, voiceKeyForPhase } from '../voice';
import { activeTime, currentPhase, exerciseOutcomes, remainingInPhase, type PlayerEvent } from './machine';
import { MuscleSphere } from './MuscleSphere';
import { blockSegments, blockText, cueText, displaySeconds, firstPosition, isFast, nextPreview, positionCard, segmentFill } from './playerUi';
import { usePlayerGestures } from './usePlayerGestures';
import { sphereWord } from './sphereMotion';
import { usePlayer } from './usePlayer';

/** Neutral position icons (ui-v3): lying, sitting, standing, functional (everyday). */
const POSITION_ICON: Record<Position, IconName> = { lying: 'bed', sitting: 'chair', standing: 'body', functional: 'pulse' };

export interface PlayerResult {
  actualSec: number;
  endedEarly: boolean;
  outcomes: { completed: boolean; skipped: boolean }[];
  /** Times the user paused (Kegel v2 difficulty signal). */
  pauses?: number;
  /** Ended with the pain / discomfort button: go on with release only, or stop for today. */
  pain?: 'release' | 'end';
}

interface Props {
  session: GeneratedSession;
  onDone: (result: PlayerResult) => void;
  /** Hide skip/finish/pain controls (tutorial trial). */
  minimal?: boolean;
  /** Force words visible (tutorial) regardless of discreet setting. */
  forceLabels?: boolean;
  /** Pain button pressed: store the report; returns whether to suggest an expert. */
  onPainReport?: () => { refer: boolean };
  /** "Stop if it hurts" shown with the start card (a pain answer in the screening). */
  painNotice?: string;
}

/**
 * Kegel player v2 (SPEC_KEGEL_V2 §7.1, §7.3), ui-v3 dark focus look (SPEC_UI_V3 §7.4): segmented block bar, block name and rep counter,
 * position icon; the Kas Küresi in the middle; a rotating technique cue and large controls below.
 * Gestures: tap anywhere = pause / resume, hold 1 s = "finish?", swipe left = skip block (asks once),
 * double tap = black screen (only vibration and optional sound stay). The pain button stops at once.
 */
export function WorkoutPlayer({ session, onDone, minimal, forceLabels, onPainReport, painNotice }: Props) {
  useSafeKeepAwake();
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width, height } = useWindowDimensions();
  const settings = useSettingsStore((s) => s.settings);
  const discreet = settings.discreetPlayer && !forceLabels;
  const doneRef = useRef(false);
  const [interrupted, setInterrupted] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const skipConfirmed = useRef(false);
  /** A dialog (skip, finish, help) paused a running player: closing it resumes; a pause the user made stays. */
  const pausedForDialog = useRef(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [black, setBlack] = useState(false);
  const [pain, setPain] = useState<{ refer: boolean } | null>(null);
  const screenReader = useRef(false);

  useEffect(() => {
    if (settings.soundCues) prepareSounds();
    return () => {
      cancelHaptics();
      releaseSounds();
    };
  }, [settings.soundCues]);

  useEffect(() => {
    if (settings.voiceCoach) void findTurkishVoice();
    return () => stopSpeech();
  }, [settings.voiceCoach]);

  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then((on) => (screenReader.current = on));
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', (on) => (screenReader.current = on));
    return () => sub.remove();
  }, []);

  const onEvents = useCallback(
    (events: PlayerEvent<Phase>[]) => {
      const strength = settings.hapticStrength;
      for (const e of events) {
        if (e.type === 'phaseStart') {
          const type = e.phase.exerciseIndex >= 0 ? session.exercises[e.phase.exerciseIndex]?.type : undefined;
          // Vibrate exactly while squeezing (continuous for a hold, 1 s on / 1 s off for quick ones);
          // let-go, rest and "Dinlen" phases are silent. The countdown keeps its light ticks.
          if (e.phase.kind === 'countdown') playCue('countdownTick', strength);
          else vibrateForPhase(e.phase, strength);
          if (settings.voiceCoach) {
            const key = e.phase.kind === 'transition' ? null : voiceKeyForPhase(e.phase, type);
            if (key) speak(tr(`player.voice.${key}`));
            else if (e.phase.kind === 'transition' && e.phase.nextType) speak(tr('player.next', { name: tr(`exercise.${e.phase.nextType}.name`) }));
          }
          if (settings.soundCues && e.phase.durationMs >= 1000) {
            const snd = soundForPhaseStart(e.phase.kind, e.phase.stage, e.phase.variant, e.phase.level, e.phase.fromLevel);
            if (snd) playSound(snd);
          }
          // Screen readers announce each phase (§17: usable without the animation).
          if (screenReader.current && e.phase.durationMs >= 1500) AccessibilityInfo.announceForAccessibility(phaseLabel(e.phase, tr, 0, type));
        } else if (e.type === 'second') {
          // 3-2-1 countdown: a light tick on every number.
          if (e.phase.kind === 'countdown') playCue('countdownTick', strength);
        } else if (e.type === 'completed') {
          if (!e.endedEarly) {
            playCue('sessionEnd', strength);
            if (settings.soundCues) playSound('done');
          }
        }
      }
    },
    [settings.hapticStrength, settings.soundCues, settings.voiceCoach, session.exercises, tr],
  );

  const player = usePlayer(session.phases, onEvents);
  const { state, now } = player;
  const painChoice = useRef<PlayerResult['pain']>(undefined);

  // Auto-start on mount.
  useEffect(() => {
    player.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pauses are a difficulty signal for Kegel v2 (adjustLevel).
  const pausesRef = useRef(0);
  const prevStatus = useRef(state.status);
  useEffect(() => {
    if (prevStatus.current === 'running' && state.status === 'paused') cancelHaptics();
    // Resumed mid-squeeze: vibrate for the rest of it.
    if (prevStatus.current === 'paused' && state.status === 'running') {
      const ph = currentPhase(state);
      if (ph) vibrateForPhase(ph, settings.hapticStrength, ph.durationMs - remainingInPhase(state, Date.now()));
    }
    if (state.status === 'completed' && state.endedEarly) cancelHaptics();
    prevStatus.current = state.status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // Report completion exactly once.
  useEffect(() => {
    if (state.status === 'completed' && !doneRef.current) {
      doneRef.current = true;
      const result: PlayerResult = {
        actualSec: Math.round(activeTime(state, Date.now()) / 1000),
        endedEarly: state.endedEarly,
        outcomes: exerciseOutcomes(state, session.exercises.length),
        pauses: pausesRef.current,
        ...(painChoice.current ? { pain: painChoice.current } : {}),
      };
      // A finished session lets the ring close and the sphere glow out before the summary (§7.2).
      if (state.endedEarly) onDone(result);
      else setTimeout(() => onDone(result), 900);
    }
  }, [state, onDone, session.exercises.length]);

  // Background: pause automatically; on return ask "continue / restart the block / finish" (§7.3).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const s = player.getState();
      if (next !== 'active' && s.status === 'running') {
        player.pause();
        cancelHaptics();
        stopSpeech();
        setInterrupted(true);
      }
    });
    return () => sub.remove();
  }, [player]);

  const phase = currentPhase(state) ?? session.phases[session.phases.length - 1]!;
  const block: SessionBlock | undefined = phase.exerciseIndex >= 0 ? session.blocks[phase.exerciseIndex] : undefined;
  const exercise = phase.exerciseIndex >= 0 ? session.exercises[phase.exerciseIndex] : undefined;
  const remainingMs = remainingInPhase(state, now);
  const elapsedMs = phase.durationMs - remainingMs;
  const paused = state.status === 'paused';
  const running = state.status === 'running';
  const sphereSize = Math.min(width * 0.9, height * 0.5, 380);
  // "Dinlen" right away when the muscle was already let go (after hızlı sık-bırak / yavaş sıkma).
  const afterLetGo = phase.kind === 'transition' && session.phases[state.index - 1]?.kind === 'relax';
  const label = afterLetGo ? tr('player.phase.rest') : phaseLabel(phase, tr, elapsedMs, exercise?.type);
  // v1 colouring: squeeze colour while squeezing (also the slow release), plain text colour when relaxing.
  // Hızlı sık-bırak and yavaş sıkma count down the whole exercise; a hold or "Dinlen" its own seconds.
  // The step-by-step moves of the 180-day plan count down the whole exercise too (their steps are short);
  // Yarım Uzun Tutma is one long hold, so it counts its own seconds like uzun sıkma.
  const wholeBlock = phase.kind !== 'transition' && (exercise?.type === 'quick_flick' || exercise?.type === 'elevator' || (!!exercise && NEW_MOVE_TYPES.has(exercise.type as KegelExerciseType) && exercise.type !== 'half_hold'));
  const secondsLeft = displaySeconds(session.phases, state.index, remainingMs, wholeBlock);
  const fastRun = wholeBlock || isFast(phase);
  // The ring runs over the whole exercise for hızlı sık-bırak and yavaş sıkma (no spin on each short step).
  const ringRange = useMemo(() => {
    if (!wholeBlock) return undefined;
    let start = -1;
    let total = 0;
    session.phases.forEach((p, i) => {
      if (p.exerciseIndex !== phase.exerciseIndex || p.kind === 'transition') return;
      if (start < 0) start = state.startOffsets[i] ?? 0;
      total += p.durationMs;
    });
    if (start < 0 || total <= 0) return undefined;
    const at = (state.startOffsets[state.index] ?? 0) - start;
    return { from: Math.min(1, (at + Math.min(phase.durationMs, elapsedMs)) / total), to: Math.min(1, (at + phase.durationMs) / total) };
    // Recomputed per phase (and on pause / resume through the sphere's own effect).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, state.status, wholeBlock]);
  const posMs = (state.startOffsets[state.index] ?? state.totalMs) + Math.min(phase.durationMs, elapsedMs);
  const segments = useMemo(() => blockSegments(session.phases), [session.phases]);
  const fills = segmentFill(segments, state.status === 'completed' && !state.endedEarly ? state.totalMs : posMs);
  const preview = nextPreview(session, phase);
  const blockName = phase.kind === 'countdown' ? tr('player.getReady') : preview ? tr('player.next', { name: tr(`exercise.${preview.block.type}.name`) }) : exercise ? tr(`exercise.${exercise.type}.name`) : '';
  const roundLabel = session.isMicro ? '' : tr('player.round', { n: session.round });
  const counter = [roundLabel, phase.rep > 0 && phase.reps > 1 && phase.kind !== 'transition' ? tr('player.rep', { rep: phase.rep, reps: phase.reps }) : ''].filter(Boolean).join(' · ');
  const cue = !discreet && phase.kind !== 'countdown' && phase.kind !== 'transition' ? cueText(block, phase.kind, posMs) : null;
  const position = block?.position ?? firstPosition(session);

  const toggle = useCallback(() => {
    const s = player.getState();
    if (s.status === 'running') {
      // Only the user's own pauses are a difficulty signal (not the skip dialog or leaving the app).
      pausesRef.current += 1;
      player.pause();
      cancelHaptics();
      stopSpeech();
    } else if (s.status === 'paused') player.resume();
  }, [player]);
  const holdForDialog = useCallback(() => {
    pausedForDialog.current = player.getState().status === 'running';
    if (pausedForDialog.current) {
      player.pause();
      cancelHaptics();
      stopSpeech();
    }
  }, [player]);
  const releaseDialog = useCallback(() => {
    if (pausedForDialog.current) player.resume();
    pausedForDialog.current = false;
  }, [player]);
  // Skip forward (2026-11-23 fix): during "Dinlen" or the start countdown it only ends the wait and the
  // coming exercise starts at once (it used to jump over that whole exercise and mark it skipped).
  // During an exercise it skips the rest of it; that asks once per session.
  const askSkip = useCallback(() => {
    if (minimal) return;
    const s = player.getState();
    const ph = currentPhase(s);
    if (ph && (ph.kind === 'transition' || ph.kind === 'countdown')) return player.skipPhase();
    if (skipConfirmed.current) return player.skip();
    holdForDialog();
    setConfirmSkip(true);
  }, [minimal, player, holdForDialog]);
  const closeSkip = useCallback(
    (skip: boolean) => {
      setConfirmSkip(false);
      if (skip) {
        skipConfirmed.current = true;
        player.skip();
      }
      releaseDialog();
    },
    [player, releaseDialog],
  );
  // "Antrenmanı bitir?" and the help used to leave the session running behind them (2026-11-23 fix).
  const askFinish = useCallback(() => {
    if (minimal) return;
    holdForDialog();
    setConfirmFinish(true);
  }, [minimal, holdForDialog]);
  const closeFinish = useCallback(
    (end: boolean) => {
      setConfirmFinish(false);
      if (end) {
        pausedForDialog.current = false;
        return player.finish();
      }
      releaseDialog();
    },
    [player, releaseDialog],
  );
  const openHelp = useCallback(() => {
    holdForDialog();
    setHelpOpen(true);
  }, [holdForDialog]);
  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    releaseDialog();
  }, [releaseDialog]);
  const endWithPain = (choice: 'release' | 'end') => {
    painChoice.current = choice;
    setPain(null);
    player.finish();
  };

  // Gesture layer: tap / double tap / hold 1 s / swipe left on the whole screen.
  // Black screen (2026-11-25): only with "Gizli mod" on in Training settings, never in the tutorial's
  // trial sets. Otherwise someone who does not know it sees a sudden black screen and thinks the app
  // broke; there a double tap is simply a tap. On the black screen a clear notice says how to leave.
  const blackAllowed = !minimal && settings.discreetPlayer;
  const [notice, setNotice] = useState(0);
  const showNotice = () => setNotice((n) => n + 1);
  const pan = usePlayerGestures({
    onTap: () => {
      toggle();
      if (black) showNotice();
    },
    onDoubleTap: blackAllowed
      ? () => {
          setBlack((b) => !b);
          showNotice();
        }
      : toggle,
    onLongPress: askFinish,
    onSwipeLeft: askSkip,
  });

  const f = t.player;
  const colors = { neutral: f.idle, accent: f.orbEdge, cool: f.relax, breath: t.tokens.breathe, ring: f.text, track: f.track, paused: f.paused, glow: f.glow, highlight: f.orbCenter, halo: f.halo, gap: f.bg };
  const overall = state.totalMs > 0 ? Math.min(1, (state.status === 'completed' ? state.totalMs : posMs) / state.totalMs) : 0;

  return (
    <View style={styles.flex} {...pan.panHandlers} accessibilityHint={tr(minimal ? 'player.gestureHintTrial' : 'player.gestureHint')}>
      {/* Top: thin segmented bar; block name + rep counter; position and help icons (44 px each). The pain button was removed (user request 2026-11-22). */}
      <View style={{ gap: t.space.md }}>
        <SegmentBar fills={fills} active={segments.findIndex((s) => s.exerciseIndex === phase.exerciseIndex)} color={f.text} track={f.track} label={tr('player.progress')} />
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            {!discreet ? (
              <AppText variant="title3" color={f.text}>
                {blockName}
              </AppText>
            ) : null}
            {!discreet && counter ? (
              <AppText variant="footnote" tabular color={f.dim} accessibilityLiveRegion="polite">
                {counter}
              </AppText>
            ) : null}
          </View>
          <View accessible accessibilityRole="image" accessibilityLabel={tr('player.positionNow', { position: positionCard(position).title })} style={styles.iconBtn}>
            <Icon name={POSITION_ICON[position]} color={f.icon} size="lg" />
          </View>
          <IconButton icon="help" label={tr('player.help')} onPress={openHelp} color={f.icon} />
        </View>
      </View>

      {/* Middle (~55 %): Kas Küresi */}
      <View style={styles.center} accessible accessibilityLabel={`${label}. ${secondsLeft}`} accessibilityLiveRegion="assertive">
        {/* Count and word inside the centre disc, as in the reference app. */}
        <MuscleSphere size={sphereSize} phase={phase} exerciseType={exercise?.type} phaseKey={state.index} elapsedMs={elapsedMs} paused={paused} finished={state.status === 'completed' && !state.endedEarly} colors={colors} ring={ringRange}>
          {(phase.durationMs >= 1000 || fastRun) && !paused ? (
            <AppText variant="display" tabular color={f.sphereText} center style={styles.shadow}>
              {secondsLeft}
            </AppText>
          ) : null}
          {paused ? (
            <AppText variant="callout" weight="700" center color={f.sphereText} style={styles.shadow}>
              {tr('player.paused')}
            </AppText>
          ) : !discreet ? (
            <AppText variant="callout" weight="700" center color={f.sphereText} style={[styles.shadow, { letterSpacing: 0.5 }]} accessibilityElementsHidden importantForAccessibility="no">
              {label}
            </AppText>
          ) : null}
        </MuscleSphere>
      </View>

      {/* Bottom: rotating technique cue + controls */}
      {/* Fixed height: a one- or two-line cue must not move the circle above it. */}
      <View style={{ height: 48, justifyContent: 'center', paddingHorizontal: 8 }}>
        {cue ? (
          <AppText variant="callout" center color={f.dim} numberOfLines={2}>
            {cue}
          </AppText>
        ) : null}
      </View>
      <View style={styles.controls}>
        {!minimal ? <IconButton icon="skip" label={tr('player.skip')} onPress={askSkip} color={f.dim} /> : <View style={styles.iconBtn} />}
        <Pressable accessibilityRole="button" accessibilityLabel={paused ? tr('player.resume') : tr('player.pause')} onPress={toggle} style={({ pressed }) => [styles.mainBtn, { backgroundColor: f.control, opacity: pressed ? 0.8 : 1 }]}>
          <Icon name={paused ? 'play' : 'pause'} color={f.text} size={32} />
        </Pressable>
        {!minimal ? <IconButton icon="stop" label={tr('player.finish')} onPress={askFinish} color={f.dim} /> : <View style={styles.iconBtn} />}
      </View>

      {/* Start: the position card; between blocks: "Next" with a mini preview (and the position change) */}
      {phase.kind === 'countdown' ? <PositionCardView position={firstPosition(session)} title={tr('player.startIn')} notice={painNotice} /> : null}
      {preview && running ? <NextCard key={state.index} block={preview.block} positionChanged={preview.positionChanged} /> : null}

      {/* Black (discreet) mode: everything hidden, gestures still work */}
      {black && blackAllowed ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: f.black, margin: -40 }]} {...pan.panHandlers} accessible accessibilityLabel={tr('player.blackMode')} accessibilityHint={tr('player.blackHint')}>
          {/* Only a 2 px progress line stays visible. */}
          <View pointerEvents="none" style={{ position: 'absolute', top: 40, left: 40, right: 40, height: 2, backgroundColor: f.control }}>
            <View style={{ width: `${overall * 100}%`, height: '100%', backgroundColor: f.dim }} />
          </View>
          <BlackNotice key={notice} />
        </View>
      ) : null}

      <Dialog
        visible={interrupted}
        title={tr('player.interruptedTitle')}
        message={tr('player.interruptedBody')}
        actions={[
          { label: tr('player.resume'), variant: 'accent', onPress: () => (setInterrupted(false), player.resume()) },
          { label: tr('player.restartBlock'), onPress: () => (setInterrupted(false), player.restartBlock()) },
          { label: tr('player.finish'), variant: 'ghost', onPress: () => (setInterrupted(false), player.finish()) },
        ]}
      />
      <Dialog
        visible={confirmFinish}
        title={tr('player.finishTitle')}
        message={tr('player.finishBody')}
        onDismiss={() => closeFinish(false)}
        actions={[
          { label: tr('player.finish'), variant: 'danger', onPress: () => closeFinish(true) },
          { label: tr('player.keepGoing'), onPress: () => closeFinish(false) },
        ]}
      />
      <Dialog
        visible={confirmSkip}
        title={tr('player.skipTitle')}
        message={tr('player.skipBody')}
        onDismiss={() => closeSkip(false)}
        actions={[
          { label: tr('player.skip'), variant: 'accent', onPress: () => closeSkip(true) },
          { label: tr('player.keepGoing'), onPress: () => closeSkip(false) },
        ]}
      />
      <Dialog
        visible={pain !== null}
        title={tr('player.painTitle')}
        message={pain?.refer ? `${tr('player.painBody')}\n\n${tr('player.painRefer')}` : tr('player.painBody')}
        actions={[
          { label: tr('player.painRelease'), variant: 'accent', onPress: () => endWithPain('release') },
          { label: tr('player.painEnd'), onPress: () => endWithPain('end') },
        ]}
      />
      <Dialog visible={helpOpen} title={tr('player.helpTitle')} onDismiss={closeHelp} actions={[{ label: tr('common.done'), variant: 'primary', onPress: closeHelp }]}>
        <View style={{ gap: 8 }}>
          {(tr('player.helpTips', { returnObjects: true }) as string[]).map((tip) => (
            <AppText key={tip}>• {tip}</AppText>
          ))}
          <View style={[styles.warn, { backgroundColor: t.tokens.destructiveSoft, borderRadius: t.radius.md }]}>
            <AppText weight="600" color={t.tokens.destructive}>
              {tr('player.painWarning')}
            </AppText>
          </View>
        </View>
      </Dialog>
    </View>
  );
}

/** Segmented progress bar: one segment per block, the active one fills. */
function SegmentBar({ fills, active, color, track, label }: { fills: number[]; active: number; color: string; track: string; label: string }) {
  const done = fills.filter((f) => f >= 1).length;
  return (
    <View style={{ flexDirection: 'row', gap: 4, height: 3 }} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: fills.length, now: done }}>
      {fills.map((f, i) => (
        <View key={i} style={{ flex: 1, borderRadius: 2, backgroundColor: track, overflow: 'hidden', opacity: i === active || f >= 1 ? 1 : 0.6 }}>
          <View style={{ width: `${f * 100}%`, height: '100%', backgroundColor: color }} />
        </View>
      ))}
    </View>
  );
}

/** Position card at the start (§5): position icon + one sentence. */
function PositionCardView({ position, title, notice }: { position: SessionBlock['position']; title: string; notice?: string }) {
  const t = useTheme();
  const card = positionCard(position);
  return (
    <View pointerEvents="none" style={[styles.sheet, { backgroundColor: t.tokens.card, borderColor: t.tokens.border, borderRadius: t.radius.lg, padding: t.space.lg, gap: t.space.md }]}>
      <IconTile icon={POSITION_ICON[position]} size="lg" />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="caption" muted>
          {title}
        </AppText>
        <AppText variant="title3">{card.title}</AppText>
        <AppText variant="footnote" muted>
          {card.text}
        </AppText>
        {notice ? (
          <AppText variant="footnote" weight="600" color={t.tokens.destructive}>
            {notice}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/** "Next: Quick Flick ×10" card sliding up from the bottom (250 ms) with a mini preview. */
function NextCard({ block, positionChanged }: { block: SessionBlock; positionChanged: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const y = useSharedValue(90);
  useEffect(() => {
    y.value = withTiming(0, { duration: t.motion.normal, easing: Easing.out(Easing.cubic) });
  }, [y, t.motion.normal]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: 1 - y.value / 90 }));
  const text = blockText(block, tr);
  return (
    <Animated.View pointerEvents="none" style={[styles.sheet, { backgroundColor: t.tokens.card, borderColor: positionChanged ? t.tokens.primary : t.tokens.border, borderRadius: t.radius.lg, padding: t.space.lg, gap: t.space.md }, style]}>
      <MiniPreview type={block.type} color={t.player.orbEdge} calm={t.tokens.breathe} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="title3">{tr('player.nextName', { name: text.title })}</AppText>
        <AppText variant="footnote" muted>
          {text.detail}
        </AppText>
      </View>
    </Animated.View>
  );
}

/** Tiny looping demo of the next exercise's rhythm: the circle grows (squeeze) and shrinks (release), like the big one. */
function MiniPreview({ type, color, calm }: { type: ExerciseType; color: string; calm: string }) {
  const scale = useSharedValue(0.55);
  const gentle = type === 'release' || type === 'breath';
  useEffect(() => {
    const up = type === 'quick_flick' ? 150 : type === 'elevator' ? 3000 : gentle ? 900 : 450;
    const down = type === 'quick_flick' ? 250 : type === 'elevator' ? 500 : gentle ? 1800 : 800;
    scale.value = withRepeat(withSequence(withTiming(gentle ? 0.75 : 1, { duration: up, easing: Easing.inOut(Easing.cubic) }), withTiming(0.55, { duration: down, easing: Easing.inOut(Easing.cubic) })), -1);
  }, [type, gentle, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={{ width: 44, height: 52, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 40, height: 40, borderRadius: 20, backgroundColor: gentle ? calm : color }, style]} />
    </View>
  );
}

function IconButton({ icon, label, onPress, color }: { icon: IconName; label: string; onPress: () => void; color: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}>
      <Icon name={icon} color={color} size="lg" />
    </Pressable>
  );
}

function phaseLabel(phase: Phase, tr: TFunction, elapsedMs: number, type?: ExerciseType): string {
  if (phase.kind === 'contract' && phase.stage) return tr('player.stage', { stage: phase.stage });
  return tr(`player.phase.${sphereWord(phase, elapsedMs, type)}`);
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'space-between' },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  shadow: { textShadowColor: lightTheme.veil.shadow, textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12 },
  mainBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  warn: { padding: 12, marginTop: 4 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 120, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
});

/** How long the black screen's notice stays before it fades (it comes back on every tap). */
const BLACK_NOTICE_MS = 3000;

/**
 * The black screen's notice: large and clear for a few seconds ("Siyah ekran · Çıkmak için iki kez
 * dokun"), then it fades so the screen is dark again. Remounted (new key) on every tap.
 */
function BlackNotice() {
  const { t: tr } = useTranslation();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOn(false), BLACK_NOTICE_MS);
    return () => clearTimeout(id);
  }, []);
  if (!on) return null;
  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(600)} pointerEvents="none" style={blackStyles.wrap} accessibilityLiveRegion="polite">
      <View style={blackStyles.card}>
        <Icon name="eyeOff" size={36} color="#FFFFFF" />
        <AppText variant="title2" center color="#FFFFFF">
          {tr('player.blackMode')}
        </AppText>
        <AppText variant="bodyStrong" center color="#E6E9EC">
          {tr('player.blackExit')}
        </AppText>
        <AppText variant="footnote" center color="#AEB6BD">
          {tr('player.blackGoesOn')}
        </AppText>
      </View>
    </Animated.View>
  );
}

const blackStyles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 40 },
  card: { alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 28, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.08)', maxWidth: 320 },
});
