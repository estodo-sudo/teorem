import { useTranslation } from 'react-i18next';

import { AppText, Screen } from '@/components';

export default function Consent() {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="h1">{t('consent.title')}</AppText>
    </Screen>
  );
}
