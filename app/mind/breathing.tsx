import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, ProgressBar, Screen, Segmented, useTheme } from '@/components';
import { BREATH_DURATIONS_MIN, breathingPhases, type BreathPatternId, type BreathPhase } from '@/features/mind/breathing';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { BreathCircle } from '@/features/training/player/BreathCircle';
import { currentPhase, progress, remainingInPhase, type PlayerEvent } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { toDateKey } from '@/lib/date';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function Breathing() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [pattern, setPattern] = useState<BreathPatternId>('box');
  const [minutes, setMinutes] = useState<number>(3);
  const [running, setRunning] = useState(false);

  if (running) return <BreathSession pattern={pattern} minutes={minutes} onExit={() => setRunning(false)} />;

  return (
    <Screen footer={<Button label={tr('common.start')} size="lg" variant="accent" icon="play" onPress={() => setRunning(true)} />}>
      <Header title={tr('mind.breathing.title')} close />
      <AppText muted>{tr('mind.breathing.intro')}</AppText>
      <AppText variant="h3">{tr('mind.breathing.pattern')}</AppText>
      <View style={{ gap: 10 }}>
        {(['box', '478'] as const).map((p) => (
          <Card key={p} onPress={() => setPattern(p)} accessibilityLabel={tr(`mind.breathing.${p}.name`)} style={{ borderColor: pattern === p ? t.colors.accent : t.colors.border, borderWidth: 2 }}>
            <AppText weight="700">{tr(`mind.breathing.${p}.name`)}</AppText>
            <AppText variant="small" muted>
              {tr(`mind.breathing.${p}.desc`)}
            </AppText>
          </Card>
        ))}
      </View>
      <AppText variant="h3">{tr('mind.breathing.duration')}</AppText>
      <Segmented
        accessibilityLabel={tr('mind.breathing.duration')}
        options={BREATH_DURATIONS_MIN.map((m) => ({ value: m, label: tr('common.minutes', { count: m }) }))}
        value={minutes}
        onChange={setMinutes}
      />
    </Screen>
  );
}

function BreathSession({ pattern, minutes, onExit }: { pattern: BreathPatternId; minutes: number; onExit: () => void }) {
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
      <ProgressBar value={progress(state, now)} color={t.colors.breathe} accessibilityLabel={tr('player.progress')} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BreathCircle
          size={size}
          target={done ? 0.7 : target}
          durationMs={phase?.kind === 'inhale' || phase?.kind === 'exhale' ? phase.durationMs : 300}
          color={t.colors.breathe}
          animKey={state.index}
          ringColor={t.colors.border}
        />
        <View style={{ position: 'absolute', alignItems: 'center' }} pointerEvents="none">
          <AppText variant="h1" color="#FFFFFF" accessibilityLiveRegion="polite">
            {done ? '🌿' : tr(`mind.breathing.phase.${phase?.kind ?? 'inhale'}`)}
          </AppText>
          {!done ? (
            <AppText variant="h2" color="#FFFFFF">
              {Math.ceil(remainingInPhase(state, now) / 1000)}
            </AppText>
          ) : null}
        </View>
      </View>
      {done ? (
        <View style={{ gap: 10 }}>
          <AppText variant="h2" center>
            {tr('mind.breathing.done')}
          </AppText>
          <Button label={tr('common.done')} variant="accent" size="lg" onPress={onExit} />
        </View>
      ) : (
        <Button
          label={state.status === 'paused' ? tr('player.resume') : tr('player.pause')}
          variant="secondary"
          icon={state.status === 'paused' ? 'play' : 'pause'}
          onPress={state.status === 'paused' ? player.resume : player.pause}
        />
      )}
    </Screen>
  );
}
