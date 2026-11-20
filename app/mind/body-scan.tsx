import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, ProgressBar, ProgressRing, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import bodyscan from '@/content/bodyscan.tr.json';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { currentPhase, progress, remainingInPhase, type PlayerEvent, type TimedPhase } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { toDateKey } from '@/lib/date';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface ScanPhase extends TimedPhase {
  text: string;
}

export default function BodyScan() {
  const { t: tr } = useTranslation();
  const [running, setRunning] = useState(false);
  const total = bodyscan.steps.reduce((a, s) => a + s.sec, 0);
  if (running) return <ScanSession onExit={() => setRunning(false)} />;
  return (
    <Screen footer={<Button label={tr('common.start')} size="lg" variant="accent" icon="play" onPress={() => setRunning(true)} />}>
      <Header title={tr('mind.bodyScan.title')} close />
      <IconTile icon="flower" tone="mind" size="lg" round />
      <AppText>{tr('mind.bodyScan.intro', { min: Math.round(total / 60) })}</AppText>
      <Card>
        <AppText variant="small" muted>
          {tr('mind.bodyScan.tip')}
        </AppText>
      </Card>
    </Screen>
  );
}

function ScanSession({ onExit }: { onExit: () => void }) {
  useSafeKeepAwake();
  const t = useTheme();
  const { t: tr } = useTranslation();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const phases = useMemo<ScanPhase[]>(() => bodyscan.steps.map((s, i) => ({ durationMs: s.sec * 1000, exerciseIndex: i, text: s.text })), []);
  const onEvents = useCallback(
    (events: PlayerEvent<ScanPhase>[]) => {
      for (const e of events) {
        if (e.type === 'phaseStart') playCue('breatheIn', strength);
        else if (e.type === 'completed' && !e.endedEarly) {
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
  const done = state.status === 'completed';
  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <Header title={tr('mind.bodyScan.title')} close onBack={onExit} />
      <ProgressBar value={progress(state, now)} color={t.colors.breathe} accessibilityLabel={tr('player.progress')} />
      <View style={{ flex: 1, justifyContent: 'center', gap: t.space.xl }}>
        {done ? (
          <AppText variant="h1" center>
            {tr('mind.bodyScan.done')}
          </AppText>
        ) : (
          <>
            <AppText variant="tiny" muted center>
              {tr('mind.bodyScan.step', { n: state.index + 1, total: phases.length })}
            </AppText>
            <AppText variant="h2" weight="500" center accessibilityLiveRegion="polite">
              {phase?.text}
            </AppText>
            <View style={{ alignItems: 'center' }}>
              <ProgressRing size={72} stroke={6} value={phase ? remainingInPhase(state, now) / phase.durationMs : 0} color={t.colors.breathe} />
            </View>
          </>
        )}
      </View>
      {done ? (
        <Button label={tr('common.done')} variant="accent" size="lg" onPress={onExit} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button style={{ flex: 1 }} label={state.status === 'paused' ? tr('player.resume') : tr('player.pause')} variant="secondary" onPress={state.status === 'paused' ? player.resume : player.pause} />
          <Button style={{ flex: 1 }} label={tr('mind.bodyScan.next')} variant="ghost" onPress={player.skip} />
        </View>
      )}
    </Screen>
  );
}
