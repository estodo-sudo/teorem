import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, TimeStepper, useTheme, type IconName } from '@/components';
import { Badge, Button, Card, Illustration, IconTile, OptionCard, ScalePressable, SegmentedSteps, type IllustrationName } from '@/components/ui';
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

/** Neutral icons only (ui-v2): nothing that hints at the body part or at sex. */
const GOALS: { value: Goal; icon: IconName }[] = [
  { value: 'endurance', icon: 'clock' },
  { value: 'bladder', icon: 'droplet' },
  { value: 'erection', icon: 'pulse' },
  { value: 'confidence', icon: 'star' },
  { value: 'general', icon: 'leaf' },
  { value: 'postSurgery', icon: 'shield' },
];
const AGES: AgeRange[] = ['16-24', '25-34', '35-44', '45-54', '55+'];
const EXPERIENCE: { value: Experience; icon: IconName }[] = [
  { value: 'none', icon: 'leaf' },
  { value: 'some', icon: 'layers' },
  { value: 'regular', icon: 'target' },
];
const ACTIVITY: { value: ActivityLevel; icon: IconName }[] = [
  { value: 'low', icon: 'body' },
  { value: 'mid', icon: 'pulse' },
  { value: 'high', icon: 'trophy' },
];
const STEPS = 7;

