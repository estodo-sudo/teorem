import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Button, Sheet, uiHaptic } from '@/components/ui';
import { exploreImage } from '@/content/explore/images';
import { useScreenReader } from '@/lib/useScreenReader';

import type { Story } from '../data';
import { ExplorePhoto, Scrim } from '../explore/ExploreCards';
import { pageDurationMs, storyPages, waitsForReader, type ShownPage } from './pages';

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
 * Bilgi Hikâyeleri v2 viewer (SPEC_V4 §B.1). Full screen; thin progress lines; tap the right two
 * thirds to go on and the left third to go back, hold to pause, swipe down to close, swipe left on
 * the last slide for the next story. Auto-advance follows the reading time, and is off with "reduce
 * motion" or a screen reader. Only the cover is a photo; the other slides sit on the theme background.
 */
export function StoryViewer({ story, startAt = 0, saved, onToggleSave, onIndex, onReachedEnd, onClose, nextStory, onOpenStory }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const pages = useMemo(() => storyPages(story), [story]);
  const reduce = useReducedMotion();
  const screenReader = useScreenReader();
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startAt), pages.length - 1));
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const reached = useRef(false);
  const page = pages[index]!;
  const last = index === pages.length - 1;
  const dur = pageDurationMs(page);
  const auto = !reduce && !screenReader && !waitsForReader(page);
  const blocked = page.type === 'myth' && !flipped[index];

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

  const onPhoto = page.type === 'cover';
  const fg = onPhoto ? t.focus.text : t.tokens.foreground;
  const tone = t.tone[story.tone ?? 'knowledge'];
  const shownMinutes = story.minutes;

  return (
    <View style={[styles.flex, { backgroundColor: t.tokens.background }]} {...pan.panHandlers}>
      {onPhoto ? (
        <>
          <ExplorePhoto image={exploreImage('stories', story.id)} icon={story.icon} tone={story.tone ?? 'knowledge'} style={StyleSheet.absoluteFill} />
          <Scrim height="70%" />
          {/* Top shade so the white status lines, title and buttons read on light photos. */}
          <Svg width="100%" height={140} style={{ position: 'absolute', left: 0, right: 0, top: 0 }} pointerEvents="none">
            <Defs>
              <LinearGradient id="storyTop" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={t.focus.black} stopOpacity={0.55} />
                <Stop offset="1" stopColor={t.focus.black} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#storyTop)" />
          </Svg>
        </>
      ) : null}
      <SafeAreaView style={styles.flex}>
        {/* Status: one line per slide, title, save and close. */}
        <View style={{ paddingHorizontal: t.space.lg, paddingTop: t.space.sm, gap: t.space.md }} accessibilityElementsHidden={false}>
          <View style={{ flexDirection: 'row', gap: 4 }} accessible accessibilityLabel={tr('stories.position', { index: index + 1, count: pages.length })}>
            {pages.map((_, i) => {
              const fill = i < index ? 1 : i > index ? 0 : auto ? Math.min(1, elapsed / dur) : 1;
              return (
                <View key={i} style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: onPhoto ? t.veil.bold : t.tokens.border, overflow: 'hidden' }}>
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
            <Slide
              key={index}
              page={page}
              story={story}
              meta={tr('stories.meta', { min: shownMinutes, count: pages.length })}
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
              accent={tone.fg}
              accentSoft={tone.soft}
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
  accent: string;
  accentSoft: string;
}

/** One slide; `accessible` groups its text so a screen reader reads title → text in one go. */
function Slide(p: SlideProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { page } = p;
  const pad = { paddingHorizontal: t.space.gutter };
  const body = { fontSize: 18, lineHeight: 27 };

  switch (page.type) {
    case 'cover':
      return (
        <View style={[styles.flex, pad, { justifyContent: 'flex-end', paddingBottom: t.space.xxl, gap: t.space.sm }]} accessible accessibilityLabel={`${p.story.title}. ${p.meta}`} pointerEvents="none">
          <View style={{ alignSelf: 'flex-start', backgroundColor: t.veil.mid, borderRadius: t.radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
            <AppText variant="footnote" weight="600" color={t.focus.text}>
              {tr(`stories.category.${p.story.category}`)}
            </AppText>
          </View>
          <AppText variant="title1" color={t.focus.text} style={{ fontSize: 34, lineHeight: 41 }} accessibilityRole="header">
            {p.story.title}
          </AppText>
          <AppText variant="callout" color={t.focus.icon}>
            {p.meta}
          </AppText>
        </View>
      );

    case 'info': {
      const support = page.support ?? [];
      return (
        <View style={styles.flex} pointerEvents="none">
          <View style={{ height: '38%', marginTop: t.space.md, marginHorizontal: t.space.gutter, borderRadius: t.radius.xl, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }} accessible={false} importantForAccessibility="no-hide-descendants">
            {page.icon ? <Icon name={page.icon} size={96} color={p.accent} strokeWidth={1.5} /> : null}
            {support.slice(0, 2).map((ic, i) => (
              <View key={ic} style={{ position: 'absolute', top: i === 0 ? '18%' : undefined, bottom: i === 1 ? '18%' : undefined, left: i === 0 ? '16%' : undefined, right: i === 1 ? '16%' : undefined, width: 48, height: 48, borderRadius: 24, backgroundColor: t.tokens.card, opacity: 0.6, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={ic} size={24} color={p.accent} />
              </View>
            ))}
          </View>
          <View style={[pad, { paddingTop: t.space.xl, gap: t.space.md }]} accessible accessibilityLabel={`${page.title ?? ''}. ${page.text ?? ''}`}>
            <AppText variant="title1" accessibilityRole="header">
              {page.title}
            </AppText>
            <AppText style={body}>{page.text}</AppText>
          </View>
        </View>
      );
    }

    case 'myth':
      return <MythSlide {...p} />;

    case 'didYouKnow':
      return (
        <View style={[styles.flex, pad, { justifyContent: 'center' }]} pointerEvents="none">
          <View style={{ backgroundColor: t.tokens.card, borderColor: t.tokens.border, borderWidth: 1, borderLeftWidth: 4, borderLeftColor: t.tokens.highlight, borderRadius: t.radius.lg, padding: t.space.xl, gap: t.space.md }} accessible accessibilityLabel={`${tr('stories.didYouKnowTitle')}. ${page.title ?? ''} ${page.text ?? ''}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
              <Icon name="bulb" size={24} color={t.tokens.highlight} />
              <AppText variant="footnote" weight="700" muted>
                {tr('stories.didYouKnowTitle')}
              </AppText>
            </View>
            {page.title ? <AppText variant="title3">{page.title}</AppText> : null}
            <AppText style={body}>{page.text}</AppText>
          </View>
        </View>
      );

    case 'quiz': {
      const q = page.quiz!;
      const answered = p.answer !== undefined;
      return (
        <View style={[styles.flex, pad, { paddingTop: t.space.xl, gap: t.space.lg }]} pointerEvents="box-none">
          <View style={{ gap: t.space.lg }} pointerEvents="none">
            <AppText variant="footnote" weight="700" muted>
              {tr('stories.quizLabel')}
            </AppText>
            <AppText variant="title2" accessibilityRole="header">
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
                    minHeight: 56,
                    borderRadius: t.radius.button,
                    borderWidth: showCorrect ? 2 : 1,
                    borderColor: showCorrect ? t.tokens.primary : t.tokens.border,
                    backgroundColor: showCorrect ? t.tokens.primarySoft : showWrong ? t.tokens.muted : t.tokens.card,
                    paddingHorizontal: t.space.lg,
                    paddingVertical: t.space.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.space.md,
                  }}
                >
                  <AppText variant="body" weight={showCorrect ? '600' : '400'} style={{ flex: 1 }}>
                    {o}
                  </AppText>
                  {showCorrect ? <Icon name="check" size={22} color={t.tokens.primary} /> : null}
                  {showWrong ? <Icon name="close" size={22} color={t.tokens.mutedForeground} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View pointerEvents="none">
            {answered ? (
              <AppText style={body} accessibilityLiveRegion="polite">
                {q.explain}
              </AppText>
            ) : (
              <AppText variant="footnote" muted>
                {tr('stories.quizHint')}
              </AppText>
            )}
          </View>
        </View>
      );
    }

    case 'action':
      return (
        <View style={[styles.flex, pad, { justifyContent: 'center', gap: t.space.lg }]} pointerEvents="box-none">
          <View style={{ gap: t.space.md }} accessible accessibilityLabel={`${tr('stories.tryToday')}. ${page.title ?? ''}. ${page.text ?? ''}`} pointerEvents="none">
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: p.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={page.icon ?? 'target'} size={28} color={p.accent} />
            </View>
            <AppText variant="footnote" weight="700" muted>
              {tr('stories.tryToday')}
            </AppText>
            {page.title ? (
              <AppText variant="title1" accessibilityRole="header">
                {page.title}
              </AppText>
            ) : null}
            <AppText style={body}>{page.text}</AppText>
          </View>
          {page.action ? <Button label={page.action.label} variant="primary" size="lg" fullWidth onPress={() => router.push(page.action!.route as Href)} /> : null}
        </View>
      );

    case 'doctor':
      return (
        <View style={[styles.flex, pad, { justifyContent: 'center' }]} pointerEvents="none">
          <View style={{ backgroundColor: t.tokens.muted, borderRadius: t.radius.lg, padding: t.space.xl, gap: t.space.lg }} accessible accessibilityLabel={`${tr('stories.doctorTitle')}. ${(page.items ?? []).join('. ')}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
              <Icon name="stethoscope" size={28} color={t.tokens.foreground} />
              <AppText variant="title2" style={{ flex: 1 }} accessibilityRole="header">
                {tr('stories.doctorTitle')}
              </AppText>
            </View>
            <Bullets items={page.items ?? []} />
          </View>
        </View>
      );

    case 'summary':
      return (
        <View style={[styles.flex, pad, { paddingTop: t.space.xl, paddingBottom: t.space.xl, gap: t.space.xl }]} pointerEvents="box-none">
          {page.items && page.items.length > 0 ? (
            <View style={{ gap: t.space.lg }} accessible accessibilityLabel={`${tr('stories.summaryTitle')}. ${page.items.join('. ')}`} pointerEvents="none">
              <AppText variant="title1" accessibilityRole="header">
                {tr('stories.summaryTitle')}
              </AppText>
              <Bullets items={page.items} check />
            </View>
          ) : (
            <View style={{ gap: t.space.sm }} pointerEvents="none">
              <AppText variant="title1" accessibilityRole="header">
                {p.story.title}
              </AppText>
              <AppText muted>{tr('stories.finished')}</AppText>
            </View>
          )}
          {p.nextStory ? <NextStoryCard story={p.nextStory} onPress={() => p.onOpenStory(p.nextStory!.id)} /> : null}
          <Pressable onPress={p.onSources} accessibilityRole="button" style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: t.space.sm, alignSelf: 'flex-start' }}>
            <Icon name="book" size="sm" color={t.tokens.primary} />
            <AppText variant="callout" weight="600" color={t.tokens.primary}>
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
              <Icon name="check" size={20} color={t.tokens.primary} />
            </View>
          ) : (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.tokens.foreground, marginTop: 10 }} />
          )}
          <AppText style={{ flex: 1, fontSize: 17, lineHeight: 25 }}>{it}</AppText>
        </View>
      ))}
    </View>
  );
}

