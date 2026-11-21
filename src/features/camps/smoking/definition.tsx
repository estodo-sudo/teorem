import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { CampDefinition, CampSummary } from '@/features/camps/core/definition';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

import { campNotificationRequests, handleCampResponse, setupCampCategory } from './campNotifications';
import { CAMP_DAYS, CAMP_ICON } from './content';
import { smokingCadence } from './engine/checkin';
import { totalSmokeFreeDays } from './engine/counters';
import { daysSinceQuit, SMOKING_PHASES } from './engine/phase';
import { DAY_BADGES, CRISIS_BADGES } from './engine/stats';
import { currentAttempt, latestAttempt } from './state';
import type { CampPhase, ToolId } from './types';
import { RowCard } from '@/features/content/RowCard';

/**
 * Sigarasız Kamp row in the "Kamplar" list. Opens without the paywall: the assessment, counters and
 * crisis tools of this camp are always free (premium parts are gated inside the camp).
 */
export function useSmokingSummary(): CampSummary {
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
  const day = a && a.status !== 'preparing' ? Math.min(CAMP_DAYS, Math.max(1, totalSmokeFreeDays(a, cigs, now))) : undefined;
  return { joined: Boolean(a || last), day, total: CAMP_DAYS, progress, status };
}

export function SmokingCampCard() {
  const { t: tr } = useTranslation();
  const { status, progress } = useSmokingSummary();
  return <RowCard icon={CAMP_ICON} tone="smokefree" title={tr('camp.title')} status={status} progress={progress} onPress={() => router.push('/camp')} />;
}

const SOS_TOOLS: ToolId[] = ['breath', 'puzzle', 'delay', 'reasons', 'call171'];

/** Sigarasız Kamp (90 Gün) on the shared camp engine. */
export const SMOKING_CAMP: CampDefinition<CampPhase> = {
  id: 'smoking',
  titleKey: 'camp.title',
  icon: CAMP_ICON,
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
    'camp/support.tr.json',
    'camp/rewards.tr.json',
    'camp/sources.json',
  ],
  color: 'primary',
  ageRule: 'all',
  privacy: 'standard',
  Card: SmokingCampCard,
  useSummary: useSmokingSummary,
  notifier: { setup: setupCampCategory, requests: campNotificationRequests, handleResponse: handleCampResponse },
};
