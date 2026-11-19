import { View } from 'react-native';

import { AppText, Card, Header, Screen, useTheme } from '@/components';
import { ODAK_BADGES as B } from '@/features/camps/odak/content';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { goBack } from '@/lib/nav';

/** Rozetler (SPEC_ODAK_KAMPI 5.13): earned ones are never taken back. */
export default function OdakRewards() {
  const t = useTheme();
  const badges = useOdakStore((s) => s.badges);
  const earned = new Set(badges.map((b) => b.id));
  return (
    <Screen>
      <Header title={B.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText muted>{B.intro}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {B.items.map((b) => {
          const on = earned.has(b.id);
          return (
            <Card key={b.id} style={{ width: '47%', gap: 4, alignItems: 'center', opacity: on ? 1 : 0.45, borderColor: on ? t.colors.success : t.colors.border }} accessibilityLabel={`${b.title}. ${on ? b.desc : B.locked}`}>
              <AppText variant="display">{on ? b.emoji : '🔒'}</AppText>
              <AppText weight="800" center>
                {b.title}
              </AppText>
              <AppText variant="tiny" muted center>
                {on ? b.desc : B.locked}
              </AppText>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
