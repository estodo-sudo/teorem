import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Screen, useTheme, type IconName } from '@/components';
import { Button, Card, EmptyState, IconTile, StatRow } from '@/components/ui';
import { useStreak } from '@/features/gamification/service';
import { HeatMap } from '@/features/progress/charts/HeatMap';
import { LineChart } from '@/features/progress/charts/LineChart';
import { heatMap, holdTrend, quickTrend, strengthTestDue, summarize } from '@/features/progress/stats';
import { openGated, openOffer, useAccess } from '@/features/purchases/useGate';
import { MovesCard } from '@/features/training/MovesCard';
import { ExerciseGuide } from '@/features/training/ProfileTraining';
import { scoreTrend } from '@/features/training/strengthV2';
import { fromDateKey, toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { localeOf } from '@/i18n/languages';

/**
 * İlerleme (user request 2026-11-22: only these): the summary card (4 stats), the strength test card with its
 * charts (one compact empty state until the first test), the training calendar heat map and, under it,
 * the exercise guide (3 open, 9 locked). The monthly
 * self-rating, weekly minutes, notes and the trophies link were removed from this tab.
 */
export default function ProgressTab() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const workouts = useHistoryStore((s) => s.workouts);
  const tests = useHistoryStore((s) => s.strengthTests);
  const level = useTrainingStore((s) => s.training.level);
  const target = useTrainingStore((s) => s.training.dailyTarget);
  const streak = useStreak();
  const today = toDateKey();
  const locale = localeOf(i18n.language);
  const short = (d: string) => fromDateKey(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  const summary = summarize(workouts, streak.longest, level);
  const heat = useMemo(() => heatMap(workouts, today, 12, target), [workouts, today, target]);
  const hold = holdTrend(tests).map((p) => ({ label: short(p.date), value: p.value }));
  const quick = quickTrend(tests).map((p) => ({ label: short(p.date), value: p.value }));
  const score = scoreTrend(tests).map((p) => ({ label: short(p.date), value: p.value }));
  const due = strengthTestDue(tests, today);
  const locked = !useAccess()('progress');

  return (
    // premium only (2026-11-26): blurred, moving by itself; a tap opens the "fırsat" paywall
    <Screen contentStyle={{ gap: t.space.xxl }} locked={locked ? () => openOffer('progress') : undefined}>
      <AppText variant="title1" accessibilityRole="header">
        {tr('progress.title')}
      </AppText>

      <Card style={{ paddingVertical: t.space.lg, paddingHorizontal: t.space.md }}>
        <StatRow
          stats={[
            { value: String(summary.totalWorkouts), label: tr('progress.statWorkouts') },
            { value: String(summary.totalMinutes), label: tr('progress.statMinutes') },
            { value: String(summary.longestStreak), label: tr('progress.statStreak') },
            { value: String(summary.level), label: tr('progress.statLevel') },
          ]}
        />
      </Card>

      <Section title={tr('progress.strengthSection')}>
        <ActionCard
          icon="ruler"
          title={tr('progress.strength.title')}
          text={due ? tr('progress.strength.due') : tr('progress.strength.notDue')}
          highlight={due}
          action={<Button label={tr('progress.strength.start')} variant={due ? 'primary' : 'secondary'} onPress={() => openGated('strengthTest', '/strength-test')} fullWidth />}
        />
        {hold.length || quick.length || score.length ? (
          <>
            {hold.length ? (
              <ChartCard title={tr('progress.charts.hold')}>
                <LineChart data={hold} unit={tr('progress.unitSec')} accessibilityLabel={tr('progress.charts.hold')} emptyText={tr('progress.charts.empty')} />
              </ChartCard>
            ) : null}
            {quick.length ? (
              <ChartCard title={tr('progress.charts.quick')}>
                <LineChart data={quick} accessibilityLabel={tr('progress.charts.quick')} emptyText={tr('progress.charts.empty')} />
              </ChartCard>
            ) : null}
            {score.length ? (
              <ChartCard title={tr('progress.charts.score')} note={tr('strength.scoreLabel')}>
                <LineChart data={score} accessibilityLabel={tr('progress.charts.score')} emptyText={tr('progress.charts.empty')} />
              </ChartCard>
            ) : null}
          </>
        ) : (
          <Card style={{ paddingHorizontal: t.space.gutter }}>
            <EmptyState illustration="empty-progress" title={tr('progress.empty.strengthTitle')} description={tr('progress.empty.strengthBody')} />
          </Card>
        )}
      </Section>

      <Section title={tr('progress.habitSection')}>
        <ChartCard title={tr('progress.charts.calendar')}>
          <HeatMap
            columns={heat}
            dayLabels={tr('progress.dayLetters', { returnObjects: true }) as string[]}
            legend={{ none: tr('progress.heat.none'), partial: tr('progress.heat.partial'), done: tr('progress.heat.done'), multi: tr('progress.heat.multi') }}
            accessibilityLabel={tr('progress.charts.calendar')}
          />
        </ChartCard>
      </Section>

      {/* the moves of the 180-day plan by name: learned, next (with its day) and locked (2026-11-26) */}
      <Section title={tr('moves.section')}>
        <MovesCard />
      </Section>

      <Section title={tr('progress.exercisesSection')}>
        <ExerciseGuide />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.md }}>
      <AppText variant="title2" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

/** A prompt card; when its moment has come it is tinted with the soft primary (never a coloured border). */
function ActionCard({ icon, title, text, highlight, action }: { icon: IconName; title: string; text: string; highlight: boolean; action: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ padding: t.space.gutter, gap: t.space.md, borderRadius: t.radius.lg, backgroundColor: highlight ? t.tokens.primarySoft : t.tokens.card, borderWidth: highlight ? 0 : t.border.thin, borderColor: t.tokens.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
        <IconTile icon={icon} background={highlight ? t.tokens.card : undefined} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title3">{title}</AppText>
          <AppText variant="footnote" muted>
            {text}
          </AppText>
        </View>
      </View>
      {action}
    </View>
  );
}

function ChartCard({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <Card style={{ padding: t.space.gutter, gap: t.space.md }}>
      <AppText variant="title3">{title}</AppText>
      {children}
      {note ? (
        <AppText variant="footnote" muted>
          {note}
        </AppText>
      ) : null}
    </Card>
  );
}
