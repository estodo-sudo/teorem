import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, ProgressRing, Screen, useTheme } from '@/components';
import { SMOKING } from '@/features/campus/smoking/content';
import { CRAVING_SESSION_SEC, smokingPhase } from '@/features/campus/smoking/logic';
import { Chip, SlipDialog } from '@/features/campus/smoking/ui';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { BreathCircle } from '@/features/training/player/BreathCircle';
import { useNow } from '@/lib/useNow';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useCampusStore } from '@/stores/campusStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { goBack } from '@/lib/nav';

/** Calming breath: 4 s in, 4 s hold, 6 s out (a longer out-breath slows the heart rate). */
const IN_MS = 4000;
const HOLD_MS = 4000;
const OUT_MS = 6000;
const CYCLE_MS = IN_MS + HOLD_MS + OUT_MS;
type BreathPhase = 'in' | 'hold' | 'out';

export default function CravingScreen() {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [result, setResult] = useState<null | 'early' | 'full'>(null);

  if (result) {
    return (
      <CravingResult
        early={result === 'early'}
        onAgain={() => {
          setStartedAt(Date.now());
          setResult(null);
        }}
      />
    );
  }
  return <CravingSession key={startedAt} startedAt={startedAt} onFinish={setResult} />;
}

function CravingSession({ startedAt, onFinish }: { startedAt: number; onFinish: (r: 'early' | 'full') => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width } = useWindowDimensions();
  useSafeKeepAwake();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const reasons = useCampusStore((s) => s.smoking.reasonIds);
  const now = useNow(250).getTime();
  const elapsed = Math.max(0, now - startedAt);
  const totalMs = CRAVING_SESSION_SEC * 1000;
  const remaining = Math.max(0, totalMs - elapsed);
  const steps = SMOKING.craving.steps;
  const stepMs = totalMs / steps.length;
  const autoStep = Math.min(steps.length - 1, Math.floor(elapsed / stepMs));
  // A tapped step stays visible until the timer moves on to its next step.
  const [manual, setManual] = useState<{ idx: number; atAuto: number } | null>(null);
  const stepIdx = manual && manual.atAuto === autoStep ? manual.idx : autoStep;
  const cycle = Math.floor(elapsed / CYCLE_MS);
  const inCycle = elapsed % CYCLE_MS;
  const phase: BreathPhase = inCycle < IN_MS ? 'in' : inCycle < IN_MS + HOLD_MS ? 'hold' : 'out';
  const phaseLeftSec = Math.ceil(((phase === 'in' ? IN_MS : phase === 'hold' ? IN_MS + HOLD_MS : CYCLE_MS) - inCycle) / 1000);
  const breathKey = cycle * 3 + (phase === 'in' ? 0 : phase === 'hold' ? 1 : 2);
  const reason = SMOKING.reasons.filter((r) => reasons.includes(r.id))[cycle % Math.max(1, reasons.length)];

  const lastKey = useRef(-1);
  useEffect(() => {
    if (breathKey === lastKey.current) return;
    lastKey.current = breathKey;
    if (phase === 'in') playCue('breatheIn', strength);
    else if (phase === 'out') playCue('breatheOut', strength);
    else playCue('contractTick', strength);
  }, [breathKey, phase, strength]);

  const finished = useRef(false);
  useEffect(() => {
    if (remaining > 0 || finished.current) return;
    finished.current = true;
    playCue('exerciseEnd', strength);
    onFinish('full');
  }, [remaining, strength, onFinish]);
  useEffect(() => () => cancelHaptics(), []);

  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  const ringSize = Math.min(280, width - 80);
  const step = steps[stepIdx]!;

  return (
    <Screen footer={<Button label={tr('smoking.craving.passedEarly')} size="lg" variant="accent" icon="check" onPress={() => onFinish('early')} />}>
      <Header title={tr('smoking.craving.title')} close />
      <AppText muted center>
        {tr('smoking.craving.intro')}
      </AppText>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <ProgressRing size={ringSize} stroke={8} value={elapsed / totalMs} color={t.colors.breathe}>
          <BreathCircle
            size={ringSize - 48}
            target={phase === 'out' ? 0.55 : 1}
            durationMs={phase === 'in' ? IN_MS : phase === 'hold' ? HOLD_MS : OUT_MS}
            color={t.colors.breathe}
            ringColor={t.colors.border}
            animKey={breathKey}
          />
          <View style={{ position: 'absolute', alignItems: 'center' }} accessibilityLiveRegion="polite">
            <AppText variant="h2" weight="800" color="#FFFFFF">
              {phase === 'in' ? tr('smoking.craving.breatheIn') : phase === 'hold' ? tr('smoking.craving.hold') : tr('smoking.craving.breatheOut')}
            </AppText>
            <AppText variant="h3" weight="700" color="#FFFFFF" style={{ opacity: 0.85 }}>
              {phaseLeftSec}
            </AppText>
          </View>
        </ProgressRing>
        <AppText variant="h3" accessibilityLabel={tr('smoking.craving.remaining', { time: `${mm}:${String(ss).padStart(2, '0')}` })}>
          {tr('smoking.craving.remaining', { time: `${mm}:${String(ss).padStart(2, '0')}` })}
        </AppText>
      </View>

      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppText variant="h2">{step.emoji}</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="tiny" muted>
              {tr('smoking.craving.tipOf', { n: stepIdx + 1, total: steps.length })}
            </AppText>
            <AppText weight="800">{step.title}</AppText>
          </View>
        </View>
        <AppText>{step.text}</AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
          {steps.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => setManual({ idx: i, atAuto: autoStep })}
              accessibilityRole="button"
              accessibilityLabel={s.title}
              accessibilityState={{ selected: i === stepIdx }}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: i === stepIdx ? 22 : 10, height: 10, borderRadius: 5, backgroundColor: i === stepIdx ? t.colors.primary : t.colors.border }} />
            </Pressable>
          ))}
        </View>
      </Card>

      {reason ? (
        <AppText center weight="700">
          {tr('smoking.craving.reasonReminder', { reason: `${reason.emoji} ${reason.label}` })}
        </AppText>
      ) : null}
    </Screen>
  );
}

