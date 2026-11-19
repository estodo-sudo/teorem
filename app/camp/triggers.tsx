import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, Screen, useTheme } from '@/components';
import { PlanEditor } from '@/features/camps/smoking/PlanEditor';
import { CAMP_ONBOARDING as ONB, CAMP_PLANS } from '@/features/camps/smoking/content';
import { triggerFrequency } from '@/features/camps/smoking/engine/diary';
import type { TriggerId } from '@/features/camps/smoking/types';
import { InfoToggle, tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

/**
 * Trigger map + if–then plans. Triggers come from the assessment, the diary and SOS, most frequent
 * first; each should have at least one plan. Plans can also accept the urge (ACT), not only avoid.
 */
export default function CampTriggers() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const ev = useCampEventsStore();
  const [editing, setEditing] = useState<TriggerId | null>(null);
  const [adding, setAdding] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [added, setAdded] = useState<TriggerId[]>([]);
  // The map shows the assessment triggers, those with a plan and ones just added here.
  const base = Array.from(new Set<TriggerId>([...(camp.profile?.triggers ?? []), ...camp.plans.map((p) => p.trigger), ...added]));
  const map = triggerFrequency(base, ev.cigarettes, ev.cravings);
  const extra = ONB.triggers.filter((x) => !map.some((m) => m.trigger === x.id));
  const withPlan = map.filter((m) => camp.plans.some((p) => p.trigger === m.trigger)).length;

  return (
    <Screen>
      <Header title={tr('camp.triggers.title')} onBack={() => goBack('/camp')} />
      <AppText muted>{tr('camp.triggers.intro')}</AppText>
      <InfoToggle title={tr('camp.plan.plansInfo')} text={CAMP_PLANS.info} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: tint(withPlan === map.length && map.length ? t.colors.success : t.colors.warning, '14') }}>
        <AppText variant="h2">{withPlan === map.length && map.length ? '✅' : '🧩'}</AppText>
        <AppText weight="800" style={{ flex: 1 }}>
          {tr('camp.triggers.coverage', { done: withPlan, total: map.length })}
        </AppText>
      </Card>

      {map.map((m) => {
        const x = ONB.triggers.find((o) => o.id === m.trigger)!;
        const plans = camp.plans.filter((p) => p.trigger === m.trigger);
        return (
          <Card key={m.trigger} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AppText variant="h2">{x.emoji}</AppText>
              <View style={{ flex: 1 }}>
                <AppText weight="800">{x.label}</AppText>
                <AppText variant="tiny" muted>
                  {m.count ? tr('camp.triggers.count', { count: m.count }) : tr('camp.triggers.noCount')}
                </AppText>
              </View>
              {!plans.length ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: t.radius.pill, backgroundColor: tint(t.colors.warning, '33') }}>
                  <AppText variant="tiny" weight="800">
                    {tr('camp.triggers.noPlan')}
                  </AppText>
                </View>
              ) : null}
            </View>
            {plans.map((p) => (
              <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: t.radius.md, backgroundColor: tint(t.colors.accent, '10'), borderLeftWidth: 3, borderLeftColor: t.colors.accent }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="small" weight="700">
                    {tr('camp.plan.if')} {p.ifText}, {tr('camp.plan.then')} {p.thenText}.
                  </AppText>
                  {p.usedCount ? (
                    <AppText variant="tiny" muted>
                      {tr('camp.triggers.used', { count: p.usedCount })}
                    </AppText>
                  ) : null}
                </View>
                <Pressable onPress={() => setRemoveId(p.id)} accessibilityRole="button" accessibilityLabel={tr('camp.triggers.removePlan')} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="trash" color={t.colors.textMuted} size={18} />
                </Pressable>
              </View>
            ))}
            {editing === m.trigger ? <PlanEditor trigger={m.trigger} onDone={() => setEditing(null)} /> : <Button label={tr('camp.triggers.addPlan')} icon="plus" variant="secondary" onPress={() => setEditing(m.trigger)} />}
          </Card>
        );
      })}

      {extra.length ? (
        adding ? (
          <Card style={{ gap: 8 }}>
            <AppText weight="800">{tr('camp.triggers.pickNew')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {extra.map((x) => (
                <Pressable
                  key={x.id}
                  onPress={() => {
                    setAdding(false);
                    setAdded((a) => [...a, x.id]);
                    setEditing(x.id);
                  }}
                  accessibilityRole="button"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 12, borderRadius: t.radius.pill, borderWidth: 1.5, borderColor: t.colors.border }}
                >
                  <AppText>{x.emoji}</AppText>
                  <AppText variant="small" weight="700">
                    {x.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="tiny" muted>
              {tr('camp.triggers.pickNote')}
            </AppText>
          </Card>
        ) : (
          <Button label={tr('camp.triggers.addTrigger')} icon="plus" variant="ghost" onPress={() => setAdding(true)} />
        )
      ) : null}

      <Dialog
        visible={removeId !== null}
        title={tr('camp.triggers.removeTitle')}
        onDismiss={() => setRemoveId(null)}
        actions={[
          {
            label: tr('camp.triggers.removeConfirm'),
            variant: 'danger',
            onPress: () => {
              if (removeId) useCampStore.getState().removePlan(removeId);
              setRemoveId(null);
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setRemoveId(null) },
        ]}
      />
    </Screen>
  );
}
