import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Icon, ProgressBar, useTheme } from '@/components';
import type { CampDefinition } from '@/features/camps/core/definition';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

import { campNotificationRequests, handleCampResponse, setupCampCategory } from './campNotifications';
import { CAMP_DAYS, CAMP_EMOJI } from './content';
import { smokingCadence } from './engine/checkin';
import { totalSmokeFreeDays } from './engine/counters';
import { daysSinceQuit, SMOKING_PHASES } from './engine/phase';
import { DAY_BADGES, CRISIS_BADGES } from './engine/stats';
import { currentAttempt, latestAttempt } from './state';
import type { CampPhase, ToolId } from './types';

/**
 * Sigarasız Kamp row in the "Kamplar" list. Opens without the paywall: the assessment, counters and
 * crisis tools of this camp are always free (premium parts are gated inside the camp).
 */
export function SmokingCampCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const s = useCampStore((x) => x);
  const cigs = useCampEventsStore((x) => x.cigarettes);
  const now = new Date();
  const a = currentAttempt(s);
  const last = latestAttempt(s);
  let status = tr('camp.card.setup');
  let progress = 0;
  if (a && a.status === 'preparing') status = tr('camp.card.preparing', { count: Math.max(0, -daysSinceQuit(a, now)) });
  else if (a) {
    const days = totalSmokeFreeDays(a, cigs, now);
    status = tr('camp.card.active', { count: days });
    progress = Math.min(1, days / CAMP_DAYS);
  } else if (last?.status === 'graduated') {
    status = tr('camp.card.graduated');
    progress = 1;
  }
  return (
    <Card onPress={() => router.push('/camp')} accessibilityLabel={`${tr('camp.title')}, ${status}`} style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="h1">{CAMP_EMOJI}</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{tr('camp.title')}</AppText>
          <AppText variant="small" weight="700" color={t.colors.primary}>
            {status}
          </AppText>
        </View>
        <Icon name="chevron" color={t.colors.textMuted} size={18} />
      </View>
      <ProgressBar value={progress} height={6} />
    </Card>
  );
}

const SOS_TOOLS: ToolId[] = ['surf', 'breath', 'delay', 'four_e', 'reasons', 'game', 'coach', 'call171'];

/** Sigarasız Kamp (90 Gün) on the shared camp engine. */
export const SMOKING_CAMP: CampDefinition<CampPhase> = {
  id: 'smoking',
  titleKey: 'camp.title',
  emoji: CAMP_EMOJI,
  days: CAMP_DAYS,
  route: '/camp',
  phases: SMOKING_PHASES,
  checkinCadence: smokingCadence,
  sosTools: SOS_TOOLS,
  badges: [...DAY_BADGES.map((d) => `days-${d}`), 'saved-1000', ...CRISIS_BADGES.map((c) => `crisis-${c}`), 'first-plan', 'all-skills', 'checkin-7', 'graduate'],
  contentFiles: [
    'camp/onboarding.tr.json',
    'camp/plans.tr.json',
    'camp/health-timeline.tr.json',
    'camp/sos.tr.json',
    'camp/checkin.tr.json',
    'camp/missions.tr.json',
    'camp/skills.tr.json',
    'camp/library.tr.json',
    'camp/coach.tr.json',
    'camp/support.tr.json',
    'camp/rewards.tr.json',
    'camp/sources.json',
  ],
  color: 'primary',
  ageRule: 'all',
  privacy: 'standard',
  Card: SmokingCampCard,
  notifier: { setup: setupCampCategory, requests: campNotificationRequests, handleResponse: handleCampResponse },
};
