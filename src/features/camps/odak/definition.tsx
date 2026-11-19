import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Icon, ProgressBar, useTheme } from '@/components';
import type { CampDefinition } from '@/features/camps/core/definition';

import { ODAK_DAYS, ODAK_EMOJI } from './content';
import { programStart } from './engine/checkin';
import { ODAK_PHASES, odakCadence, programDay, programProgress, type OdakPhase } from './engine/phase';
import { isLocked, useOdakLockStore } from './privacy/lockStore';
import { odakNotifier } from './notifications';
import { useOdakStore } from './store';

/**
 * Odak Kampı row in the "Kamplar" list: neutral title and progress only. While the camp is locked its
 * data is not decrypted, so the row shows the lock instead of the day.
 */
export function OdakCampCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const lock = useOdakLockStore();
  const { ready, goal } = useOdakStore();
  const now = new Date();
  const open = !isLocked(lock) && ready && goal;
  const status = !lock.enrolled ? tr('odak.card.setup') : open ? tr('odak.card.day', { day: Math.min(programDay(programStart(goal), now), ODAK_DAYS), total: ODAK_DAYS }) : tr('odak.card.locked');
  return (
    <Card onPress={() => router.push('/odak')} accessibilityLabel={`${tr('odak.title')}, ${status}`} style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="h1">{ODAK_EMOJI}</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{tr('odak.title')}</AppText>
          <AppText variant="small" weight="700" color={t.colors.primary}>
            {status}
          </AppText>
        </View>
        <Icon name={lock.enrolled && !open ? 'lock' : 'chevron'} color={t.colors.textMuted} size={18} />
      </View>
      <ProgressBar value={open ? programProgress(programStart(goal), now) : 0} height={6} />
    </Card>
  );
}

/** Odak Kampı on the shared camp engine (18+, highest privacy level). */
export const ODAK_CAMP: CampDefinition<OdakPhase> = {
  id: 'odak',
  titleKey: 'odak.title',
  emoji: ODAK_EMOJI,
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
  notifier: odakNotifier,
};
