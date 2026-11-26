import { BlurView } from 'expo-blur';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLive } from '@/lib/useLive';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { useTheme } from './useTheme';

/**
 * Locked premium tabs (user request 2026-11-26): the page stays visible behind a blur — you can tell
 * there is something and see it move, but not read it. The whole page scrolls down slowly by itself
 * (and its horizontal strips drift left); nothing under the blur reacts to touch; "Premium'a özel" sits in
 * the middle and a tap anywhere opens the offer.
 */
export const PremiumPreviewContext = createContext(false);
/** True inside a locked preview: horizontal strips drift on their own. */
export const usePremiumPreview = () => useContext(PremiumPreviewContext);

/** Pixels moved per tick (≈ 40 ms): about 18 px/s down the page, 15 px/s along a strip. */
export const PREVIEW_SPEED = { down: 0.72, along: 0.6 } as const;
const TICK_MS = 40;
/** At the end the page waits, then glides back to the top and starts again. */
const END_PAUSE_MS = 1600;

/**
 * Moves a scroll position on its own while `on`: from 0 to `max`, waits, back to 0, again. `scrollTo` is
 * called with the new offset; it stops while the screen is not seen (battery).
 */
export function useAutoScroll(on: boolean, max: number, speed: number, scrollTo: (offset: number, animated: boolean) => void) {
  const live = useLive();
  const pos = useRef(0);
  useEffect(() => {
    if (!on || !live || max <= 0) return;
    let wait: ReturnType<typeof setTimeout> | null = null;
    const id = setInterval(() => {
      if (wait) return;
      pos.current = Math.min(max, pos.current + speed);
      scrollTo(pos.current, false);
      if (pos.current >= max) {
        wait = setTimeout(() => {
          pos.current = 0;
          scrollTo(0, true);
          wait = setTimeout(() => (wait = null), END_PAUSE_MS / 2);
        }, END_PAUSE_MS);
      }
    }, TICK_MS);
    return () => {
      clearInterval(id);
      if (wait) clearTimeout(wait);
    };
  }, [on, live, max, speed, scrollTo]);
}

/** The blur, the badge in the middle and the tap that opens the offer. */
export function PremiumOverlay({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${tr('premiumLock.title')}. ${tr('premiumLock.hint')}`} style={StyleSheet.absoluteFill} testID="premium-lock">
      <BlurView intensity={t.dark ? 28 : 34} tint={t.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: t.dark ? 'rgba(5,6,7,0.28)' : 'rgba(255,255,255,0.22)' }]} />
      <View style={styles.center} pointerEvents="none">
        <View style={{ alignItems: 'center', gap: t.space.sm, paddingVertical: t.space.xl, paddingHorizontal: t.space.xxl, borderRadius: t.radius.xl, backgroundColor: t.tokens.card, borderWidth: t.border.thin, borderColor: t.tokens.border }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.primarySoft }}>
            <Icon name="lock" size="lg" color={t.tokens.primary} />
          </View>
          <AppText variant="title3" weight="800" center>
            {tr('premiumLock.title')}
          </AppText>
          <AppText variant="footnote" muted center>
            {tr('premiumLock.hint')}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

/** Measures a scroll view's viewport and content so useAutoScroll knows how far it can go. */
export function useScrollRange() {
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  return { max: Math.max(0, content - viewport), setViewport, setContent };
}

const styles = StyleSheet.create({ center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24 } });
