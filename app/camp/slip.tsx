import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_CHECKIN as CHK, CAMP_ONBOARDING as ONB } from '@/features/camp/content';
import { totalSmokeFreeDays } from '@/features/camp/engine/counters';
import { PlanEditor } from '@/features/camp/PlanEditor';
import { campAttempt } from '@/features/camp/state';
import type { Score5, TriggerId } from '@/features/camp/types';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

type Step = 'welcome' | 'what' | 'plan' | 'done';
const COUNTS = [1, 2, 3, 4] as const;

/**
 * Slip flow (1 or a few cigarettes), never judging: welcome → how many → what happened (trigger,
 * feeling) → a new if–then plan → back to the programme. "Since the last cigarette" restarts; the
 * total smoke-free days and the phase stay. `logged=1` when the cigarette is already in the diary.
 */
export default function CampSlip() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const params = useLocalSearchParams<{ trigger?: string; logged?: string }>();
  const camp = useCampStore();
  const attempt = campAttempt(camp);
  const known = ONB.triggers.some((x) => x.id === params.trigger) ? (params.trigger as TriggerId) : null;
  const alreadyLogged = params.logged === '1';
  const [step, setStep] = useState<Step>('welcome');
  const [count, setCount] = useState<number>(1);
  const [trigger, setTrigger] = useState<TriggerId | null>(known);
  const [mood, setMood] = useState<Score5 | null>(null);
  const back = () => goBack('/camp');
  const triggers = [...ONB.triggers].sort((a, b) => Number(camp.profile?.triggers.includes(b.id)) - Number(camp.profile?.triggers.includes(a.id)));

  const logSlip = () => {
    if (alreadyLogged || !attempt) return;
    for (let i = 0; i < count; i += 1) useCampEventsStore.getState().logCigarette({ attemptId: attempt.id, isSlip: attempt.status !== 'preparing', trigger: trigger ?? undefined, mood: mood ?? undefined });
  };

  const chip = (on: boolean) => ({
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: t.radius.pill,
    borderWidth: 1.5,
    borderColor: on ? t.colors.accent : t.colors.border,
    backgroundColor: on ? tint(t.colors.accent, '1A') : t.colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 6,
  });

  const footer =
    step === 'welcome' ? (
      <Button label={tr('common.next')} size="lg" variant="primary" onPress={() => setStep('what')} />
    ) : step === 'what' ? (
      <Button
        label={tr('common.next')}
        size="lg"
        variant="primary"
        onPress={() => {
          logSlip();
          setStep(trigger ? 'plan' : 'done');
        }}
      />
    ) : step === 'done' ? (
      <Button label={tr('camp.slip.toPanel')} size="lg" variant="primary" onPress={back} />
    ) : null;

  return (
    <Screen footer={footer}>
      <Header title={tr('camp.slip.title')} close onBack={back} />

      {step === 'welcome' ? (
        <>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <AppText variant="display">🌱</AppText>
            <AppText variant="h1" center accessibilityRole="header">
              {CHK.slip.welcomeTitle}
            </AppText>
          </View>
          <AppText center>{CHK.slip.welcome}</AppText>
          {!alreadyLogged ? (
            <>
              <AppText weight="800">{CHK.slip.howMany}</AppText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {COUNTS.map((n) => (
                  <Pressable key={n} onPress={() => setCount(n)} accessibilityRole="radio" accessibilityState={{ selected: count === n }} style={[chip(count === n), { flex: 1 }]}>
                    <AppText weight="800">{n === 4 ? tr('camp.checkin.orMore', { n: 4 }) : String(n)}</AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}

      {step === 'what' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {CHK.slip.what}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {triggers.map((x) => {
              const on = trigger === x.id;
              return (
                <Pressable key={x.id} onPress={() => setTrigger(on ? null : x.id)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={chip(on)}>
                  <AppText>{x.emoji}</AppText>
                  <AppText variant="small" weight="700">
                    {x.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <AppText weight="800">{CHK.slip.feeling}</AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {CHK.moods.map((m) => {
              const on = mood === m.v;
              return (
                <Pressable
                  key={m.v}
                  onPress={() => setMood(on ? null : m.v)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={m.label}
                  style={{ alignItems: 'center', gap: 4, width: 62, paddingVertical: 8, borderRadius: t.radius.lg, borderWidth: 2, borderColor: on ? t.colors.accent : 'transparent' }}
                >
                  <AppText style={{ fontSize: 30, lineHeight: 36 }}>{m.emoji}</AppText>
                  <AppText variant="tiny" weight="700" center>
                    {m.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {step === 'plan' && trigger ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {CHK.slip.next}
          </AppText>
          <AppText muted>{CHK.slip.nextHint}</AppText>
          <Card>
            <PlanEditor trigger={trigger} saveLabel={tr('camp.slip.savePlan')} onDone={() => setStep('done')} />
          </Card>
        </>
      ) : null}

      {step === 'done' ? (
        <>
          <View style={{ alignItems: 'center', gap: 8, marginTop: 20 }}>
            <AppText variant="display">💪</AppText>
            <AppText variant="h1" center accessibilityRole="header">
              {CHK.slip.doneTitle}
            </AppText>
            <AppText muted center>
              {CHK.slip.done}
            </AppText>
          </View>
          {attempt ? (
            <Card style={{ alignItems: 'center', backgroundColor: tint(t.colors.success, '14'), borderColor: t.colors.success, borderWidth: 2 }}>
              <AppText variant="h3" color={t.colors.success} center>
                {tr('camp.slip.totalKept', { count: totalSmokeFreeDays(attempt, useCampEventsStore.getState().cigarettes, new Date()) })}
              </AppText>
            </Card>
          ) : null}
          <Button label={CHK.slip.relapseLink} variant="ghost" onPress={() => router.replace('/camp/relapse')} />
        </>
      ) : null}
    </Screen>
  );
}
