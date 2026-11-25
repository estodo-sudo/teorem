import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Button, Card } from '@/components/ui';
import { appImage } from '@/content/images';
import { PROGRAM_WEEKS, programState } from '@/features/fitness/program';
import { routineDurationSec, standardRoutine } from '@/features/fitness/routines';
import { todayPlanDay } from '@/features/training/plan';
import { protectedDays } from '@/features/training/returns';
import { weekTheme } from '@/features/training/roadmap';
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
 * done (filled primary circle with a check), today (primary ring), later days (muted), a rest day (moon)
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
  const planWeek = Math.min(3, Math.floor(todayPlanDay(training, today) / 7));
  const labels = dayLabels(i18n.language);

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
      <Card style={{ padding: t.space.lg, gap: t.space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="list">
          {days.map((d) => (
            <DayDot key={d.key} day={d} label={labels[d.index]!} />
          ))}
        </View>
        <AppText variant="footnote" muted center>
          {tr('home.week.summary', { done: count.done, total: count.total, theme: weekTheme(planWeek).title })}
        </AppText>
      </Card>
    </View>
  );
}

export function DayDot({ day, label }: { day: WeekDay; label: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const k = t.tokens;
  const filled = day.state === 'done' || day.state === 'todayDone';
  const half = day.state === 'partial' || day.state === 'todayPartial';
  const ring = day.state === 'today' || day.state === 'todayDone' || day.state === 'todayPartial';
  const a11y = `${label}, ${tr(`home.week.state.${day.state}`)}`;
  return (
    <View style={{ alignItems: 'center', gap: t.space.xs, minWidth: 36 }} accessible accessibilityLabel={a11y}>
      <AppText variant="caption" muted={!ring} weight={ring ? '700' : '500'} color={ring ? k.primary : undefined}>
        {label}
      </AppText>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? k.primary : day.state === 'rest' ? 'transparent' : k.muted,
          borderWidth: ring || half ? 2 : day.state === 'rest' ? 1 : 0,
          borderColor: ring ? (filled ? k.primaryForeground : k.primary) : half ? k.primary : k.border,
          overflow: 'hidden',
        }}
      >
        {/* Below the daily target: the lower half is filled. */}
        {half ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', backgroundColor: k.primary }} /> : null}
        {filled ? <Icon name="check" size={18} color={k.primaryForeground} strokeWidth={3} /> : day.state === 'rest' ? <Icon name="moon" size={16} color={k.mutedForeground} /> : null}
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
