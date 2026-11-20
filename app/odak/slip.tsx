import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { mmss, useCountdown } from '@/features/camps/core/sosTools';
import { fill, ODAK_ONBOARDING as ONB, ODAK_PANEL as P, ODAK_PLANS, ODAK_SLIP as S } from '@/features/camps/odak/content';
import { goalCounters } from '@/features/camps/odak/engine/goals';
import { managedCount } from '@/features/camps/odak/engine/sos';
import { buildPlans } from '@/features/camps/odak/onboarding';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import type { BehaviorKind, OdakTriggerId } from '@/features/camps/odak/types';
import { PillGroup } from '@/features/camps/odak/ui';
import { goBack } from '@/lib/nav';

type Step = 'welcome' | 'what' | 'notErased' | 'compassion' | 'plan' | 'done';
const STEPS: Step[] = ['welcome', 'what', 'notErased', 'compassion', 'plan', 'done'];

/** When the slip happened (for the log). */
function whenToDate(id: string, now: Date): Date {
  if (id === 'yesterday') return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 21, 0);
  if (id === 'today') return new Date(Math.max(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 30).getTime(), now.getTime() - 3 * 3_600_000));
  return now;
}

/**
 * Slip flow (SPEC_ODAK_KAMPI 5.6, anti-shame): welcome → what happened → "a slip does not erase your
 * work" (totals kept) → 1-minute self-compassion → new or updated if-then plan → carry on.
 * `from=log` means the behaviour is already logged.
 */
