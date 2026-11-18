import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_SOURCES, CAMP_SUPPORT } from '@/features/camp/content';
import { SectionTitle } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';

const METHOD_KEYS = ['act', 'missions', 'coach', 'hsi', 'health', 'withdrawal', 'support'] as const;

/** "Kaynaklar ve Yöntem": every scientific / institutional source the camp uses, and how it is built. */
export default function CampSources() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Screen>
      <Header title={tr('camp.sources.title')} onBack={() => goBack('/camp/settings')} />
      <AppText muted>{tr('camp.sources.intro')}</AppText>

      <SectionTitle emoji="🧭" title={tr('camp.sources.methodTitle')} />
      <View style={{ gap: 8 }}>
        {METHOD_KEYS.map((k) => (
          <Card key={k} style={{ gap: 4 }}>
            <AppText weight="800">{tr(`camp.sources.method.${k}.title`)}</AppText>
            <AppText variant="small">{tr(`camp.sources.method.${k}.text`)}</AppText>
          </Card>
        ))}
      </View>
      <Card style={{ gap: 4, borderLeftWidth: 4, borderLeftColor: t.colors.warning }}>
        <AppText weight="800">{tr('camp.sources.reviewTitle')}</AppText>
        <AppText variant="small">{tr('camp.sources.reviewText')}</AppText>
        <AppText variant="tiny" muted>
          {tr('camp.support.lastVerified', { date: CAMP_SUPPORT.lastVerified })}
        </AppText>
      </Card>

      <SectionTitle emoji="📚" title={tr('camp.sources.listTitle', { count: CAMP_SOURCES.length })} />
      <View style={{ gap: 8 }}>
        {CAMP_SOURCES.map((s) => (
          <Pressable key={s.id} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link" accessibilityLabel={`${s.org}, ${s.year}: ${s.title}`}>
            <Card style={{ gap: 2 }}>
              <AppText variant="small" weight="800" color={t.colors.primary}>
                {s.title}
              </AppText>
              <AppText variant="tiny" muted>
                {`${s.org} · ${s.year} · ${tr('camp.sources.accessed', { date: s.accessed })}`}
              </AppText>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
