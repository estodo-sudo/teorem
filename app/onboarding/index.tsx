import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Children, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Branded, Icon, Screen, TimeStepper, useTheme, type IconName } from '@/components';
import { AnimatedArt, type AnimatedArtName } from '@/components/AnimatedArt';
import { Badge, Button, Card, IconTile, OptionCard, ScalePressable, SegmentedSteps } from '@/components/ui';
import { APP_NAME, PLAN_LENGTH_DAYS } from '@/config/app';
import { requestNotificationPermission } from '@/features/reminders/permissions';
import { generateSession } from '@/features/training/generateSession';
import { initialTrack } from '@/features/training/kegelProfile';
import { startingLevelFor } from '@/features/training/levels';
import { sexCtx } from '@/i18n/sex';
import { toDateKey } from '@/lib/date';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { ActivityLevel, AgeRange, Experience, Goal, Sex } from '@/types';

/** Neutral icons only (ui-v2): nothing that hints at the body part or at sex. */
const GOALS: { value: Goal; icon: IconName }[] = [
  { value: 'endurance', icon: 'clock' },
  { value: 'bladder', icon: 'droplet' },
  { value: 'erection', icon: 'pulse' },
  { value: 'confidence', icon: 'star' },
  { value: 'general', icon: 'leaf' },
  { value: 'postSurgery', icon: 'shield' },
];
/** Women see the goals that matter most to them first (same ids, female labels via `sexCtx`). */
const FEMALE_ORDER: Goal[] = ['bladder', 'postSurgery', 'erection', 'general', 'confidence', 'endurance'];
const goalsFor = (sex: Sex) => (sex === 'female' ? FEMALE_ORDER.map((v) => GOALS.find((g) => g.value === v)!) : GOALS);
const SEXES: Sex[] = ['female', 'male'];
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
const STEPS = 8;

/**
 * Onboarding — ui-v3 (SPEC_UI_V3 §7.9): a thin progress bar with "1 / 7", a header zone (illustration +
 * title1 + body) on the welcome, goals and plan steps, 64 px selection cards and one pinned primary
 * button. Questions, order and saved data unchanged.
 */
