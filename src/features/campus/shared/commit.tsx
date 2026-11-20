import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
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

/** Last enrolment page of every campus: the user is the real strength of the programme. */
export function CommitmentView() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ gap: 18, paddingTop: t.space.sm }}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: tint(t.colors.accent, '26'), alignItems: 'center', justifyContent: 'center' }}>
          <IconTile icon="key" tone="campus" size="lg" round />
        </View>
        <AppText variant="h1" center accessibilityRole="header">
          {tr('campusCommit.title')}
        </AppText>
        <AppText variant="h3" center color={t.colors.accent}>
          {tr('campusCommit.lead')}
        </AppText>
      </View>
      <View style={{ gap: t.space.md, padding: 18, borderRadius: t.radius.xl, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
        <AppText style={{ lineHeight: 24 }}>{tr('campusCommit.p1')}</AppText>
        <AppText style={{ lineHeight: 24 }}>{tr('campusCommit.p2')}</AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: t.radius.lg, backgroundColor: t.tokens.muted }}>
        <IconTile icon="handshake" tone="campus" />
        <AppText weight="800" style={{ flex: 1 }}>
          {tr('campusCommit.pledge')}
        </AppText>
      </View>
    </View>
  );
}
