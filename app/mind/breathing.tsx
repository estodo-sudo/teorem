import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen, useTheme } from '@/components';
import { Button, Illustration } from '@/components/ui';
import { BreathPlayer } from '@/features/breath/BreathPlayer';
import { BreathSetup } from '@/features/breath/BreathSetup';
import { type BreathMode } from '@/features/breath/patterns';
import { minutesFor, useBreathStore } from '@/features/breath/store';
import { toDateKey } from '@/lib/date';
import { goBack } from '@/lib/nav';
import { useProgressStore } from '@/stores/progressStore';

/**
 * Nefes (SPEC_V4 §C.4): the shared breath module — "Hızlı sakinleş", "Yavaş nefes" and "Kutu nefesi" —
 * replacing the old box / 4-7-8 screen. The last mode and duration are remembered.
 */
export default function Breathing() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [mode, setMode] = useState<BreathMode>(() => useBreathStore.getState().lastMode);
  const [minutes, setMinutes] = useState(() => minutesFor(useBreathStore.getState().lastMode, useBreathStore.getState().minutes));
  const [running, setRunning] = useState(false);

  if (running) {
    return (
      <BreathPlayer
        mode={mode}
        minutes={minutes}
        onClose={() => setRunning(false)}
        onDone={() => {
          useProgressStore.getState().setLastMindSession(toDateKey());
          goBack();
        }}
      />
    );
  }

  return (
    <Screen
      contentStyle={{ gap: t.space.xl }}
      footer={
        <Button
          label={tr('common.start')}
          size="lg"
          icon="play"
          fullWidth
          onPress={() => {
            useBreathStore.getState().remember(mode, minutes);
            setRunning(true);
          }}
        />
      }
    >
      <Header title={tr('mind.breathing.title')} close />
      <View style={{ alignItems: 'center' }}>
        <Illustration name="mind-breathing" size={112} />
      </View>
      <AppText variant="body" muted>
        {tr('breath.intro')}
      </AppText>
      <BreathSetup
        mode={mode}
        minutes={minutes}
        onChange={(m, n) => {
          setMode(m);
          setMinutes(n);
        }}
      />
    </Screen>
  );
}
