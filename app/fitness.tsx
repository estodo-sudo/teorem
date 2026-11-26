import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, ProgressBar, Screen, useTheme, type IconName } from '@/components';
import { Button, Card } from '@/components/ui';
import { appImage } from '@/content/images';
import { PROGRAM_WEEKS, programState, SESSIONS_PER_WEEK, PROGRAM_SESSIONS, weekStatus, type ProgramWeekStatus } from '@/features/fitness/program';
import { routineDurationSec, routineRounds, standardRoutine } from '@/features/fitness/routines';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { PhotoBackground } from '@/features/today/PhotoCard';
import { DayDot, dayLabels, useWeekCardStyle } from '@/features/today/WeekSections';
import { toDateKey } from '@/lib/date';
import { goBack } from '@/lib/nav';
import { useHistoryStore } from '@/stores/historyStore';

/** Bar area height of the 7-week chart. */
const CHART_H = 96;

/**
 * Kasık Fitness programme (user request 2026-11-23): opened from the Günüm card, it looks like a real
 * programme, like the Kegel plan — the week on a photo, this week's seven days, today's session, a
 * 7-week chart (sessions per week against the goal of three) and the seven weeks with their focus.
 * The screen itself is free to look at; starting the session is the premium part.
 */
export default function FitnessProgram() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const logs = useHistoryStore((s) => s.fitnessLogs);
  const access = useAccess()('fitness');
  // Premium only (2026-11-26): a deep link without premium goes to the "fırsat" paywall.
  useEffect(() => {
    if (!access) router.replace({ pathname: '/paywall', params: { source: 'fitness', offer: '1' } });
  }, [access]);
  const today = toDateKey();
  const s = programState(logs, today);
  const routine = standardRoutine();
  const cover = appImage('today/fitness');
  const labels = dayLabels(i18n.language);
  const weekFrame = useWeekCardStyle();
  const min = Math.round(routineDurationSec(routine) / 60);
  const start = () => openGated('fitness', { pathname: '/fitness/[routineId]', params: { routineId: routine.id } });
  const note = s.finished ? tr('fitnessProgram.finished') : s.over ? tr('fitnessProgram.over') : !s.started ? tr('fitnessProgram.notStarted') : null;

  return (
    <Screen>
      <Header title={tr('fitnessProgram.title')} onBack={() => goBack('/')} />

      {/* The week on a photo, with the programme progress. */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {cover ? <PhotoBackground image={cover} id="programVeil" /> : null}
        <View style={{ padding: t.space.gutter, gap: t.space.sm }}>
          <AppText variant="caption" color={cover ? t.focus.icon : undefined} muted={!cover}>
            {tr('fitnessProgram.kicker')} · {tr('fitnessProgram.weekOf', { n: s.week, total: PROGRAM_WEEKS })}
          </AppText>
          <AppText variant="title1" accessibilityRole="header" color={cover ? t.focus.text : undefined}>
            {tr(`fitnessProgram.weeks.${s.week}.title`)}
          </AppText>
          <AppText variant="callout" color={cover ? t.focus.icon : undefined} muted={!cover}>
            {tr(`fitnessProgram.weeks.${s.week}.text`)}
          </AppText>
          {cover ? <View style={{ height: 96 }} /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="footnote" weight="600" color={cover ? t.focus.text : undefined}>
              {tr('fitnessProgram.sessions', { done: s.total, total: PROGRAM_SESSIONS })}
            </AppText>
            <AppText variant="footnote" tabular color={cover ? t.focus.icon : undefined} muted={!cover}>
              %{Math.round((s.total / PROGRAM_SESSIONS) * 100)}
            </AppText>
          </View>
          <ProgressBar value={s.total / PROGRAM_SESSIONS} accessibilityLabel={tr('fitnessProgram.progressA11y', { done: s.total, total: PROGRAM_SESSIONS })} />
        </View>
      </Card>

      {note ? (
        <View style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-start' }}>
          <Icon name={s.finished ? 'trophy' : 'info'} size="sm" color={t.tokens.primary} />
          <AppText variant="footnote" style={{ flex: 1 }}>
            {note}
          </AppText>
        </View>
      ) : null}

      {/* This week, Monday → Sunday, like Günüm's "Bu hafta". */}
      <View style={{ gap: t.space.md }}>
        <AppText variant="title2" accessibilityRole="header">
          {tr('fitnessProgram.thisWeek')}
        </AppText>
        <Card style={[{ paddingVertical: t.space.lg, paddingHorizontal: t.space.sm, gap: t.space.md }, weekFrame]}>
          <View style={{ flexDirection: 'row' }} accessibilityRole="list">
            {s.thisWeek.map((d) => (
              <DayDot key={d.key} day={d} label={labels[d.index]!} />
            ))}
          </View>
          <AppText variant="footnote" muted center>
            {tr('fitnessProgram.thisWeekCount', { done: s.thisWeekCount, target: SESSIONS_PER_WEEK })}
          </AppText>
        </Card>
      </View>

      {/* Today's session. */}
      <View style={{ gap: t.space.md }}>
        <AppText variant="title2" accessibilityRole="header">
          {tr('fitnessProgram.today')}
        </AppText>
        <Card style={{ padding: t.space.lg, gap: t.space.md }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
            <Chip icon="layers" label={tr('fitness.chipMoves', { count: routine.steps.length })} />
            <Chip icon="clock" label={tr('fitness.chipMin', { min })} />
            <Chip icon="rotate" label={tr('fitness.chipRounds', { count: routineRounds(routine).length })} />
          </View>
          <AppText variant="footnote" muted>
            {s.todayDone ? tr('fitnessProgram.todayDone') : tr('fitnessProgram.todayTodo')}
          </AppText>
          <Button label={s.todayDone ? tr('fitnessProgram.again') : tr('fitnessProgram.start')} variant={s.todayDone ? 'secondary' : 'primary'} icon={access ? 'play' : 'lock'} size="lg" fullWidth onPress={start} testID="fitness-program-start" />
        </Card>
      </View>

      {/* 7-week chart: sessions per week against the goal. */}
      <View style={{ gap: t.space.md }}>
        <View style={{ gap: 2 }}>
          <AppText variant="title2" accessibilityRole="header">
            {tr('fitnessProgram.chart')}
          </AppText>
          <AppText variant="footnote" muted>
            {tr('fitnessProgram.chartHint')}
          </AppText>
        </View>
        <Card style={{ padding: t.space.lg, gap: t.space.sm }}>
          <View style={{ height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', gap: t.space.sm }}>
            {/* Goal line at three sessions. */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: t.tokens.border }} />
            {s.perWeek.map((n, i) => {
              const status = weekStatus(s, i);
              const v = Math.min(n, SESSIONS_PER_WEEK) / SESSIONS_PER_WEEK;
              return (
                <View key={i} style={{ flex: 1, height: CHART_H, justifyContent: 'flex-end' }} accessible accessibilityLabel={tr('fitnessProgram.chartA11y', { n: i + 1, done: n, target: SESSIONS_PER_WEEK })}>
                  <View style={{ height: Math.max(6, v * CHART_H), borderRadius: t.radius.sm, backgroundColor: status === 'done' ? t.tokens.primary : status === 'current' ? t.tokens.primarySoft : t.tokens.muted, borderWidth: status === 'current' ? 1.5 : 0, borderColor: t.tokens.primary }} />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: t.space.sm }}>
            {s.perWeek.map((_, i) => (
              <AppText key={i} variant="caption" tabular center muted={i !== s.week - 1} weight={i === s.week - 1 ? '700' : '500'} color={i === s.week - 1 ? t.tokens.primary : undefined} style={{ flex: 1 }}>
                {i + 1}
              </AppText>
            ))}
          </View>
        </Card>
      </View>

      {/* The seven weeks and their focus. */}
      <View style={{ gap: t.space.md }}>
        <AppText variant="title2" accessibilityRole="header">
          {tr('fitnessProgram.weeksTitle')}
        </AppText>
        <Card style={{ padding: 0 }}>
          {s.perWeek.map((n, i) => (
            <WeekRow key={i} index={i} status={weekStatus(s, i)} done={Math.min(n, SESSIONS_PER_WEEK)} first={i === 0} />
          ))}
        </Card>
      </View>

      <AppText variant="small" muted>
        {tr('fitness.safety')}
      </AppText>
    </Screen>
  );
}

function Chip({ icon, label }: { icon: IconName; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.md, paddingVertical: t.space.xs, borderRadius: t.radius.pill, backgroundColor: t.tokens.muted }}>
      <Icon name={icon} size="sm" color={t.tokens.foreground} />
      <AppText variant="footnote" weight="600">
        {label}
      </AppText>
    </View>
  );
}

function WeekRow({ index, status, done, first }: { index: number; status: ProgramWeekStatus; done: number; first: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const k = t.tokens;
  const n = index + 1;
  const current = status === 'current';
  return (
    <View
      accessible
      accessibilityLabel={`${tr('fitnessProgram.weekOf', { n, total: PROGRAM_WEEKS })}, ${tr(`fitnessProgram.weeks.${n}.title`)}, ${tr(`fitnessProgram.status.${status}`)}, ${done}/${SESSIONS_PER_WEEK}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingHorizontal: t.space.lg, paddingVertical: t.space.md, borderTopWidth: first ? 0 : t.border.thin, borderTopColor: k.border, backgroundColor: current ? k.primarySoft : 'transparent' }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: status === 'done' ? k.primary : current ? k.card : k.muted, borderWidth: current ? 2 : 0, borderColor: k.primary }}>
        {status === 'done' ? (
          <Icon name="check" size="sm" color={k.primaryForeground} />
        ) : (
          <AppText variant="footnote" tabular weight="600" color={current ? k.primary : k.mutedForeground}>
            {n}
          </AppText>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong" color={status === 'upcoming' ? k.mutedForeground : undefined}>
          {tr(`fitnessProgram.weeks.${n}.title`)}
        </AppText>
        <AppText variant="footnote" muted numberOfLines={current ? undefined : 1}>
          {current ? tr(`fitnessProgram.weeks.${n}.text`) : tr(`fitnessProgram.status.${status}`)}
        </AppText>
      </View>
      <AppText variant="footnote" tabular muted>
        {done}/{SESSIONS_PER_WEEK}
      </AppText>
    </View>
  );
}
