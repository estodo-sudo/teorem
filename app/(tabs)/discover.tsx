import { useTranslation } from 'react-i18next';

import { AppText, Screen } from '@/components';

export default function Placeholder() {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="h1">{t('tabs.discover')}</AppText>
    </Screen>
  );
}