/**
 * Onboarding — ui-v3 (SPEC_UI_V3 §7.9): a thin progress bar with "1 / 7", a header zone (illustration +
 * title1 + body) on the welcome, goals and plan steps, 64 px selection cards and one pinned primary
 * button. Questions, order and saved data unchanged.
 */
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
          icon="bell"
          fullWidth
          onPress={async () => {
            const ok = await requestNotificationPermission();
            setNotifAsked(ok);
            next();
          }}
        />
        <Button
          label={tr('onboarding.reminder.skip')}
          variant="ghost"
          fullWidth
          onPress={() => {
            setNotifAsked(false);
            next();
          }}
        />
      </>
    ) : (
      <Button label={step === STEPS - 1 ? tr('onboarding.plan.cta') : tr('common.continue')} size="lg" fullWidth icon={step === STEPS - 1 ? 'play' : undefined} disabled={!canContinue} onPress={step === STEPS - 1 ? finish : next} />
    );

  const dailyMin = Math.round(generateSession({ level, seed: toDateKey() }).plannedSec / 60);

  return (
    <Screen footer={footer}>
      {/* Top: back + segmented step bar */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.space.md }}>
        {step > 0 ? (
          <ScalePressable
            onPress={() => setStep(step - 1)}
            accessibilityRole="button"
            accessibilityLabel={tr('onboarding.back')}
            style={{ width: t.touch, height: t.touch, borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.muted }}
          >
            <Icon name="back" size="md" color={t.tokens.foreground} />
          </ScalePressable>
        ) : null}
        <View style={{ flex: 1, paddingBottom: step > 0 ? t.space.sm : 0 }}>
          <SegmentedSteps total={STEPS} current={step} label={tr('onboarding.progress', { step: step + 1, total: STEPS })} />
        </View>
      </View>

      {step === 0 ? (
        <View style={{ gap: t.space.xl }}>
          <HeaderZone illustration="onboarding-welcome" kicker={tr('onboarding.welcome.kicker')} title={tr('onboarding.welcome.title', { app: APP_NAME })} body={tr('onboarding.welcome.body')} />
          <Card style={{ paddingHorizontal: t.space.lg }}>
            <CheckRow icon="clock" text={tr('onboarding.welcome.point1')} />
            <CheckRow icon="vibrate" text={tr('onboarding.welcome.point2')} divider />
            <CheckRow icon="lock" text={tr('onboarding.welcome.point3')} divider />
          </Card>
        </View>
      ) : null}

      {step === 1 ? (
        <Question multi illustration="onboarding-goals" title={tr('onboarding.goals.title')} hint={tr('onboarding.goals.hint')}>
          {GOALS.map((g) => (
            <OptionCard key={g.value} multi icon={g.icon} label={tr(`goal.${g.value}`)} selected={goals.includes(g.value)} onPress={() => toggleGoal(g.value)} />
          ))}
          {/* Live count + chip summary of the picks */}
          <View style={{ gap: t.space.sm, paddingTop: t.space.xs }} accessibilityLiveRegion="polite">
            <AppText variant="footnote" muted>
              {goals.length ? tr('onboarding.goals.selected', { count: goals.length }) : tr('onboarding.goals.none')}
            </AppText>
            {goals.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.xs }}>
                {GOALS.filter((g) => goals.includes(g.value)).map((g) => (
                  <Badge key={g.value} icon={g.icon} label={tr(`goal.${g.value}`)} />
                ))}
              </View>
            ) : null}
          </View>
        </Question>
      ) : null}

      {step === 2 ? (
        <Question title={tr('onboarding.age.title')}>
          {AGES.map((a) => (
            <OptionCard key={a} icon="user" label={a === '55+' ? tr('onboarding.age.55') : a} selected={age === a} onPress={() => setAge(a)} />
          ))}
        </Question>
      ) : null}

      {step === 3 ? (
        <Question title={tr('onboarding.experience.title')}>
          {EXPERIENCE.map((e) => (
            <OptionCard key={e.value} icon={e.icon} label={tr(`onboarding.experience.${e.value}.label`)} description={tr(`onboarding.experience.${e.value}.hint`)} selected={exp === e.value} onPress={() => setExp(e.value)} />
          ))}
        </Question>
      ) : null}

      {step === 4 ? (
        <Question title={tr('onboarding.activity.title')} hint={tr('onboarding.activity.hint')}>
          {ACTIVITY.map((a) => (
            <OptionCard key={a.value} icon={a.icon} label={tr(`onboarding.activity.${a.value}.label`)} description={tr(`onboarding.activity.${a.value}.hint`)} selected={activity === a.value} onPress={() => setActivity(a.value)} />
          ))}
        </Question>
      ) : null}

      {step === 5 ? (
        <Question title={tr('onboarding.reminder.title')} hint={tr('onboarding.reminder.hint')}>
          <Card style={{ paddingVertical: t.space.xl }}>
            <TimeStepper value={time} onChange={setTime} />
          </Card>
          <View style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-start' }}>
            <Icon name="lock" size="sm" color={t.tokens.mutedForeground} />
            <AppText variant="footnote" muted style={{ flex: 1 }}>
              {tr('onboarding.reminder.privacy')}
            </AppText>
          </View>
        </Question>
      ) : null}

      {step === 6 ? (
        <View style={{ gap: t.space.xl }}>
          <HeaderZone illustration="onboarding-plan" title={tr('onboarding.plan.title')} body={tr('onboarding.plan.body', { level, days: PLAN_LENGTH_DAYS })} />
          <Card style={{ paddingHorizontal: t.space.lg }}>
            <SummaryRow label={tr('onboarding.plan.goals')} value={goals.map((g) => tr(`goal.${g}`)).join(', ')} />
            <SummaryRow label={tr('onboarding.plan.start')} value={tr('common.level', { level })} divider />
            <SummaryRow label={tr('onboarding.plan.daily')} value={tr('common.minutes', { count: dailyMin })} divider />
            <SummaryRow label={tr('onboarding.plan.reminder')} value={notifAsked === false ? tr('onboarding.plan.reminderOff') : time} off={notifAsked === false} divider />
          </Card>
          <View style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-start' }}>
            <Icon name="info" size="sm" color={t.tokens.mutedForeground} />
            <AppText variant="footnote" muted style={{ flex: 1 }}>
              {tr('onboarding.plan.next')}
            </AppText>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

/** Header zone (§7.9): illustration (160 px) + title1 + body. */
function HeaderZone({ illustration, kicker, title, body }: { illustration?: IllustrationName; kicker?: string; title: string; body?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.md }}>
      {illustration ? (
        <View style={{ alignItems: 'center' }}>
          <Illustration name={illustration} size={160} />
        </View>
      ) : null}
      {kicker ? (
        <AppText variant="caption" muted>
          {kicker}
        </AppText>
      ) : null}
      <AppText variant="title1" accessibilityRole="header">
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" muted>
          {body}
        </AppText>
      ) : null}
    </View>
  );
}

function Question({ title, hint, multi, illustration, children }: { title: string; hint?: string; multi?: boolean; illustration?: IllustrationName; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.lg }}>
      <HeaderZone illustration={illustration} title={title} body={hint} />
      <View style={{ gap: t.space.sm }} accessibilityRole={multi ? undefined : 'radiogroup'}>
        {children}
      </View>
    </View>
  );
}

/** Welcome checklist row: icon tile + text + check. */
function CheckRow({ icon, text, divider }: { icon: IconName; text: string; divider?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 64, borderTopWidth: divider ? t.border.thin : 0, borderTopColor: t.tokens.border }}>
      <IconTile icon={icon} />
      <AppText variant="body" style={{ flex: 1 }}>
        {text}
      </AppText>
      <Icon name="check" size="md" color={t.tokens.primary} />
    </View>
  );
}

function SummaryRow({ label, value, off, divider }: { label: string; value: string; off?: boolean; divider?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 56, paddingVertical: t.space.sm, borderTopWidth: divider ? t.border.thin : 0, borderTopColor: t.tokens.border }} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="callout" muted>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={{ flex: 1, textAlign: 'right', color: off ? t.tokens.mutedForeground : t.tokens.foreground }}>
        {value}
      </AppText>
    </View>
  );
}
