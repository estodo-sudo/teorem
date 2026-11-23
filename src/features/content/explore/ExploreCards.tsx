import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { ScalePressable, uiHaptic } from '@/components/ui';
import type { ModuleTone } from '@/config/theme';
import type { ExploreImage } from '@/content/images';

/** Card sizes (SPEC_KESFET_V2 §4). */
export const CARD = {
  poster: { w: 148, h: 220 },
  camp: { w: 300, h: 240, image: 140 },
  program: { w: 220, h: 260, image: 130 },
  glossary: { w: 280, h: 96, image: 72 },
  featured: { h: 200 },
} as const;

/**
 * Bundled photo with its blurhash placeholder and a 200 ms fade (expo-image), or — when an item has no
 * photo — the tone gradient with a big icon (§5.5). In dark mode a 10 % veil keeps photos from glaring.
 */
export function ExplorePhoto({ image, icon, tone, style, iconSize = 'xl', blur, wide }: { image?: ExploreImage; icon: IconName; tone: ModuleTone; style?: ViewStyle; iconSize?: 'lg' | 'xl' | number; blur?: number; /** Use the wide banner crop when the photo has one (Keşfet story of the day). */ wide?: boolean }) {
  const t = useTheme();
  const c = t.tone[tone];
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: c.soft }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {image ? (
        <Image source={wide && image.wide ? image.wide : image.image} placeholder={{ blurhash: image.blurhash }} contentFit="cover" contentPosition={wide && image.wide ? 'center' : focusPosition(image)} transition={200} blurRadius={blur} style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="fallback" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={c.soft} />
                <Stop offset="1" stopColor={c.fg} stopOpacity={0.45} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#fallback)" />
          </Svg>
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Icon name={icon} size={iconSize} color={c.fg} />
          </View>
        </>
      )}
      {image && t.dark ? <View style={[StyleSheet.absoluteFill, { backgroundColor: t.focus.black, opacity: 0.1 }]} /> : null}
    </View>
  );
}

/** expo-image `contentPosition` from the crop focus (SPEC_GORSELLER_V5 §5). */
export const focusPosition = (image: ExploreImage) => ({ left: `${Math.round(image.focus.x * 100)}%` as const, top: `${Math.round(image.focus.y * 100)}%` as const });

/** Black → clear gradient over the lower half of a photo so white text stays readable (§4). */
export function Scrim({ height = '55%' }: { height?: ViewStyle['height'] }) {
  const t = useTheme();
  return (
    <Svg width="100%" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }} pointerEvents="none">
      <Defs>
        <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.focus.black} stopOpacity={0} />
          <Stop offset="1" stopColor={t.focus.black} stopOpacity={0.65} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#scrim)" />
    </Svg>
  );
}

