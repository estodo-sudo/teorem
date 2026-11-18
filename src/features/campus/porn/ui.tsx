import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Dialog, Icon, ProgressRing, useTheme } from '@/components';
import { useCampusStore } from '@/stores/campusStore';

import { Chip } from '../smoking/ui';
import { GroupCard, tint } from '../shared/ui';

import { PC, type PcOption } from './content';
import { listProgress, recommendationKeys, type RiskMap } from './logic';

/** "Kayma oldu" with a short chain analysis: device, feeling and first step (all optional). */
export function LapseAnalysisDialog({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved?: () => void }) {
  const { t: tr } = useTranslation();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [feelingId, setFeelingId] = useState<string | null>(null);
  const [firstStepId, setFirstStepId] = useState<string | null>(null);
  // Reset only when the dialog opens again, so its content does not change while it fades out.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDeviceId(null);
      setFeelingId(null);
      setFirstStepId(null);
    }
  }
  const group = (title: string, items: PcOption[], value: string | null, set: (v: string | null) => void) => (
    <View style={{ gap: 6 }}>
      <AppText weight="800">{title}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {items.map((x) => (
          <Chip key={x.id} emoji={x.emoji} label={x.label} selected={value === x.id} onPress={() => set(value === x.id ? null : x.id)} />
        ))}
      </View>
    </View>
  );
  return (
    <Dialog
      visible={visible}
      title={tr('pcampus.lapse.title')}
      onDismiss={onClose}
      actions={[
        {
          label: tr('pcampus.lapse.save'),
          variant: 'primary',
          onPress: () => {
            useCampusStore.getState().logPcLapse({ deviceId, feelingId, firstStepId });
            onClose();
            onSaved?.();
          },
        },
        { label: tr('common.cancel'), variant: 'ghost', onPress: onClose },
      ]}
    >
      <View style={{ gap: 12 }}>
        {PC.lapseLines.map((l) => (
          <AppText key={l} variant="small">
            {l}
          </AppText>
        ))}
        {group(tr('pcampus.lapse.device'), PC.analysis.devices, deviceId, setDeviceId)}
        {group(tr('pcampus.lapse.feeling'), PC.analysis.feelings, feelingId, setFeelingId)}
        {group(tr('pcampus.lapse.firstStep'), PC.analysis.firstSteps, firstStepId, setFirstStepId)}
        <AppText variant="tiny" muted>
          {tr('pcampus.lapse.optional')}
        </AppText>
      </View>
    </Dialog>
  );
}

