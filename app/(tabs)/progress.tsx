import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, Screen, useTheme } from '@/components';
import { useStreak } from '@/features/gamification/service';
import { BarChart } from '@/features/progress/charts/BarChart';
import { HeatMap } from '@/features/progress/charts/HeatMap';
import { LineChart } from '@/features/progress/charts/LineChart';
import { heatMap, holdTrend, quickTrend, strengthTestDue, summarize, weeklyMinutes } from '@/features/progress/stats';
import { openGated } from '@/features/purchases/useGate';
import { fromDateKey, toDateKey } from '@/lib/date';
import { makeId } from '@/lib/random';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

export default function ProgressTab() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const workouts = useHistoryStore((s) => s.workouts);
  const tests = useHistoryStore((s) => s.strengthTests);
  const notes = useHistoryStore((s) => s.notes);
  const addNote = useHistoryStore((s) => s.addNote);
  const deleteNote = useHistoryStore((s) => s.deleteNote);
  const level = useTrainingStore((s) => s.training.level);
  const streak = useStreak();
  const today = toDateKey();
  const [note, setNote] = useState('');
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const short = (d: string) => fromDateKey(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  const summary = summarize(workouts, streak.longest, level);
  const weeks = useMemo(() => weeklyMinutes(workouts, today, 8), [workouts, today]);
  const heat = useMemo(() => heatMap(workouts, today, 12), [workouts, today]);
  const hold = holdTrend(tests).map((p) => ({ label: short(p.date), value: p.value }));
  const quick = quickTrend(tests).map((p) => ({ label: short(p.date), value: p.value }));
  const due = strengthTestDue(tests, today);
  const progressNotes = notes.filter((n) => n.kind === 'progress').slice().reverse();

  const saveNote = () => {
    const text = note.trim();
    if (!text) return;
    addNote({ id: makeId('n_'), date: today, createdAt: new Date().toISOString(), text, kind: 'progress' });
    setNote('');
  };

  return (
    <Screen>
      <AppText variant="h1" accessibilityRole="header">
        {tr('progress.title')}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <StatCard label={tr('progress.totalWorkouts')} value={String(summary.totalWorkouts)} />
        <StatCard label={tr('progress.totalMinutes')} value={String(summary.totalMinutes)} />
        <StatCard label={tr('progress.longestStreak')} value={tr('progress.days', { count: summary.longestStreak })} />
        <StatCard label={tr('progress.level')} value={String(summary.level)} />
      </View>

      <Card style={{ gap: 10, borderColor: due ? t.colors.accent : t.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppText variant="h2">📏</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="h3">{tr('progress.strength.title')}</AppText>
            <AppText variant="small" muted>
              {due ? tr('progress.strength.due') : tr('progress.strength.notDue')}
            </AppText>
          </View>
        </View>
        <Button label={tr('progress.strength.start')} variant={due ? 'accent' : 'secondary'} onPress={() => openGated('strengthTest', '/strength-test')} />
      </Card>

      <ChartCard title={tr('progress.charts.hold')}>
        <LineChart data={hold} unit={tr('progress.unitSec')} accessibilityLabel={tr('progress.charts.hold')} emptyText={tr('progress.charts.empty')} />
      </ChartCard>
      <ChartCard title={tr('progress.charts.quick')}>
        <LineChart data={quick} accessibilityLabel={tr('progress.charts.quick')} emptyText={tr('progress.charts.empty')} />
      </ChartCard>
      <ChartCard title={tr('progress.charts.weekly')}>
        <BarChart
          data={weeks.map((w) => ({ label: short(w.week), value: Math.round(w.minutes) }))}
          unit={tr('progress.unitMin')}
          accessibilityLabel={tr('progress.charts.weekly')}
        />
      </ChartCard>
      <ChartCard title={tr('progress.charts.calendar')}>
        <HeatMap
          columns={heat}
          dayLabels={tr('progress.dayLetters', { returnObjects: true }) as string[]}
          legend={{ none: tr('progress.heat.none'), partial: tr('progress.heat.partial'), done: tr('progress.heat.done'), multi: tr('progress.heat.multi') }}
          accessibilityLabel={tr('progress.charts.calendar')}
        />
      </ChartCard>

      <Card style={{ gap: 10 }}>
        <AppText variant="h3">{tr('progress.notes.title')}</AppText>
        <AppText variant="small" muted>
          {tr('progress.notes.hint')}
        </AppText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={tr('progress.notes.placeholder')}
          placeholderTextColor={t.colors.textMuted}
          multiline
          maxLength={500}
          accessibilityLabel={tr('progress.notes.title')}
          style={{ minHeight: 64, color: t.colors.text, backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.md, padding: 12, fontSize: 16, textAlignVertical: 'top' }}
        />
        <Button label={tr('progress.notes.add')} variant="secondary" icon="plus" disabled={!note.trim()} onPress={saveNote} />
        {progressNotes.map((n) => (
          <View key={n.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingVertical: 6, borderTopWidth: 1, borderTopColor: t.colors.border }}>
            <View style={{ flex: 1 }}>
              <AppText variant="tiny" muted>
                {short(n.date)}
              </AppText>
              <AppText>{n.text}</AppText>
            </View>
            <Pressable onPress={() => deleteNote(n.id)} accessibilityRole="button" accessibilityLabel={tr('common.delete')} hitSlop={10} style={{ padding: 6 }}>
              <Icon name="trash" color={t.colors.textMuted} size={18} />
            </Pressable>
          </View>
        ))}
      </Card>
      <Button label={tr('progress.achievements')} variant="ghost" icon="trophy" onPress={() => router.push('/achievements')} />
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ width: '47%', flexGrow: 1, gap: 2 }}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="small" muted>
        {label}
      </AppText>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card style={{ gap: 10 }}>
      <AppText variant="h3">{title}</AppText>
      {children}
    </Card>
  );
}
