import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Screen, Segmented } from '@/components';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type Language } from '@/i18n/languages';
import { reloadApp } from '@/lib/reload';
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
        <Segmented<Language>
          accessibilityLabel={tr('settings.appearance.language')}
          value={settings.language}
          onChange={(v) => {
            if (v === settings.language) return;
            // Content is chosen at start-up, so the app restarts in the new language.
            update({ language: v });
            void reloadApp();
          }}
          options={SUPPORTED_LANGUAGES.map((v) => ({ value: v, label: LANGUAGE_NAMES[v] }))}
        />
        <AppText variant="small" muted>
          {tr('settings.appearance.languageHint')}
        </AppText>
      </Card>
    </Screen>
  );
}
