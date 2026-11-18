import { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Icon, ProgressRing, Screen, useTheme } from '@/components';
import { CAMP_HEALTH } from '@/features/camp/content';
import { remainingUnit } from '@/features/camp/engine/format';
import { nextHealthMilestone, reachedMilestones } from '@/features/camp/engine/milestones';
import { currentPhase, quitStart } from '@/features/camp/engine/phase';
import { campAttempt } from '@/features/camp/state';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useClock } from '@/lib/useNow';
import { useCampStore } from '@/stores/campStore';

/** Health recovery timeline (WHO): reached gains, the next one with its progress, later ones. */
export default function CampHealth() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const s = useCampStore();
  const { now } = useClock(30_000);
  const attempt = campAttempt(s);
  const active = attempt ? currentPhase(attempt, now) !== 'preparation' : false;
  const start = attempt ? quitStart(attempt) : null;
  const reached = active && start ? reachedMilestones(start, now) : [];
  const next = active && start ? nextHealthMilestone(start, now) : null;

  // Opening the timeline counts as seeing every gain reached so far.
  const reachedKey = reached.join(',');
  useEffect(() => {
    if (reachedKey) useCampStore.getState().markMilestonesSeen(reachedKey.split(','));
  }, [reachedKey]);

  return (
    <Screen>
      <Header title={tr('camp.health.title')} onBack={() => goBack('/camp')} />
      <AppText muted>{CAMP_HEALTH.intro}</AppText>
      {!active ? (
        <Card style={{ gap: 4, borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
          <AppText variant="small">{tr('camp.health.notYet')}</AppText>
        </Card>
      ) : null}

      <View>
        {CAMP_HEALTH.items.map((item, i) => {
          const done = reached.includes(item.id);
          const isNext = next?.id === item.id;
          const left = isNext && next ? remainingUnit(next.remainingMs) : null;
          const color = done ? t.colors.success : isNext ? t.colors.primary : t.colors.textMuted;
          return (
            <View
              key={item.id}
              style={{ flexDirection: 'row', gap: 14 }}
              accessible
              accessibilityLabel={`${item.label}: ${item.text}. ${done ? tr('camp.health.reached') : left ? tr('camp.health.leftA11y', { left: tr(`camp.dur.${left.unit}`, { count: left.value }) }) : ''}`}
            >
              <View style={{ alignItems: 'center', width: 56 }}>
                <ProgressRing size={56} stroke={5} value={done ? 1 : isNext && next ? next.progress : 0} color={color} trackColor={tint(color, '26')}>
                  {done ? <Icon name="check" color={t.colors.success} size={22} strokeWidth={3} /> : <AppText>{item.emoji}</AppText>}
                </ProgressRing>
                {i < CAMP_HEALTH.items.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: done ? t.colors.success : t.colors.border }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 18, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <AppText weight="800" color={color}>
                    {item.label}
                  </AppText>
                  {done ? (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: t.radius.pill, backgroundColor: tint(t.colors.success, '26') }}>
                      <AppText variant="tiny" weight="800" color={t.colors.success}>
                        {tr('camp.health.reached')}
                      </AppText>
                    </View>
                  ) : left ? (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: t.radius.pill, backgroundColor: tint(t.colors.primary, '22') }}>
                      <AppText variant="tiny" weight="800" color={t.colors.primary}>
                        {tr('camp.health.left', { left: tr(`camp.dur.${left.unit}`, { count: left.value }) })}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText style={{ opacity: done || isNext ? 1 : 0.7 }}>{item.text}</AppText>
                <AppText variant="tiny" muted>
                  {CAMP_HEALTH.note}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
