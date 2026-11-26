import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Button, Card } from '@/components/ui';
import { appImage } from '@/content/images';
import { PROGRAM_WEEKS, programState } from '@/features/fitness/program';
import { routineDurationSec, standardRoutine } from '@/features/fitness/routines';
import { protectedDays } from '@/features/training/returns';
import { currentPlanWeek, weekTheme } from '@/features/training/roadmap';
import { targetDays } from '@/features/training/summary';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

import { PHOTO_SPACE, PhotoBackground } from './PhotoCard';
import { weekCount, weekDays, type WeekDay } from './week';
import { localeOf } from '@/i18n/languages';

/** Short weekday names, Monday first (tr: Pzt, Sal, Çar, Per, Cum, Cmt, Paz). */
export function dayLabels(lang: string): string[] {
  // 1 January 2024 was a Monday.
  return Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(localeOf(lang), { weekday: 'short' }).replace('.', ''));
}

/**
 * "Bu hafta" (SPEC_V4 §A.2, moved from the Antrenman tab): the calendar week with each day's state —
 * each day a soft capsule (round 3, 2026-11-25: weekday, date and a mark — check, half, moon, dot, dash)
 * — and one line "Bu hafta 2/5 antrenman · 1. hafta: Kası tanı". "Tüm planı gör" opens the plan.
 */
export function ThisWeek() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const workouts = useHistoryStore((s) => s.workouts);
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  // A day is done when the daily target is reached (2026-11-23: one session of two showed the day as done).
  const split = targetDays(workouts, training.dailyTarget);
  const days = weekDays(today, split.full, protectedDays(training), split.partial);
  const count = weekCount(days);
  const { stage: planStage, week: planWeek } = currentPlanWeek(training, today);
  const labels = dayLabels(i18n.language);
  const frameStyle = useWeekCardStyle();

  return (
    <View style={{ gap: t.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.sm }}>
        <AppText variant="title2" accessibilityRole="header" style={{ flex: 1 }}>
          {tr('home.week.title')}
        </AppText>
        <Pressable onPress={() => router.push('/kegel/plan')} accessibilityRole="link" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
          <AppText variant="callout" weight="600" color={t.tokens.primary}>
            {tr('home.week.seePlan')}
          </AppText>
        </Pressable>
      </View>
      <Card style={[{ paddingVertical: t.space.lg, paddingHorizontal: t.space.sm, gap: t.space.md }, frameStyle]}>
        <View style={{ flexDirection: 'row' }} accessibilityRole="list">
          {days.map((d) => (
            <DayDot key={d.key} day={d} label={labels[d.index]!} />
          ))}
        </View>
        <AppText variant="footnote" muted center>
          {tr('home.week.summary', { done: count.done, total: count.total, theme: weekTheme(planWeek, planStage).title })}
        </AppText>
      </Card>
    </View>
  );
}

/** A #rrggbb colour at an opacity (other formats are returned as they are). */
const withAlpha = (hex: string, a: number) =>
  /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0')}` : hex;

/** The card around the week: the app's own card, with no extra frame (round 3 revision, 2026-11-25). */
export function useWeekCardStyle() {
  return {};
}

/**
 * One day of the week (round 3 revised, 2026-11-25): a soft capsule like the app's chips — no frames.
 * Weekday on top, the date, then a small mark. Done: the capsule fills with the primary colour and a
 * check. Today: a primary tint, a thin primary outline and a dot. Below the target: the lower half fills.
 * Rest: a moon on a dashed outline. Missed: a short dash. To come: a muted capsule and a ring.
 */
