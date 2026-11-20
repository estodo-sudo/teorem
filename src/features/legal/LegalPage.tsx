import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen, useTheme } from '@/components';
import { APP_NAME } from '@/config/app';

interface Section {
  heading: string;
  paragraphs: string[];
}

/** Longest comfortable reading line (≈ 65 characters at body size, §7.15). */
const READING_WIDTH = 560;

/**
 * Legal reading layout (SPEC_UI_V3 §7.15): body 16/24, headings title3, 12 px between paragraphs and a
 * capped line length on wide screens.
 */
export function LegalPage({ section }: { section: 'disclaimer' | 'privacy' | 'terms' }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const sections = tr(`legal.${section}.sections`, { returnObjects: true, app: APP_NAME }) as Section[];
  return (
    <Screen>
      <Header title={tr(`legal.${section}.title`)} />
      <View style={{ maxWidth: READING_WIDTH, alignSelf: 'center', width: '100%', gap: t.space.xl }}>
        <AppText variant="footnote" muted>
          {tr('legal.updated')}
        </AppText>
        {sections.map((s) => (
          <View key={s.heading} style={{ gap: t.space.md }}>
            <AppText variant="title3" accessibilityRole="header">
              {s.heading}
            </AppText>
            {s.paragraphs.map((p) => (
              <AppText key={p} variant="body">
                {p}
              </AppText>
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}
