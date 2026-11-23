import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { IconTile } from '@/components/ui';
import { appImage } from '@/content/images';
import { useNow } from '@/lib/useNow';

import { tint } from './ui';

/** How long the commitment page holds the enrol button. */
export const COMMIT_SECONDS = 5;

/**
 * Seconds left before the enrol button unlocks on the commitment page.
 * The countdown starts when `active` becomes true and resets when it turns false.
 */
export function useCommitGate(active: boolean, seconds = COMMIT_SECONDS): number {
  const now = useNow(250).getTime();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // Adjust state while rendering (no effect): start on entering, clear on leaving.
  if (active && startedAt === null) setStartedAt(now);
  if (!active && startedAt !== null) setStartedAt(null);
  if (!active || startedAt === null) return seconds;
  return Math.max(0, seconds - Math.floor((now - startedAt) / 1000));
}

const POINT_ICONS: IconName[] = ['target', 'handshake', 'rotate'];

/**
 * Last enrolment page of every camp (Sigarasız, Alkolsüz, Odak) — redesigned 2026-11-23: a photo of a
 * man with open arms on a summit with the title on it, three short points (the decision is yours; the
 * tools are ours, the steps are yours; determined, not perfect) and the pledge.
 */
export function CommitmentView() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const photo = appImage('hero/commit');
  const points = tr('campusCommit.points', { returnObjects: true }) as { title: string; text: string }[];
  const f = t.focus;
  return (
    <View style={{ gap: t.space.lg, paddingTop: t.space.xs }}>
      <View style={{ minHeight: 300, borderRadius: t.radius.xl, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: t.tone.campus.soft }}>
        {photo ? <Image source={photo.image} placeholder={{ blurhash: photo.blurhash }} contentFit="cover" contentPosition="top" transition={200} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="commitVeil" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.35" stopColor={f.black} stopOpacity={0} />
              <Stop offset="1" stopColor={f.black} stopOpacity={0.8} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#commitVeil)" />
        </Svg>
        <View style={{ padding: t.space.lg, gap: t.space.xs }}>
          <AppText variant="title1" accessibilityRole="header" color={f.text}>
            {tr('campusCommit.title')}
          </AppText>
          <AppText variant="callout" weight="600" color={f.icon}>
            {tr('campusCommit.lead')}
          </AppText>
        </View>
      </View>

      <View style={{ gap: t.space.md }}>
        {points.map((p, i) => (
          <View key={p.title} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'flex-start' }}>
            <IconTile icon={POINT_ICONS[i] ?? 'check'} tone="campus" />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">{p.title}</AppText>
              <AppText variant="callout" muted style={{ lineHeight: 22 }}>
                {p.text}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'center', padding: t.space.lg, borderRadius: t.radius.lg, backgroundColor: tint(t.colors.accent, '1F'), borderWidth: 1, borderColor: tint(t.colors.accent, '55') }}>
        <Icon name="handshake" size="lg" color={t.colors.accent} />
        <AppText weight="800" style={{ flex: 1 }}>
          {tr('campusCommit.pledge')}
        </AppText>
      </View>
    </View>
  );
}