export function DayDot({ day, label }: { day: WeekDay; label: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const k = t.tokens;
  const filled = day.state === 'done' || day.state === 'todayDone';
  const half = day.state === 'partial' || day.state === 'todayPartial';
  const today = day.state === 'today' || day.state === 'todayDone' || day.state === 'todayPartial';
  const rest = day.state === 'rest';
  const missed = day.state === 'missed';
  const date = Number(day.key.slice(8, 10));
  const a11y = `${label} ${date}, ${tr(`home.week.state.${day.state}`)}`;
  const bg = filled ? k.primary : today || half ? withAlpha(k.primary, 0.18) : rest ? 'transparent' : k.muted;
  const ink = filled ? k.primaryForeground : today ? k.primary : missed ? k.mutedForeground : k.foreground;
  const sub = filled ? k.primaryForeground : today ? k.primary : k.mutedForeground;
  return (
    <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={a11y}>
      <View
        style={{
          width: '86%',
          maxWidth: 44,
          alignItems: 'center',
          gap: 3,
          paddingTop: 10,
          paddingBottom: 10,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: bg,
          borderWidth: today && !filled ? 1.5 : rest ? 1 : 0,
          borderStyle: rest ? 'dashed' : 'solid',
          borderColor: today ? k.primary : k.border,
          opacity: missed ? 0.75 : 1,
        }}
      >
        {/* Below the daily target: the lower half fills. */}
        {half ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%', backgroundColor: withAlpha(k.primary, 0.55) }} /> : null}
        <AppText variant="caption" weight="600" color={sub}>
          {label}
        </AppText>
        <AppText variant="callout" weight="700" color={ink} tabular>
          {date}
        </AppText>
        <View style={{ height: 16, alignItems: 'center', justifyContent: 'center' }}>
          {filled ? <Icon name="check" size={14} color={k.primaryForeground} strokeWidth={3} /> : null}
          {rest ? <Icon name="moon" size={13} color={k.mutedForeground} /> : null}
          {missed ? <View style={{ width: 8, height: 2, borderRadius: 1, backgroundColor: k.mutedForeground }} /> : null}
          {today && !filled && !half ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: k.primary }} /> : null}
          {day.state === 'future' ? <View style={{ width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: k.mutedForeground }} /> : null}
        </View>
      </View>
    </View>
  );
}

/**
 * Kasık Fitness (user request 2026-11-23): one standard routine, no levels, on a photo card — kicker,
 * title and one line on top, the photo in the middle, then three chips (week · moves · minutes) and one
 * button that opens the 7-week programme (app/fitness.tsx), where the session starts.
 */
export function FitnessCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const routine = standardRoutine();
  const logs = useHistoryStore((h) => h.fitnessLogs);
  const week = programState(logs, toDateKey()).week;
  const cover = appImage('today/fitness');
  const fg = cover ? t.focus.text : t.tokens.foreground;
  const min = Math.round(routineDurationSec(routine) / 60);
  const chips: { icon: IconName; label: string }[] = [
    { icon: 'calendar', label: tr('fitness.chipWeek', { n: week, total: PROGRAM_WEEKS }) },
    { icon: 'layers', label: tr('fitness.chipMoves', { count: routine.steps.length }) },
    { icon: 'clock', label: tr('fitness.chipMin', { min }) },
  ];
  // Opens the 7-week programme (2026-11-23); the session starts from there.
  const open = () => router.push('/fitness');
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {cover ? <PhotoBackground image={cover} id="fitnessVeil" textAt="bottom" /> : null}
      <View style={{ padding: t.space.gutter, gap: t.space.md }}>
        {/* Week, moves and length on the top of the photo (user request 2026-11-23). */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.xs }} accessible accessibilityLabel={chips.map((c) => c.label).join(', ')}>
          {chips.map((c) => (
            <View
              key={c.icon}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.sm, paddingVertical: t.space.xs, borderRadius: t.radius.pill, backgroundColor: cover ? t.veil.strong : t.tokens.muted }}
            >
              <Icon name={c.icon} size="sm" color={fg} />
              <AppText variant="footnote" weight="600" color={fg}>
                {c.label}
              </AppText>
            </View>
          ))}
        </View>
        {cover ? <View style={{ height: PHOTO_SPACE }} /> : null}
        {/* Title and one short line on the blurred bottom. */}
        <View style={{ gap: t.space.xs }}>
          <AppText variant="title2" accessibilityRole="header" color={fg}>
            {tr('fitness.title')}
          </AppText>
          <AppText variant="footnote" color={cover ? t.focus.icon : t.tokens.mutedForeground}>
            {tr('fitness.cardDesc')}
          </AppText>
        </View>
        <Button label={tr('fitness.openProgram')} icon="chevron" size="lg" fullWidth onPress={open} accessibilityHint={tr('fitness.startHint')} />
      </View>
    </Card>
  );
}
