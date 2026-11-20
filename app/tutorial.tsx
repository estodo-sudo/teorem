import type { IconName } from '@/components/Icon';
import type { ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, Screen, useTheme } from '@/components';
import { IconTile, SegmentedSteps } from '@/components/ui';
import { FindMuscleArt, PelvicFloorArt, TechniqueArt, VibrationArt } from '@/components/Illustrations';
import { generateTrialSession } from '@/features/training/generateSession';
import { playCue } from '@/features/training/haptics';
import { positionCard } from '@/features/training/player/playerUi';
import { WorkoutPlayer } from '@/features/training/player/WorkoutPlayer';
import { ThemeOverride } from '@/components/useTheme';
import { CHECKLIST, checklistDone, generateReleasePractice, quizPassed, TUTORIAL_ORDER, vibrationQuiz, type QuizAnswer, type TutorialStep } from '@/features/training/tutorial';
import { goBack as safeBack } from '@/lib/nav';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Eğitim v2 (SPEC_KEGEL_V2 §12): what / find the muscle (never while urinating) / lying start position /
 * technique / "am I doing it right?" checklist / vibration matching game / trial set / release practice /
 * common mistakes / "you're ready" — the first session is Quick (3 min). The muscle profile screening
 * comes right before (onboarding → /kegel/screening → here).
 */
export default function Tutorial() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const [step, setStep] = useState<TutorialStep>('what');
  const [runKey, setRunKey] = useState(0);
  const [checked, setChecked] = useState<string[]>([]);
  const trial = useMemo(() => generateTrialSession(), []);
  const release = useMemo(() => generateReleasePractice(), []);
  const mainStep: TutorialStep = step === 'tips' ? 'check' : step === 'releaseTips' ? 'releaseCheck' : step;
  const idx = TUTORIAL_ORDER.indexOf(mainStep);
  const next = () => setStep(TUTORIAL_ORDER[idx + 1]!);

  const finish = () => {
    if (replay) return safeBack();
    useProfileStore.getState().update({ tutorialDone: true });
    // The first session is Quick (3 min); the user's own preset applies afterwards.
    useTrainingStore.getState().update({ nextPresetOnce: 'quick' });
    router.replace('/paywall');
  };

  const back = () => {
    if (step === 'tips') return setStep('check');
    if (step === 'releaseTips') return setStep('releaseCheck');
    if (idx === 0) return replay ? safeBack() : undefined;
    setStep(TUTORIAL_ORDER[idx - 1]!);
  };

  // Guided runs (trial set, release practice) use the real player.
  if (step === 'trial' || step === 'release') {
    const isTrial = step === 'trial';
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        <AppText variant="h2">{isTrial ? tr('tutorial.trial.title') : tr('tutorial.release.title')}</AppText>
        <AppText muted>{isTrial ? tr('tutorial.trial.body') : tr('tutorial.release.body')}</AppText>
        {/* The player is always a dark focus surface (SPEC_UI_V3 §7.4). */}
        <ThemeOverride dark>
          <View style={{ flex: 1, backgroundColor: t.focus.bg, borderRadius: t.radius.lg, padding: t.space.lg }}>
            <WorkoutPlayer key={runKey} session={isTrial ? trial : release} minimal forceLabels onDone={() => setStep(isTrial ? 'check' : 'releaseCheck')} />
          </View>
        </ThemeOverride>
      </Screen>
    );
  }

  const paras = (key: string) => tr(key, { returnObjects: true }) as string[];
  const info: Partial<Record<TutorialStep, { art?: ReactNode; title: string; body: string[]; warn?: string; cta: string; onCta?: () => void; alt?: { label: string; onPress: () => void } }>> = {
    what: { art: <PelvicFloorArt />, title: tr('tutorial.what.title'), body: paras('tutorial.what.body'), cta: tr('tutorial.understood') },
    find: { art: <FindMuscleArt />, title: tr('tutorial.find.title'), body: paras('tutorial.find.body'), warn: tr('tutorial.find.warn'), cta: tr('tutorial.understood') },
    position: { art: <PositionArt />, title: tr('tutorial.position.title'), body: [positionCard('lying').text, ...paras('tutorial.position.body')], cta: tr('tutorial.understood') },
    technique: { art: <TechniqueArt />, title: tr('tutorial.technique.title'), body: paras('tutorial.technique.body'), warn: tr('tutorial.technique.warn'), cta: tr('tutorial.understood') },
    check: {
      title: tr('tutorial.check.title'),
      body: [tr('tutorial.check.body')],
      cta: tr('tutorial.check.yes'),
      alt: { label: tr('tutorial.check.unsure'), onPress: () => setStep('tips') },
    },
    tips: { title: tr('tutorial.tips.title'), body: paras('tutorial.tips.body'), cta: tr('tutorial.tips.retry'), onCta: () => (setRunKey((k) => k + 1), setStep('trial')) },
    releaseCheck: {
      title: tr('tutorial.releaseCheck.title'),
      body: [tr('tutorial.releaseCheck.body')],
      cta: tr('tutorial.releaseCheck.yes'),
      alt: { label: tr('tutorial.releaseCheck.unsure'), onPress: () => setStep('releaseTips') },
    },
    releaseTips: { title: tr('tutorial.releaseTips.title'), body: paras('tutorial.releaseTips.body'), cta: tr('tutorial.tips.retry'), onCta: () => (setRunKey((k) => k + 1), setStep('release')) },
    ready: { title: tr('tutorial.ready.title'), body: paras('tutorial.ready.body'), cta: replay ? tr('tutorial.close') : tr('tutorial.ready.cta'), onCta: finish },
  };
  const c = info[step];

  let body: ReactNode = null;
  let cta: { label: string; onPress: () => void; disabled?: boolean } | null = null;
  let alt: { label: string; onPress: () => void } | undefined;
  if (c) {
    body = (
      <>
        {c.art ? (
          <View style={{ alignItems: 'center', marginVertical: t.space.sm }}>{c.art}</View>
        ) : (
          <View style={{ alignItems: 'center', marginTop: t.space.xl }}>
            <IconTile icon={step === 'ready' ? 'party' : step.endsWith('ips') ? 'bulb' : 'thought'} size="lg" round />
          </View>
        )}
        <AppText variant="title1" accessibilityRole="header">
          {c.title}
        </AppText>
        {c.body.map((p) => (
          <AppText key={p} variant="body">
            {p}
          </AppText>
        ))}
        {c.warn ? (
          <View style={{ flexDirection: 'row', gap: t.space.md, padding: t.space.lg, borderRadius: t.radius.lg, backgroundColor: t.tokens.warningSoft }}>
            <Icon name="warning" size="md" color={t.tokens.warning} />
            <AppText variant="callout" style={{ flex: 1 }}>
              {c.warn}
            </AppText>
          </View>
        ) : null}
      </>
    );
    cta = { label: c.cta, onPress: c.onCta ?? next };
    alt = c.alt;
  } else if (step === 'checklist') {
    body = <Checklist checked={checked} onToggle={(id) => setChecked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))} />;
    cta = { label: tr('common.continue'), onPress: next, disabled: !checklistDone(checked) };
  } else if (step === 'vibration') {
    body = <VibrationGame onPassed={next} />;
  } else if (step === 'mistakes') {
    body = <Mistakes />;
    cta = { label: tr('tutorial.understood'), onPress: next };
  }

  return (
    <Screen
      footer={
        cta || alt || replay ? (
          <>
            {cta ? <Button label={cta.label} size="lg" disabled={cta.disabled} onPress={cta.onPress} /> : null}
            {alt ? <Button label={alt.label} variant="secondary" onPress={alt.onPress} /> : null}
            {replay && step !== 'ready' ? <Button label={tr('tutorial.close')} variant="ghost" onPress={() => safeBack()} /> : null}
          </>
        ) : undefined
      }
    >
      <View style={{ gap: t.space.sm }}>
        <Header onBack={back} title={tr('tutorial.header')} />
        <SegmentedSteps total={TUTORIAL_ORDER.length} current={idx} label={tr('onboarding.progress', { step: idx + 1, total: TUTORIAL_ORDER.length })} />
      </View>
      {body}
    </Screen>
  );
}

