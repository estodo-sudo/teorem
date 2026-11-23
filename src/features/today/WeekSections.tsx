import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Badge, Card, IconTile } from '@/components/ui';
import { recommendedRoutine, routineDurationSec, ROUTINES } from '@/features/fitness/routines';
import { completedDates } from '@/features/gamification/service';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { todayPlanDay } from '@/features/training/plan';
import { protectedDays } from '@/features/training/returns';
import { weekTheme } from '@/features/training/roadmap';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTrainingStore } from '@/stores/trainingStore';

import { weekCount, weekDays, type WeekDay } from './week';
import { localeOf } from '@/i18n/languages';

/** Short weekday names, Monday first (tr: Pzt, Sal, Çar, Per, Cum, Cmt, Paz). */
function dayLabels(lang: string): string[] {
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
  const days = weekDays(today, completedDates(workouts), protectedDays(training));
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

function DayDot({ day, label }: { day: WeekDay; label: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const k = t.tokens;
  const filled = day.state === 'done' || day.state === 'todayDone';
  const ring = day.state === 'today' || day.state === 'todayDone';
  const a11y = `${label}, ${tr(`home.week.state.${day.state}`)}`;
  return (
    <View style={{ alignItems: 'center', gap: t.space.xs, minWidth: 36 }} accessible accessibilityLabel={a11y}>
      <AppText variant="caption" muted={!ring} weight={ring ? '700' : '500'} color={ring ? k.primary : undefined}>
        {label}
      </AppText>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? k.primary : day.state === 'rest' ? 'transparent' : k.muted, borderWidth: ring ? 2 : day.state === 'rest' ? 1 : 0, borderColor: ring ? (filled ? k.primaryForeground : k.primary) : k.border }}>
        {filled ? <Icon name="check" size={18} color={k.primaryForeground} strokeWidth={3} /> : day.state === 'rest' ? <Icon name="moon" size={16} color={k.mutedForeground} /> : null}
      </View>
    </View>
  );
}

const ROUTINE_ICON: Record<string, IconName> = { beginner: 'leaf', intermediate: 'layers', advanced: 'trophy' };

/**
 * Kasık Fitness (moved from the Antrenman tab): a title with one line of description and the three
 * routines. "Senin için önerilen" sits next to the routine name, so "8 egzersiz · 8 dk" never wraps.
 */
export function FitnessCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const activity = useProfileStore((s) => s.profile.activity);
  const rec = recommendedRoutine(activity);
  const access = useAccess()('fitness');
  return (
    <View style={{ gap: t.space.md }}>
      <View style={{ gap: 2 }}>
        <AppText variant="title2" accessibilityRole="header">
          {tr('fitness.title')}
        </AppText>
        <AppText variant="footnote" muted>
          {tr('fitness.subtitle')}
        </AppText>
      </View>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {ROUTINES.map((r, i) => {
          const meta = tr('fitness.cardMeta', { count: r.steps.length, min: Math.round(routineDurationSec(r) / 60) });
          return (
            <Pressable
              key={r.id}
              onPress={() => openGated('fitness', { pathname: '/fitness/[routineId]', params: { routineId: r.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${r.name}, ${meta}${r.id === rec.id ? `, ${tr('fitness.recommended')}` : ''}`}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 64, paddingHorizontal: t.space.lg, paddingVertical: t.space.md, borderTopWidth: i ? 1 : 0, borderTopColor: t.tokens.border, backgroundColor: pressed ? t.tokens.muted : 'transparent' })}
            >
              <IconTile icon={ROUTINE_ICON[r.id] ?? 'body'} size="sm" />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: t.space.sm }}>
                  <AppText variant="bodyStrong">{r.name}</AppText>
                  {r.id === rec.id ? <Badge label={tr('fitness.recommended')} /> : null}
                </View>
                <AppText variant="footnote" muted numberOfLines={1}>
                  {meta}
                </AppText>
              </View>
              <Icon name={access ? 'chevron' : 'lock'} size="md" color={t.tokens.subtle} />
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}


