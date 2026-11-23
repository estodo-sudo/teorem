import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, RowGroup, Screen, Segmented, SwitchRow, useTheme } from '@/components';
import { cancelHaptics, hapticSupport, playCue } from '@/features/training/haptics';
import { cueLengthMs, PREVIEW_CUES, type Cue } from '@/features/training/hapticPatterns';
import { findTurkishVoice, speak } from '@/features/training/voice';
import { getLevel, MAX_LEVEL, MIN_LEVEL } from '@/features/training/levels';
import { setManualLevel } from '@/features/training/plan';
import { VacationCard } from '@/features/training/VacationCard';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { DailyTarget, HapticStrength } from '@/types';

/** "Standart" vibration when switched on: Normal (same as a fresh install). */
const DEFAULT_STRENGTH: HapticStrength = 2;

export default function TrainingSettings() {
  const { t: tr } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const training = useTrainingStore((s) => s.training);
  const [pending, setPending] = useState<number | null>(null);

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
              {tr('settings.training.holdAt', { sec: getLevel(pending ?? training.level).holdSec })}
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
          holdSec={(l) => getLevel(l).holdSec}
          onCancel={() => setPending(null)}
          onConfirm={(l) => {
            useTrainingStore.getState().replace(setManualLevel(useTrainingStore.getState().training, l));
            setPending(null);
          }}
        />
      </Card>

      {/* Vibration on/off (user request 2026-11-22; on at Normal by default). Off = strength 0 everywhere. */}
      <RowGroup>
        <SwitchRow
          label={tr('settings.training.vibration')}
          description={tr('settings.training.vibrationHint')}
          value={settings.hapticStrength > 0}
          onChange={(on) => {
            const v: HapticStrength = on ? DEFAULT_STRENGTH : 0;
            update({ hapticStrength: v });
            if (on) playCue('contractStart', v);
            else cancelHaptics();
          }}
        />
      </RowGroup>
      {settings.hapticStrength > 0 ? (
        <Card style={{ gap: 10 }}>
          <AppText variant="h3">{tr('settings.training.haptics')}</AppText>
          <Segmented<HapticStrength>
            accessibilityLabel={tr('settings.training.haptics')}
            value={settings.hapticStrength}
            onChange={(v) => {
              update({ hapticStrength: v });
              playCue('contractStart', v);
            }}
            options={[1, 2, 3].map((v) => ({ value: v as HapticStrength, label: tr(`settings.training.strength.${v}`) }))}
          />
          <AppText variant="small" muted>
            {tr('settings.training.hapticsHint')}
          </AppText>
        </Card>
      ) : null}

      <RowGroup>
        <SwitchRow label={tr('settings.training.sound')} description={tr('settings.training.soundHint')} value={settings.soundCues} onChange={(v) => update({ soundCues: v })} />
        <VoiceCoachRow />
        <SwitchRow label={tr('settings.training.discreet')} description={tr('settings.training.discreetHint')} value={settings.discreetPlayer} onChange={(v) => update({ discreetPlayer: v })} />
      </RowGroup>

      <HapticLanguageCard />

      <VacationCard />

      <Card style={{ gap: 10 }}>
        <AppText variant="h3">{tr('settings.training.perDay')}</AppText>
        <Segmented<DailyTarget>
          accessibilityLabel={tr('settings.training.perDay')}
          value={training.dailyTarget}
          onChange={(v) => useTrainingStore.getState().update({ dailyTarget: v })}
          options={([1, 2, 3, 4] as const).map((v) => ({ value: v, label: String(v) }))}
        />
        <AppText variant="small" muted>
          {tr('settings.training.perDayHint')}
        </AppText>
      </Card>
    </Screen>
  );
}

