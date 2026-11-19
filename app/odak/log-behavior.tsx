import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, Screen, useTheme } from '@/components';
import { ODAK_DIARY as D, fill, ODAK_ONBOARDING as ONB, ODAK_PANEL as P } from '@/features/camps/odak/content';
import { goalCounters, touches } from '@/features/camps/odak/engine/goals';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import type { BehaviorEvent, BehaviorKind, OdakTriggerId, Score5 } from '@/features/camps/odak/types';
import { PillGroup, ScaleRow } from '@/features/camps/odak/ui';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';

const one = (cur: string | null, id: string) => (cur === id ? null : id);

/** Behaviour log: kind (required), situation, feeling before / after, satisfaction 1–5. No judgement. */
export default function OdakLogBehavior() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { goal, events } = useOdakStore();
  const [kind, setKind] = useState<BehaviorKind | null>(null);
  const [trigger, setTrigger] = useState<string | null>(null);
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [satisfaction, setSatisfaction] = useState<Score5 | null>(null);
  const [saved, setSaved] = useState<BehaviorEvent | null>(null);

  const save = async () => {
    if (!kind) return;
    const e = await useOdakStore.getState().logBehavior(kind, undefined, {
      trigger: (trigger as OdakTriggerId | null) ?? undefined,
      emotionBefore: before ?? undefined,
      emotionAfter: after ?? undefined,
      satisfaction: satisfaction ?? undefined,
    });
    setSaved(e);
  };

  if (saved) {
    const c = saved.isSlip && goal ? goalCounters(goal, events, new Date()).find((x) => touches(saved.kind, x.target)) : undefined;
    return (
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {saved.isSlip ? <Button label={tr('odak.sos.toSlip')} size="lg" onPress={() => router.replace({ pathname: '/odak/slip', params: { from: 'log' } })} /> : null}
            <Button label={tr('common.done')} size="lg" variant={saved.isSlip ? 'ghost' : 'primary'} onPress={() => goBack('/odak')} />
          </View>
        }
      >
        <Header title={D.behavior.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
        <Card style={{ gap: 10 }}>
          {saved.isSlip ? (
            <AppText variant="h2" accessibilityRole="header">
              {P.log.slipTitle}
            </AppText>
          ) : (
            <AppText variant="display" center>
              🌿
            </AppText>
          )}
          <AppText>{saved.isSlip ? P.log.slipBody : P.log.saved}</AppText>
          {c && (c.total > 0 || c.longest > 0) ? (
            <View style={{ padding: 12, borderRadius: t.radius.md, backgroundColor: tint(t.colors.success, '1A') }}>
              <AppText variant="small" weight="700">
                {fill(P.log.kept, { total: c.total, longest: c.longest })}
              </AppText>
            </View>
          ) : null}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label={D.behavior.save} size="lg" disabled={!kind} onPress={() => void save()} />}>
      <Header title={D.behavior.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText muted>{D.behavior.hint}</AppText>
      <AppText weight="800">{D.behavior.kind}</AppText>
      <View style={{ gap: 8 }}>
        {P.log.options.map((o) => (
          <ChoiceCard key={o.id} emoji={o.emoji} label={o.label} selected={kind === o.id} onPress={() => setKind(o.id as BehaviorKind)} />
        ))}
      </View>
      <AppText weight="800">{D.behavior.trigger}</AppText>
      <PillGroup items={ONB.triggers.options} selected={trigger ? [trigger] : []} onToggle={(id) => setTrigger((x) => one(x, id))} />
      <AppText weight="800">{D.behavior.before}</AppText>
      <PillGroup items={ONB.emotions.before} selected={before ? [before] : []} onToggle={(id) => setBefore((x) => one(x, id))} />
      <AppText weight="800">{D.behavior.after}</AppText>
      <PillGroup items={ONB.emotions.after} selected={after ? [after] : []} onToggle={(id) => setAfter((x) => one(x, id))} />
      <ScaleRow label={D.behavior.satisfaction} options={D.behavior.satisfactionScale.map((label, i) => ({ value: i + 1, label }))} value={satisfaction} onChange={(v) => setSatisfaction(v as Score5)} />
    </Screen>
  );
}
