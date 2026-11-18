import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Dialog, Icon, ProgressRing, useTheme } from '@/components';
import { fromDateKey } from '@/lib/date';
import { useCampusStore } from '@/stores/campusStore';

import { MC } from './content';
import { tint } from '../shared/ui';

import { listProgress, nextLapseEndsAttempt, thisWeek, type CalendarDay, type McMode, type WeekUsage } from './logic';

/** Environment checklist: progress ring header and large tappable items (enrolment page and campus home). */
export function EnvChecklist({ doneIds, onToggle, title, subtitle }: { doneIds: string[]; onToggle: (id: string) => void; title: string; subtitle?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { done, total, complete } = listProgress(MC.env.map((e) => e.id), doneIds);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <ProgressRing size={72} stroke={8} value={total ? done / total : 0} color={complete ? t.colors.success : t.colors.primary}>
          <AppText weight="800">{tr('mcampus.home.envRing', { done, total })}</AppText>
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
      {MC.env.map((e) => {
        const checked = doneIds.includes(e.id);
        return (
          <Pressable
            key={e.id}
            onPress={() => onToggle(e.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={e.text}
            style={{
              flexDirection: 'row',
              gap: 12,
              padding: 14,
              borderRadius: t.radius.lg,
              borderWidth: 2,
              borderColor: checked ? t.colors.success : t.colors.border,
              backgroundColor: t.colors.surface,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: checked ? t.colors.success : t.colors.border,
                backgroundColor: checked ? t.colors.success : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
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

/**
 * Quit path "Fire verdim" dialog, same rule as the smoking campus: the first lapse
 * of an attempt is logged and the counter goes on; the second is confirmed first
 * and then ends the attempt.
 */
export function LapseDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t: tr } = useTranslation();
  const m = useCampusStore((s) => s.masturbation);
  const [endedAttempt, setEndedAttempt] = useState<number | null>(null);
  // Reset only when the dialog opens again, so its content does not change while it fades out.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setEndedAttempt(null);
  }
  const log = () => {
    const { restarted } = useCampusStore.getState().logLapse();
    if (restarted) setEndedAttempt(useCampusStore.getState().masturbation.attempt);
    else onClose();
  };
  if (endedAttempt !== null) {
    return (
      <Dialog
        visible={visible}
        title={tr('mcampus.lapse.endedTitle')}
        message={tr('mcampus.lapse.endedBody', { count: endedAttempt })}
        onDismiss={onClose}
        actions={[{ label: tr('mcampus.lapse.endedOk'), variant: 'primary', onPress: onClose }]}
      />
    );
  }
  if (nextLapseEndsAttempt(m)) {
    return (
      <Dialog
        visible={visible}
        title={tr('mcampus.lapse.secondTitle')}
        message={tr('mcampus.lapse.secondBody')}
        onDismiss={onClose}
        actions={[
          { label: tr('mcampus.lapse.secondYes'), variant: 'danger', onPress: log },
          { label: tr('mcampus.lapse.secondNo'), variant: 'ghost', onPress: onClose },
        ]}
      />
    );
  }
  return (
    <Dialog
      visible={visible}
      title={tr('mcampus.lapse.title')}
      onDismiss={onClose}
      actions={[
        { label: tr('mcampus.lapse.save'), variant: 'primary', onPress: log },
        { label: tr('common.cancel'), variant: 'ghost', onPress: onClose },
      ]}
    >
      <View style={{ gap: 8 }}>
        {MC.lapse.map((line) => (
          <AppText key={line} variant="small">
            {line}
          </AppText>
        ))}
      </View>
    </Dialog>
  );
}

/** Control path: confirm using one weekly allowance; warns (and offers the urge screen) when over the limit. */
export function UseDialog({ visible, onClose, onTryUrge }: { visible: boolean; onClose: () => void; onTryUrge?: () => void }) {
  const { t: tr } = useTranslation();
  const m = useCampusStore((s) => s.masturbation);
  const week = thisWeek(m, new Date());
  const willBeOver = week.used + 1 > week.limit;
  const save = () => {
    useCampusStore.getState().logUse();
    onClose();
  };
  return (
    <Dialog
      visible={visible}
      title={willBeOver ? tr('mcampus.use.overTitle') : tr('mcampus.use.title')}
      message={willBeOver ? tr('mcampus.use.overBody', { limit: week.limit }) : tr('mcampus.use.body', { used: week.used + 1, limit: week.limit })}
      onDismiss={onClose}
      actions={
        willBeOver
          ? [
              ...(onTryUrge ? [{ label: tr('mcampus.use.tryUrge'), variant: 'primary' as const, onPress: onTryUrge }] : []),
              { label: tr('mcampus.use.overSave'), variant: 'secondary', onPress: save },
              { label: tr('common.cancel'), variant: 'ghost', onPress: onClose },
            ]
          : [
              { label: tr('mcampus.use.save'), variant: 'primary', onPress: save },
              { label: tr('common.cancel'), variant: 'ghost', onPress: onClose },
            ]
      }
    />
  );
}

/** 4×7 grid of the last 28 days. Quit: clean / fire. Control: clean / used / over the limit. A dot marks urges ridden out. */
export function CalendarGrid({ days, locale, mode }: { days: CalendarDay[]; locale: string; mode: McMode }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const colorOf: Record<CalendarDay['status'], string> = {
    none: t.colors.surfaceAlt,
    clean: t.colors.success,
    lapse: t.colors.danger,
    use: t.colors.warning,
    over: t.colors.danger,
  };
  const labelOf: Record<CalendarDay['status'], string> = {
    none: tr('mcampus.home.legendNone'),
    clean: tr('mcampus.home.legendClean'),
    lapse: tr('mcampus.home.legendLapse'),
    use: tr('mcampus.home.legendUse'),
    over: tr('mcampus.home.legendOver'),
  };
  const rows = [0, 1, 2, 3].map((r) => days.slice(r * 7, r * 7 + 7));
  const legend: { c: string; l: string }[] =
    mode === 'quit'
      ? [
          { c: t.colors.success, l: labelOf.clean },
          { c: t.colors.danger, l: labelOf.lapse },
        ]
      : [
          { c: t.colors.success, l: labelOf.clean },
          { c: t.colors.warning, l: labelOf.use },
          { c: t.colors.danger, l: labelOf.over },
        ];
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 6 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 6 }}>
            {row.map((d) => {
              const day = fromDateKey(d.key);
              const filled = d.status !== 'none';
              // Today is still in progress: a soft tint instead of a full colour while it is clean.
              const soft = d.today && d.status === 'clean';
              const solid = filled && !soft;
              return (
                <View
                  key={d.key}
                  accessible
                  accessibilityLabel={`${day.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}: ${d.today ? `${tr('mcampus.home.legendToday')}, ` : ''}${labelOf[d.status]}`}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 10,
                    backgroundColor: soft ? tint(colorOf.clean, '40') : solid ? colorOf[d.status] : t.colors.surfaceAlt,
                    borderWidth: d.today ? 2 : 0,
                    borderColor: t.colors.text,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: d.status === 'none' ? 0.45 : 1,
                  }}
                >
                  <AppText variant="tiny" weight="800" color={solid ? '#FFFFFF' : t.colors.textMuted}>
                    {day.getDate()}
                  </AppText>
                  {d.uses > 1 ? (
                    <AppText variant="tiny" weight="800" color="#FFFFFF" style={{ position: 'absolute', bottom: 1, fontSize: 9 }}>
                      ×{d.uses}
                    </AppText>
                  ) : null}
                  {d.urges > 0 ? <View style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: solid ? '#FFFFFF' : t.colors.primary }} /> : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {legend.map((x) => (
          <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: x.c }} />
            <AppText variant="tiny" muted>
              {x.l}
            </AppText>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.primary }} />
          <AppText variant="tiny" muted>
            {tr('mcampus.home.urgeDot')}
          </AppText>
        </View>
      </View>
    </View>
  );
}

/** Control path: bars of the last weeks against the weekly limit line. */
export function WeekBars({ weeks, locale }: { weeks: WeekUsage[]; locale: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const height = 110;
  const barArea = height - 18;
  const maxVal = Math.max(1, ...weeks.map((w) => Math.max(w.used, w.limit))) * 1.15;
  const limit = weeks[weeks.length - 1]?.limit ?? 0;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: (limit / maxVal) * barArea, borderTopWidth: 2, borderStyle: 'dashed', borderColor: t.colors.textMuted, opacity: 0.6 }} />
        {weeks.map((w, i) => {
          const current = i === weeks.length - 1;
          const color = w.over ? t.colors.danger : t.colors.success;
          return (
            <View
              key={w.weekKey}
              accessible
              accessibilityLabel={tr('mcampus.home.historyA11y', { week: fromDateKey(w.weekKey).toLocaleDateString(locale, { day: 'numeric', month: 'short' }), used: w.used, limit: w.limit })}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height, gap: 2 }}
            >
              <AppText variant="tiny" weight="800" muted>
                {w.used}
              </AppText>
              <View style={{ width: 26, height: Math.max(4, (w.used / maxVal) * barArea), borderRadius: 8, backgroundColor: current ? tint(color, 'AA') : color }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {weeks.map((w) => (
          <AppText key={w.weekKey} variant="tiny" muted center style={{ flex: 1 }} numberOfLines={1}>
            {fromDateKey(w.weekKey).toLocaleDateString(locale, { day: 'numeric', month: 'numeric' })}
          </AppText>
        ))}
      </View>
    </View>
  );
}

/** "Aşırı mastürbasyonun zararları": a soft button that opens an evidence-based list in place. */
export function HarmsCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  const h = MC.harms;
  return (
    <View style={{ borderRadius: t.radius.lg, borderWidth: 1, borderColor: tint(t.colors.warning, '66'), backgroundColor: tint(t.colors.warning, '12'), overflow: 'hidden' }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={tr('mcampus.home.harmsButton')}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: t.touch, opacity: pressed ? 0.85 : 1 })}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tint(t.colors.warning, '33'), alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="h3">⚠️</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="800">{tr('mcampus.home.harmsButton')}</AppText>
          <AppText variant="small" muted>
            {tr('mcampus.home.harmsHint')}
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
