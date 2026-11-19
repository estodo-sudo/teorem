import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Icon, Screen, useTheme } from '@/components';
import { ODAK_LIBRARY } from '@/features/camps/odak/content';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { goBack } from '@/lib/nav';

/** "Bilim Ne Diyor?" (SPEC_ODAK_KAMPI 5.9): myths and facts, sourced. Always free. */
export default function OdakLibrary() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  // Select the stored array itself (a new array from the selector would re-render forever).
  const libraryRead = useOdakStore((s) => s.libraryRead);
  const read = libraryRead.map((r) => r.id);
  return (
    <Screen>
      <Header title={tr('odak.library.title')} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText muted>{tr('odak.library.intro', { read: read.filter((id) => ODAK_LIBRARY.some((s) => s.id === id)).length, total: ODAK_LIBRARY.length })}</AppText>
      {ODAK_LIBRARY.map((s) => {
        const done = read.includes(s.id);
        return (
          <Card
            key={s.id}
            onPress={() => router.push({ pathname: '/odak/library/[storyId]', params: { storyId: s.id } })}
            accessibilityLabel={`${s.title}. ${done ? tr('odak.library.read') : tr('odak.skills.minutes', { count: s.minutes })}`}
            style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
          >
            <AppText variant="h1">{s.emoji}</AppText>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText weight="800">{s.title}</AppText>
              <AppText variant="small" muted>
                {done ? `✓ ${tr('odak.library.read')}` : `${s.summary} · ${tr('odak.skills.minutes', { count: s.minutes })}`}
              </AppText>
            </View>
            <Icon name="chevron" color={t.colors.textMuted} size={18} />
          </Card>
        );
      })}
    </Screen>
  );
}