function NextStoryCard({ story, onPress }: { story: Story; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${tr('stories.nextStory')}: ${story.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, backgroundColor: t.tokens.card, borderColor: t.tokens.border, borderWidth: 1, borderRadius: t.radius.lg, padding: t.space.md }}>
      <ExplorePhoto image={exploreImage('stories', story.id)} icon={story.icon} tone={story.tone ?? 'knowledge'} iconSize="lg" style={{ width: 64, height: 80, borderRadius: t.radius.md }} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="footnote" muted>
          {tr('stories.nextStory')}
        </AppText>
        <AppText variant="bodyStrong">{story.title}</AppText>
      </View>
      <Icon name="chevron" size="sm" color={t.tokens.mutedForeground} />
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
  const card = { minHeight: 280, borderRadius: t.radius.xl, padding: t.space.xl, gap: t.space.lg, justifyContent: 'center' as const, backfaceVisibility: 'hidden' as const };

  return (
    <View style={[styles.flex, { paddingHorizontal: t.space.gutter, justifyContent: 'center' }]} pointerEvents="box-none">
      <Pressable onPress={p.flipped ? undefined : p.onFlip} disabled={p.flipped} pointerEvents={p.flipped ? 'none' : 'auto'} accessibilityRole="button" accessibilityLabel={p.flipped ? `${tr('stories.factLabel')}. ${p.page.fact}` : `${tr('stories.mythLabel')}. ${p.page.myth}`} accessibilityHint={p.flipped ? undefined : tr('stories.tapToFlip')}>
        <View>
          <Animated.View style={[card, { backgroundColor: t.tokens.card, borderWidth: 1, borderColor: t.tokens.border }, front]}>
            <AppText variant="footnote" weight="700" muted>
              {tr('stories.mythLabel')}
            </AppText>
            <AppText variant="title2" muted>
              “{p.page.myth}”
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
              <Icon name="rotate" size="sm" color={t.tokens.primary} />
              <AppText variant="callout" weight="600" color={t.tokens.primary}>
                {tr('stories.tapToFlip')}
              </AppText>
            </View>
          </Animated.View>
          <Animated.View style={[card, StyleSheet.absoluteFill, { backgroundColor: t.tokens.card, borderWidth: 2, borderColor: t.tokens.primary }, back]} pointerEvents="none">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
              <Icon name="check" size={22} color={t.tokens.primary} />
              <AppText variant="footnote" weight="700" color={t.tokens.primary}>
                {tr('stories.factLabel')}
              </AppText>
            </View>
            <AppText style={{ fontSize: 18, lineHeight: 27 }}>{p.page.fact}</AppText>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
