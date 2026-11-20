import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Icon, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { tint } from '@/features/campus/shared/ui';
import { useNow } from '@/lib/useNow';
import { useCampusStore } from '@/stores/campusStore';

import type { BodyContent } from './content';
import { clampMeasure, type BodyExercise, type BodyMeasure, type BodyId, type DayCell } from './logic';

/** Formats a measurement with its unit (1 decimal only when needed). */
export const fmtMeasure = (v: number, unit: string) => `${Number.isInteger(v) ? v : v.toFixed(1).replace('.', ',')} ${unit}`;

/** "10 tekrar × 5 sn tut · her iki taraf" */
export function useDosage() {
  const { t: tr } = useTranslation();
  return (e: BodyExercise) => {
    const parts = [
      e.reps > 1
        ? tr('body.dose.reps', { reps: e.reps, hold: e.holdSec })
        : tr('body.dose.once', {
            hold: e.holdSec >= 60 ? tr('body.dose.min', { count: Math.round(e.holdSec / 60) }) : tr('body.dose.sec', { count: e.holdSec }),
          }),
    ];
    if (e.sides) parts.push(tr('body.dose.sides'));
    return parts.join(' · ');
  };
}

/** Expandable exercise row: icon, title and dosage; opens to the steps and a tip. */
export function ExerciseRow({ ex, n }: { ex: BodyExercise; n: number }) {
  const t = useTheme();
  const dose = useDosage();
  const [open, setOpen] = useState(false);
  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          minHeight: t.touch,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: tint(t.colors.primary, '1A'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconTile icon={ex.icon} tone="campus" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="800">
            {n}. {ex.title}
          </AppText>
          <AppText variant="small" muted>
            {dose(ex)}
          </AppText>
        </View>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron" color={t.colors.textMuted} size={18} />
        </View>
      </Pressable>
      {open ? <ExerciseSteps ex={ex} style={{ marginHorizontal: 14, marginBottom: 14 }} /> : null}
    </Card>
  );
}

/** Numbered how-to steps of an exercise, with its tip. */
export function ExerciseSteps({ ex, style }: { ex: BodyExercise; style?: object }) {
  const t = useTheme();
  return (
    <View style={[{ gap: 8 }, style]}>
      {ex.steps.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: t.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}
          >
            <AppText variant="tiny" weight="800" color={t.colors.primaryText}>
              {i + 1}
            </AppText>
          </View>
          <AppText variant="small" style={{ flex: 1, lineHeight: 20 }}>
            {s}
          </AppText>
        </View>
      ))}
      {ex.tip ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            padding: 10,
            borderRadius: t.radius.md,
            backgroundColor: tint(t.colors.warning, '1A'),
          }}
        >
          <Icon name="bulb" size="md" color={t.tone.campus.fg} />
          <AppText variant="small" style={{ flex: 1 }}>
            {ex.tip}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

