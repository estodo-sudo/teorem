import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Icon, useTheme } from '@/components';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { useProfileStore } from '@/stores/profileStore';

import { recommendedRoutine, routineDurationSec, ROUTINES } from './routines';

/** Pelvic-fitness routines list on the Training tab. */
export function TrainingFitnessSection() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const activity = useProfileStore((s) => s.profile.activity);
  const rec = recommendedRoutine(activity);
  const access = useAccess()('fitness');
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <AppText variant="h2">{tr('fitness.title')}</AppText>
      <AppText muted>{tr('fitness.subtitle')}</AppText>
      {ROUTINES.map((r) => (
        <Card
          key={r.id}
          onPress={() => openGated('fitness', { pathname: '/fitness/[routineId]', params: { routineId: r.id } })}
          accessibilityLabel={`${r.name}, ${tr('common.minutes', { count: Math.round(routineDurationSec(r) / 60) })}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: r.id === rec.id ? t.colors.accent : t.colors.border }}
        >
          <AppText variant="h2">{r.id === 'beginner' ? '🌱' : r.id === 'intermediate' ? '🌿' : '🌳'}</AppText>
          <View style={{ flex: 1 }}>
            <AppText weight="700">{r.name}</AppText>
            <AppText variant="small" muted>
              {tr('fitness.cardMeta', { count: r.steps.length, min: Math.round(routineDurationSec(r) / 60) })}
              {r.id === rec.id ? ` · ${tr('fitness.recommended')}` : ''}
            </AppText>
          </View>
          <Icon name={access ? 'chevron' : 'lock'} color={t.colors.textMuted} size={20} />
        </Card>
      ))}
    </View>
  );
}
