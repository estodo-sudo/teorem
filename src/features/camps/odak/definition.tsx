import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { CampDefinition, CampSummary } from '@/features/camps/core/definition';

import { ODAK_DAYS, ODAK_ICON } from './content';
import { programStart } from './engine/checkin';
import { ODAK_PHASES, odakCadence, programDay, programProgress, type OdakPhase } from './engine/phase';
import { isLocked, useOdakLockStore } from './privacy/lockStore';
import { odakNotifier } from './notifications';
import { useOdakStore } from './store';
import { RowCard } from '@/features/content/RowCard';

/**
 * Odak Kampı row in the "Kamplar" list: neutral title and progress only. While the camp is locked its
 * data is not decrypted, so the row shows the lock instead of the day.
 */
export function useOdakSummary(): CampSummary {
  const { t: tr } = useTranslation();
  const lock = useOdakLockStore();
  const { ready, goal } = useOdakStore();
  const now = new Date();
  const open = !isLocked(lock) && ready && goal;
  const day = open ? Math.min(programDay(programStart(goal), now), ODAK_DAYS) : undefined;
  const status = !lock.enrolled ? tr('odak.card.setup') : open ? tr('odak.card.day', { day, total: ODAK_DAYS }) : tr('odak.card.locked');
  // While locked nothing is decrypted, so the card shows the lock instead of the day.
  return { joined: lock.enrolled, day, total: ODAK_DAYS, progress: open ? programProgress(programStart(goal), now) : 0, status, locked: lock.enrolled && !open };
}

export function OdakCampCard() {
  const { t: tr } = useTranslation();
  const { status, progress, locked } = useOdakSummary();
  return <RowCard icon={ODAK_ICON} tone="focus" title={tr('odak.title')} status={status} progress={progress} locked={locked} onPress={() => router.push('/odak')} />;
}

/** Odak Kampı on the shared camp engine (18+, highest privacy level). */
export const ODAK_CAMP: CampDefinition<OdakPhase> = {
  id: 'odak',
  titleKey: 'odak.title',
  icon: ODAK_ICON,
  days: ODAK_DAYS,
  route: '/odak',
  phases: ODAK_PHASES,
  checkinCadence: odakCadence,
  sosTools: ['dayy', 'relocate', 'surf', 'breath', 'move', 'values', 'futureSelf', 'supporter', 'coach'],
  badges: ['days-1', 'days-3', 'days-7', 'days-14', 'days-30', 'days-60', 'days-90', 'urges-10', 'urges-50', 'urges-100', 'first-plan', 'boundaries', 'checkin-7', 'all-skills', 'comeback', 'graduate'],
  contentFiles: ['camps/odak/onboarding.tr.json', 'camps/odak/plans.tr.json', 'camps/odak/panel.tr.json', 'camps/odak/sources.json'],
  color: 'accent',
  ageRule: 'adults',
  privacy: 'high',
  Card: OdakCampCard,
  useSummary: useOdakSummary,
  notifier: odakNotifier,
};
