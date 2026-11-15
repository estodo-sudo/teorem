import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Screen, useTheme } from '@/components';
import { APP_NAME, APP_VERSION } from '@/config/app';

export default function About() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Screen>
      <Header title={tr('settings.about.title', { app: APP_NAME })} />
      <View style={{ alignItems: 'center', gap: 4, marginVertical: 12 }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="h1" color={t.colors.primaryText}>
            ◎
          </AppText>
        </View>
        <AppText variant="h2">{APP_NAME}</AppText>
        <AppText muted>{tr('settings.about.version', { version: APP_VERSION })}</AppText>
      </View>
      <Card style={{ gap: 6 }}>
        <AppText weight="700">🔒 {tr('settings.about.privacyTitle')}</AppText>
        <AppText muted>{tr('settings.about.privacyBody')}</AppText>
      </Card>
      <Card style={{ gap: 6 }}>
        <AppText weight="700">🩺 {tr('settings.about.medicalTitle')}</AppText>
        <AppText muted>{tr('settings.about.medicalBody')}</AppText>
      </Card>
    </Screen>
  );
}