function CravingResult({ early, onAgain }: { early: boolean; onAgain: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const userTriggers = useCampusStore((s) => s.smoking.triggerIds);
  // The user's own triggers first, then the rest.
  const triggers = [...SMOKING.triggers].sort((a, b) => Number(userTriggers.includes(b.id)) - Number(userTriggers.includes(a.id)));
  const [triggerId, setTriggerId] = useState<string | null>(null);
  const [slipOpen, setSlipOpen] = useState(false);
  const alo = SMOKING.help.find((h) => h.phone);

  return (
    <Screen
      footer={
        <Button
          label={tr('smoking.craving.savePassed')}
          size="lg"
          variant="accent"
          icon="check"
          onPress={() => {
            useCampusStore.getState().logCraving(triggerId, true);
            goBack('/campus/smoking');
          }}
        />
      }
    >
      <Header title={tr('smoking.craving.title')} close />
      <AppText variant="display" center>
        🎉
      </AppText>
      <AppText variant="h1" center accessibilityRole="header">
        {early ? tr('smoking.craving.doneTitleEarly') : tr('smoking.craving.doneTitle')}
      </AppText>
      <AppText muted center>
        {tr('smoking.craving.doneBody')}
      </AppText>

      <AppText variant="h3">{tr('smoking.craving.triggerQuestion')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {triggers.map((x) => (
          <Chip key={x.id} emoji={x.emoji} label={x.label} selected={triggerId === x.id} onPress={() => setTriggerId((cur) => (cur === x.id ? null : x.id))} />
        ))}
      </View>

      <Button label={tr('smoking.craving.again')} variant="secondary" icon="wind" onPress={onAgain} />
      <Button
        label={tr('smoking.craving.smoked')}
        variant="ghost"
        onPress={() => {
          const st = useCampusStore.getState();
          st.logCraving(triggerId, false);
          // Before the quit day a cigarette is not a slip; only the craving is logged.
          if (smokingPhase(st.smoking, new Date()) === 'smokeFree') setSlipOpen(true);
          else goBack('/campus/smoking');
        }}
      />
      <SlipDialog
        visible={slipOpen}
        onClose={() => {
          setSlipOpen(false);
          goBack('/campus/smoking');
        }}
      />

      {alo ? (
        <Card style={{ gap: 6, borderColor: t.colors.border }}>
          <AppText variant="small" muted>
            {tr('smoking.craving.stillHard')}
          </AppText>
          <Button label={tr('smoking.home.call', { phone: alo.phone })} icon="bell" variant="secondary" onPress={() => void Linking.openURL(`tel:${alo.phone}`)} />
        </Card>
      ) : null}
    </Screen>
  );
}
