import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, RowGroup, Screen, useTheme } from '@/components';
import { SourceRow } from '@/features/content/SourceRow';
import { CAMP_SOURCES, CAMP_SUPPORT } from '@/features/camps/smoking/content';
import { SectionTitle } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';

const METHOD_KEYS = ['act', 'missions', 'hsi', 'health', 'withdrawal', 'support'] as const;

/** "Kaynaklar ve Yöntem": every scientific / institutional source the camp uses, and how it is built. */
export default function CampSources() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Screen>
      <Header title={tr('camp.sources.title')} onBack={() => goBack('/camp/settings')} />
      <AppText muted>{tr('camp.sources.intro')}</AppText>

      <SectionTitle tone="smokefree" icon="compass" title={tr('camp.sources.methodTitle')} />
      <View style={{ gap: t.space.sm }}>
        {METHOD_KEYS.map((k) => (
          <Card key={k} style={{ gap: t.space.xs }}>
            <AppText weight="800">{tr(`camp.sources.method.${k}.title`)}</AppText>
            <AppText variant="small">{tr(`camp.sources.method.${k}.text`)}</AppText>
          </Card>
        ))}
      </View>
      <Card style={{ gap: t.space.xs, backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
        <AppText weight="800">{tr('camp.sources.reviewTitle')}</AppText>
        <AppText variant="small">{tr('camp.sources.reviewText')}</AppText>
        <AppText variant="tiny" muted>
          {tr('camp.support.lastVerified', { date: CAMP_SUPPORT.lastVerified })}
        </AppText>
      </Card>

      <SectionTitle tone="smokefree" icon="book" title={tr('camp.sources.listTitle', { count: CAMP_SOURCES.length })} />
      <RowGroup>
        {CAMP_SOURCES.map((s) => (
          <SourceRow key={s.id} source={s} meta={`${s.org} · ${s.year} · ${tr('camp.sources.accessed', { date: s.accessed })}`} />
        ))}
      </RowGroup>
    </Screen>
  );
}