export default function Onboarding() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex | null>(useProfileStore.getState().profile.sex);
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
    useProfileStore.getState().update({ sex, goals, ageRange: age, experience: exp, activity, onboardingDone: true });
    // Kegel v2: the muscle profile screening comes before the tutorial (spec §12).
    router.replace({ pathname: '/kegel/screening', params: { from: 'onboarding' } });
  };

  const canContinue = [true, !!sex, goals.length > 0, !!age, !!exp, !!activity, true, true][step];
  const ctx = sexCtx(sex ?? 'male');
  const chooseSex = (v: Sex) => {
    setSex(v);
    // Saved at once: the screening and tracks right after onboarding read their texts from the profile.
    useProfileStore.getState().update({ sex: v });
  };

  const toggleGoal = (g: Goal) => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  const footer =
    step === 6 ? (
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

      {/* Each step slides in from the right; its cards follow one by one (motion polish 2026-11-25). */}
      <Animated.View key={step} entering={FadeInRight.duration(320)} style={{ gap: t.space.xl }}>
      {step === 0 ? (
        <View style={{ gap: t.space.xl }}>
          <HeaderZone art="welcome" kicker={tr('onboarding.welcome.kicker')} title={tr('onboarding.welcome.title', { app: APP_NAME })} body={tr('onboarding.welcome.body')} />
          <Card style={{ paddingHorizontal: t.space.lg }}>
            <CheckRow icon="clock" text={tr('onboarding.welcome.point1')} />
            <CheckRow icon="vibrate" text={tr('onboarding.welcome.point2')} divider />
            <CheckRow icon="lock" text={tr('onboarding.welcome.point3')} divider />
          </Card>
        </View>
      ) : null}

      {step === 1 ? (
        <Question title={tr('onboarding.sex.title')} hint={tr('onboarding.sex.hint')}>
          {/* side by side, the word and its sign only (2026-11-26) */}
          <View style={{ flexDirection: 'row', gap: 12 }} accessibilityRole="radiogroup">
            {SEXES.map((v) => (
              <SexTile key={v} sex={v} label={tr(`onboarding.sex.${v}`)} selected={sex === v} onPress={() => chooseSex(v)} />
            ))}
          </View>
        </Question>
      ) : null}

      {step === 2 ? (
        <Question multi art="goals" title={tr('onboarding.goals.title')} hint={tr('onboarding.goals.hint')}>
          {goalsFor(sex ?? 'male').map((g) => (
            <OptionCard key={g.value} multi icon={g.icon} label={tr(`goal.${g.value}`, ctx)} selected={goals.includes(g.value)} onPress={() => toggleGoal(g.value)} />
          ))}
          {/* Live count + chip summary of the picks */}
          <View style={{ gap: t.space.sm, paddingTop: t.space.xs }} accessibilityLiveRegion="polite">
            <AppText variant="footnote" muted>
              {goals.length ? tr('onboarding.goals.selected', { count: goals.length }) : tr('onboarding.goals.none')}
            </AppText>
            {goals.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.xs }}>
                {goalsFor(sex ?? 'male').filter((g) => goals.includes(g.value)).map((g) => (
                  <Badge key={g.value} icon={g.icon} label={tr(`goal.${g.value}`, ctx)} />
                ))}
              </View>
            ) : null}
          </View>
        </Question>
      ) : null}

      {step === 3 ? (
        <Question title={tr('onboarding.age.title')}>
          {AGES.map((a) => (
            <OptionCard key={a} icon="user" label={a === '55+' ? tr('onboarding.age.55') : a} selected={age === a} onPress={() => setAge(a)} />
          ))}
        </Question>
      ) : null}

      {step === 4 ? (
        <Question title={tr('onboarding.experience.title')}>
          {EXPERIENCE.map((e) => (
            <OptionCard key={e.value} icon={e.icon} label={tr(`onboarding.experience.${e.value}.label`)} description={tr(`onboarding.experience.${e.value}.hint`)} selected={exp === e.value} onPress={() => setExp(e.value)} />
          ))}
        </Question>
      ) : null}

      {step === 5 ? (
        <Question title={tr('onboarding.activity.title')} hint={tr('onboarding.activity.hint')}>
          {ACTIVITY.map((a) => (
            <OptionCard key={a.value} icon={a.icon} label={tr(`onboarding.activity.${a.value}.label`)} description={tr(`onboarding.activity.${a.value}.hint`)} selected={activity === a.value} onPress={() => setActivity(a.value)} />
          ))}
        </Question>
      ) : null}

      {step === 6 ? (
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

      {step === 7 ? (
        <View style={{ gap: t.space.xl }}>
          <HeaderZone art="plan" title={tr('onboarding.plan.title')} body={tr('onboarding.plan.body', { level, days: PLAN_LENGTH_DAYS })} />
          <Card style={{ paddingHorizontal: t.space.lg }}>
            <SummaryRow label={tr('onboarding.plan.goals')} value={goals.map((g) => tr(`goal.${g}`, ctx)).join(', ')} />
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
      </Animated.View>
    </Screen>
  );
}

/** Header zone (§7.9): looping animated art (Remotion) + title1 + body. */
function HeaderZone({ art, kicker, title, body }: { art?: AnimatedArtName; kicker?: string; title: string; body?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.md }}>
      {art ? (
        <Animated.View entering={FadeInDown.duration(420)} style={{ alignItems: 'center' }}>
          <AnimatedArt name={art} size={176} />
        </Animated.View>
      ) : null}
      {kicker ? (
        <AppText variant="caption" muted>
          {kicker}
        </AppText>
      ) : null}
      <AppText variant="title1" accessibilityRole="header">
        <Branded>{title}</Branded>
      </AppText>
      {body ? (
        <AppText variant="body" muted>
          {body}
        </AppText>
      ) : null}
    </View>
  );
}

function Question({ title, hint, multi, art, children }: { title: string; hint?: string; multi?: boolean; art?: AnimatedArtName; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.lg }}>
      <HeaderZone art={art} title={title} body={hint} />
      <View style={{ gap: t.space.sm }} accessibilityRole={multi ? undefined : 'radiogroup'}>
        {Children.map(children, (child, i) => (
          <Animated.View entering={FadeInDown.delay(90 + i * 60).duration(300)}>{child}</Animated.View>
        ))}
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

/** One of the two sex choices: a tall tile with the sign in a soft circle and the word under it. */
function SexTile({ sex, label, selected, onPress }: { sex: Sex; label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const k = t.tokens;
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={`sex-${sex}`}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.space.md,
        paddingVertical: t.space.xl,
        borderRadius: t.radius.lg,
        borderWidth: selected ? t.border.medium : t.border.thin,
        borderColor: selected ? k.primary : k.border,
        backgroundColor: selected ? k.primarySoft : k.card,
      }}
    >
      <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? k.primary : k.muted }}>
        <Icon name={sex} size={34} color={selected ? k.primaryForeground : k.primary} strokeWidth={2.2} />
      </View>
      <AppText variant="title3" weight="700">
        {label}
      </AppText>
      {selected ? (
        <View style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: k.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={14} color={k.primaryForeground} strokeWidth={2.6} />
        </View>
      ) : null}
    </ScalePressable>
  );
}
