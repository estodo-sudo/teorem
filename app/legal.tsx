import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Header, ListRow, RowGroup, Screen, useTheme } from '@/components';
import { APP_NAME } from '@/config/app';
import { LEGAL_ICONS, OTHER_DOCS, POLICY_DOCS } from '@/features/legal/docs';

/** "Politikalar ve Diğer" (user request 2026-11-22): one profile button opens every policy and the rest. */
export default function LegalIndex() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Screen contentStyle={{ gap: t.space.xl }}>
      <Header title={tr('profile.groups.policiesAndOther')} />
      <RowGroup title={tr('profile.groups.policies')}>
        {POLICY_DOCS.map((d) => (
          <ListRow key={d} label={tr(`legal.${d}.title`)} icon={LEGAL_ICONS[d]} tone="knowledge" onPress={() => router.push(`/legal/${d}`)} />
        ))}
      </RowGroup>
      <RowGroup title={tr('profile.groups.other')}>
        {OTHER_DOCS.map((d) => (
          <ListRow key={d} label={tr(`legal.${d}.title`)} icon={LEGAL_ICONS[d]} tone="knowledge" onPress={() => router.push(`/legal/${d}`)} />
        ))}
        <ListRow label={tr('settings.about.title', { app: APP_NAME })} icon="info" tone="knowledge" onPress={() => router.push('/settings/about')} />
      </RowGroup>
    </Screen>
  );
}
