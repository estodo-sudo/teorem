import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Icon, useTheme, type IconName } from '@/components';
import { openGated, useAccess } from '@/features/purchases/useGate';

const MIND: { route: '/mind/breathing' | '/mind/unload' | '/mind/body-scan'; key: string; icon: IconName }[] = [
  { route: '/mind/breathing', key: 'breathing', icon: 'wind' },
  { route: '/mind/unload', key: 'unload', icon: 'leaf' },
  { route: '/mind/body-scan', key: 'bodyScan', icon: 'body' },
];

/** Mind tools (breathing, unload, body scan) listed on the Training tab. */
export function TrainingMindSection() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const access = useAccess();
  return (
    <>
      <AppText variant="h2" style={{ marginTop: 8 }}>
        {tr('mind.title')}
      </AppText>
      <AppText muted>{tr('mind.subtitle')}</AppText>
      {MIND.map((m) => (
        <Card key={m.key} onPress={() => openGated('mind', m.route)} accessibilityLabel={tr(`mind.${m.key}.title`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={m.icon} color={t.colors.breathe} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="700">{tr(`mind.${m.key}.title`)}</AppText>
            <AppText variant="small" muted>
              {tr(`mind.${m.key}.card`)}
            </AppText>
          </View>
          <Icon name={access('mind') ? 'chevron' : 'lock'} color={t.colors.textMuted} size={18} />
        </Card>
      ))}
      <AppText variant="small" muted>
        {tr('mind.note')}
      </AppText>
    </>
  );
}
