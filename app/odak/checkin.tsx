import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { ODAK_CHECKIN as C } from '@/features/camps/odak/content';
import { buildCheckin, lowMoodAlert, VALUE_ACTION_MAX } from '@/features/camps/odak/engine/checkin';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import type { OdakCheckIn, Score5 } from '@/features/camps/odak/types';
import { ExpertCard, ScaleRow } from '@/features/camps/odak/ui';
import { goBack } from '@/lib/nav';

const scale = (labels: string[]) => labels.map((label, i) => ({ value: i + 1, label }));

/** Daily check-in (≤30 s): on goal? · strong urges · mood · sleep · loneliness · a value-based action. */
export default function OdakCheckin() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [onGoal, setOnGoal] = useState<boolean | null>(null);
  const [urges, setUrges] = useState<number | null>(null);
  const [mood, setMood] = useState<Score5 | null>(null);
  const [sleep, setSleep] = useState<Score5 | null>(null);
  const [lonely, setLonely] = useState<Score5 | null>(null);
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState<OdakCheckIn | null>(null);
  const checkins = useOdakStore((s) => s.checkins);
  const ready = onGoal !== null && urges !== null && mood !== null && sleep !== null && lonely !== null;

  const save = async () => {
    if (!ready) return;
    const c = buildCheckin({ onGoal, urgeCount: urges, mood, sleep, loneliness: lonely, valueAction: value }, new Date());
    await useOdakStore.getState().logCheckin(c);
    setSaved(c);
  };

  if (saved) {
    const low = lowMoodAlert(checkins, new Date());
    return (
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {!saved.onGoal ? <Button label={C.toSlip} size="lg" onPress={() => router.replace({ pathname: '/odak/slip', params: { from: 'checkin' } })} /> : null}
            <Button label={tr('common.done')} size="lg" variant={saved.onGoal ? 'primary' : 'ghost'} onPress={() => goBack('/odak')} />
          </View>
        }
      >
        <Header title={C.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
        <Card style={{ alignItems: 'center', gap: 8, padding: 20 }}>
          <AppText variant="display">🌿</AppText>
          <AppText center accessibilityLiveRegion="polite">
            {saved.onGoal ? C.done : C.doneSlip}
          </AppText>
        </Card>
        {low ? <ExpertCard lead={C.lowMood} /> : null}
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label={C.save} size="lg" disabled={!ready} onPress={() => void save()} />}>
      <Header title={C.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText muted>{C.hint}</AppText>
      <ScaleRow
        label={C.onGoal.q}
        options={[
          { value: 1, label: C.onGoal.yes },
          { value: 0, label: C.onGoal.no },
        ]}
        value={onGoal === null ? null : onGoal ? 1 : 0}
        onChange={(v) => setOnGoal(v === 1)}
      />
      <ScaleRow label={C.urges.q} options={C.urges.options.map((n) => ({ value: n, label: n === 5 ? C.urges.max : String(n) }))} value={urges} onChange={setUrges} />
      <ScaleRow label={C.mood.q} options={scale(C.mood.scale)} value={mood} onChange={(v) => setMood(v as Score5)} />
      <ScaleRow label={C.sleep.q} options={scale(C.sleep.scale)} value={sleep} onChange={(v) => setSleep(v as Score5)} />
      <ScaleRow label={C.loneliness.q} options={scale(C.loneliness.scale)} value={lonely} onChange={(v) => setLonely(v as Score5)} />
      <AppText weight="700">{C.value.q}</AppText>
      <TextInput
        value={value}
        onChangeText={setValue}
        maxLength={VALUE_ACTION_MAX}
        placeholder={C.value.placeholder}
        accessibilityLabel={C.value.q}
        placeholderTextColor={t.colors.textMuted}
        style={{ minHeight: 52, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, paddingHorizontal: 14, color: t.colors.text, fontSize: 16 }}
      />
    </Screen>
  );
}
