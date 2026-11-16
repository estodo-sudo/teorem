import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Button, useTheme } from '@/components';
import { goHome } from '@/lib/nav';

export function ErrorScreen({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <AppText variant="display" center>
          🛠️
        </AppText>
        <AppText variant="h1" center>
          {tr('error.title')}
        </AppText>
        <AppText muted center>
          {tr('error.body')}
        </AppText>
        {error ? (
          // Shown locally to help diagnose (nothing is sent anywhere).
          <ScrollView style={{ maxHeight: 220, backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.md }} contentContainerStyle={{ padding: 12 }}>
            <AppText variant="tiny" selectable>
              {`${error.name}: ${error.message}\n\n${(error.stack ?? '').split('\n').slice(0, 8).join('\n')}`}
            </AppText>
          </ScrollView>
        ) : null}
        <Button label={tr('error.retry')} variant="accent" size="lg" onPress={onRetry} />
        <Button label={tr('error.home')} variant="ghost" onPress={goHome} />
      </View>
    </SafeAreaView>
  );
}
