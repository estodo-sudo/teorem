import type { IconName } from '@/components/Icon';
import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, useTheme } from '@/components';
import { tint } from '@/features/campus/shared/ui';

import { ODAK_ONBOARDING as ONB } from './content';

/** Gentle specialist card (BPS / mood screen high): never a diagnosis; 115 one tap away, 112 always shown. */
export function ExpertCard({ lead }: { lead?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const e = ONB.expert;
  return (
    <Card style={{ gap: t.space.sm, backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
      <AppText variant="h3">{e.title}</AppText>
      {lead ? <AppText variant="small">{lead}</AppText> : null}
      <AppText variant="small">{e.body}</AppText>
      <Button label={e.phoneLabel} icon="bell" variant="secondary" onPress={() => void Linking.openURL(`tel:${e.phone}`)} />
      <AppText variant="tiny" muted>
        {e.emergency}
      </AppText>
      <AppText variant="tiny" muted>
        {tr('camp.ui.lastVerified', { date: e.lastVerified })}
      </AppText>
    </Card>
  );
}

/** Row of answer pills for a scored item (BPS, PHQ-2/GAD-2, 1–5 scale). */
export function ScaleRow({ label, options, value, onChange }: { label: string; options: { value: number; label: string }[]; value: number | null; onChange: (v: number) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.sm }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText weight="700">{label}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label}: ${o.label}`}
              style={{
                minHeight: 48,
                paddingHorizontal: 14,
                borderRadius: t.radius.pill,
                borderWidth: 2,
                borderColor: selected ? t.colors.primary : t.colors.border,
                backgroundColor: selected ? tint(t.colors.primary, '1F') : t.colors.surface,
                justifyContent: 'center',
              }}
            >
              <AppText variant="small" weight="700" color={selected ? t.colors.primary : t.colors.text}>
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Wrapping pills for multi-select lists (emotions, values, time ranges). */
export function PillGroup({ items, selected, onToggle }: { items: { id: string; icon?: IconName; label: string }[]; selected: string[]; onToggle: (id: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
      {items.map((it) => {
        const on = selected.includes(it.id);
        return (
          <Pressable
            key={it.id}
            onPress={() => onToggle(it.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={it.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              minHeight: 48,
              paddingHorizontal: 14,
              borderRadius: t.radius.pill,
              borderWidth: 2,
              borderColor: on ? t.colors.primary : t.colors.border,
              backgroundColor: on ? t.colors.primary : t.colors.surface,
            }}
          >
            {it.icon ? <Icon name={it.icon} size="md" /> : null}
            <AppText variant="small" weight="700" color={on ? t.colors.primaryText : t.colors.text}>
              {it.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Phase progress line: six segments, the current one highlighted. */
export function OdakPhaseTrack({ index }: { index: number }) {
  const t = useTheme();
  const phases = ONB.summary.phases;
  return (
    <View style={{ flexDirection: 'row', gap: t.space.xs }} accessible accessibilityLabel={`${index + 1}/${phases.length} · ${phases[index]?.name ?? ''}`}>
      {phases.map((p, i) => (
        <View key={p.name} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < index ? t.colors.success : i === index ? t.colors.accent : t.colors.surfaceAlt }} />
      ))}
    </View>
  );
}

/** Premium lock card of the camp (neutral, no urgency). */
export function OdakLock({ title }: { title: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Card style={{ gap: t.space.sm, borderWidth: 1.5, borderColor: tint(t.colors.accent, '88'), backgroundColor: tint(t.colors.accent, '0D') }}>
      <AppText weight="800">{title}</AppText>
      <AppText variant="small" muted>
        {tr('odak.premium.text')}
      </AppText>
      <Button label={tr('odak.premium.unlock')} icon="star" variant="accent" onPress={() => router.push({ pathname: '/paywall', params: { source: 'odak' } })} />
    </Card>
  );
}
