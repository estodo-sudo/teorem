import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme, type IconName } from '@/components';
import { Button, Card, EmptyState, IconTile, Input, ScalePressable, StatRow } from '@/components/ui';
import { useStreak } from '@/features/gamification/service';
import { BarChart } from '@/features/progress/charts/BarChart';
import { HeatMap } from '@/features/progress/charts/HeatMap';
import { LineChart } from '@/features/progress/charts/LineChart';
import { heatMap, holdTrend, quickTrend, strengthTestDue, summarize, weeklyMinutes } from '@/features/progress/stats';
import { openGated } from '@/features/purchases/useGate';
import { scoreTrend, selfRatingDue, selfRatingQuestions, selfRatingTrend } from '@/features/training/strengthV2';
import { fromDateKey, toDateKey } from '@/lib/date';
import { makeId } from '@/lib/random';
import { useHistoryStore } from '@/stores/historyStore';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * İlerleme — ui-v3 (SPEC_UI_V3 §7.6): one summary card (4 stats side by side), the strength test card
 * (soft primary when due, no orange border), charts only when there is data (otherwise one compact empty
 * state), the self-rating card, weekly minutes, the calendar heat map and notes.
 */
export default function ProgressTab() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const workouts = useHistoryStore((s) => s.workouts);
  const tests = useHistoryStore((s) => s.strengthTests);
  const level = useTrainingStore((s) => s.training.level);
  const track = useTrainingStore((s) => s.training.track);
  const ratings = useKegelStore((s) => s.selfRatings);
  const streak = useStreak();
  const today = toDateKey();
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const short = (d: string) => fromDateKey(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  const summary = summarize(workouts, streak.longest, level);
  const weeks = useMemo(() => weeklyMinutes(workouts, today, 8), [workouts, today]);
  const heat = useMemo(() => heatMap(workouts, today, 12), [workouts, today]);
  const hold = holdTrend(tests).map((p) => ({ label: short(p.date), value: p.value }));
  const quick = quickTrend(tests).map((p) => ({ label: short(p.date), value: p.value }));
  const score = scoreTrend(tests).map((p) => ({ label: short(p.date), value: p.value }));
  const due = strengthTestDue(tests, today);
  const ratingDue = selfRatingDue(ratings, track, today);
  const ratingCharts = selfRatingQuestions(track)
    .map((q) => ({ q, data: selfRatingTrend(ratings, track, q.id).map((p) => ({ label: short(p.date), value: p.value })) }))
    .filter((x) => x.data.length);
  const anyMinutes = weeks.some((w) => w.minutes > 0);

  return (
    <Screen contentStyle={{ gap: t.space.xxl }}>
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
        <ActionCard
          icon="notebook"
          title={tr('kegel.selfRating.cardTitle')}
          text={ratingDue ? tr('kegel.selfRating.due') : tr('kegel.selfRating.notDue')}
          highlight={ratingDue}
          action={<Button label={tr('kegel.selfRating.start')} variant={ratingDue && !due ? 'primary' : 'secondary'} onPress={() => router.push('/kegel/self-rating')} fullWidth />}
        />
        {ratingCharts.map(({ q, data }) => (
          <ChartCard key={q.id} title={q.text} note={q.better === 'high' ? tr('kegel.selfRating.higherBetter') : tr('kegel.selfRating.lowerBetter')}>
            <LineChart data={data} accessibilityLabel={q.text} emptyText={tr('progress.charts.empty')} />
          </ChartCard>
        ))}
      </Section>

      <Section title={tr('progress.habitSection')}>
        {anyMinutes ? (
          <ChartCard title={tr('progress.charts.weekly')}>
            <BarChart data={weeks.map((w) => ({ label: short(w.week), value: Math.round(w.minutes) }))} unit={tr('progress.unitMin')} accessibilityLabel={tr('progress.charts.weekly')} />
          </ChartCard>
        ) : (
          <Card style={{ paddingHorizontal: t.space.gutter }}>
            <EmptyState illustration="empty-history" title={tr('progress.empty.weeklyTitle')} description={tr('progress.empty.weeklyBody')} />
          </Card>
        )}
        <ChartCard title={tr('progress.charts.calendar')}>
          <HeatMap
            columns={heat}
            dayLabels={tr('progress.dayLetters', { returnObjects: true }) as string[]}
            legend={{ none: tr('progress.heat.none'), partial: tr('progress.heat.partial'), done: tr('progress.heat.done'), multi: tr('progress.heat.multi') }}
            accessibilityLabel={tr('progress.charts.calendar')}
          />
        </ChartCard>
      </Section>

      <Notes />
      <Button label={tr('progress.achievements')} variant="ghost" icon="trophy" onPress={() => router.push('/achievements')} />
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

/** Own notes, kept on this device only. */
function Notes() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const notes = useHistoryStore((s) => s.notes);
  const addNote = useHistoryStore((s) => s.addNote);
  const deleteNote = useHistoryStore((s) => s.deleteNote);
  const [note, setNote] = useState('');
  const today = toDateKey();
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const list = notes
    .filter((n) => n.kind === 'progress')
    .slice()
    .reverse();
  const save = () => {
    const text = note.trim();
    if (!text) return;
    addNote({ id: makeId('n_'), date: today, createdAt: new Date().toISOString(), text, kind: 'progress' });
    setNote('');
  };
  return (
    <Section title={tr('progress.notes.title')}>
      <AppText variant="footnote" muted>
        {tr('progress.notes.hint')}
      </AppText>
      <Card style={{ padding: t.space.gutter, gap: t.space.md }}>
        <Input value={note} onChangeText={setNote} placeholder={tr('progress.notes.placeholder')} multiline maxLength={500} accessibilityLabel={tr('progress.notes.title')} />
        <Button label={tr('progress.notes.add')} variant="secondary" icon="plus" disabled={!note.trim()} onPress={save} fullWidth />
        {list.map((n) => (
          <View key={n.id} style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-start', paddingTop: t.space.md, borderTopWidth: t.border.thin, borderTopColor: t.tokens.border }}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" muted>
                {fromDateKey(n.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
              </AppText>
              <AppText variant="body">{n.text}</AppText>
            </View>
            <ScalePressable onPress={() => deleteNote(n.id)} accessibilityRole="button" accessibilityLabel={tr('common.delete')} style={{ width: t.touch, height: t.touch, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trash" color={t.tokens.mutedForeground} size="md" />
            </ScalePressable>
          </View>
        ))}
      </Card>
    </Section>
  );
}
