import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, SwitchRow, useTheme } from '@/components';
import type { IconName } from '@/components/Icon';
import { Chip, OptionCard, Sheet } from '@/components/ui';

import { BREATH_MODE_IDS, BREATH_MODES, type BreathMode } from './patterns';
import { minutesFor, useBreathStore } from './store';

const MODE_ICON: Record<BreathMode, IconName> = { quick: 'zap', slow: 'waves', box: 'box' };

/** Research behind the modes (SPEC_V4 §C.4). Told as "olumlu sonuç verdi", never as a proven treatment. */
export const BREATH_SOURCES = [
  { title: 'Balban MY ve ark. (2023) – Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Reports Medicine 4', url: 'https://doi.org/10.1016/j.xcrm.2022.100895' },
  { title: 'Zaccaro A ve ark. (2018) – How breath-control can change your life: a systematic review on psycho-physiological correlates of slow breathing. Front Hum Neurosci 12', url: 'https://doi.org/10.3389/fnhum.2018.00353' },
];

/**
 * Start screen of the breath module: three mode cards (name, rhythm, when to use), duration chips,
 * the haptic guide switch and an info button with the safety note and the sources. The last mode and
 * duration are remembered. `mode` / `minutes` are controlled by the parent so it can start the session.
 */
export function BreathSetup({ mode, minutes, onChange, compact }: { mode: BreathMode; minutes: number; onChange: (mode: BreathMode, minutes: number) => void; compact?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const remembered = useBreathStore((s) => s.minutes);
  const haptics = useBreathStore((s) => s.haptics);
  const [info, setInfo] = useState(false);

  return (
    <View style={{ gap: t.space.lg }}>
      <View style={{ gap: t.space.sm }} accessibilityRole="radiogroup">
        {BREATH_MODE_IDS.map((m) => (
          <OptionCard key={m} icon={MODE_ICON[m]} label={tr(`breath.mode.${m}.name`)} description={compact ? tr(`breath.mode.${m}.rhythm`) : `${tr(`breath.mode.${m}.rhythm`)}\n${tr(`breath.mode.${m}.when`)}`} selected={mode === m} onPress={() => onChange(m, minutesFor(m, remembered))} />
        ))}
      </View>
      <View style={{ gap: t.space.sm }}>
        <AppText variant="title3">{tr('breath.duration')}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }} accessibilityRole="radiogroup">
          {BREATH_MODES[mode].minutes.map((n) => (
            <Chip key={n} label={tr('common.minutes', { count: n })} selected={minutes === n} onPress={() => onChange(mode, n)} />
          ))}
        </View>
      </View>
      {compact ? null : <SwitchRow label={tr('breath.haptics')} description={tr('breath.hapticsHint')} value={haptics} onChange={(v) => useBreathStore.getState().setHaptics(v)} />}
      <Pressable onPress={() => setInfo(true)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm, minHeight: 44, alignSelf: 'flex-start' }}>
        <Icon name="info" size="sm" color={t.tokens.primary} />
        <AppText variant="callout" weight="600" color={t.tokens.primary}>
          {tr('breath.infoLink')}
        </AppText>
      </Pressable>

      <Sheet visible={info} onClose={() => setInfo(false)} title={tr('breath.infoTitle')}>
        <View style={{ gap: t.space.md }}>
          <AppText variant="callout">{tr('breath.safety')}</AppText>
          <AppText variant="callout">{tr('breath.evidence')}</AppText>
          {BREATH_SOURCES.map((s) => (
            <Pressable key={s.url} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link" style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'center', minHeight: 44 }}>
              <Icon name="link" size="sm" color={t.tokens.mutedForeground} />
              <AppText variant="footnote" style={{ flex: 1, textDecorationLine: 'underline' }}>
                {s.title}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  );
}
