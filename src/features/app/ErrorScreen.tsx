import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Button, useTheme } from '@/components';
import { goHome } from '@/lib/nav';

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
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
        <Button label={tr('error.retry')} variant="accent" size="lg" onPress={onRetry} />
        <Button label={tr('error.home')} variant="ghost" onPress={goHome} />
      </View>
    </SafeAreaView>
  );
}
