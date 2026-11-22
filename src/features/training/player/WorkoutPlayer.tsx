import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AppText, Dialog, Icon, useTheme, type IconName } from '@/components';
import { lightTheme } from '@/config/theme';
import { IconTile } from '@/components/ui';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ExerciseType, Position } from '@/types';

import { cancelHaptics, playCue } from '../haptics';
import { cueForHoldSecond, cueForPhase } from '../hapticPatterns';
import { playSound, prepareSounds, releaseSounds, soundForPhaseStart } from '../sounds';
import type { GeneratedSession, Phase, SessionBlock } from '../types';
import { findTurkishVoice, speak, stopSpeech, voiceKeyForPhase } from '../voice';
import { activeTime, currentPhase, exerciseOutcomes, remainingInPhase, type PlayerEvent } from './machine';
import { MuscleSphere } from './MuscleSphere';
import { blockSegments, cueText, firstPosition, nextPreview, positionCard, segmentFill } from './playerUi';
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
          const cue = cueForPhase(e.phase, type);
          if (cue) playCue(cue, strength);
          if (settings.voiceCoach) {
            const key = e.phase.kind === 'transition' ? null : voiceKeyForPhase(e.phase, type);
            if (key) speak(tr(`player.voice.${key}`));
            else if (e.phase.kind === 'transition' && e.phase.nextType) speak(tr('player.next', { name: tr(`exercise.${e.phase.nextType}.name`) }));
          }
          if (settings.soundCues && e.phase.durationMs >= 1000) {
            const snd = soundForPhaseStart(e.phase.kind, e.phase.stage, e.phase.variant);
            if (snd) playSound(snd);
          }
          // Screen readers announce each phase (§17: usable without the animation).
          if (screenReader.current && e.phase.durationMs >= 1500) AccessibilityInfo.announceForAccessibility(phaseLabel(e.phase, tr, 0, type));
        } else if (e.type === 'second') {
          // A light tick each second of a hold, stronger in the last 3 seconds (count without looking).
          const tick = cueForHoldSecond(e.phase, e.second);
          if (tick) {
            playCue(tick, strength);
            if (settings.soundCues) playSound('tick');
          }
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
    if (prevStatus.current === 'running' && state.status === 'paused') pausesRef.current += 1;
    prevStatus.current = state.status;
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
  const sphereSize = Math.min(width * 0.78, height * 0.46, 340);
  const label = phaseLabel(phase, tr, elapsedMs, exercise?.type);
  // v1 colouring: squeeze colour while squeezing (also the slow release), plain text colour when relaxing.
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const posMs = (state.startOffsets[state.index] ?? state.totalMs) + Math.min(phase.durationMs, elapsedMs);
  const segments = useMemo(() => blockSegments(session.phases), [session.phases]);
  const fills = segmentFill(segments, state.status === 'completed' && !state.endedEarly ? state.totalMs : posMs);
  const preview = nextPreview(session, phase);
  const blockName = phase.kind === 'countdown' ? tr('player.getReady') : preview ? tr('player.next', { name: tr(`exercise.${preview.block.type}.name`) }) : exercise ? tr(`exercise.${exercise.type}.name`) : '';
  const counter = phase.rep > 0 && phase.kind !== 'transition' ? tr('player.rep', { rep: phase.rep, reps: phase.reps }) : '';
  const cue = !discreet && phase.kind !== 'countdown' && phase.kind !== 'transition' ? cueText(block, phase.kind, posMs) : null;
  const position = block?.position ?? firstPosition(session);

  const toggle = useCallback(() => {
    const s = player.getState();
    if (s.status === 'running') {
      player.pause();
      cancelHaptics();
      stopSpeech();
    } else if (s.status === 'paused') player.resume();
  }, [player]);
  const askSkip = useCallback(() => {
    if (minimal) return;
    if (skipConfirmed.current) player.skip();
    else {
      if (player.getState().status === 'running') player.pause();
      setConfirmSkip(true);
    }
  }, [minimal, player]);
  const askFinish = useCallback(() => {
    if (minimal) return;
    setConfirmFinish(true);
  }, [minimal]);
  const onPain = () => {
    if (player.getState().status === 'running') player.pause();
    cancelHaptics();
    stopSpeech();
    setPain(onPainReport ? onPainReport() : { refer: false });
  };
  const endWithPain = (choice: 'release' | 'end') => {
    painChoice.current = choice;
    setPain(null);
    player.finish();
  };

  // Gesture layer: tap / double tap / hold 1 s / swipe left on the whole screen.
  const pan = usePlayerGestures({ onTap: toggle, onDoubleTap: () => setBlack((b) => !b), onLongPress: askFinish, onSwipeLeft: askSkip });

  const f = t.player;
  const colors = { neutral: f.idle, accent: f.orbEdge, cool: f.relax, breath: t.tokens.breathe, ring: f.orbEdge, track: f.track, paused: f.paused, glow: f.glow, highlight: f.orbCenter };
  const overall = state.totalMs > 0 ? Math.min(1, (state.status === 'completed' ? state.totalMs : posMs) / state.totalMs) : 0;

  return (
    <View style={styles.flex} {...pan.panHandlers} accessibilityHint={tr('player.gestureHint')}>
      {/* Top: thin segmented bar; block name + rep counter; position, help and pain icons (44 px each) */}
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
          <IconButton icon="help" label={tr('player.help')} onPress={() => setHelpOpen(true)} color={f.icon} />
          {!minimal ? <IconButton icon="painCare" label={tr('player.painButton')} onPress={onPain} color={f.icon} /> : null}
        </View>
      </View>

      {/* Middle (~55 %): Kas Küresi */}
      <View style={styles.center} accessible accessibilityLabel={`${label}. ${secondsLeft}`} accessibilityLiveRegion="assertive">
        <MuscleSphere size={sphereSize} phase={phase} exerciseType={exercise?.type} phaseKey={state.index} elapsedMs={elapsedMs} paused={paused} finished={state.status === 'completed' && !state.endedEarly} colors={colors}>
          {phase.durationMs >= 1000 && !paused ? (
            <AppText variant="display" tabular color={f.sphereText} center style={styles.shadow}>
              {secondsLeft}
            </AppText>
          ) : null}
        </MuscleSphere>
      </View>
      {/* The phase word under the sphere: calm title in the text colour, not coloured (ui-v3). */}
      <View style={{ minHeight: 44, justifyContent: 'center' }}>
        {paused ? (
          <AppText variant="title1" weight="600" center color={f.dim}>
            {tr('player.paused')}
          </AppText>
        ) : !discreet ? (
          <AppText variant="title1" weight="600" center color={f.text} accessibilityElementsHidden importantForAccessibility="no">
            {label}
          </AppText>
        ) : null}
      </View>

      {/* Bottom: rotating technique cue + controls */}
      <View style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
        {cue ? (
          <AppText variant="callout" center color={f.dim}>
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
      {black ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: f.black, margin: -40 }]} {...pan.panHandlers} accessible accessibilityLabel={tr('player.blackMode')} accessibilityHint={tr('player.blackHint')}>
          {/* Only a 2 px progress line stays visible. */}
          <View pointerEvents="none" style={{ position: 'absolute', top: 40, left: 40, right: 40, height: 2, backgroundColor: f.control }}>
            <View style={{ width: `${overall * 100}%`, height: '100%', backgroundColor: f.dim }} />
          </View>
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
        onDismiss={() => setConfirmFinish(false)}
        actions={[
          { label: tr('player.finish'), variant: 'danger', onPress: () => (setConfirmFinish(false), player.finish()) },
          { label: tr('player.keepGoing'), onPress: () => setConfirmFinish(false) },
        ]}
      />
      <Dialog
        visible={confirmSkip}
        title={tr('player.skipTitle')}
        message={tr('player.skipBody')}
        onDismiss={() => (setConfirmSkip(false), player.resume())}
        actions={[
          { label: tr('player.skip'), variant: 'accent', onPress: () => ((skipConfirmed.current = true), setConfirmSkip(false), player.resume(), player.skip()) },
          { label: tr('player.keepGoing'), onPress: () => (setConfirmSkip(false), player.resume()) },
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
      <Dialog visible={helpOpen} title={tr('player.helpTitle')} onDismiss={() => setHelpOpen(false)} actions={[{ label: tr('common.done'), variant: 'primary', onPress: () => setHelpOpen(false) }]}>
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
  const card = positionCard(block.position);
  const detail = block.slowSec
    ? tr('player.nextSlow', { slow: block.slowSec, top: (block.holdSec ?? 0) - block.slowSec })
    : block.holdSec !== undefined
      ? tr('player.nextDetail', { hold: block.holdSec, rest: block.restSec })
      : tr('player.nextRelease');
  return (
    <Animated.View pointerEvents="none" style={[styles.sheet, { backgroundColor: t.tokens.card, borderColor: positionChanged ? t.tokens.primary : t.tokens.border, borderRadius: t.radius.lg, padding: t.space.lg, gap: t.space.md }, style]}>
      <MiniPreview type={block.type} color={t.player.orbEdge} calm={t.tokens.breathe} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="title3">{tr('player.nextTitle', { name: tr(`exercise.${block.type}.name`), reps: block.reps })}</AppText>
        <AppText variant="footnote" muted>
          {detail}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs }}>
          <Icon name={POSITION_ICON[block.position]} size="sm" color={positionChanged ? t.tokens.primary : t.tokens.mutedForeground} />
          <AppText variant="footnote" weight={positionChanged ? '600' : '400'} color={positionChanged ? t.tokens.primary : t.tokens.mutedForeground}>
            {positionChanged ? tr('player.positionChange', { position: card.title }) : card.title}
          </AppText>
        </View>
        {positionChanged ? (
          <AppText variant="footnote" muted>
            {card.text}
          </AppText>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Tiny looping demo of the next exercise's rhythm. */
/** Tiny looping demo of the next exercise's rhythm: the circle grows (squeeze) and shrinks (release), like the big one. */
function MiniPreview({ type, color, calm }: { type: ExerciseType; color: string; calm: string }) {
  const scale = useSharedValue(0.55);
  const gentle = type === 'release' || type === 'breath';
  useEffect(() => {
    const up = type === 'quick_flick' ? 150 : type === 'elevator' ? 1800 : gentle ? 900 : 450;
    const down = type === 'quick_flick' ? 250 : type === 'elevator' ? 1800 : gentle ? 1800 : 800;
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
