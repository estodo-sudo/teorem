import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen, useTheme } from '@/components';
import { AnimatedArt, type AnimatedArtName } from '@/components/AnimatedArt';
import { Button, Card, IconTile } from '@/components/ui';
import type { ModuleTone } from '@/config/theme';
import { CAMPS } from '@/features/camps/registry';

/** Camp → illustration and module tone (§3.3, §4.2). Unknown camps fall back to the neutral set. */
/** Each camp's looping drawing (round 6, 2026-11-25) and its tone. */
const LOOK: Record<string, { art: AnimatedArtName; tone: ModuleTone }> = {
  smoking: { art: 'smokefree', tone: 'smokefree' },
  odak: { art: 'focus', tone: 'focus' },
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
        const look = LOOK[c.id] ?? { art: 'alcoholfree' as const, tone: 'campus' as const };
        const title = tr(c.titleKey);
        return (
          <Card key={c.id}>
            <View style={{ height: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tone[look.tone].soft }}>
              <AnimatedArt name={look.art} size={132} />
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
