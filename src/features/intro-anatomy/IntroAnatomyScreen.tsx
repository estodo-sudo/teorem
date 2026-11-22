import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Icon } from '@/components';
import { Button } from '@/components/ui';
import { ThemeOverride } from '@/components/useTheme';
import { darkTheme } from '@/config/theme';
import { useSettingsStore } from '@/stores/settingsStore';

import { AnatomyBackground, AnatomyScene, SCENE_COLORS } from './AnatomyScene';
import { BUTTONS_RISE, CAPTION, SCENES, TOTAL_MS, TRACKS } from './timeline';
import { useTimeline } from './useTimeline';

/** How long the closing buttons take to rise in (from `timeline.ts`). */
const BUTTONS_IN_MS = TRACKS.buttons[1][0] - TRACKS.buttons[0][0];

/**
 * "Pelvik taban kasın nerede?" (SPEC_ANIMASYON_PELVIK §5–§7). Always dark, light status bar.
 * - Thin progress bar on top. It cannot be skipped (no "Geç"); it can be paused with a tap.
 * - Shown inside the "Kası bul" tutorial, right after "Kası nasıl bulursun?"; "Devam et" goes on.
 * - A tap on the drawing pauses or plays; while paused a round play icon sits in the middle.
 * - The caption of each scene under the drawing; the closing buttons rise in at 46 s.
 * - Pauses by itself when the app goes to the background.
 */
export function IntroAnatomyScreen({
  onFinish,
  stillAt,
  forceReader = false,
}: {
  /** "Devam et" on the last scene: the tutorial goes on. */
  onFinish?: () => void;
  /** Dev frames only: show this moment, paused, without the play icon. */
  stillAt?: number;
  /** Dev only: force the screen-reader step mode (the web preview cannot detect a screen reader). */
  forceReader?: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const reader = useScreenReader() || forceReader;
  const c = SCENE_COLORS;
  const tl = useTimeline(stillAt === undefined ? { sound: !reader } : { autoPlay: false, haptics: false, sound: false, startAt: stillAt });
  const soundOn = useSettingsStore((s) => s.settings.introSound !== false);
  const toggleSound = () => useSettingsStore.getState().update({ introSound: !soundOn });
  const { time, pulse, playing, scene, buttonsOn, finished, pause, toggle, restart, seek } = tl;

  // Screen reader (§8): no auto play; each scene is shown in its last state, stepped with Önceki / Sonraki.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reader) seek(sceneStill(step));
  }, [reader, step, seek]);

  // The app going to the background pauses the animation (and with it the vibration).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') pause();
    });
    return () => sub.remove();
  }, [pause]);

  const progress = useAnimatedStyle(() => ({ width: `${(Math.min(TOTAL_MS, time.value) / TOTAL_MS) * 100}%` }));

  return (
    <ThemeOverride dark>
      <View style={[styles.root, { backgroundColor: c.bgBottom, paddingTop: insets.top, paddingBottom: insets.bottom + darkTheme.space.lg }]}>
        <StatusBar style="light" />
        <AnatomyBackground />

        {/* progress bar and the sound switch (there is no "Geç": the animation is watched to the end) */}
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { backgroundColor: c.muscle }, progress]} />
        </View>
        <View style={styles.topRow}>
          {!reader ? (
            <Pressable onPress={toggleSound} hitSlop={8} style={styles.iconButton} accessibilityRole="switch" accessibilityState={{ checked: soundOn }} accessibilityLabel={t('introAnatomy.sound')}>
              <Icon name={soundOn ? 'volume' : 'volumeOff'} size={22} color={c.text} />
            </Pressable>
          ) : null}
        </View>

        {/* the drawing: one tap pauses or plays */}
        <Pressable
          style={styles.stage}
          onPress={toggle}
          disabled={finished || reader}
          accessibilityRole={reader ? 'image' : 'button'}
          accessibilityLabel={t('introAnatomy.sceneLabel')}
          accessibilityHint={reader ? undefined : t('introAnatomy.stageHint')}
        >
          <AnatomyScene time={time} pulse={pulse} reduce={reduce} background={false} />
          {!playing && !finished && !reader && stillAt === undefined ? (
            <View style={styles.center} pointerEvents="none">
              <View style={[styles.playIcon, { backgroundColor: c.pauseBg }]}>
                <Icon name="play" size={24} color={c.text} />
              </View>
            </View>
          ) : null}
        </Pressable>

        {/* caption, then the closing buttons (they rise in at 46 s) */}
        <View style={styles.bottom}>
          <Caption text={t(SCENES[scene]!.caption)} reduce={reduce} />
          {reader ? (
            <View style={styles.steps}>
              <Button label={t('introAnatomy.prev')} variant="ghost" size="md" disabled={step === 0} onPress={() => setStep((n) => Math.max(0, n - 1))} />
              <Button label={t('introAnatomy.next')} variant="ghost" size="md" disabled={step === SCENES.length - 1} onPress={() => setStep((n) => Math.min(SCENES.length - 1, n + 1))} />
            </View>
          ) : null}
          {buttonsOn ? (
            <Animated.View style={styles.actions} entering={stillAt === undefined ? FadeInDown.duration(BUTTONS_IN_MS).withInitialValues({ transform: [{ translateY: BUTTONS_RISE }] }) : undefined}>
              <Button label={t('introAnatomy.continue')} variant="primary" size="lg" fullWidth onPress={() => onFinish?.()} />
              <Pressable onPress={reader ? () => setStep(0) : restart} style={styles.textButtonSmall} accessibilityRole="button">
                <AppText variant="footnote" color={c.label}>
                  {t('introAnatomy.replay')}
                </AppText>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </ThemeOverride>
  );
}

/** The moment shown for scene i in screen-reader mode: its last state. */
function sceneStill(i: number): number {
  return Math.min(TOTAL_MS - 1, SCENES[i]!.end - 1);
}

/**
 * Whether a screen reader (VoiceOver / TalkBack) is on, kept up to date. Phones only: React Native Web
 * always answers "on", which would switch the browser preview to step mode.
 */
function useScreenReader(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let live = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((v) => live && setOn(v))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return on;
}

/**
 * The scene's caption (§5): `title3`, white, centred, at most 2 lines (it grows with large text instead
 * of being cut). On a change the old text fades out in 200 ms and the new one rises 6 units in 300 ms.
 */
function Caption({ text, reduce }: { text: string; reduce: boolean }) {
  const [shown, setShown] = useState(text);
  const v = useSharedValue(1);
  useEffect(() => {
    if (text === shown) return;
    v.set(withTiming(0, { duration: CAPTION.outMs }));
    const id = setTimeout(() => {
      setShown(text);
      v.set(withTiming(1, { duration: CAPTION.inMs, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
    }, CAPTION.outMs);
    return () => clearTimeout(id);
  }, [text, shown, v]);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: reduce ? 0 : (1 - v.value) * CAPTION.rise }] }));
  return (
    <Animated.View style={[styles.caption, style]} accessibilityLiveRegion="polite">
      <AppText variant="title3" center color={SCENE_COLORS.text}>
        {shown}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  track: { height: 2, width: '100%' },
  topRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  iconButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  stage: { flex: 1 },
  bar: { height: 2 },
  bottom: { paddingHorizontal: 24, paddingTop: 12 },
  caption: { minHeight: 44, justifyContent: 'center', marginBottom: 12 },
  actions: { gap: 4, alignItems: 'center' },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  textButtonSmall: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 16 },
});
