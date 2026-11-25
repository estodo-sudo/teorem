import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { NumberStepper } from '@/features/camps/core/ui';
import { fill, ODAK_ONBOARDING as ONB, ODAK_RELAPSE as R, odakToolLabel } from '@/features/camps/odak/content';
import { restartAtBoundaries } from '@/features/camps/odak/engine/checkin';
import { weeklySummary } from '@/features/camps/odak/engine/diary';
import { managedCount, toolEffectiveness } from '@/features/camps/odak/engine/sos';
import { MAST_WEEKLY, PAUSE_DAYS, PAUSE_PRESETS, PORN_WEEKLY } from '@/features/camps/odak/onboarding';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import type { GoalConfig, MastGoal, PornGoal } from '@/features/camps/odak/types';
import { goBack } from '@/lib/nav';

type Step = 'intro' | 'learned' | 'goal' | 'restart' | 'done';
const STEPS: Step[] = ['intro', 'learned', 'goal', 'restart', 'done'];

/** Relapse (several slip days in a row): "yeniden başlamak bir beceridir" → what you learned → review the goal → back to phase 2. */
export default function OdakRelapse() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { goal, urges, events } = useOdakStore();
  const [step, setStep] = useState<Step>('intro');
  const [draft, setDraft] = useState<GoalConfig | null>(goal);
  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, idx + 1)]!);

  // What the last weeks taught: frequent situations (urges + behaviours) and tools that helped.
  const now = new Date();
  const triggers = [...new Set([...urges, ...events].map((x) => x.trigger).filter(Boolean))].slice(0, 3);
  const topTrigger = weeklySummary(urges, events, now).topTrigger;
  const trigList = [...new Set([topTrigger, ...triggers].filter(Boolean))]
    .slice(0, 3)
    .map((id) => ONB.triggers.options.find((o) => o.id === id)?.label)
    .filter(Boolean)
    .join(', ');
  const tools = toolEffectiveness(urges)
    .filter((x) => x.managed > 0)
    .slice(0, 3)
    .map((x) => odakToolLabel(x.tool))
    .filter(Boolean)
    .join(', ');

  const finish = async () => {
    if (!draft) return;
    const st = useOdakStore.getState();
    await st.updateGoal(restartAtBoundaries(draft, new Date()));
    await st.markRelapseHandled();
    next();
  };
  const set = (patch: Partial<GoalConfig>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const footer =
    step === 'restart' ? (
      <Button label={R.restart.button} size="lg" onPress={() => void finish()} />
    ) : step === 'done' ? (
      <Button label={tr('common.done')} size="lg" onPress={() => goBack('/odak')} />
    ) : step === 'goal' ? (
      <View style={{ gap: 6 }}>
        <Button label={R.goal.save} size="lg" onPress={next} />
        <Button
          label={R.goal.keep}
          variant="ghost"
          onPress={() => {
            setDraft(goal);
            next();
          }}
        />
      </View>
    ) : (
      <Button label={tr('common.continue')} size="lg" onPress={next} />
    );

  return (
    <Screen footer={footer}>
      <Header title={tr('odak.relapseTitle')} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <ProgressBar value={(idx + 1) / STEPS.length} height={6} />

      {step === 'intro' ? (
        <Card style={{ alignItems: 'center', gap: 10, padding: 22 }}>
          <IconTile icon="repeat" tone="focus" size="lg" round />
          <AppText variant="h2" center accessibilityRole="header">
            {R.intro.title}
          </AppText>
          <AppText center>{R.intro.body}</AppText>
        </Card>
      ) : null}

      {step === 'learned' ? (
        <Card style={{ gap: t.space.sm }}>
          <AppText variant="h2" accessibilityRole="header">
            {R.learned.title}
          </AppText>
          {trigList ? <AppText>{fill(R.learned.triggers, { list: trigList })}</AppText> : null}
          {tools ? <AppText>{fill(R.learned.tools, { list: tools })}</AppText> : null}
          <AppText>{fill(R.learned.managed, { n: managedCount(urges) })}</AppText>
          {!trigList && !tools ? (
            <AppText variant="small" muted>
              {R.learned.none}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {step === 'goal' && draft ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {R.goal.title}
          </AppText>
          <AppText muted>{R.goal.hint}</AppText>
          <Card style={{ gap: t.space.sm }}>
            <AppText variant="h3">{ONB.goal.porn.title}</AppText>
            {ONB.goal.porn.options.map((o) => (
              <ChoiceCard key={o.id} icon={o.icon} label={o.label} selected={draft.porn === o.id} onPress={() => set({ porn: o.id as PornGoal, pornWeeklyMax: o.id === 'reduce' ? (draft.pornWeeklyMax ?? 2) : undefined })} />
            ))}
            {draft.porn === 'reduce' ? <NumberStepper label={ONB.goal.weeklyMax} value={draft.pornWeeklyMax ?? 2} onChange={(v) => set({ pornWeeklyMax: v })} min={PORN_WEEKLY.min} max={PORN_WEEKLY.max} unit={ONB.goal.weeklyUnit} /> : null}
          </Card>
          <Card style={{ gap: t.space.sm }}>
            <AppText variant="h3">{ONB.goal.mast.title}</AppText>
            {ONB.goal.mast.options.map((o) => (
              <ChoiceCard
                key={o.id}
                icon={o.icon}
                label={o.label}
                selected={draft.mast === o.id}
                onPress={() => set({ mast: o.id as MastGoal, mastWeeklyMax: o.id === 'reduce' ? (draft.mastWeeklyMax ?? 3) : undefined, mastPauseDays: o.id === 'pause' ? (draft.mastPauseDays ?? 30) : undefined })}
              />
            ))}
            {draft.mast === 'reduce' ? <NumberStepper label={ONB.goal.weeklyMax} value={draft.mastWeeklyMax ?? 3} onChange={(v) => set({ mastWeeklyMax: v })} min={MAST_WEEKLY.min} max={MAST_WEEKLY.max} unit={ONB.goal.weeklyUnit} /> : null}
            {draft.mast === 'pause' ? (
              <NumberStepper label={ONB.goal.pauseTitle} value={draft.mastPauseDays ?? 30} onChange={(v) => set({ mastPauseDays: v })} min={PAUSE_DAYS.min} max={PAUSE_DAYS.max} unit={ONB.goal.pauseUnit} quick={[...PAUSE_PRESETS]} />
            ) : null}
          </Card>
          <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
            <AppText variant="small">{ONB.goal.note}</AppText>
          </Card>
        </>
      ) : null}

      {step === 'restart' ? (
        <Card style={{ gap: t.space.sm }}>
          <AppText variant="h2" accessibilityRole="header">
            {R.restart.title}
          </AppText>
          <AppText>{R.restart.body}</AppText>
        </Card>
      ) : null}

      {step === 'done' ? (
        <Card style={{ alignItems: 'center', gap: 10, padding: 22 }}>
          <IconTile icon="sprout" tone="focus" size="lg" round />
          <AppText center>{R.restart.done}</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}