export default function OdakSlip() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { goal, events, urges } = useOdakStore();
  const [now] = useState(() => new Date());
  const [step, setStep] = useState<Step>('welcome');
  const [kind, setKind] = useState<BehaviorKind | null>(null);
  const [trigger, setTrigger] = useState<OdakTriggerId | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [when, setWhen] = useState('now');
  const [pick, setPick] = useState<number | 'own'>(0);
  const [own, setOwn] = useState('');
  const cd = useCountdown(S.compassion.seconds);
  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, idx + 1)]!);

  const saveWhat = async () => {
    if (from !== 'log' && kind) await useOdakStore.getState().logBehavior(kind, whenToDate(when, now), { trigger: trigger ?? undefined, emotionBefore: emotion ?? undefined });
    next();
  };
  const savePlan = async () => {
    if (trigger) {
      const tpl = ODAK_PLANS.templates[trigger];
      const thenText = pick === 'own' ? own.trim() : tpl.then[pick]!;
      if (thenText) await useOdakStore.getState().addPlan(buildPlans([{ trigger, ifText: tpl.if, thenText }], new Date())[0]!);
    }
    next();
  };

  const counters = goal ? goalCounters(goal, events, new Date()) : [];
  const total = counters.length ? Math.max(...counters.map((c) => c.total)) : 0;
  const longest = counters.length ? Math.max(...counters.map((c) => c.longest)) : 0;
  const prompt = S.compassion.prompts[Math.min(S.compassion.prompts.length - 1, Math.floor((cd.elapsed / S.compassion.seconds) * S.compassion.prompts.length))]!;

  const footer =
    step === 'welcome' || step === 'notErased' ? (
      <Button label={tr('common.continue')} size="lg" onPress={next} />
    ) : step === 'what' ? (
      <Button label={tr('common.continue')} size="lg" onPress={() => void saveWhat()} />
    ) : step === 'compassion' ? (
      <Button label={tr('common.continue')} size="lg" variant={cd.finished ? 'primary' : 'secondary'} onPress={next} />
    ) : step === 'plan' ? (
      <View style={{ gap: 6 }}>
        <Button label={S.plan.save} size="lg" disabled={!trigger || (pick === 'own' && !own.trim())} onPress={() => void savePlan()} />
        <Button label={S.plan.skip} variant="ghost" onPress={next} />
      </View>
    ) : (
      <Button label={S.done.back} size="lg" onPress={() => goBack('/odak')} />
    );

  return (
    <Screen footer={footer}>
      <Header title={S.welcome.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <ProgressBar value={(idx + 1) / STEPS.length} height={6} />

      {step === 'welcome' ? (
        <Card style={{ alignItems: 'center', gap: 10, padding: 22 }}>
          <IconTile icon="heart" tone="focus" size="lg" round />
          <AppText variant="h2" center accessibilityRole="header">
            {S.welcome.title}
          </AppText>
          <AppText center>{S.welcome.body}</AppText>
        </Card>
      ) : null}

      {step === 'what' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {S.what.title}
          </AppText>
          <AppText muted>{S.what.hint}</AppText>
          {from !== 'log' ? (
            <>
              <AppText weight="800">{S.what.kind}</AppText>
              <View style={{ gap: t.space.sm }}>
                {P.log.options.map((o) => (
                  <ChoiceCard key={o.id} icon={o.icon} label={o.label} selected={kind === o.id} onPress={() => setKind((k) => (k === o.id ? null : (o.id as BehaviorKind)))} />
                ))}
              </View>
              <AppText weight="800">{S.what.when}</AppText>
              <PillGroup items={S.what.whenOptions} selected={[when]} onToggle={setWhen} />
            </>
          ) : null}
          <AppText weight="800">{S.what.trigger}</AppText>
          <PillGroup items={ONB.triggers.options} selected={trigger ? [trigger] : []} onToggle={(id) => setTrigger((x) => (x === id ? null : (id as OdakTriggerId)))} />
          <AppText weight="800">{S.what.emotion}</AppText>
          <PillGroup items={ONB.emotions.before} selected={emotion ? [emotion] : []} onToggle={(id) => setEmotion((x) => (x === id ? null : id))} />
        </>
      ) : null}

      {step === 'notErased' ? (
        <Card style={{ gap: 10, backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
          <AppText variant="h2" accessibilityRole="header">
            {S.notErased.title}
          </AppText>
          <AppText>{S.notErased.body}</AppText>
          <AppText weight="800">✓ {fill(S.notErased.total, { n: total })}</AppText>
          <AppText weight="800">✓ {fill(S.notErased.longest, { n: longest })}</AppText>
          <AppText weight="800">✓ {fill(S.notErased.managed, { n: managedCount(urges) })}</AppText>
        </Card>
      ) : null}

      {step === 'compassion' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {S.compassion.title}
          </AppText>
          <Card style={{ minHeight: 110, justifyContent: 'center' }}>
            <AppText variant="h3" center accessibilityLiveRegion="polite">
              {cd.finished ? S.compassion.done : prompt}
            </AppText>
          </Card>
          <AppText variant="h2" center accessibilityLabel={tr('camp.sos.timeLeft', { time: mmss(cd.left) })}>
            {mmss(cd.left)}
          </AppText>
          <ProgressBar value={cd.elapsed / S.compassion.seconds} height={8} />
          {!cd.finished ? <Button label={cd.running ? tr('camp.sos.pause') : cd.elapsed > 0 ? tr('camp.sos.resume') : S.compassion.start} icon={cd.running ? 'pause' : 'play'} variant="secondary" onPress={cd.running ? cd.pause : cd.start} /> : null}
        </>
      ) : null}

      {step === 'plan' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {S.plan.title}
          </AppText>
          <AppText muted>{S.plan.hint}</AppText>
          <PillGroup items={ONB.triggers.options} selected={trigger ? [trigger] : []} onToggle={(id) => setTrigger(id as OdakTriggerId)} />
          {trigger ? (
            <Card style={{ gap: t.space.sm }}>
              <AppText weight="800" color={t.colors.accent}>
                {ONB.plans.if} {ODAK_PLANS.templates[trigger].if}…
              </AppText>
              {ODAK_PLANS.templates[trigger].then.map((th, i) => (
                <ChoiceCard key={th} label={th} selected={pick === i} onPress={() => setPick(i)} />
              ))}
              <ChoiceCard label={S.plan.own} selected={pick === 'own'} onPress={() => setPick('own')} />
              {pick === 'own' ? (
                <TextInput
                  value={own}
                  onChangeText={setOwn}
                  maxLength={120}
                  placeholder={S.plan.ownPlaceholder}
                  accessibilityLabel={S.plan.ownPlaceholder}
                  placeholderTextColor={t.colors.textMuted}
                  style={{ minHeight: 52, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, paddingHorizontal: 14, color: t.colors.text, fontSize: t.type.body.fontSize }}
                />
              ) : null}
            </Card>
          ) : null}
        </>
      ) : null}

      {step === 'done' ? (
        <Card style={{ alignItems: 'center', gap: 10, padding: 22 }}>
          <IconTile icon="sprout" tone="focus" size="lg" round />
          <AppText variant="h2" center accessibilityRole="header">
            {S.done.title}
          </AppText>
          <AppText center>{S.done.body}</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}
