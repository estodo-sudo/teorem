import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, Screen, useTheme } from '@/components';
import { Badge } from '@/components/ui';
import { getCategory, getExercise, getProgram, type Category } from '@/features/bodyweight/catalog';
import { currentDay, dayPlan, PROGRAM_ORDER, programDone, workoutSec, type Program, type ProgramProgress, type Workout } from '@/features/bodyweight/program';
import { MoveCard, moveMeta } from '@/features/bodyweight/ui';
import { toDateKey } from '@/lib/date';
import { useBodyweightStore } from '@/stores/bodyweightStore';

/** Shortest and longest workout of a programme, in minutes. */
function minuteRange(p: Program): [number, number] {
  const secs = Array.from({ length: p.days }, (_, i) => dayPlan(p, i + 1)).flatMap((d) => (d.kind === 'workout' ? [workoutSec(d.workout)] : []));
  return [Math.round(Math.min(...secs) / 60), Math.round(Math.max(...secs) / 60)];
}

/**
 * An Aletsiz Fitness category: the active programme (today's workout and the day grid), the three
 * programmes to choose from, what research says, and every move with its moving figure.
 */
export default function CategoryScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { category } = useLocalSearchParams<{ category: string }>();
  const c = getCategory(category ?? '');
  const progress = useBodyweightStore((s) => (c ? s.active[c.id] : undefined));
  const [open, setOpen] = useState<string | null>(null);
  const [switchTo, setSwitchTo] = useState<Program | null>(null);
  const [stopOpen, setStopOpen] = useState(false);
  if (!c || !c.ready || !c.text) {
    return (
      <Screen>
        <Header />
        <AppText>{tr('bodyweight.notFound')}</AppText>
      </Screen>
    );
  }
  const active = progress ? getProgram(c, progress.programId) : undefined;
  const start = (p: Program) => {
    if (progress && progress.programId !== p.id) return setSwitchTo(p);
    if (!progress) useBodyweightStore.getState().start(c.id, p.id, toDateKey());
  };

  return (
    <Screen>
      <Header title={c.text.title} />
      <AppText muted>{c.text.intro}</AppText>

      {c.routine ? <Routine c={c} workout={c.routine} /> : null}

      {active && progress ? <ActiveProgram c={c} program={active} progress={progress} onStop={() => setStopOpen(true)} /> : null}

      <View style={{ gap: t.space.sm }}>
        {PROGRAM_ORDER.map((id) => getProgram(c, id))
          .filter((p): p is Program => Boolean(p))
          .map((p) => {
            const [min, max] = minuteRange(p);
            const isActive = progress?.programId === p.id;
            return (
              <Card key={p.id} style={{ padding: t.space.gutter, gap: t.space.sm, borderWidth: isActive ? t.border.medium : t.border.thin, borderColor: isActive ? t.tokens.primary : t.tokens.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
                  <AppText variant="title3" style={{ flex: 1 }}>
                    {tr('bodyweight.programTitle', { title: tr(`bodyweight.programs.${p.id}.title`), days: p.days })}
                  </AppText>
                  {isActive ? <Badge variant="success" label={tr('bodyweight.activeBadge')} /> : null}
                </View>
                <AppText variant="callout">{tr(`bodyweight.programs.${p.id}.desc`)}</AppText>
                <AppText variant="footnote" muted>
                  {min === max ? tr('bodyweight.programMetaOne', { days: p.days, perWeek: p.trainDays.length, min }) : tr('bodyweight.programMeta', { days: p.days, perWeek: p.trainDays.length, min, max })}
                </AppText>
                {!isActive ? <Button label={tr('bodyweight.start')} variant="secondary" icon="play" onPress={() => start(p)} testID={`bw-start-${p.id}`} /> : null}
              </Card>
            );
          })}
      </View>

      <Card style={{ padding: t.space.gutter, gap: t.space.sm }}>
        <AppText variant="bodyStrong">{tr('bodyweight.scienceTitle')}</AppText>
        {c.text.science.map((line, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-start' }}>
            <Icon name="flask" size="sm" color={t.tokens.primary} />
            <AppText variant="callout" style={{ flex: 1 }}>
              {line}
            </AppText>
          </View>
        ))}
      </Card>

      <View style={{ gap: 2 }}>
        <AppText variant="title2" accessibilityRole="header">
          {tr('bodyweight.movesTitle')}
        </AppText>
        <AppText variant="footnote" muted>
          {tr('bodyweight.movesHint')}
        </AppText>
      </View>
      {c.exercises.map((ex) => (
        <MoveCard key={ex.id} ex={ex} move={c.moves[ex.id]} open={open === ex.id} onToggle={() => setOpen(open === ex.id ? null : ex.id)} />
      ))}
      <AppText variant="small" muted>
        {tr('bodyweight.safety')}
      </AppText>

      <Dialog
        visible={switchTo !== null}
        title={tr('bodyweight.switchTitle')}
        message={switchTo && progress ? tr('bodyweight.switchBody', { current: tr(`bodyweight.programs.${progress.programId}.title`), next: tr(`bodyweight.programs.${switchTo.id}.title`) }) : ''}
        onDismiss={() => setSwitchTo(null)}
        actions={[
          { label: tr('bodyweight.switchOk'), variant: 'primary', onPress: () => (switchTo && useBodyweightStore.getState().start(c.id, switchTo.id, toDateKey()), setSwitchTo(null)) },
          { label: tr('common.cancel'), onPress: () => setSwitchTo(null) },
        ]}
      />
      <Dialog
        visible={stopOpen}
        title={tr('bodyweight.stopTitle')}
        message={tr('bodyweight.stopBody')}
        onDismiss={() => setStopOpen(false)}
        actions={[
          { label: tr('bodyweight.stop'), variant: 'danger', onPress: () => (useBodyweightStore.getState().stop(c.id), setStopOpen(false)) },
          { label: tr('common.cancel'), onPress: () => setStopOpen(false) },
        ]}
      />
    </Screen>
  );
}

/** A single routine with no programme (Isınma): its moves and a start button. */
function Routine({ c, workout }: { c: Category; workout: Workout }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Card style={{ padding: t.space.gutter, gap: t.space.md, borderWidth: t.border.medium, borderColor: t.tokens.primary }}>
      <View style={{ gap: 2 }}>
        <AppText variant="title3">{tr('bodyweight.routineTitle')}</AppText>
        <AppText variant="footnote" muted>
          {tr('bodyweight.todayMeta', { count: workout.moves.length, rounds: workout.rounds, work: workout.workSec, rest: workout.restSec, min: Math.round(workoutSec(workout) / 60) })}
        </AppText>
        <AppText variant="callout">{tr('bodyweight.routineBody')}</AppText>
      </View>
      <View style={{ gap: t.space.sm }}>
        {workout.moves.map((id, i) => {
          const ex = getExercise(c, id);
          if (!ex) return null;
          return <MoveCard key={`${id}-${i}`} n={i + 1} ex={ex} move={c.moves[id]} meta={moveMeta(tr, c.moves[id], workout.workSec)} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />;
        })}
      </View>
      <Button label={tr('bodyweight.startWarmup')} size="lg" variant="accent" icon="play" onPress={() => router.push({ pathname: '/bodyweight/workout', params: { category: c.id, routine: '1' } })} testID="bw-start-routine" />
    </Card>
  );
}