/** Lying start position: knees bent, feet on the floor; the sphere breathes slowly. */
function PositionArt() {
  const t = useTheme();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1);
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ width: 220, height: 150, alignItems: 'center', justifyContent: 'flex-end' }} accessible accessibilityLabel={positionCard('lying').title}>
      <IconTile icon={positionCard('lying').icon} tone="kegel" size="lg" round />
      <Animated.View style={[{ position: 'absolute', top: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: t.colors.breathe }, style]} />
      <View style={{ width: 200, height: 4, borderRadius: 2, backgroundColor: t.colors.border, marginTop: t.space.xs }} />
    </View>
  );
}

/** "Am I doing it right?" — four checks, each needs a yes (§12.3). */
function Checklist({ checked, onToggle }: { checked: string[]; onToggle: (id: string) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      <IconTile icon="success" tone="kegel" size="lg" round />
      <AppText variant="h1" accessibilityRole="header">
        {tr('tutorial.checklist.title')}
      </AppText>
      <AppText>{tr('tutorial.checklist.body')}</AppText>
      {CHECKLIST.map((id) => {
        const on = checked.includes(id);
        return (
          <Pressable
            key={id}
            onPress={() => onToggle(id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={({ pressed }) => ({
              minHeight: 64,
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.space.md,
              padding: t.space.md,
              borderRadius: t.radius.lg,
              borderWidth: on ? t.border.medium : t.border.thin,
              borderColor: on ? t.tokens.primary : t.tokens.border,
              backgroundColor: on ? t.tokens.primarySoft : t.tokens.card,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ width: 24, height: 24, borderRadius: t.radius.md, backgroundColor: on ? t.tokens.primary : 'transparent', borderWidth: on ? 0 : t.border.medium, borderColor: t.tokens.subtle, alignItems: 'center', justifyContent: 'center' }}>{on ? <Icon name="check" color={t.tokens.primaryForeground} size={16} /> : null}</View>
            <View style={{ flex: 1 }}>
              <AppText weight="700">{tr(`tutorial.checklist.items.${id}.title`)}</AppText>
              <AppText variant="small" muted>
                {tr(`tutorial.checklist.items.${id}.text`)}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "What does this vibration mean? SIK / BIRAK" — 4 questions; all correct to go on (§12.4). */
function VibrationGame({ onPassed }: { onPassed: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const [round, setRound] = useState(0);
  const quiz = useMemo(() => vibrationQuiz(`r${round}`), [round]);
  const [answers, setAnswers] = useState<(QuizAnswer | null)[]>([null, null, null, null]);
  const [i, setI] = useState(0);
  const [played, setPlayed] = useState(false);
  const finished = answers.every((a) => a !== null);
  const passed = finished && quizPassed(quiz, answers);
  const play = () => {
    playCue(quiz[i]!.cue, strength || 2);
    setPlayed(true);
  };
  const answer = (a: QuizAnswer) => {
    const nextAnswers = answers.map((x, k) => (k === i ? a : x));
    setAnswers(nextAnswers);
    setPlayed(false);
    if (i < quiz.length - 1) setI(i + 1);
  };
  const retry = () => {
    setRound((r) => r + 1);
    setAnswers([null, null, null, null]);
    setI(0);
    setPlayed(false);
  };

  return (
    <View style={{ gap: t.space.md }}>
      <View style={{ alignItems: 'center' }}>
        <VibrationArt size={140} />
      </View>
      <AppText variant="h1" accessibilityRole="header">
        {tr('tutorial.vibration.title')}
      </AppText>
      <AppText>{tr('tutorial.vibration.gameBody')}</AppText>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button style={{ flex: 1 }} label={tr('tutorial.vibration.trySqueeze')} variant="secondary" onPress={() => playCue('squeezeStart', strength || 2)} />
        <Button style={{ flex: 1 }} label={tr('tutorial.vibration.tryRelax')} variant="secondary" onPress={() => playCue('releaseStart', strength || 2)} />
      </View>

      {!finished ? (
        <Card style={{ gap: 10 }}>
          <AppText variant="small" weight="800" muted>
            {tr('tutorial.vibration.question', { n: i + 1, total: quiz.length })}
          </AppText>
          <Button label={played ? tr('tutorial.vibration.playAgain') : tr('tutorial.vibration.play')} icon="play" variant="accent" onPress={play} />
          <AppText weight="700" center>
            {tr('tutorial.vibration.ask')}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button style={{ flex: 1 }} label={tr('player.phase.contract')} variant="primary" disabled={!played} onPress={() => answer('squeeze')} />
            <Button style={{ flex: 1 }} label={tr('player.phase.release')} variant="primary" disabled={!played} onPress={() => answer('release')} />
          </View>
        </Card>
      ) : (
        <Card style={{ gap: 10, backgroundColor: passed ? t.tokens.successSoft : t.tokens.warningSoft, borderColor: passed ? t.tokens.successSoft : t.tokens.warningSoft }}>
          <AppText weight="800">{passed ? tr('tutorial.vibration.passed') : tr('tutorial.vibration.missed', { right: quiz.filter((q, k) => answers[k] === q.answer).length, total: quiz.length })}</AppText>
          {passed ? <Button label={tr('tutorial.vibration.cta')} variant="accent" onPress={onPassed} /> : <Button label={tr('tutorial.vibration.retry')} variant="accent" onPress={retry} />}
        </Card>
      )}
      <Button label={tr('tutorial.vibration.cannotFeel')} variant="ghost" onPress={onPassed} />
    </View>
  );
}

/** Common mistakes (§12.6). */
function Mistakes() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const items = tr('tutorial.mistakes.items', { returnObjects: true }) as { icon: IconName; title: string; text: string }[];
  return (
    <View style={{ gap: 10 }}>
      <IconTile icon="ban" tone="kegel" size="lg" round />
      <AppText variant="h1" accessibilityRole="header">
        {tr('tutorial.mistakes.title')}
      </AppText>
      {items.map((m) => (
        <Card key={m.title} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'flex-start' }}>
          <IconTile icon={m.icon} tone="kegel" />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="800">{m.title}</AppText>
            <AppText variant="small" muted>
              {m.text}
            </AppText>
          </View>
        </Card>
      ))}
    </View>
  );
}
