import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen } from '@/components';
import { APP_NAME } from '@/config/app';

interface Section {
  heading: string;
  paragraphs: string[];
}

export function LegalPage({ section }: { section: 'disclaimer' | 'privacy' | 'terms' }) {
  const { t } = useTranslation();
  const sections = t(`legal.${section}.sections`, { returnObjects: true, app: APP_NAME }) as Section[];
  return (
    <Screen>
      <Header title={t(`legal.${section}.title`)} />
      <AppText variant="small" muted>
        {t('legal.updated')}
      </AppText>
      {sections.map((s) => (
        <View key={s.heading} style={{ gap: 6 }}>
          <AppText variant="h3" accessibilityRole="header">
            {s.heading}
          </AppText>
          {s.paragraphs.map((p) => (
            <AppText key={p}>{p}</AppText>
          ))}
        </View>
      ))}
    </Screen>
  );
}
