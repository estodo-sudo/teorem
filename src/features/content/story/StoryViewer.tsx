import { BlurTargetView, BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { Linking, PanResponder, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { useAppActive } from '@/lib/useLive';
import { currentSex, sexCtx } from '@/i18n/sex';
import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Button, Sheet, uiHaptic } from '@/components/ui';
import { exploreImage } from '@/content/images';
import { useScreenReader } from '@/lib/useScreenReader';

import type { Story } from '../data';
import { ExplorePhoto, focusPosition } from '../explore/ExploreCards';
import { pageDurationMs, storyPages, waitsForReader, type ShownPage } from './pages';
import { preloadIndices, SCRIM_BASE, SCRIM_STOPS, slidePhoto, SUMMARY_BLUR, SUMMARY_DIM, TOP_SCRIM, ZOOM_TO, type SlidePhoto } from './slideImage';

type Target = RefObject<ComponentRef<typeof View> | null>;

interface Props {
  story: Story;
  /** Slide to open at (where the reader left off). */
  startAt?: number;
  saved: boolean;
  onToggleSave: () => void;
  /** Called on every slide change, to remember the position. */
  onIndex: (index: number) => void;
  /** The last slide was reached: the story counts as read. */
  onReachedEnd: () => void;
  onClose: () => void;
  nextStory?: Story;
  onOpenStory: (id: string) => void;
}

/**
 * Bilgi Hikâyeleri viewer (SPEC_V4 §B.1, SPEC_GORSELLER_V5 §4). Every slide is a full-screen photo with
 * a bottom and a top scrim and white text at the bottom; myth, quiz, "did you know" and doctor text sits
 * on a dark frosted card. The look is the same in both themes. Thin progress lines; tap the right two
 * thirds to go on and the left third to go back, hold to pause, swipe down to close, swipe left on the
 * last slide for the next story. Auto-advance and the slow zoom are off with "reduce motion";
 * auto-advance also with a screen reader.
 */
export function StoryViewer({ story, startAt = 0, saved, onToggleSave, onIndex, onReachedEnd, onClose, nextStory, onOpenStory }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const pages = useMemo(() => storyPages(story), [story]);
  const reduce = useReducedMotion();
  const screenReader = useScreenReader();
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startAt), pages.length - 1));
  const [elapsed, setElapsed] = useState(0);
  const [heldPaused, setPaused] = useState(false);
  // Battery (round 8): the slide timer also stops while the app is in the background.
  const appActive = useAppActive();
  const paused = heldPaused || !appActive;
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const reached = useRef(false);
  const blurTarget = useRef<ComponentRef<typeof View> | null>(null);
  const page = pages[index]!;
  const last = index === pages.length - 1;
  const dur = pageDurationMs(page);
  const auto = !reduce && !screenReader && !waitsForReader(page);
  const blocked = page.type === 'myth' && !flipped[index];
  const photo = slidePhoto(story, page);

  useEffect(() => {
    onIndex(index);
    if (last && !reached.current) {
      reached.current = true;
      onReachedEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const goTo = (i: number) => {
    if (i < 0) return;
    if (i >= pages.length) return onClose();
    setIndex(i);
    setElapsed(0);
  };
  const next = () => {
    if (!blocked) goTo(index + 1);
  };

  // Auto-advance: a timer that pauses while held and on slides that wait for the reader.
  useEffect(() => {
    if (!auto || paused) return;
    const started = Date.now() - elapsed;
    const id = setInterval(() => {
      const e = Date.now() - started;
      if (e >= dur) {
        clearInterval(id);
        goTo(index + 1);
      } else setElapsed(e);
    }, 80);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, auto, dur]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 12 || Math.abs(g.dx) > 12,
        onPanResponderRelease: (_, g) => {
          if (g.dy > 80 && Math.abs(g.dy) > Math.abs(g.dx)) onClose();
          else if (g.dx < -60 && Math.abs(g.dx) > Math.abs(g.dy) && last && nextStory) onOpenStory(nextStory.id);
        },
      }),
    [onClose, onOpenStory, last, nextStory],
  );

  const fg = t.focus.text;
  const preload = preloadIndices(index, pages.length)
    .map((i) => slidePhoto(story, pages[i]!))
    .filter((p): p is SlidePhoto => !!p && !p.blurred);

  return (
    <View style={[styles.flex, { backgroundColor: t.focus.black }]} {...pan.panHandlers}>
      <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
        <Backdrop key={index} photo={photo} story={story} page={page} zoomMs={reduce ? 0 : Math.max(dur, 9000)} />
      </BlurTargetView>
      {/* The next slides' photos, decoded ahead of time (§5). */}
      <View style={styles.preload} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {preload.map((p) => (
          <Image key={p.source} source={p.source} style={styles.preloadImage} />
        ))}
      </View>
      <SlideScrims max={photo?.scrim ?? SCRIM_BASE} />

      <SafeAreaView style={styles.flex}>
        {/* Status: one line per slide, title, save and close. */}
        <View style={{ paddingHorizontal: t.space.lg, paddingTop: t.space.sm, gap: t.space.md }}>
          <View style={{ flexDirection: 'row', gap: 4 }} accessible accessibilityLabel={tr('stories.position', { index: index + 1, count: pages.length })}>
            {pages.map((_, i) => {
              const fill = i < index ? 1 : i > index ? 0 : auto ? Math.min(1, elapsed / dur) : 1;
              return (
                <View key={i} style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: t.veil.bold, overflow: 'hidden' }}>
                  <View style={{ width: `${fill * 100}%`, height: 2, backgroundColor: fg }} />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs }}>
            <AppText variant="callout" weight="600" color={fg} style={{ flex: 1 }} numberOfLines={1}>
              {story.title}
            </AppText>
            <HeaderButton icon="bookmark" filled={saved} color={fg} label={saved ? tr('stories.unsave') : tr('stories.save')} onPress={onToggleSave} />
            <HeaderButton icon="close" color={fg} label={tr('common.close')} onPress={onClose} />
          </View>
        </View>

        <View style={styles.flex}>
          {/* Tap zones sit under the slide; the slide only catches touches on its own controls. */}
          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => goTo(index - 1)}
              onLongPress={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
              delayLongPress={250}
              accessibilityRole="button"
              accessibilityLabel={tr('stories.prev')}
            />
            <Pressable
              style={{ flex: 2 }}
              onPress={next}
              onLongPress={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
              delayLongPress={250}
              accessibilityRole="button"
              accessibilityLabel={tr('stories.next')}
              accessibilityHint={blocked ? tr('stories.flipFirst') : undefined}
            />
          </View>
          <View style={styles.flex} pointerEvents="box-none">
            {photo && page.type !== 'cover' && page.type !== 'summary' ? <View accessible accessibilityRole="image" accessibilityLabel={photo.alt} style={styles.altAnchor} /> : null}
            <Slide
              key={index}
              page={page}
              story={story}
              meta={tr('stories.meta', { min: story.minutes, count: pages.length })}
              flipped={!!flipped[index]}
              onFlip={() => {
                uiHaptic('selection');
                setFlipped((f) => ({ ...f, [index]: true }));
              }}
              answer={answers[index]}
              onAnswer={(a) => {
                uiHaptic('selection');
                setAnswers((x) => (x[index] === undefined ? { ...x, [index]: a } : x));
              }}
              nextStory={nextStory}
              onOpenStory={onOpenStory}
              onSources={() => setSourcesOpen(true)}
              blurTarget={blurTarget}
            />
          </View>
        </View>
      </SafeAreaView>

      <Sheet visible={sourcesOpen} onClose={() => setSourcesOpen(false)} title={tr('stories.sources')} description={tr('stories.disclaimer')}>
        {story.sources.map((s) => (
          <Pressable key={s.url} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link" style={{ paddingVertical: t.space.sm, flexDirection: 'row', gap: t.space.sm, alignItems: 'center' }}>
            <Icon name="link" size="sm" color={t.tokens.mutedForeground} />
            <AppText variant="callout" style={{ flex: 1, textDecorationLine: 'underline' }}>
              {s.title}
            </AppText>
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

/**
 * The slide's photo with a slow 1 → 1.06 zoom (none when `zoomMs` is 0), the summary's blurred and
 * darkened cover, or — with no photo — a dark tone gradient with the slide's icon.
 */
function Backdrop({ photo, story, page, zoomMs }: { photo?: SlidePhoto; story: Story; page: ShownPage; zoomMs: number }) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const zooms = zoomMs > 0 && !!photo && !photo.blurred;
  useEffect(() => {
    if (zooms) scale.value = withTiming(ZOOM_TO, { duration: zoomMs, easing: Easing.linear });
  }, [zooms, zoomMs, scale]);
  const zoom = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!photo) {
    const tone = t.tone[story.tone ?? 'knowledge'];
    return (
      <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="slideFallback" x1="0" y1="0" x2="0.4" y2="1">
              <Stop offset="0" stopColor={tone.fg} stopOpacity={0.9} />
              <Stop offset="1" stopColor={t.focus.black} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#slideFallback)" />
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', paddingTop: '32%' }]}>
          <Icon name={page.icon ?? story.icon} size={112} color={t.focus.icon} strokeWidth={1.4} />
        </View>
      </View>
    );
  }
  return (
    <Animated.View style={[StyleSheet.absoluteFill, zoom]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={photo.source} placeholder={{ blurhash: photo.image.blurhash }} contentFit="cover" contentPosition={focusPosition(photo.image)} blurRadius={photo.blurred ? SUMMARY_BLUR : undefined} transition={180} style={StyleSheet.absoluteFill} />
      {photo.blurred ? <View style={[StyleSheet.absoluteFill, { backgroundColor: t.focus.black, opacity: SUMMARY_DIM }]} /> : null}
    </Animated.View>
  );
}

/** Top shade (0.35 → 0) for the status lines; bottom shade (0 → `max`, from 40 % height down) for the text. */
function SlideScrims({ max }: { max: number }) {
  const t = useTheme();
  const from = SCRIM_STOPS[0]![0];
  return (
    <>
      <Svg width="100%" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '22%' }} pointerEvents="none">
        <Defs>
          <LinearGradient id="slideTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.focus.black} stopOpacity={TOP_SCRIM} />
            <Stop offset="1" stopColor={t.focus.black} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#slideTop)" />
      </Svg>
      <Svg width="100%" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(1 - from) * 100}%` }} pointerEvents="none">
        <Defs>
          <LinearGradient id="slideBottom" x1="0" y1="0" x2="0" y2="1">
            {SCRIM_STOPS.map(([at, share]) => (
              <Stop key={at} offset={(at - from) / (1 - from)} stopColor={t.focus.black} stopOpacity={share * max} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#slideBottom)" />
      </Svg>
    </>
  );
}

function HeaderButton({ icon, color, label, onPress, filled }: { icon: IconName; color: string; label: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={filled === undefined ? undefined : { selected: filled }} hitSlop={8} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ opacity: filled === false ? 0.85 : 1 }}>
        <Icon name={filled ? 'bookmark' : icon} size={22} color={color} strokeWidth={filled ? 2.6 : undefined} />
      </View>
      {filled ? <View style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: color }} /> : null}
    </Pressable>
  );
}

/** Dark frosted card (theme `veil.card`, blur 20, radius 20) for myth, quiz, "did you know" and doctor slides. */
function VeilCard({ children, blurTarget, style, accent }: { children: ReactNode; blurTarget: Target; style?: ViewStyle; accent?: string }) {
  const t = useTheme();
  return (
    <View style={[{ borderRadius: 20, overflow: 'hidden', borderWidth: accent ? 2 : 0, borderColor: accent }, style]}>
      <BlurView intensity={20} tint="dark" blurTarget={blurTarget} blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: t.veil.card }]} />
      <View style={{ padding: t.space.xl, gap: t.space.md }}>{children}</View>
    </View>
  );
}

interface SlideProps {
  page: ShownPage;
  story: Story;
  meta: string;
  flipped: boolean;
  onFlip: () => void;
  answer?: number;
  onAnswer: (i: number) => void;
  nextStory?: Story;
  onOpenStory: (id: string) => void;
  onSources: () => void;
  blurTarget: Target;
}

/** One slide, laid out at the bottom over the scrim; `accessible` groups its text for screen readers. */
function Slide(p: SlideProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { page } = p;
  const W = t.focus.text;
  const accent = t.focus.orbCenter;
  const body = { fontSize: 18, lineHeight: 27 };
  const bottom = [styles.flex, { paddingHorizontal: t.space.gutter, justifyContent: 'flex-end' as const, paddingBottom: t.space.xxl, gap: t.space.md }];
  const label = (text: string, icon?: IconName) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
      {icon ? <Icon name={icon} size={20} color={accent} /> : null}
      <AppText variant="footnote" weight="700" color={t.focus.icon}>
        {text}
      </AppText>
    </View>
  );

  switch (page.type) {
    case 'cover':
      return (
        <View style={[bottom, { gap: t.space.sm }]} accessible accessibilityLabel={`${p.story.title}. ${p.meta}`} pointerEvents="none">
          <View style={{ alignSelf: 'flex-start', backgroundColor: t.veil.mid, borderRadius: t.radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
            <AppText variant="footnote" weight="600" color={W}>
              {tr(`stories.category.${p.story.category}`, sexCtx(currentSex()))}
            </AppText>
          </View>
          <AppText variant="title1" color={W} style={{ fontSize: 34, lineHeight: 41 }} accessibilityRole="header">
            {p.story.title}
          </AppText>
          <AppText variant="callout" color={t.focus.icon}>
            {p.meta}
          </AppText>
        </View>
      );

    case 'info':
      return (
        <View style={bottom} pointerEvents="none">
          <View style={{ gap: t.space.md }} accessible accessibilityLabel={`${page.title ?? ''}. ${page.text ?? ''}`}>
            {page.icon ? (
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.veil.mid, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={page.icon} size={24} color={W} />
              </View>
            ) : null}
            <AppText variant="title1" color={W} accessibilityRole="header">
              {page.title}
            </AppText>
            <AppText style={body} color={W}>
              {page.text}
            </AppText>
          </View>
        </View>
      );

    case 'myth':
      return <MythSlide {...p} />;

    case 'didYouKnow':
      return (
        <View style={bottom} pointerEvents="none">
          <VeilCard blurTarget={p.blurTarget}>
            <View accessible accessibilityLabel={`${tr('stories.didYouKnowTitle')}. ${page.title ?? ''} ${page.text ?? ''}`} style={{ gap: t.space.md }}>
              {label(tr('stories.didYouKnowTitle'), 'bulb')}
              {page.title ? (
                <AppText variant="title3" color={W}>
                  {page.title}
                </AppText>
              ) : null}
              <AppText style={body} color={W}>
                {page.text}
              </AppText>
            </View>
          </VeilCard>
        </View>
      );

    case 'quiz': {
      const q = page.quiz!;
      const answered = p.answer !== undefined;
      return (
        <View style={bottom} pointerEvents="box-none">
          <VeilCard blurTarget={p.blurTarget}>
            <View style={{ gap: t.space.md }} pointerEvents="none">
              {label(tr('stories.quizLabel'))}
              <AppText variant="title2" color={W} accessibilityRole="header">
                {q.question}
              </AppText>
            </View>
            <View style={{ gap: t.space.sm }} accessibilityRole="radiogroup">
              {q.options.map((o, i) => {
                const isCorrect = i === q.correct;
                const chosen = p.answer === i;
                const showCorrect = answered && isCorrect;
                const showWrong = answered && chosen && !isCorrect;
                return (
                  <Pressable
                    key={o}
                    onPress={() => p.onAnswer(i)}
                    disabled={answered}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: chosen, disabled: answered }}
                    accessibilityLabel={showCorrect ? `${o}, ${tr('stories.correct')}` : o}
                    style={{
                      minHeight: 52,
                      borderRadius: t.radius.button,
                      borderWidth: showCorrect ? 2 : 1,
                      borderColor: showCorrect ? accent : t.veil.bold,
                      backgroundColor: showCorrect ? t.veil.mid : t.veil.faint,
                      opacity: showWrong ? 0.7 : 1,
                      paddingHorizontal: t.space.lg,
                      paddingVertical: t.space.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: t.space.md,
                    }}
                  >
                    <AppText variant="body" weight={showCorrect ? '600' : '400'} color={W} style={{ flex: 1 }}>
                      {o}
                    </AppText>
                    {showCorrect ? <Icon name="check" size={22} color={accent} /> : null}
                    {showWrong ? <Icon name="close" size={22} color={t.focus.dim} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <View pointerEvents="none">
              {answered ? (
                <AppText variant="callout" color={W} accessibilityLiveRegion="polite">
                  {q.explain}
                </AppText>
              ) : (
                <AppText variant="footnote" color={t.focus.dim}>
                  {tr('stories.quizHint')}
                </AppText>
              )}
            </View>
          </VeilCard>
        </View>
      );
    }

    case 'action':
      return (
        <View style={[bottom, { gap: t.space.lg }]} pointerEvents="box-none">
          <View style={{ gap: t.space.md }} accessible accessibilityLabel={`${tr('stories.tryToday')}. ${page.title ?? ''}. ${page.text ?? ''}`} pointerEvents="none">
            {label(tr('stories.tryToday'), page.icon ?? 'target')}
            {page.title ? (
              <AppText variant="title1" color={W} accessibilityRole="header">
                {page.title}
              </AppText>
            ) : null}
            <AppText style={body} color={W}>
              {page.text}
            </AppText>
          </View>
          {page.action ? <Button label={page.action.label} variant="primary" size="lg" fullWidth onPress={() => router.push(page.action!.route as Href)} /> : null}
        </View>
      );

    case 'doctor':
      return (
        <View style={bottom} pointerEvents="none">
          <VeilCard blurTarget={p.blurTarget}>
            <View accessible accessibilityLabel={`${tr('stories.doctorTitle')}. ${(page.items ?? []).join('. ')}`} style={{ gap: t.space.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
                <Icon name="stethoscope" size={28} color={W} />
                <AppText variant="title2" color={W} style={{ flex: 1 }} accessibilityRole="header">
                  {tr('stories.doctorTitle')}
                </AppText>
              </View>
              <Bullets items={page.items ?? []} />
            </View>
          </VeilCard>
        </View>
      );

    case 'summary':
      return (
        <View style={[bottom, { gap: t.space.xl }]} pointerEvents="box-none">
          {page.items && page.items.length > 0 ? (
            <View style={{ gap: t.space.lg }} accessible accessibilityLabel={`${tr('stories.summaryTitle')}. ${page.items.join('. ')}`} pointerEvents="none">
              <AppText variant="title1" color={W} accessibilityRole="header">
                {tr('stories.summaryTitle')}
              </AppText>
              <Bullets items={page.items} check />
            </View>
          ) : (
            <View style={{ gap: t.space.sm }} pointerEvents="none">
              <AppText variant="title1" color={W} accessibilityRole="header">
                {p.story.title}
              </AppText>
              <AppText color={t.focus.icon}>{tr('stories.finished')}</AppText>
            </View>
          )}
          {p.nextStory ? <NextStoryCard story={p.nextStory} onPress={() => p.onOpenStory(p.nextStory!.id)} /> : null}
          <Pressable onPress={p.onSources} accessibilityRole="button" style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: t.space.sm, alignSelf: 'flex-start' }}>
            <Icon name="book" size="sm" color={W} />
            <AppText variant="callout" weight="600" color={W} style={{ textDecorationLine: 'underline' }}>
              {tr('stories.sourcesLink', { count: p.story.sources.length })}
            </AppText>
          </Pressable>
        </View>
      );
  }
}

function Bullets({ items, check }: { items: string[]; check?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.md }}>
      {items.map((it) => (
        <View key={it} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'flex-start' }}>
          {check ? (
            <View style={{ marginTop: 2 }}>
              <Icon name="check" size={20} color={t.focus.orbCenter} />
            </View>
          ) : (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.focus.text, marginTop: 10 }} />
          )}
          <AppText color={t.focus.text} style={{ flex: 1, fontSize: 17, lineHeight: 25 }}>
            {it}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function NextStoryCard({ story, onPress }: { story: Story; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${tr('stories.nextStory')}: ${story.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, backgroundColor: t.veil.card, borderColor: t.veil.mid, borderWidth: 1, borderRadius: 20, padding: t.space.md }}>
      <ExplorePhoto image={exploreImage('stories', story.id)} icon={story.icon} tone={story.tone ?? 'knowledge'} iconSize="lg" style={{ width: 64, height: 80, borderRadius: t.radius.md }} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="footnote" color={t.focus.icon}>
          {tr('stories.nextStory')}
        </AppText>
        <AppText variant="bodyStrong" color={t.focus.text}>
          {story.title}
        </AppText>
      </View>
      <Icon name="chevron" size="sm" color={t.focus.icon} />
    </Pressable>
  );
}

/** "Yaygın inanış" card that turns over to the fact; the story does not move on before it is turned. */
function MythSlide(p: SlideProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reduce = useReducedMotion();
  const turn = useSharedValue(p.flipped ? 1 : 0);
  useEffect(() => {
    turn.value = reduce ? (p.flipped ? 1 : 0) : withTiming(p.flipped ? 1 : 0, { duration: 420 });
  }, [p.flipped, reduce, turn]);
  const front = useAnimatedStyle(() => ({ opacity: turn.value < 0.5 ? 1 : 0, transform: [{ perspective: 900 }, { rotateY: `${turn.value * 180}deg` }] }));
  const back = useAnimatedStyle(() => ({ opacity: turn.value >= 0.5 ? 1 : 0, transform: [{ perspective: 900 }, { rotateY: `${(turn.value - 1) * 180}deg` }] }));
  const W = t.focus.text;
  const accent = t.focus.orbCenter;

  return (
    <View style={[styles.flex, { paddingHorizontal: t.space.gutter, justifyContent: 'flex-end', paddingBottom: t.space.xxl }]} pointerEvents="box-none">
      <Pressable onPress={p.flipped ? undefined : p.onFlip} disabled={p.flipped} pointerEvents={p.flipped ? 'none' : 'auto'} accessibilityRole="button" accessibilityLabel={p.flipped ? `${tr('stories.factLabel')}. ${p.page.fact}` : `${tr('stories.mythLabel')}. ${p.page.myth}`} accessibilityHint={p.flipped ? undefined : tr('stories.tapToFlip')}>
        <View>
          <Animated.View style={[{ backfaceVisibility: 'hidden' }, front]}>
            <VeilCard blurTarget={p.blurTarget} style={{ minHeight: 240, justifyContent: 'center' }}>
              <AppText variant="footnote" weight="700" color={t.focus.icon}>
                {tr('stories.mythLabel')}
              </AppText>
              <AppText variant="title2" color={W}>
                “{p.page.myth}”
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
                <Icon name="rotate" size="sm" color={accent} />
                <AppText variant="callout" weight="600" color={accent}>
                  {tr('stories.tapToFlip')}
                </AppText>
              </View>
            </VeilCard>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { backfaceVisibility: 'hidden' }, back]} pointerEvents="none">
            <VeilCard blurTarget={p.blurTarget} accent={accent} style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
                <Icon name="check" size={22} color={accent} />
                <AppText variant="footnote" weight="700" color={accent}>
                  {tr('stories.factLabel')}
                </AppText>
              </View>
              <AppText color={W} style={{ fontSize: 18, lineHeight: 27 }}>
                {p.page.fact}
              </AppText>
            </VeilCard>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  preload: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
  preloadImage: { width: 1, height: 1 },
  altAnchor: { position: 'absolute', top: 0, left: 0, width: 1, height: 1 },
});