/** Personal risk map: most common device, time, feeling and first step, plus matching recommendations. */
export function RiskMapCard({ map }: { map: RiskMap }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  if (map.total === 0) {
    return (
      <View style={{ padding: 14, borderRadius: t.radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.border }}>
        <AppText variant="small" muted>
          🗺️ {tr('pcampus.home.riskEmpty')}
        </AppText>
      </View>
    );
  }
  const find = (list: PcOption[], id: string | undefined) => list.find((x) => x.id === id);
  const device = find(PC.analysis.devices, map.device?.id);
  const feeling = find(PC.analysis.feelings, map.feeling?.id);
  const first = find(PC.analysis.firstSteps, map.firstStep?.id);
  const tiles = [
    { label: tr('pcampus.home.riskDevice'), value: device ? `${device.emoji} ${device.label}` : '–', count: map.device?.count },
    { label: tr('pcampus.home.riskTime'), value: map.time ? `🕒 ${tr(`pcampus.home.dayPart.${map.time.id}`)}` : '–', count: map.time?.count },
    { label: tr('pcampus.home.riskFeeling'), value: feeling ? `${feeling.emoji} ${feeling.label}` : '–', count: map.feeling?.count },
    { label: tr('pcampus.home.riskFirst'), value: first ? `${first.emoji} ${first.label}` : '–', count: map.firstStep?.count },
  ];
  const recs = recommendationKeys(map)
    .map((k) => PC.analysis.recommendations[k])
    .filter((x): x is string => !!x);
  return (
    <View style={{ gap: 10 }}>
      <AppText variant="tiny" muted>
        {tr('pcampus.home.riskCount', { count: map.total })}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tiles.map((x) => (
          <View key={x.label} style={{ width: '48%', flexGrow: 1, gap: 2, padding: 12, borderRadius: t.radius.md, backgroundColor: tint(t.colors.danger, '12'), borderWidth: 1, borderColor: tint(t.colors.danger, '40') }}>
            <AppText variant="tiny" weight="800" muted>
              {x.label.toLocaleUpperCase('tr-TR')}
            </AppText>
            <AppText weight="800" numberOfLines={2}>
              {x.value}
            </AppText>
            {x.count ? (
              <AppText variant="tiny" muted>
                {tr('pcampus.home.riskTimes', { count: x.count })}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
      {recs.length ? (
        <>
          <AppText weight="800">{tr('pcampus.home.recsTitle')}</AppText>
          <GroupCard>
            {recs.map((r) => (
              <View key={r} style={{ flexDirection: 'row', gap: 10 }}>
                <AppText>💡</AppText>
                <AppText variant="small" style={{ flex: 1 }}>
                  {r}
                </AppText>
              </View>
            ))}
          </GroupCard>
        </>
      ) : null}
    </View>
  );
}

/** Everyday activity suggestion on the urge screen (display only): large for favourites, compact for the rest. */
export function ActivityTile({ emoji, label, large }: { emoji: string; label: string; large?: boolean }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        width: large ? '48%' : '31%',
        flexGrow: large ? 1 : 0,
        minHeight: large ? 104 : 86,
        padding: large ? 14 : 10,
        gap: 6,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        borderColor: large ? tint(t.colors.primary, '55') : t.colors.border,
        backgroundColor: large ? tint(t.colors.primary, '14') : t.colors.surface,
        justifyContent: 'space-between',
      }}
    >
      <AppText variant={large ? 'h1' : 'h3'}>{emoji}</AppText>
      <AppText variant={large ? 'body' : 'small'} weight="800" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

/** "Pornonun zararları": a soft button that opens an evidence-based list in place. */
export function PornHarmsCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  const h = PC.harms;
  return (
    <View style={{ borderRadius: t.radius.lg, borderWidth: 1, borderColor: tint(t.colors.warning, '66'), backgroundColor: tint(t.colors.warning, '12'), overflow: 'hidden' }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={tr('pcampus.home.harmsButton')}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: t.touch, opacity: pressed ? 0.85 : 1 })}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tint(t.colors.warning, '33'), alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="h3">⚠️</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="800">{tr('pcampus.home.harmsButton')}</AppText>
          <AppText variant="small" muted>
            {tr('pcampus.home.harmsHint')}
          </AppText>
        </View>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron" color={t.colors.textMuted} size={18} />
        </View>
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
          <AppText variant="small">{h.intro}</AppText>
          {h.items.map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <AppText>{x.emoji}</AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText weight="800">{x.title}</AppText>
                <AppText variant="small">{x.text}</AppText>
              </View>
            </View>
          ))}
          <View style={{ padding: 12, borderRadius: t.radius.md, backgroundColor: tint(t.colors.success, '14'), borderLeftWidth: 3, borderLeftColor: t.colors.success }}>
            <AppText variant="small">✅ {h.note}</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Digital environment checklist with a progress ring (enrolment page and campus home). */
export function PcEnvChecklist({ doneIds, onToggle, title, subtitle }: { doneIds: string[]; onToggle: (id: string) => void; title: string; subtitle?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { done, total, complete } = listProgress(PC.env.map((e) => e.id), doneIds);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <ProgressRing size={72} stroke={8} value={total ? done / total : 0} color={complete ? t.colors.success : t.colors.primary}>
          <AppText weight="800">{tr('pcampus.home.envRing', { done, total })}</AppText>
        </ProgressRing>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="h3" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="small" muted>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {PC.env.map((e) => {
        const checked = doneIds.includes(e.id);
        return (
          <Pressable
            key={e.id}
            onPress={() => onToggle(e.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={e.text}
            style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: t.radius.lg, borderWidth: 2, borderColor: checked ? t.colors.success : t.colors.border, backgroundColor: t.colors.surface }}
          >
            <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: checked ? t.colors.success : t.colors.border, backgroundColor: checked ? t.colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {checked ? <Icon name="check" color="#FFFFFF" size={16} strokeWidth={3} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText weight="700" style={{ textDecorationLine: checked ? 'line-through' : 'none' }} muted={checked}>
                {e.text}
              </AppText>
              <AppText variant="small" muted>
                {e.detail}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
