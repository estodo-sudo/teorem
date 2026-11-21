import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, SegmentedBar, useTheme } from '@/components';

import type { StorySlide } from '../data';

/** Reading time per slide: base + per character, clamped. */
export function slideDurationMs(s: StorySlide): number {
  const chars = s.title.length + s.text.length + (s.didYouKnow?.length ?? 0);
  return Math.min(14_000, Math.max(5_000, 3_000 + chars * 45));
}

interface Props {
  title: string;
  slides: StorySlide[];
  onFinish: () => void;
  onClose: () => void;
  /** Extra header content (e.g. favourite button). */
  headerRight?: ReactNode;
  /** Shown instead of auto-closing on the last slide (e.g. quiz CTA). */
  endLabel?: string;
}

export function StoryPlayer({ title, slides, onFinish, onClose, headerRight, endLabel }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const startRef = useRef(0);
  const baseRef = useRef(0);
  const finished = useRef(false);
  const slide = slides[index]!;
  const dur = slideDurationMs(slide);
  const last = index === slides.length - 1;

  const goTo = (i: number) => {
    if (i < 0) i = 0;
    if (i >= slides.length) {
      if (!finished.current) {
        finished.current = true;
        onFinish();
      }
      return;
    }
    setIndex(i);
    baseRef.current = 0;
    startRef.current = Date.now();
    setElapsed(0);
  };

  useEffect(() => {
    if (paused) return;
    startRef.current = Date.now();
    const id = setInterval(() => {
      const e = baseRef.current + (Date.now() - startRef.current);
      setElapsed(e);
      // On the last slide with an explicit end button, wait for the user.
      if (e >= dur && !(last && endLabel)) goTo(index + 1);
    }, 50);
    return () => {
      clearInterval(id);
      baseRef.current += Date.now() - startRef.current;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, dur]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 80) onClose();
        },
      }),
    [onClose],
  );

  const bg = t.colors.primary;
  const fg = t.focus.text;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: bg }]} {...pan.panHandlers}>
      <View style={{ padding: t.space.lg, gap: t.space.md }}>
        <SegmentedBar count={slides.length} index={index} progress={Math.min(1, elapsed / dur)} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText weight="700" color={fg} style={{ flex: 1 }} numberOfLines={1}>
            {title}
          </AppText>
          {headerRight}
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={tr('common.close')} hitSlop={10} style={{ padding: t.space.sm }}>
            <Icon name="close" color={fg} size={26} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.flex, { paddingHorizontal: 28, justifyContent: 'center', gap: t.space.lg }]}>
        {/* The slide's `icon` is an icon name: always draw it as an icon, never as text (SPEC_V4 §0.1). */}
        <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: t.veil.soft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={slide.icon} color={fg} size={44} />
        </View>
        <AppText variant="h1" color={fg} accessibilityRole="header">
          {slide.title}
        </AppText>
        <AppText variant="h3" weight="500" color={fg} style={{ opacity: 0.92 }}>
          {slide.text}
        </AppText>
        {slide.didYouKnow ? (
          <View style={{ backgroundColor: t.veil.soft, borderRadius: t.radius.md, padding: 14, gap: t.space.xs }}>
            <AppText variant="small" weight="800" color={t.focus.orbCenter}>
              {tr('stories.didYouKnow')}
            </AppText>
            <AppText color={fg}>{slide.didYouKnow}</AppText>
          </View>
        ) : null}
      </View>

      {/* Tap zones: left = back, right = forward; long press = pause */}
      <View style={[StyleSheet.absoluteFill, { top: 110, flexDirection: 'row' }]}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => goTo(index - 1)}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          delayLongPress={200}
          accessibilityRole="button"
          accessibilityLabel={tr('stories.prev')}
        />
        <Pressable
          style={{ flex: 2 }}
          onPress={() => goTo(index + 1)}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          delayLongPress={200}
          accessibilityRole="button"
          accessibilityLabel={tr('stories.next')}
        />
      </View>
      {/* Rendered after the tap zones so it sits on top of them. */}
        {last && endLabel ? (
          <Pressable
            onPress={() => goTo(index + 1)}
            accessibilityRole="button"
            style={{ backgroundColor: t.colors.accent, borderRadius: t.radius.lg, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginHorizontal: t.space.gutter, marginBottom: t.space.lg }}
          >
            <AppText weight="800" color={t.colors.accentText}>
              {endLabel}
            </AppText>
          </Pressable>
        ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
