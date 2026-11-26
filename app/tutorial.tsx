import type { IconName } from '@/components/Icon';
import type { ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { sexCtx, useSex } from '@/i18n/sex';

import { AppText, Button, Card, Header, Icon, Screen, useTheme } from '@/components';
import { IconTile, SegmentedSteps } from '@/components/ui';
import { AnimatedArt } from '@/components/AnimatedArt';
import { PelvicFloor3D } from '@/components/Illustrations';
import { IntroAnatomyScreen } from '@/features/intro-anatomy/IntroAnatomyScreen';
import { generateTrialSession } from '@/features/training/generateSession';
import { WorkoutPlayer } from '@/features/training/player/WorkoutPlayer';
import { TUTORIAL_ORDER, type TutorialStep } from '@/features/training/tutorial';
import { goBack as safeBack } from '@/lib/nav';
import { useProfileStore } from '@/stores/profileStore';

/**
 * Eğitim v2 (SPEC_KEGEL_V2 §12; slimmed down 2026-11-26): what / find the muscle (never while urinating) /
 * where it is (animation) / the right technique (starting position and self-check folded in) / one
 * practice set and "Nasıl geçti?" / common mistakes, whose "Hazırım" finishes. The muscle profile screening
 * comes right before (onboarding → /kegel/screening → here).
 */
export default function Tutorial() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  // "What is it for": the penis-control line is for men only (2026-11-25)
  const ctx = sexCtx(useSex());
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const [step, setStep] = useState<TutorialStep>('what');
  const [runKey, setRunKey] = useState(0);
  const trial = useMemo(() => generateTrialSession(), []);
  const mainStep: TutorialStep = step === 'tips' ? 'check' : step;
  const idx = TUTORIAL_ORDER.indexOf(mainStep);
  const next = () => setStep(TUTORIAL_ORDER[idx + 1]!);

  const finish = () => {
    if (replay) return safeBack();
    useProfileStore.getState().update({ tutorialDone: true });
    router.replace('/paywall');
  };

  const back = () => {
    if (step === 'tips') return setStep('check');
    if (idx === 0) return replay ? safeBack() : undefined;
    setStep(TUTORIAL_ORDER[idx - 1]!);
  };

  // "Pelvik taban kasın nerede?": full screen, cannot be skipped (also when watched again).
  if (step === 'anatomy') return <IntroAnatomyScreen onFinish={next} />;

  // The practice set runs in the real player.
  if (step === 'trial') {
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        <AppText variant="h2">{tr('tutorial.trial.title')}</AppText>
        <AppText muted>{tr('tutorial.trial.body')}</AppText>
        {/* The player follows the app theme: the dark focus surface in dark mode, a light card in light mode. */}
        <View
          style={{
            flex: 1,
            backgroundColor: t.dark ? t.player.bg : t.tokens.card,
            borderRadius: t.radius.lg,
            borderWidth: t.dark ? 0 : t.border.thin,
            borderColor: t.tokens.border,
            padding: t.space.lg,
          }}
        >
          <WorkoutPlayer key={runKey} session={trial} minimal forceLabels onDone={() => setStep('check')} />
        </View>
      </Screen>
    );
  }

  const paras = (key: string) => tr(key, { returnObjects: true, ...ctx }) as string[];
  const info: Partial<Record<TutorialStep, { art?: ReactNode; title: string; body: string[]; warn?: string; cta: string; onCta?: () => void; alt?: { label: string; onPress: () => void } }>> = {
    what: { art: <PelvicFloor3D />, title: tr('tutorial.what.title'), body: paras('tutorial.what.body'), cta: tr('tutorial.understood') },
    find: { art: <AnimatedArt name="find" size={190} />, title: tr('tutorial.find.title'), body: paras('tutorial.find.body'), warn: tr('tutorial.find.warn'), cta: tr('tutorial.understood') },
    technique: { art: <AnimatedArt name="technique" size={190} />, title: tr('tutorial.technique.title'), body: paras('tutorial.technique.body'), warn: tr('tutorial.technique.warn'), cta: tr('tutorial.understood') },
    check: {
      title: tr('tutorial.check.title'),
      body: [tr('tutorial.check.body')],
      cta: tr('tutorial.check.yes'),
      alt: { label: tr('tutorial.check.unsure'), onPress: () => setStep('tips') },
    },
    tips: { title: tr('tutorial.tips.title'), body: paras('tutorial.tips.body'), cta: tr('tutorial.tips.retry'), onCta: () => (setRunKey((k) => k + 1), setStep('trial')) },
  };
  const c = info[step];

  let body: ReactNode = null;
  let cta: { label: string; onPress: () => void; disabled?: boolean } | null = null;
  let alt: { label: string; onPress: () => void } | undefined;
  if (c) {
    body = (
      // each page slides in (motion polish 2026-11-25)
      <Animated.View key={step} entering={FadeInRight.duration(320)} style={{ gap: t.space.xl }}>
        {c.art ? (
          <View style={{ alignItems: 'center', marginVertical: t.space.sm }}>{c.art}</View>
        ) : (
          <View style={{ alignItems: 'center', marginTop: t.space.xl }}>
            <IconTile icon={step === 'tips' ? 'bulb' : 'thought'} size="lg" round />
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
      </Animated.View>
    );
    cta = { label: c.cta, onPress: c.onCta ?? next };
    alt = c.alt;
  } else if (step === 'mistakes') {
    // the last step: its button finishes the tutorial (the "Hazırsın" page was removed 2026-11-26)
    body = <Mistakes />;
    cta = { label: replay ? tr('tutorial.close') : tr('tutorial.mistakes.cta'), onPress: finish };
  }

  return (
    <Screen
      footer={
        cta || alt || replay ? (
          <>
            {cta ? <Button label={cta.label} size="lg" disabled={cta.disabled} onPress={cta.onPress} /> : null}
            {alt ? <Button label={alt.label} variant="secondary" onPress={alt.onPress} /> : null}
            {replay && step !== 'mistakes' ? <Button label={tr('tutorial.close')} variant="ghost" onPress={() => safeBack()} /> : null}
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

/**
 * Common mistakes (§12.6; 2026-11-26: titles only, as a calm 2 × 2 grid): each a soft tile with its icon and
 * a short "don't" in bold.
 */
function Mistakes() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const items = tr('tutorial.mistakes.items', { returnObjects: true }) as { icon: IconName; title: string }[];
  return (
    <Animated.View entering={FadeInRight.duration(320)} style={{ gap: t.space.xl }}>
      <View style={{ alignItems: 'center', marginTop: t.space.xl }}>
        <IconTile icon="ban" tone="kegel" size="lg" round />
      </View>
      <AppText variant="title1" accessibilityRole="header">
        {tr('tutorial.mistakes.title')}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md }}>
        {items.map((m) => (
          <Card key={m.title} style={{ flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: t.space.md, paddingVertical: t.space.xl, paddingHorizontal: t.space.md }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.warningSoft }}>
              <Icon name={m.icon} size="lg" color={t.tokens.warning} />
            </View>
            <AppText variant="bodyStrong" center>
              {m.title}
            </AppText>
          </Card>
        ))}
      </View>
    </Animated.View>
  );
}
