import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Dialog, useTheme } from '@/components';
import { fromDateKey } from '@/lib/date';

import { tint } from '../shared/ui';

import { ALC, type AlcDrinkType } from './content';
import { DAILY_MAX } from './logic';

const fmt = (n: number) => String(n).replace('.', ',');

/** Drink picker: one tap logs a serving of that drink. */
export function DrinkSheet({ visible, onPick, onClose }: { visible: boolean; onPick: (d: AlcDrinkType) => void; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Dialog visible={visible} title={tr('acampus.drinkSheet.title')} message={tr('acampus.drinkSheet.hint')} onDismiss={onClose} actions={[{ label: tr('common.close'), variant: 'ghost', onPress: onClose }]}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
        {ALC.drinks.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => onPick(d)}
            accessibilityRole="button"
            accessibilityLabel={`${d.title}, ${d.detail}, ${tr('acampus.drinkSheet.std', { std: fmt(d.std) })}`}
            style={({ pressed }) => ({
              width: '48%',
              flexGrow: 1,
              gap: 2,
              padding: 10,
              borderRadius: t.radius.md,
              borderWidth: 1,
              borderColor: t.colors.border,
              backgroundColor: pressed ? tint(t.colors.primary, '22') : t.colors.surfaceAlt,
            })}
          >
            <AppText weight="800">
              {d.title}
            </AppText>
            <AppText variant="tiny" muted>
              {d.detail}
            </AppText>
            <AppText variant="tiny" weight="800" color={t.colors.primary}>
              {tr('acampus.drinkSheet.std', { std: fmt(d.std) })}
            </AppText>
          </Pressable>
        ))}
      </View>
    </Dialog>
  );
}

/** Bars of the last days in standard drinks, with the daily maximum as a dashed line. */
export function DayBars({ days, locale }: { days: { key: string; std: number; before: boolean }[]; locale: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const height = 120;
  const barArea = height - 18;
  const maxVal = Math.max(DAILY_MAX, ...days.map((d) => d.std)) * 1.15;
  return (
    <View style={{ gap: t.space.sm }}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: t.space.sm }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: (DAILY_MAX / maxVal) * barArea, borderTopWidth: 2, borderStyle: 'dashed', borderColor: t.colors.warning, opacity: 0.7 }} />
        {days.map((d, i) => {
          const color = d.before ? t.colors.border : d.std === 0 ? t.colors.success : d.std > DAILY_MAX ? t.colors.danger : t.colors.primary;
          const today = i === days.length - 1;
          return (
            <View
              key={d.key}
              accessible
              accessibilityLabel={tr('acampus.home.chartA11y', { day: fromDateKey(d.key).toLocaleDateString(locale, { weekday: 'long' }), std: fmt(d.std) })}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height, gap: 2 }}
            >
              <AppText variant="tiny" weight="800" muted>
                {d.before ? '–' : d.std === 0 ? '0' : fmt(d.std)}
              </AppText>
              <View style={{ width: 24, height: d.std === 0 ? 6 : Math.max(6, (d.std / maxVal) * barArea), borderRadius: t.radius.sm, backgroundColor: today ? tint(color, 'AA') : color }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: t.space.sm }}>
        {days.map((d, i) => (
          <AppText key={d.key} variant="tiny" muted center style={{ flex: 1 }} weight={i === days.length - 1 ? '800' : undefined}>
            {fromDateKey(d.key).toLocaleDateString(locale, { weekday: 'short' })}
          </AppText>
        ))}
      </View>
    </View>
  );
}

/** Red banner shown when the withdrawal check found a risk: do not stop alone; AMATEM call button, 112 as a warning line only. */
export function WithdrawalBanner() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const w = ALC.withdrawal;
  const amatem = ALC.help.find((h) => h.id === 'amatem');
  return (
    <View style={{ gap: t.space.sm, padding: t.space.lg, borderRadius: t.radius.lg, borderWidth: 2, borderColor: t.colors.danger, backgroundColor: tint(t.colors.danger, '14') }}>
      <AppText variant="h3" color={t.colors.danger}>
        {w.riskTitle}
      </AppText>
      <AppText variant="small">{w.riskText}</AppText>
      <AppText variant="small" weight="700">
        {w.emergency}
      </AppText>
      {amatem?.phone ? <Button label={tr('acampus.home.callAmatem', { phone: amatem.phone })} variant="secondary" icon="bell" onPress={() => void Linking.openURL(`tel:${amatem.phone}`)} /> : null}
    </View>
  );
}

/** AUDIT-C score on a 0–12 scale: low (0–3), risky (4–7), high (8–12), with a marker at the user's score. */
export function AuditScale({ score }: { score: number }) {
  const t = useTheme();
  const bands = [
    { from: 0, to: 3, color: t.colors.success, label: ALC.audit.bands[0]!.title },
    { from: 4, to: 7, color: t.colors.warning, label: ALC.audit.bands[1]!.title },
    { from: 8, to: 12, color: t.colors.danger, label: ALC.audit.bands[2]!.title },
  ];
  const pct = (Math.min(12, Math.max(0, score)) + 0.5) / 13;
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${score}/12`}>
      <View style={{ height: 14 }}>
        <View style={{ position: 'absolute', left: `${pct * 100}%`, marginLeft: -7, width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: t.colors.text }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {bands.map((b) => (
          <View key={b.from} style={{ flex: b.to - b.from + 1, height: 10, borderRadius: 5, backgroundColor: b.color, opacity: score >= b.from && score <= b.to ? 1 : 0.35 }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {bands.map((b) => (
          <View key={b.from} style={{ flex: b.to - b.from + 1 }}>
            <AppText variant="tiny" weight={score >= b.from && score <= b.to ? '800' : undefined} muted={!(score >= b.from && score <= b.to)}>
              {b.from}–{b.to} · {b.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