/** Common pressable shell: radius 20, surface, 1 px border, 0.98 press + light haptic. */
function Shell({ onPress, label, hint, style, children }: { onPress: () => void; label: string; hint?: string; style?: ViewStyle; children: ReactNode }) {
  const t = useTheme();
  return (
    <ScalePressable
      onPress={() => {
        uiHaptic('light');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={[{ borderRadius: t.radius.lg, borderWidth: t.border.thin, borderColor: t.tokens.border, backgroundColor: t.tokens.card, overflow: 'hidden' }, style]}
    >
      {children}
    </ScalePressable>
  );
}

// ---------------------------------------------------------------- 4.1 featured story

export function FeaturedStoryCard({ title, kicker, meta, resume, image, icon, tone, locked, onPress }: { title: string; kicker: string; meta: string; resume?: string; image?: ExploreImage; icon: IconName; tone: ModuleTone; locked: boolean; onPress: () => void }) {
  const t = useTheme();
  const f = t.focus;
  return (
    <Shell onPress={onPress} label={`${kicker}: ${title}. ${resume ? `${resume}. ` : ''}${meta}`} style={{ minHeight: CARD.featured.h }}>
      {/* The wide crop made for this banner (2026-11-23), not the 2:3 poster cut again. */}
      <ExplorePhoto image={image} icon={icon} tone={tone} style={StyleSheet.absoluteFill} wide />
      <Scrim height="70%" />
      <View style={{ flex: 1, minHeight: CARD.featured.h, flexDirection: 'row', alignItems: 'flex-end', padding: t.space.lg, gap: t.space.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" color={f.icon}>
            {kicker}
          </AppText>
          <AppText variant="title2" color={f.text}>
            {title}
          </AppText>
          {resume ? (
            <AppText variant="footnote" weight="600" color={f.text}>
              {resume}
            </AppText>
          ) : null}
          <AppText variant="footnote" color={f.icon}>
            {meta}
          </AppText>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.veil.strong, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={locked ? 'lock' : 'play'} size="md" color={f.text} />
        </View>
      </View>
    </Shell>
  );
}

// ---------------------------------------------------------------- 4.2 story poster

/**
 * Story poster (SPEC_V4 §B.2): read → a check top right; half read → a thin progress line at the bottom;
 * saved → a small bookmark top left. Unread ones keep the primary ring.
 */
export function StoryPosterCard({ title, read, progress = 0, saved, image, icon, tone, stateLabel, plain, onPress }: { title: string; read: boolean; progress?: number; saved?: boolean; image?: ExploreImage; icon: IconName; tone: ModuleTone; stateLabel?: string; /** No unread ring or read check (glossary posters on Günüm). */ plain?: boolean; onPress: () => void }) {
  const t = useTheme();
  const ringed = !plain && !read && progress === 0;
  return (
    <Shell onPress={onPress} label={stateLabel ? `${title}, ${stateLabel}` : title} style={{ width: CARD.poster.w, minHeight: CARD.poster.h, flex: 1, borderWidth: ringed ? t.border.thick : t.border.thin, borderColor: ringed ? t.tokens.primary : t.tokens.border }}>
      <ExplorePhoto image={image} icon={icon} tone={tone} style={StyleSheet.absoluteFill} />
      <Scrim />
      {!plain && read && progress === 0 ? (
        <View style={{ position: 'absolute', top: t.space.sm, right: t.space.sm, width: 24, height: 24, borderRadius: 12, backgroundColor: t.focus.text, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size="sm" color={t.tokens.primary} />
        </View>
      ) : null}
      {saved ? (
        <View style={{ position: 'absolute', top: t.space.sm, left: t.space.sm, width: 24, height: 24, borderRadius: 12, backgroundColor: t.veil.shadow, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bookmark" size={14} color={t.focus.text} />
        </View>
      ) : null}
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: t.space.md }}>
        <AppText variant="callout" color={t.focus.text} style={{ fontWeight: '600' }} numberOfLines={3}>
          {title}
        </AppText>
      </View>
      {progress > 0 ? (
        <View style={{ position: 'absolute', left: t.space.md, right: t.space.md, bottom: t.space.sm, height: 3, borderRadius: 2, backgroundColor: t.veil.bold, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(progress * 100)}%`, height: 3, backgroundColor: t.focus.text }} />
        </View>
      ) : null}
    </Shell>
  );
}

// ---------------------------------------------------------------- 4.3 camp

export function CampWideCard({ title, description, lengthLabel, image, icon, tone, joined, progress, status, locked, startLabel, continueLabel, dayLabel, onPress }: {
  title: string; description: string; lengthLabel: string; image?: ExploreImage; icon: IconName; tone: ModuleTone; joined: boolean; day?: number; total: number; progress: number; status: string; locked?: boolean; startLabel: string; continueLabel: string; dayLabel?: string; onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Shell onPress={onPress} label={`${title}. ${status}`} style={{ width: CARD.camp.w, minHeight: CARD.camp.h, flex: 1 }}>
      <View style={{ height: CARD.camp.image }}>
        <ExplorePhoto image={image} icon={icon} tone={tone} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top: t.space.md, left: t.space.md, flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingRight: t.space.sm, borderRadius: t.radius.md, backgroundColor: t.tokens.card }}>
          <View style={{ width: 32, height: 32, borderRadius: t.radius.md, backgroundColor: t.tone[tone].soft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size="sm" color={t.tone[tone].fg} />
          </View>
          <AppText variant="caption">{lengthLabel}</AppText>
        </View>
      </View>
      <View style={{ flex: 1, padding: t.space.lg, gap: t.space.sm }}>
        <AppText variant="title3">{title}</AppText>
        <AppText variant="footnote" muted>
          {joined && dayLabel ? status : description}
        </AppText>
        <View style={{ flex: 1 }} />
        {joined ? (
          <View style={{ gap: t.space.xs }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: t.tokens.muted, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%`, height: '100%', backgroundColor: t.tone[tone].fg }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.sm }}>
              <AppText variant="footnote" muted tabular style={{ flex: 1 }}>
                {dayLabel ?? status}
              </AppText>
              <Pill label={locked ? '' : continueLabel} icon={locked ? 'lock' : undefined} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pill label={startLabel} filled />
          </View>
        )}
      </View>
    </Shell>
  );
}

/** Small action pill inside a card (the whole card is the button). */
function Pill({ label, filled, icon }: { label: string; filled?: boolean; icon?: IconName }) {
  const t = useTheme();
  return (
    <View style={{ minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.md, borderRadius: t.radius.pill, backgroundColor: filled ? t.tokens.primary : t.tokens.primarySoft }}>
      {icon ? <Icon name={icon} size="sm" color={filled ? t.tokens.primaryForeground : t.tokens.primary} /> : null}
      {label ? (
        <AppText variant="footnote" style={{ fontWeight: '600', color: filled ? t.tokens.primaryForeground : t.tokens.primary }}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------- 4.4 programme

/** Blur of a "Yakında" card's photo: medium-light, the scene still reads. */
const SOON_BLUR = 3;

/**
 * A training programme card. With `soon` (user request 2026-11-22) the card is locked: the photo is
 * softly blurred, a "Yakında" tag sits on its corner and tapping does nothing.
 */
export function ProgramCard({ title, lengthLabel, progressLabel, progress, image, icon, tone, locked, soon, onPress }: { title: string; lengthLabel: string; progressLabel?: string; progress: number; image?: ExploreImage; icon: IconName; tone: ModuleTone; locked: boolean; soon?: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Shell onPress={soon ? () => undefined : onPress} label={`${title}. ${soon ?? lengthLabel}${progressLabel ? `. ${progressLabel}` : ''}`} style={{ width: CARD.program.w, minHeight: CARD.program.h, flex: 1 }}>
      <View style={{ height: CARD.program.image }}>
        <ExplorePhoto image={image} icon={icon} tone={tone} blur={soon ? SOON_BLUR : undefined} style={{ height: CARD.program.image }} />
        {soon ? (
          <View
            style={{ position: 'absolute', top: t.space.sm, left: t.space.sm, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: t.space.sm, paddingVertical: 3, borderRadius: t.radius.pill, backgroundColor: t.tokens.card }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Icon name="clock" size={12} color={t.tokens.primary} />
            <AppText variant="caption" weight="700" color={t.tokens.primary}>
              {soon}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, padding: t.space.lg, gap: t.space.sm }}>
        <AppText variant="title3" numberOfLines={3}>
          {title}
        </AppText>
        <View style={{ flex: 1 }} />
        {soon ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
            <View style={{ minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.sm, borderRadius: t.radius.pill, backgroundColor: t.tokens.muted }}>
              <Icon name={locked ? 'lock' : 'calendar'} size="sm" color={t.tokens.mutedForeground} />
              <AppText variant="caption">{lengthLabel}</AppText>
            </View>
          </View>
        )}
        {progressLabel ? (
          <View style={{ gap: t.space.xs }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: t.tokens.muted, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%`, height: '100%', backgroundColor: t.tone[tone].fg }} />
            </View>
            <AppText variant="footnote" muted tabular>
              {progressLabel}
            </AppText>
          </View>
        ) : null}
      </View>
    </Shell>
  );
}

// ---------------------------------------------------------------- 4.5 glossary

export function GlossaryCompactCard({ title, summary, image, icon, tone, onPress }: { title: string; summary: string; image?: ExploreImage; icon: IconName; tone: ModuleTone; onPress: () => void }) {
  const t = useTheme();
  return (
    <Shell onPress={onPress} label={`${title}. ${summary}`} style={{ width: CARD.glossary.w, minHeight: CARD.glossary.h, flexDirection: 'row', alignItems: 'center', gap: t.space.md, padding: t.space.md }}>
      <ExplorePhoto image={image} icon={icon} tone={tone} iconSize="lg" style={{ width: CARD.glossary.image, height: CARD.glossary.image, borderRadius: t.radius.button }} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {title}
        </AppText>
        <AppText variant="footnote" muted>
          {summary}
        </AppText>
      </View>
    </Shell>
  );
}