/** Today's workout (or why not), the progress and the day grid of the running programme. */
function ActiveProgram({ c, program, progress, onStop }: { c: Category; program: Program; progress: ProgramProgress; onStop: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState<number | null>(null);
  const today = toDateKey();
  const now = currentDay(program, progress, today);
  const plan = dayPlan(program, now.day);
  const done = programDone(program, progress);
  const workout = plan.kind === 'workout' ? plan.workout : undefined;
  return (
    <Card style={{ padding: t.space.gutter, gap: t.space.md, borderWidth: t.border.medium, borderColor: t.tokens.primary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
        <AppText variant="caption" muted style={{ flex: 1 }}>
          {tr(`bodyweight.programs.${program.id}.title`)} · {tr('bodyweight.progressMeta', { done: done.done, total: done.total })}
        </AppText>
        {plan.kind === 'workout' && plan.light ? <Badge variant="outline" label={tr('bodyweight.light')} /> : null}
      </View>
      {now.finished ? (
        <AppText variant="title3">{tr('bodyweight.finished')}</AppText>
      ) : workout && now.ready ? (
        <>
          <AppText variant="title3">{tr('bodyweight.todayTitle', { day: now.day, id: workout.id })}</AppText>
          <AppText variant="footnote" muted>
            {tr('bodyweight.todayMeta', { count: workout.moves.length, rounds: workout.rounds, work: workout.workSec, rest: workout.restSec, min: Math.round(workoutSec(workout) / 60) })}
          </AppText>
          <View style={{ gap: t.space.sm }}>
            {workout.moves.map((id, i) => {
              const ex = getExercise(c, id);
              if (!ex) return null;
              return <MoveCard key={`${id}-${i}`} n={i + 1} ex={ex} move={c.moves[id]} meta={moveMeta(tr, c.moves[id], workout.workSec)} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />;
            })}
          </View>
          <Button label={tr('bodyweight.startWorkout')} size="lg" variant="accent" icon="play" onPress={() => router.push({ pathname: '/bodyweight/workout', params: { category: c.id, day: String(now.day) } })} testID="bw-start-workout" />
        </>
      ) : (
        <AppText variant="callout">{plan.kind === 'rest' ? tr('bodyweight.restNext') : tr('bodyweight.doneToday')}</AppText>
      )}
      <DayGrid program={program} progress={progress} current={now.finished ? 0 : now.day} />
      <Button label={tr('bodyweight.stop')} variant="ghost" onPress={onStop} />
    </Card>
  );
}

/** Weeks of 7 small cells: done (check), next (ring), rest days faint. */
function DayGrid({ program, progress, current }: { program: Program; progress: ProgramProgress; current: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const weeks = Math.ceil(program.days / 7);
  return (
    <View style={{ gap: 6 }} accessibilityLabel={tr('bodyweight.progressTitle')}>
      {Array.from({ length: weeks }, (_, w) => (
        <View key={w} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText variant="caption" muted style={{ width: 54 }}>
            {tr('bodyweight.week', { n: w + 1 })}
          </AppText>
          {Array.from({ length: 7 }, (_, i) => {
            const day = w * 7 + i + 1;
            if (day > program.days) return <View key={i} style={{ flex: 1 }} />;
            const rest = dayPlan(program, day).kind === 'rest';
            const isDone = Boolean(progress.done[day]);
            const isNext = day === current;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 22,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDone ? t.tokens.primary : rest ? 'transparent' : t.tokens.muted,
                  borderWidth: isNext ? t.border.medium : rest ? t.border.thin : 0,
                  borderColor: isNext ? t.tokens.primary : t.tokens.border,
                  borderStyle: rest && !isNext ? 'dashed' : 'solid',
                }}
              >
                {isDone ? <Icon name="check" size={12} color={t.tokens.primaryForeground} /> : <AppText variant="caption" muted style={{ fontSize: 10 }}>{day}</AppText>}
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: t.space.md, flexWrap: 'wrap' }}>
        <AppText variant="caption" muted>
          ■ {tr('bodyweight.legendDone')}
        </AppText>
        <AppText variant="caption" muted>
          ▢ {tr('bodyweight.legendToday')}
        </AppText>
        <AppText variant="caption" muted>
          ┄ {tr('bodyweight.legendRest')}
        </AppText>
      </View>
    </View>
  );
}