/** Neck: modelled load on the neck at each head angle, as horizontal bars. */
export function LoadChart({ loads }: { loads: { deg: number; kg: number; label: string }[] }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const max = Math.max(...loads.map((l) => l.kg));
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={loads.map((l) => `${l.label}: ${l.kg} kg`).join(', ')}>
      {loads.map((l, i) => {
        const c = i === 0 ? t.colors.success : i < 2 ? t.colors.warning : t.colors.danger;
        return (
          <View key={l.deg} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 34, alignItems: 'center' }}>
              <View style={{ transform: [{ rotate: `${l.deg}deg` }] }}>
                <Icon name="smile" size="md" color={t.tone.campus.fg} />
              </View>
            </View>
            <AppText variant="small" weight="700" style={{ width: 34 }}>
              {l.label}
            </AppText>
            <View
              style={{
                flex: 1,
                height: 14,
                borderRadius: 7,
                backgroundColor: t.colors.surfaceAlt,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${(l.kg / max) * 100}%`,
                  height: '100%',
                  borderRadius: 7,
                  backgroundColor: c,
                }}
              />
            </View>
            <AppText variant="small" weight="800" style={{ width: 48, textAlign: 'right' }}>
              {tr('body.kg', { kg: l.kg })}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

/** Feet: a stylised footprint; `mid` is the share of the midfoot that touches the ground. */
export function Footprint({ mid, size = 64, color }: { mid: number; size?: number; color: string }) {
  const w = size * 0.55;
  const h = size;
  // Outer edge stays put; the inner (arch) edge moves in as the midfoot fills.
  const archX = w * (0.92 - 0.6 * mid);
  const d = `M ${w * 0.5} ${h * 0.97}
    C ${w * 0.12} ${h * 0.97}, ${w * 0.05} ${h * 0.8}, ${w * 0.1} ${h * 0.62}
    C ${w * 0.12} ${h * 0.5}, ${w * 0.04} ${h * 0.38}, ${w * 0.08} ${h * 0.26}
    C ${w * 0.14} ${h * 0.12}, ${w * 0.6} ${h * 0.1}, ${w * 0.9} ${h * 0.24}
    C ${w * 0.98} ${h * 0.34}, ${archX} ${h * 0.5}, ${archX} ${h * 0.6}
    C ${archX} ${h * 0.72}, ${w * 0.92} ${h * 0.8}, ${w * 0.88} ${h * 0.88}
    C ${w * 0.82} ${h * 0.96}, ${w * 0.66} ${h * 0.97}, ${w * 0.5} ${h * 0.97} Z`;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={w} height={h}>
        <Path d={d} fill={color} />
        {[0.12, 0.3, 0.46, 0.62, 0.78].map((x, i) => (
          <Ellipse key={i} cx={w * (0.1 + x * 0.85)} cy={h * (0.11 - (i === 0 ? 0.02 : 0) + i * 0.012)} rx={w * (i === 0 ? 0.1 : 0.065)} ry={h * (i === 0 ? 0.06 : 0.042)} fill={color} />
        ))}
      </Svg>
    </View>
  );
}

/** Programme calendar: one row per week (W1…W8), done days filled. */
export function ProgramGrid({ grid, currentWeek }: { grid: DayCell[][]; currentWeek: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const cell = (c: DayCell) =>
    c === 'done'
      ? { backgroundColor: t.colors.success, borderColor: t.colors.success }
      : c === 'today'
        ? {
            backgroundColor: t.colors.surface,
            borderColor: t.colors.primary,
            borderWidth: 2,
          }
        : c === 'missed'
          ? {
              backgroundColor: t.colors.surfaceAlt,
              borderColor: t.colors.surfaceAlt,
            }
          : { backgroundColor: t.colors.surface, borderColor: t.colors.border };
  return (
    <View style={{ gap: 6 }}>
      {grid.map((row, w) => (
        <View
          key={w}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          accessible
          accessibilityLabel={tr('body.home.gridRow', {
            week: w + 1,
            count: row.filter((c) => c === 'done').length,
          })}
        >
          <AppText variant="tiny" weight={w + 1 === currentWeek ? '800' : '700'} color={w + 1 === currentWeek ? t.colors.primary : t.colors.textMuted} style={{ width: 28 }}>
            {tr('body.home.weekShort', { n: w + 1 })}
          </AppText>
          {row.map((c, i) => (
            <View
              key={i}
              style={[
                {
                  flex: 1,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                cell(c),
              ]}
            >
              {c === 'done' ? <Icon name="check" color={t.tokens.primaryForeground} size={13} strokeWidth={3} /> : null}
            </View>
          ))}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 2 }}>
        <Legend color={t.colors.success} label={tr('body.home.legendDone')} />
        <Legend color={t.colors.surfaceAlt} label={tr('body.home.legendMissed')} />
        <Legend color={t.colors.surface} border={t.colors.primary} label={tr('body.home.legendToday')} />
      </View>
    </View>
  );
}

function Legend({ color, border, label }: { color: string; border?: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          backgroundColor: color,
          borderWidth: border ? 2 : 1,
          borderColor: border ?? t.colors.border,
        }}
      />
      <AppText variant="tiny" muted>
        {label}
      </AppText>
    </View>
  );
}

/** Measurement history as bars (latest 8), the better direction highlighted. */
export function MeasureBars({ measures, unit }: { measures: BodyMeasure[]; unit: string }) {
  const t = useTheme();
  const list = measures.slice(-8);
  const max = Math.max(1, ...list.map((m) => m.value));
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        height: 120,
      }}
    >
      {list.map((m, i) => {
        const last = i === list.length - 1;
        const d = new Date(m.at);
        return (
          <View key={m.at} style={{ flex: 1, alignItems: 'center', gap: 4 }} accessible accessibilityLabel={`${d.getDate()}.${d.getMonth() + 1}: ${fmtMeasure(m.value, unit)}`}>
            <AppText variant="tiny" weight="800" color={last ? t.colors.primary : t.colors.textMuted}>
              {fmtMeasure(m.value, '').trim()}
            </AppText>
            <View
              style={{
                width: '100%',
                maxWidth: 34,
                height: Math.max(4, (m.value / max) * 72),
                borderRadius: 6,
                backgroundColor: last ? t.colors.primary : tint(t.colors.primary, '55'),
              }}
            />
            <AppText variant="tiny" muted>
              {`${d.getDate()}.${d.getMonth() + 1}`}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

/** Value entry for a measurement: a big number with −/+ (stepper) and, for timed tests, a stopwatch. */
export function MeasureInput({ m, value, onChange }: { m: BodyContent['measure']; value: number; onChange: (v: number) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const now = useNow(100).getTime();
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const shown = runningSince !== null ? clampMeasure(Math.floor((now - runningSince) / 1000), m.min, m.max, m.step) : value;
  const set = (v: number) => onChange(clampMeasure(v, m.min, m.max, m.step));
  const stepBtn = (sign: 1 | -1) => (
    <Pressable
      onPress={() => set(shown + sign * m.step)}
      disabled={runningSince !== null}
      accessibilityRole="button"
      accessibilityLabel={sign > 0 ? tr('body.measure.plus') : tr('body.measure.minus')}
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: t.colors.border,
        backgroundColor: t.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: runningSince !== null ? 0.4 : 1,
      }}
    >
      <AppText variant="h2">{sign > 0 ? '+' : '−'}</AppText>
    </Pressable>
  );
  return (
    <View style={{ gap: 14, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        {stepBtn(-1)}
        <View style={{ minWidth: 120, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <AppText variant="display" style={{ lineHeight: 52 }}>
            {fmtMeasure(shown, '').trim()}
          </AppText>
          <AppText weight="700" muted>
            {m.unit}
          </AppText>
        </View>
        {stepBtn(1)}
      </View>
      {m.kind === 'stopwatch' ? (
        <Button
          label={runningSince !== null ? tr('body.measure.stop') : tr('body.measure.start')}
          icon={runningSince !== null ? 'stop' : 'play'}
          variant={runningSince !== null ? 'accent' : 'secondary'}
          onPress={() => {
            if (runningSince !== null) {
              set(Math.floor((Date.now() - runningSince) / 1000));
              setRunningSince(null);
            } else setRunningSince(Date.now());
          }}
          style={{ alignSelf: 'stretch' }}
        />
      ) : null}
    </View>
  );
}

/** How to measure, numbered. */
export function MeasureHowTo({ m }: { m: BodyContent['measure'] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {m.howTo.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
          <AppText variant="small" weight="800" color={t.colors.primary}>
            {i + 1}.
          </AppText>
          <AppText variant="small" style={{ flex: 1 }}>
            {s}
          </AppText>
        </View>
      ))}
      <AppText variant="tiny" muted>
        {m.hint}
      </AppText>
    </View>
  );
}

/** Weekly measurement dialog: how-to, value entry, save. */
export function MeasureDialog({ id, content, visible, onClose, initial }: { id: BodyId; content: BodyContent; visible: boolean; onClose: () => void; initial: number }) {
  const { t: tr } = useTranslation();
  const [value, setValue] = useState(initial);
  return (
    <Dialog
      visible={visible}
      title={content.measure.title}
      onDismiss={onClose}
      actions={[
        {
          label: tr('body.measure.save'),
          variant: 'primary',
          onPress: () => {
            useCampusStore.getState().logBodyMeasure(id, value);
            onClose();
          },
        },
        { label: tr('common.cancel'), variant: 'ghost', onPress: onClose },
      ]}
    >
      <View style={{ gap: 16 }}>
        <MeasureHowTo m={content.measure} />
        <MeasureInput m={content.measure} value={value} onChange={setValue} />
      </View>
    </Dialog>
  );
}

/** Daily-habits checklist (ergonomics / footwear). */
export function BodyChecklist({ items, doneIds, onToggle }: { items: BodyContent['checklist']; doneIds: string[]; onToggle: (id: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {items.map((c) => {
        const done = doneIds.includes(c.id);
        return (
          <Pressable
            key={c.id}
            onPress={() => onToggle(c.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            style={{
              flexDirection: 'row',
              gap: 12,
              padding: 12,
              borderRadius: t.radius.md,
              backgroundColor: done ? tint(t.colors.success, '14') : t.colors.surface,
              borderWidth: 1,
              borderColor: done ? t.colors.success : t.colors.border,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: done ? t.colors.success : t.colors.border,
                backgroundColor: done ? t.colors.success : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}
            >
              {done ? <Icon name="check" color={t.tokens.primaryForeground} size={16} strokeWidth={3} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText
                weight="700"
                style={{
                  textDecorationLine: done ? 'line-through' : 'none',
                  opacity: done ? 0.75 : 1,
                }}
              >
                {c.text}
              </AppText>
              <AppText variant="small" muted>
                {c.detail}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
