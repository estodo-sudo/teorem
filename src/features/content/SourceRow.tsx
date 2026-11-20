import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';
import { Badge } from '@/components/ui/Display';

import { sourceKind } from './sourceKind';

/**
 * One source (SPEC_UI_V3 §7.15): a type badge (DSÖ, RCT, derleme…), the title, org · year and a
 * "Kaynağı aç" link instead of the long URL. Use inside a `RowGroup`.
 */
export function SourceRow({ source, meta }: { source: { title: string; org: string; year: number; url: string }; meta?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const kind = sourceKind(source);
  return (
    <Pressable
      onPress={() => void Linking.openURL(source.url)}
      accessibilityRole="link"
      accessibilityLabel={`${tr(`sources.kind.${kind}`)}. ${source.title}. ${source.org}, ${source.year}. ${tr('sources.open')}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, paddingVertical: t.space.md, gap: t.space.xs, borderBottomWidth: t.border.hairline, borderBottomColor: t.tokens.border })}
    >
      <Badge variant="secondary" label={tr(`sources.kind.${kind}`)} />
      <AppText variant="bodyStrong">{source.title}</AppText>
      <AppText variant="footnote" muted>
        {meta ?? `${source.org} · ${source.year}`}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs, minHeight: 28 }}>
        <AppText variant="footnote" style={{ color: t.tokens.primary, fontWeight: '600' }}>
          {tr('sources.open')}
        </AppText>
        <Icon name="chevron" size="sm" color={t.tokens.primary} />
      </View>
    </Pressable>
  );
}
