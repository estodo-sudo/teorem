import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { IntensityScale } from '@/features/camps/core/sosTools';
import { ODAK_DIARY as D, ODAK_ONBOARDING as ONB, ODAK_SOS as SOS } from '@/features/camps/odak/content';
import { buildUrge, noDayy, type Dayy } from '@/features/camps/odak/engine/sos';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import type { OdakTriggerId, UrgeEvent } from '@/features/camps/odak/types';
import { PillGroup } from '@/features/camps/odak/ui';
import { goBack } from '@/lib/nav';

/** Quick urge log (≤3 taps): intensity → (optional situation / DAYY) → managed or slipped. Time is automatic. */
export default function OdakLogUrge() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [now] = useState(() => new Date());
  const [intensity, setIntensity] = useState<number | null>(null);
  const [trigger, setTrigger] = useState<OdakTriggerId | null>(null);
  const [dayy, setDayy] = useState<Dayy>(noDayy);
  const [saved, setSaved] = useState(false);

  const save = async (outcome: UrgeEvent['outcome']) => {
    if (intensity === null) return;
    await useOdakStore.getState().logUrge(buildUrge({ startedAt: now, endedAt: now, intensityBefore: intensity, dayy, toolsUsed: [], outcome, trigger }));
    setSaved(true);
  };

  if (saved) {
    return (
      <Screen footer={<Button label={tr('common.done')} size="lg" onPress={() => goBack('/odak/diary')} />}>
        <Header title={D.urge.title} onBack={() => goBack('/odak/diary')} right={<QuickExitButton />} />
        <Card style={{ alignItems: 'center', gap: t.space.sm, padding: t.space.gutter }}>
          <IconTile icon="leaf" tone="focus" size="lg" round />
          <AppText center weight="700" accessibilityLiveRegion="polite">
            {D.urge.saved}
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={D.urge.title} onBack={() => goBack('/odak/diary')} right={<QuickExitButton />} />
      <AppText muted>{D.urge.hint}</AppText>
      <AppText weight="800">{D.urge.intensity}</AppText>
      <IntensityScale value={intensity} onChange={setIntensity} label={D.urge.intensity} labels={SOS.check.intensityLabels} />
      <AppText weight="800">{D.urge.trigger}</AppText>
      <PillGroup items={ONB.triggers.options} selected={trigger ? [trigger] : []} onToggle={(id) => setTrigger((x) => (x === id ? null : (id as OdakTriggerId)))} />
      <AppText weight="800">{D.urge.dayy}</AppText>
      <PillGroup items={SOS.check.items.map((i) => ({ id: i.id, icon: i.icon, label: i.label }))} selected={SOS.check.items.filter((i) => dayy[i.id]).map((i) => i.id)} onToggle={(id) => setDayy((d) => ({ ...d, [id]: !d[id as keyof Dayy] }))} />
      <AppText weight="800">{D.urge.outcome}</AppText>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label={D.urge.managed} size="lg" disabled={intensity === null} onPress={() => void save('managed')} style={{ flex: 1 }} />
        <Button label={D.urge.slipped} size="lg" variant="secondary" disabled={intensity === null} onPress={() => void save('slipped')} style={{ flex: 1 }} />
      </View>
      <AppText variant="tiny" muted style={{ color: t.colors.textMuted }}>
        {SOS.emergency}
      </AppText>
    </Screen>
  );
}
