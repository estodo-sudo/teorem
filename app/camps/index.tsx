import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen, useTheme } from '@/components';
import { Button, Card, IconTile, Illustration, type IllustrationName } from '@/components/ui';
import type { ModuleTone } from '@/config/theme';
import { CAMPS } from '@/features/camps/registry';

/** Camp → illustration and module tone (§3.3, §4.2). Unknown camps fall back to the neutral set. */
const LOOK: Record<string, { art: IllustrationName; tone: ModuleTone }> = {
  smoking: { art: 'camp-smokefree-welcome', tone: 'smokefree' },
  odak: { art: 'camp-focus-welcome', tone: 'focus' },
};

/**
 * "Kamplar" — ui-v3 (SPEC_UI_V3 §7.13): one big card per camp (illustration strip in the camp tone,
 * name, length and "Başla"). Several camps can be joined at once; each opens its own panel.
 */
export default function CampsScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Screen contentStyle={{ gap: t.space.xl }}>
      <Header title={tr('camps.allTitle')} />
      <AppText variant="body" muted>
        {tr('camps.subtitle')}
      </AppText>
      {CAMPS.map((c) => {
        const look = LOOK[c.id] ?? { art: 'campus-welcome' as const, tone: 'campus' as const };
        const title = tr(c.titleKey);
        return (
          <Card key={c.id}>
            <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tone[look.tone].soft }}>
              <Illustration name={look.art} size={112} tone={look.tone} />
            </View>
            <View style={{ padding: t.space.gutter, gap: t.space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
                <IconTile icon={c.icon} tone={look.tone} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="title3">{title}</AppText>
                  <AppText variant="footnote" muted>
                    {tr('camps.length', { count: c.days })}
                  </AppText>
                </View>
              </View>
              <Button label={tr('camps.open')} onPress={() => router.push(c.route)} fullWidth accessibilityHint={title} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
