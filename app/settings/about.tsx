import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppLogo, AppText, BrandName, Card, Header, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { APP_NAME, APP_VERSION } from '@/config/app';

export default function About() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Screen>
      <Header title={tr('settings.about.title', { app: APP_NAME })} />
      <View style={{ alignItems: 'center', gap: t.space.xs, marginVertical: t.space.md }}>
        <AppLogo size={t.tile.lg + t.space.xxl} />
        <BrandName variant="title2" />
        <AppText variant="callout" muted>
          {tr('app.tagline')}
        </AppText>
        <AppText variant="footnote" muted>
          {tr('settings.about.version', { version: APP_VERSION })}
        </AppText>
      </View>
      <Card style={{ gap: t.space.sm, padding: t.space.gutter }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
          <IconTile icon="lock" />
          <AppText variant="title3" style={{ flex: 1 }}>
            {tr('settings.about.privacyTitle')}
          </AppText>
        </View>
        <AppText variant="body" muted>
          {tr('settings.about.privacyBody')}
        </AppText>
      </Card>
      <Card style={{ gap: t.space.sm, padding: t.space.gutter }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
          <IconTile icon="stethoscope" />
          <AppText variant="title3" style={{ flex: 1 }}>
            {tr('settings.about.medicalTitle')}
          </AppText>
        </View>
        <AppText variant="body" muted>
          {tr('settings.about.medicalBody')}
        </AppText>
      </Card>
    </Screen>
  );
}
