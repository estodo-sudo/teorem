import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, ProgressRing, Screen, useTheme } from '@/components';
import { SMOKING } from '@/features/campus/smoking/content';
import { milestoneStatuses, smokeFreeMs, smokingPhase } from '@/features/campus/smoking/logic';
import { useNow } from '@/lib/useNow';
import { useCampusStore } from '@/stores/campusStore';

export default function SmokingHealthTimeline() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const s = useCampusStore((x) => x.smoking);
  const now = useNow(30_000);
  const started = smokingPhase(s, now) === 'smokeFree';
  const statuses = milestoneStatuses(SMOKING.milestones, smokeFreeMs(s, now));

  return (
    <Screen>
      <Header title={tr('smoking.health.title')} />
      <AppText muted>{tr('smoking.health.intro')}</AppText>
      {!started ? <AppText weight="700">{tr('smoking.health.notStarted')}</AppText> : null}
      <View>
        {statuses.map(({ milestone: m, reached, progress }, i) => {
          const last = i === statuses.length - 1;
          return (
            <View
              key={m.id}
              accessible
              accessibilityLabel={`${reached ? tr('smoking.health.reached', { label: m.label }) : tr('smoking.health.pending', { label: m.label })}. ${m.text}`}
              style={{ flexDirection: 'row', gap: 14 }}
            >
              <View style={{ alignItems: 'center', width: 40 }}>
                {reached ? (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.success, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" color="#FFFFFF" size={20} strokeWidth={3} />
                  </View>
                ) : (
                  <ProgressRing size={40} stroke={5} value={progress} color={t.colors.primary} />
                )}
                {!last ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: reached ? t.colors.success : t.colors.border }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: last ? 0 : 18, paddingTop: 8, gap: 2 }}>
                <AppText weight="800" color={reached ? t.colors.success : undefined}>
                  {m.label}
                </AppText>
                <AppText variant="small" muted={!reached}>
                  {m.text}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
