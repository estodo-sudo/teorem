import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, Screen, Segmented, SwitchRow, useTheme } from '@/components';
import { generateSession } from '@/features/training/generateSession';
import { playCue } from '@/features/training/haptics';
import { MAX_LEVEL, MIN_LEVEL } from '@/features/training/levels';
import { setManualLevel } from '@/features/training/plan';
import { toDateKey } from '@/lib/date';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { HapticStrength } from '@/types';

export default function TrainingSettings() {
  const { t: tr } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const training = useTrainingStore((s) => s.training);
  const [pending, setPending] = useState<number | null>(null);
  const minutes = (l: number) => Math.round(generateSession(l, 0, toDateKey()).plannedSec / 60);

  const step = (d: number) => {
    const next = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, (pending ?? training.level) + d));
    setPending(next);
  };

  return (
    <Screen>
      <Header title={tr('settings.training.title')} />
      <Card style={{ gap: 10 }}>
        <AppText variant="h3">{tr('settings.training.level')}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <Stepper label="−" a11y={tr('settings.training.levelDown')} onPress={() => step(-1)} />
          <View style={{ alignItems: 'center', minWidth: 90 }}>
            <AppText variant="display">{pending ?? training.level}</AppText>
            <AppText variant="small" muted>
              {tr('common.minutes', { count: minutes(pending ?? training.level) })}
            </AppText>
          </View>
          <Stepper label="+" a11y={tr('settings.training.levelUp')} onPress={() => step(1)} />
        </View>
        <AppText variant="small" muted>
          {tr('settings.training.levelHint')}
        </AppText>
        <LevelConfirm
          pending={pending}
          current={training.level}
          minutes={minutes}
          onCancel={() => setPending(null)}
          onConfirm={(l) => {
            useTrainingStore.getState().replace(setManualLevel(useTrainingStore.getState().training, l));
            setPending(null);
          }}
        />
      </Card>

      <Card style={{ gap: 10 }}>
        <AppText variant="h3">{tr('settings.training.haptics')}</AppText>
        <Segmented<HapticStrength>
          accessibilityLabel={tr('settings.training.haptics')}
          value={settings.hapticStrength}
          onChange={(v) => {
            update({ hapticStrength: v });
            playCue('contractStart', v);
          }}
          options={[0, 1, 2, 3].map((v) => ({ value: v as HapticStrength, label: tr(`settings.training.strength.${v}`) }))}
        />
        <AppText variant="small" muted>
          {tr('settings.training.hapticsHint')}
        </AppText>
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <SwitchRow label={tr('settings.training.sound')} description={tr('settings.training.soundHint')} value={settings.soundCues} onChange={(v) => update({ soundCues: v })} />
        <SwitchRow label={tr('settings.training.discreet')} description={tr('settings.training.discreetHint')} value={settings.discreetPlayer} onChange={(v) => update({ discreetPlayer: v })} />
      </Card>

      <Card style={{ gap: 10 }}>
        <AppText variant="h3">{tr('settings.training.perDay')}</AppText>
        <Segmented<1 | 2 | 3>
          accessibilityLabel={tr('settings.training.perDay')}
          value={settings.sessionsPerDay}
          onChange={(v) => update({ sessionsPerDay: v })}
          options={([1, 2, 3] as const).map((v) => ({ value: v, label: String(v) }))}
        />
        <AppText variant="small" muted>
          {tr('settings.training.perDayHint')}
        </AppText>
      </Card>

    </Screen>
  );
}

/** Confirmation before changing level manually (longer sessions when increasing). */
function LevelConfirm({ pending, current, minutes, onCancel, onConfirm }: { pending: number | null; current: number; minutes: (l: number) => number; onCancel: () => void; onConfirm: (l: number) => void }) {
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  if (pending === null || pending === current) return null;
  return (
    <>
      <Button label={tr('settings.training.applyLevel', { level: pending })} variant="accent" onPress={() => setOpen(true)} />
      <Dialog
        visible={open}
        title={tr('settings.training.confirmTitle', { level: pending })}
        message={
          pending > current
            ? tr('settings.training.confirmUp', { from: minutes(current), to: minutes(pending) })
            : tr('settings.training.confirmDown', { from: minutes(current), to: minutes(pending) })
        }
        onDismiss={() => setOpen(false)}
        actions={[
          { label: tr('common.save'), variant: 'accent', onPress: () => (setOpen(false), onConfirm(pending)) },
          { label: tr('common.cancel'), onPress: () => (setOpen(false), onCancel()) },
        ]}
      />
    </>
  );
}

function Stepper({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
      {label === '+' ? <Icon name="plus" color={t.colors.text} size={26} /> : <View style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: t.colors.text }} />}
    </Pressable>
  );
}
