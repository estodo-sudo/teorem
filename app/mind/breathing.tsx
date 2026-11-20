import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen, useTheme } from '@/components';
import { Button, Illustration, OptionCard, Tabs } from '@/components/ui';
import { ThemeOverride } from '@/components/useTheme';
import { BREATH_DURATIONS_MIN, breathingPhases, type BreathPatternId, type BreathPhase } from '@/features/mind/breathing';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { BreathCircle } from '@/features/training/player/BreathCircle';
import { currentPhase, progress, remainingInPhase, type PlayerEvent } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { toDateKey } from '@/lib/date';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Nefes — ui-v3 (SPEC_UI_V3 §7.12): calm mind-tone setup (pattern cards + duration), then the same dark
 * focus surface as the Kegel player with a softly growing / shrinking ring. Timing and haptics unchanged.
 */
export default function Breathing() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [pattern, setPattern] = useState<BreathPatternId>('box');
  const [minutes, setMinutes] = useState<number>(3);
  const [running, setRunning] = useState(false);

  if (running) return <BreathSession pattern={pattern} minutes={minutes} onExit={() => setRunning(false)} />;

  return (
    <Screen contentStyle={{ gap: t.space.xl }} footer={<Button label={tr('common.start')} size="lg" icon="play" onPress={() => setRunning(true)} fullWidth />}>
      <Header title={tr('mind.breathing.title')} close />
      <View style={{ alignItems: 'center' }}>
        <Illustration name="mind-breathing" size={128} />
      </View>
      <AppText variant="body" muted>
        {tr('mind.breathing.intro')}
      </AppText>
      <View style={{ gap: t.space.md }}>
        <AppText variant="title3">{tr('mind.breathing.pattern')}</AppText>
        <View style={{ gap: t.space.sm }} accessibilityRole="radiogroup">
          {(['box', '478'] as const).map((p) => (
            <OptionCard key={p} icon={p === 'box' ? 'stop' : 'wind'} label={tr(`mind.breathing.${p}.name`)} description={tr(`mind.breathing.${p}.desc`)} selected={pattern === p} onPress={() => setPattern(p)} />
          ))}
        </View>
      </View>
      <View style={{ gap: t.space.md }}>
        <AppText variant="title3">{tr('mind.breathing.duration')}</AppText>
        <Tabs<string> label={tr('mind.breathing.duration')} items={BREATH_DURATIONS_MIN.map((m) => ({ value: String(m), label: tr('common.minutes', { count: m }) }))} value={String(minutes)} onChange={(v) => setMinutes(Number(v))} />
      </View>
    </Screen>
  );
}

function BreathSession(props: { pattern: BreathPatternId; minutes: number; onExit: () => void }) {
  return (
    <ThemeOverride dark>
      <StatusBar style="light" />
      <BreathSessionBody {...props} />
    </ThemeOverride>
  );
}

function BreathSessionBody({ pattern, minutes, onExit }: { pattern: BreathPatternId; minutes: number; onExit: () => void }) {
  useSafeKeepAwake();
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width } = useWindowDimensions();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const phases = useMemo(() => breathingPhases(pattern, minutes), [pattern, minutes]);
  const onEvents = useCallback(
    (events: PlayerEvent<BreathPhase>[]) => {
      for (const e of events) {
        if (e.type === 'phaseStart') {
          if (e.phase.kind === 'inhale') playCue('breatheIn', strength);
          else if (e.phase.kind === 'exhale') playCue('breatheOut', strength);
          else playCue('tap', strength);
        } else if (e.type === 'completed' && !e.endedEarly) {
          playCue('exerciseEnd', strength);
          useProgressStore.getState().setLastMindSession(toDateKey());
        }
      }
    },
    [strength],
  );
  const player = usePlayer(phases, onEvents);
  const { state, now } = player;
  useEffect(() => {
    player.start();
    return () => cancelHaptics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phase = currentPhase(state);
  const size = Math.min(width * 0.7, 300);
  const target = phase?.kind === 'inhale' || phase?.kind === 'holdIn' ? 1 : 0.5;
  const done = state.status === 'completed';

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <Header title={tr(`mind.breathing.${pattern}.name`)} close onBack={onExit} />
      <View accessible accessibilityRole="progressbar" accessibilityLabel={tr('player.progress')} accessibilityValue={{ min: 0, max: 100, now: Math.round(progress(state, now) * 100) }} style={{ height: 3, borderRadius: 2, backgroundColor: t.focus.track, overflow: 'hidden' }}>
        <View style={{ width: `${progress(state, now) * 100}%`, height: '100%', backgroundColor: t.focus.dim }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BreathCircle
          size={size}
          target={done ? 0.7 : target}
          durationMs={phase?.kind === 'inhale' || phase?.kind === 'exhale' ? phase.durationMs : 300}
          color={t.tone.mind.fg}
          animKey={state.index}
          ringColor={t.focus.track}
        />
        <View style={{ position: 'absolute', alignItems: 'center' }} pointerEvents="none">
          <AppText variant="title1" weight="600" color={t.focus.text} accessibilityLiveRegion="polite">
            {done ? tr('common.done') : tr(`mind.breathing.phase.${phase?.kind ?? 'inhale'}`)}
          </AppText>
          {!done ? (
            <AppText variant="title2" tabular color={t.focus.dim}>
              {Math.ceil(remainingInPhase(state, now) / 1000)}
            </AppText>
          ) : null}
        </View>
      </View>
      {done ? (
        <View style={{ gap: 10 }}>
          <AppText variant="title2" center>
            {tr('mind.breathing.done')}
          </AppText>
          <Button label={tr('common.done')} size="lg" onPress={onExit} fullWidth />
        </View>
      ) : (
        <Button
          label={state.status === 'paused' ? tr('player.resume') : tr('player.pause')}
          variant="secondary"
          size="lg"
          icon={state.status === 'paused' ? 'play' : 'pause'}
          onPress={state.status === 'paused' ? player.resume : player.pause}
          fullWidth
        />
      )}
    </Screen>
  );
}