/** Confirmation before changing level manually (longer sessions when increasing). */
function LevelConfirm({ pending, current, holdSec, onCancel, onConfirm }: { pending: number | null; current: number; holdSec: (l: number) => number; onCancel: () => void; onConfirm: (l: number) => void }) {
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  if (pending === null || pending === current) return null;
  return (
    <>
      <Button label={tr('settings.training.applyLevel', { level: pending })} variant="accent" onPress={() => setOpen(true)} />
      <Dialog
        visible={open}
        title={tr('settings.training.confirmTitle', { level: pending })}
        message={pending > current ? tr('settings.training.confirmUp', { from: holdSec(current), to: holdSec(pending) }) : tr('settings.training.confirmDown', { from: holdSec(current), to: holdSec(pending) })}
        onDismiss={() => setOpen(false)}
        actions={[
          { label: tr('common.save'), variant: 'accent', onPress: () => (setOpen(false), onConfirm(pending)) },
          { label: tr('common.cancel'), onPress: () => (setOpen(false), onCancel()) },
        ]}
      />
    </>
  );
}

/** Voice coach switch, shown only when the device has a Turkish voice. */
function VoiceCoachRow() {
  const { t: tr } = useTranslation();
  const on = useSettingsStore((s) => s.settings.voiceCoach ?? false);
  const update = useSettingsStore((s) => s.update);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let alive = true;
    void findTurkishVoice().then((v) => alive && setAvailable(Boolean(v)));
    return () => {
      alive = false;
    };
  }, []);
  if (!available) return null;
  return (
    <View>
      <SwitchRow label={tr('settings.training.voice')} description={tr('settings.training.voiceHint')} value={on} onChange={(v) => (update({ voiceCoach: v }), v && speak(tr('player.voice.squeeze')))} />
      {on ? <Button label={tr('settings.training.voiceTry')} icon="play" variant="ghost" onPress={() => speak(`${tr('player.voice.squeeze')}. ${tr('player.voice.release')}.`)} /> : null}
    </View>
  );
}

/** Titreşim Dili v2 try screen (SPEC_KEGEL_V2 §7.4): feel each pattern. */
function HapticLanguageCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [playing, setPlaying] = useState<Cue | null>(null);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => (clear(), cancelHaptics()), []);
  const play = (cue: Cue) => {
    clear();
    setPlaying(cue);
    playCue(cue, strength);
    timers.current.push(setTimeout(() => setPlaying(null), Math.max(400, cueLengthMs(cue))));
  };
  const playAll = () => {
    clear();
    let at = 0;
    for (const cue of PREVIEW_CUES) {
      timers.current.push(setTimeout(() => (setPlaying(cue), playCue(cue, strength)), at));
      at += cueLengthMs(cue) + 900;
    }
    timers.current.push(setTimeout(() => setPlaying(null), at));
  };
  const support = hapticSupport();
  return (
    <Card style={{ gap: 10 }}>
      <AppText variant="h3">{tr('settings.training.langTitle')}</AppText>
      <AppText variant="small" muted>
        {tr('settings.training.langHint')}
      </AppText>
      <AppText variant="small" muted>
        {strength === 0 ? tr('settings.training.langOff') : support.native ? tr('settings.training.langNative') : tr('settings.training.langBasic')}
      </AppText>
      {PREVIEW_CUES.map((cue) => (
        <Pressable
          key={cue}
          onPress={() => play(cue)}
          disabled={strength === 0}
          accessibilityRole="button"
          accessibilityLabel={`${tr(`settings.training.cue.${cue}.title`)}. ${tr(`settings.training.cue.${cue}.text`)}`}
          style={({ pressed }) => ({
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: t.radius.md,
            backgroundColor: playing === cue ? t.colors.surfaceAlt : 'transparent',
            opacity: strength === 0 ? 0.5 : pressed ? 0.8 : 1,
          })}
        >
          <Icon name="play" color={playing === cue ? t.colors.contract : t.colors.textMuted} size={18} />
          <View style={{ flex: 1 }}>
            <AppText weight="700">{tr(`settings.training.cue.${cue}.title`)}</AppText>
            <AppText variant="small" muted>
              {tr(`settings.training.cue.${cue}.text`)}
            </AppText>
          </View>
        </Pressable>
      ))}
      <Button label={tr('settings.training.langAll')} icon="play" variant="secondary" disabled={strength === 0} onPress={playAll} />
    </Card>
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
