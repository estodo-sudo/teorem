import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Screen, Segmented } from '@/components';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ThemePreference } from '@/types';

export default function AppearanceSettings() {
  const { t: tr } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  return (
    <Screen>
      <Header title={tr('settings.appearance.title')} />
      <Card style={{ gap: 10 }}>
        <AppText variant="h3">{tr('settings.appearance.theme')}</AppText>
        <Segmented<ThemePreference>
          accessibilityLabel={tr('settings.appearance.theme')}
          value={settings.theme}
          onChange={(v) => update({ theme: v })}
          options={(['light', 'dark', 'system'] as const).map((v) => ({ value: v, label: tr(`settings.appearance.${v}`) }))}
        />
      </Card>
      <Card style={{ gap: 10 }}>
        <AppText variant="h3">{tr('settings.appearance.language')}</AppText>
        <Segmented<'tr'>
          accessibilityLabel={tr('settings.appearance.language')}
          value="tr"
          onChange={() => update({ language: 'tr' })}
          options={[{ value: 'tr', label: 'Türkçe' }]}
        />
        <AppText variant="small" muted>
          {tr('settings.appearance.languageHint')}
        </AppText>
      </Card>
    </Screen>
  );
}
