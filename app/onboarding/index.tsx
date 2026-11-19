import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, TimeStepper, useTheme } from '@/components';
import { PlanArt } from '@/components/Illustrations';
import { APP_NAME, PLAN_LENGTH_DAYS } from '@/config/app';
import { requestNotificationPermission } from '@/features/reminders/permissions';
import { generateSession } from '@/features/training/generateSession';
import { initialTrack } from '@/features/training/kegelProfile';
import { startingLevelFor } from '@/features/training/levels';
import { toDateKey } from '@/lib/date';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { ActivityLevel, AgeRange, Experience, Goal } from '@/types';

const GOALS: { value: Goal; emoji: string }[] = [
  { value: 'endurance', emoji: '⏱️' },
  { value: 'bladder', emoji: '💧' },
  { value: 'erection', emoji: '⚡' },
  { value: 'confidence', emoji: '🦁' },
  { value: 'general', emoji: '🌿' },
  { value: 'postSurgery', emoji: '🩹' },
];
const AGES: AgeRange[] = ['16-24', '25-34', '35-44', '45-54', '55+'];
const EXPERIENCE: Experience[] = ['none', 'some', 'regular'];
const ACTIVITY: ActivityLevel[] = ['low', 'mid', 'high'];
const STEPS = 7;

export default function Onboarding() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [age, setAge] = useState<AgeRange | null>(null);
  const [exp, setExp] = useState<Experience | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [time, setTime] = useState('21:00');
  const [notifAsked, setNotifAsked] = useState<null | boolean>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) {
        setStep(step - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const level = startingLevelFor(exp);
  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));

  const finish = () => {
    useTrainingStore.getState().update({ level, track: initialTrack(goals) });
    useSettingsStore.getState().update({ reminderTimes: [time], remindersEnabled: notifAsked !== false });
    useProfileStore.getState().update({ goals, ageRange: age, experience: exp, activity, onboardingDone: true });
    // Kegel v2: the muscle profile screening comes before the tutorial (spec §12).
    router.replace({ pathname: '/kegel/screening', params: { from: 'onboarding' } });
  };

  const canContinue = [true, goals.length > 0, !!age, !!exp, !!activity, true, true][step];

  const toggleGoal = (g: Goal) => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  const footer =
    step === 5 ? (
      <>
        <Button
          label={tr('onboarding.reminder.allow')}
          size="lg"
          variant="accent"
          onPress={async () => {
            const ok = await requestNotificationPermission();
            setNotifAsked(ok);
            next();
          }}
        />
        <Button
          label={tr('onboarding.reminder.skip')}
          variant="ghost"
          onPress={() => {
            setNotifAsked(false);
            next();
          }}
        />
      </>
    ) : (
      <Button label={step === STEPS - 1 ? tr('onboarding.plan.cta') : tr('common.continue')} size="lg" variant="accent" disabled={!canContinue} onPress={step === STEPS - 1 ? finish : next} />
    );

  return (
    <Screen footer={footer}>
      <View style={{ gap: 12 }}>
        {step > 0 ? <Header onBack={() => setStep(step - 1)} /> : <View style={{ height: 48 }} />}
        <ProgressBar value={(step + 1) / STEPS} accessibilityLabel={tr('onboarding.progress', { step: step + 1, total: STEPS })} />
      </View>

      {step === 0 ? (
        <View style={{ gap: 16, marginTop: 24 }}>
          <AppText variant="display">👋</AppText>
          <AppText variant="h1">{tr('onboarding.welcome.title', { app: APP_NAME })}</AppText>
          <AppText variant="h3" weight="500">
            {tr('onboarding.welcome.body')}
          </AppText>
          <Card style={{ gap: 6 }}>
            <AppText weight="700">⏱️ {tr('onboarding.welcome.point1')}</AppText>
            <AppText weight="700">📳 {tr('onboarding.welcome.point2')}</AppText>
            <AppText weight="700">🔒 {tr('onboarding.welcome.point3')}</AppText>
          </Card>
        </View>
      ) : null}

      {step === 1 ? (
        <Question title={tr('onboarding.goals.title')} hint={tr('onboarding.goals.hint')}>
          {GOALS.map((g) => (
            <ChoiceCard key={g.value} multi emoji={g.emoji} label={tr(`goal.${g.value}`)} selected={goals.includes(g.value)} onPress={() => toggleGoal(g.value)} />
          ))}
        </Question>
      ) : null}

      {step === 2 ? (
        <Question title={tr('onboarding.age.title')}>
          {AGES.map((a) => (
            <ChoiceCard key={a} label={a === '55+' ? tr('onboarding.age.55') : a} selected={age === a} onPress={() => setAge(a)} />
          ))}
        </Question>
      ) : null}

      {step === 3 ? (
        <Question title={tr('onboarding.experience.title')}>
          {EXPERIENCE.map((e) => (
            <ChoiceCard key={e} label={tr(`onboarding.experience.${e}.label`)} description={tr(`onboarding.experience.${e}.hint`)} selected={exp === e} onPress={() => setExp(e)} />
          ))}
        </Question>
      ) : null}

      {step === 4 ? (
        <Question title={tr('onboarding.activity.title')} hint={tr('onboarding.activity.hint')}>
          {ACTIVITY.map((a) => (
            <ChoiceCard key={a} label={tr(`onboarding.activity.${a}.label`)} description={tr(`onboarding.activity.${a}.hint`)} selected={activity === a} onPress={() => setActivity(a)} />
          ))}
        </Question>
      ) : null}

      {step === 5 ? (
        <Question title={tr('onboarding.reminder.title')} hint={tr('onboarding.reminder.hint')}>
          <Card style={{ paddingVertical: 24 }}>
            <TimeStepper value={time} onChange={setTime} />
          </Card>
          <AppText variant="small" muted>
            {tr('onboarding.reminder.privacy')}
          </AppText>
        </Question>
      ) : null}

      {step === 6 ? (
        <View style={{ gap: 16, marginTop: 8 }}>
          <AppText variant="h1">{tr('onboarding.plan.title')}</AppText>
          <AppText variant="h3" weight="500">
            {tr('onboarding.plan.body', { level, days: PLAN_LENGTH_DAYS })}
          </AppText>
          <Card style={{ alignItems: 'center', gap: 12 }}>
            <PlanArt level={level} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch' }}>
              <Mini label={tr('onboarding.plan.start')} value={tr('common.level', { level })} />
              <Mini
                label={tr('onboarding.plan.daily')}
                value={tr('common.minutes', { count: Math.round(generateSession({ track: 'general', level, durationPreset: 'standard', dayIndex: 0, weekIndex: 0, hypertonic: false, seed: toDateKey() }).plannedSec / 60) })}
              />
              <Mini label={tr('onboarding.plan.reminder')} value={notifAsked === false ? '—' : time} />
            </View>
          </Card>
          <AppText muted>{tr('onboarding.plan.next')}</AppText>
        </View>
      ) : null}
      <View style={{ height: t.spacing(2) }} />
    </Screen>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 12, marginTop: 8 }}>
      <AppText variant="h1" accessibilityRole="header">
        {title}
      </AppText>
      {hint ? <AppText muted>{hint}</AppText> : null}
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <AppText variant="h3">{value}</AppText>
      <AppText variant="tiny" muted>
        {label}
      </AppText>
    </View>
  );
}
