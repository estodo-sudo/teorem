import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, ProgressRing, Screen, useTheme } from '@/components';
import { CampusHero, HeroStat, GroupCard, InfoToggle, SectionTitle, tint } from '@/features/campus/shared/ui';
import { useClock } from '@/lib/useNow';
import { useCampusStore } from '@/stores/campusStore';

import { BODY } from './content';
import { bodyPhase, doneToday, measureDue, measureTrend, programGrid, programProgress, programWeek, routineDays, routineMinutes, sortedMeasures, streakDays, weekRoutineDays, type BodyId } from './logic';
import { TestResult } from './SetupScreen';
import { BodyChecklist, ExerciseRow, fmtMeasure, MeasureBars, MeasureDialog, ProgramGrid } from './ui';

export function BodyHomeScreen({ id }: { id: BodyId }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const c = BODY[id];
  const s = useCampusStore((x) => x[id]);
  const { now } = useClock(60_000);
  const phase = bodyPhase(s);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [openFact, setOpenFact] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  useEffect(() => {
    if (phase === 'setup') router.replace(`/campus/${id}/setup`);
  }, [phase, id]);

  if (phase === 'setup') {
    return (
      <Screen>
        <Header title={c.title} />
      </Screen>
    );
  }

  const onHero = t.colors.primaryText;
  const week = programWeek(s, now);
  const weekDays = weekRoutineDays(s, now);
  const today = doneToday(s, now);
  const finished = week > c.weeks;
  const measures = sortedMeasures(s);
  const last = measures[measures.length - 1];
  const trend = measureTrend(s, c.measure.better);
  const due = measureDue(s, now);
  const minutes = routineMinutes(c.exercises);
  const checkDone = c.checklist.filter((x) => s.checkDoneIds.includes(x.id)).length;

  return (
    <Screen>
      <Header title={c.title} />

      {s.redFlagIds.length ? (
        <Card
          style={{
            gap: t.space.xs,
            borderWidth: 2,
            borderColor: t.colors.danger,
            backgroundColor: tint(t.colors.danger, '10'),
          }}
        >
          <AppText weight="800" color={t.colors.danger}>
            {c.redFlags.title}
          </AppText>
          <AppText variant="small">{tr('body.home.flagsReminder')}</AppText>
        </Card>
      ) : null}

      <CampusHero color={t.colors.primary}>
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: t.space.xs,
            borderRadius: t.radius.pill,
            backgroundColor: t.veil.mid,
          }}
        >
          <AppText variant="tiny" weight="800" color={onHero} style={{ letterSpacing: 1 }}>
            {tr(`body.home.heroLabel.${id}`)}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing size={112} stroke={11} value={Math.min(1, weekDays / c.weeklyTarget)} color={t.colors.success} trackColor={t.veil.strong}>
            <AppText variant="h3" weight="800" color={onHero}>
              {tr('body.home.ring', {
                done: Math.min(weekDays, c.weeklyTarget),
                goal: c.weeklyTarget,
              })}
            </AppText>
          </ProgressRing>
          <View style={{ flex: 1, gap: t.space.xs }}>
            <AppText variant="tiny" weight="800" color={onHero} style={{ opacity: 0.85 }}>
              {tr('body.home.programLabel')}
            </AppText>
            <AppText variant="display" color={onHero} style={{ lineHeight: 50 }}>
              {finished ? tr('body.home.finishedShort') : tr('body.home.week', { n: week, total: c.weeks })}
            </AppText>
            <AppText variant="small" color={onHero} style={{ opacity: 0.9 }}>
              {tr('body.home.weekHint', { goal: c.weeklyTarget })}
            </AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: t.space.sm }}>
          <HeroStat label={tr('body.home.streak')} value={tr('body.home.days', { count: streakDays(s, now) })} color={onHero} />
          <HeroStat label={tr('body.home.total')} value={String(routineDays(s).size)} color={onHero} />
          <HeroStat label={c.measure.title} value={last ? fmtMeasure(last.value, c.measure.unit) : '—'} color={onHero} />
        </View>
        <InfoToggle
          light
          title={tr('body.home.statsInfo')}
          text={tr('body.home.statsInfoText', {
            goal: c.weeklyTarget,
            weeks: c.weeks,
          })}
        />
      </CampusHero>

      {finished ? (
        <Card
          style={{
            gap: 6,
            borderColor: t.colors.success,
            borderWidth: 2,
            backgroundColor: tint(t.colors.success, '14'),
          }}
        >
          <AppText variant="h3" color={t.colors.success}>
            {tr('body.home.finishedTitle', { weeks: c.weeks })}
          </AppText>
          <AppText variant="small">{tr('body.home.finishedBody')}</AppText>
        </Card>
      ) : null}

      <View style={{ gap: t.space.sm }}>
        {today ? (
          <Card
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.space.md,
              borderColor: t.colors.success,
              borderWidth: 2,
              backgroundColor: tint(t.colors.success, '14'),
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: t.colors.success,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" color={t.tokens.primaryForeground} size={24} strokeWidth={3} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3" color={t.colors.success}>
                {tr('body.home.todayDone')}
              </AppText>
              <AppText variant="small" muted>
                {tr('body.home.todayDoneHint')}
              </AppText>
            </View>
          </Card>
        ) : null}
        <Button label={today ? tr('body.home.again') : tr('body.home.startRoutine', { minutes })} icon="play" variant={today ? 'secondary' : 'accent'} size="lg" onPress={() => router.push(`/campus/${id}/routine`)} />
      </View>

      <SectionTitle icon="calendar" title={tr('body.home.calendarTitle')} hint={tr('body.home.calendarHint', { goal: c.weeklyTarget })} />
      <Card style={{ gap: 10 }}>
        <ProgramGrid grid={programGrid(s, c.weeks, now)} currentWeek={week} />
        <AppText variant="tiny" muted>
          {tr('body.home.programProgress', {
            pct: Math.round(programProgress(s, c.weeks, c.weeklyTarget) * 100),
          })}
        </AppText>
      </Card>

      <SectionTitle
        icon={id === 'neck' ? 'ruler' : 'timer'}
        title={tr('body.home.measureTitle')}
        hint={c.measure.title}
        right={
          due ? (
            <View
              style={{
                paddingHorizontal: t.space.sm,
                paddingVertical: 3,
                borderRadius: t.radius.pill,
                backgroundColor: tint(t.colors.warning, '33'),
              }}
            >
              <AppText variant="tiny" weight="800">
                {tr('body.home.measureDue')}
              </AppText>
            </View>
          ) : undefined
        }
      />
      <Card style={{ gap: t.space.md }}>
        {measures.length ? <MeasureBars measures={measures} unit={c.measure.unit} /> : <AppText muted>{tr('body.home.measureEmpty')}</AppText>}
        {trend ? (
          <View
            style={{
              padding: 10,
              borderRadius: t.radius.md,
              backgroundColor: tint(trend.improved ? t.colors.success : t.colors.primary, '14'),
            }}
          >
            <AppText variant="small" weight="700">
              {trend.improved
                ? tr(`body.home.trendBetter.${id}`, {
                    delta: fmtMeasure(Math.abs(trend.delta), c.measure.unit),
                  })
                : trend.delta === 0
                  ? tr('body.home.trendSame')
                  : tr('body.home.trendWorse')}
            </AppText>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: t.space.sm }}>
          <Button label={tr('body.home.measureAdd')} icon="plus" variant={due ? 'primary' : 'secondary'} onPress={() => setMeasureOpen(true)} style={{ flex: 1 }} />
          {measures.length ? <Button label={tr('body.home.measureUndo')} variant="ghost" onPress={() => useCampusStore.getState().undoBodyMeasure(id)} /> : null}
        </View>
        <InfoToggle title={tr('body.home.measureInfo')} text={c.measure.hint} />
      </Card>

      <SectionTitle
        icon="dumbbell"
        title={tr('body.home.exercisesTitle')}
        hint={tr('body.home.exercisesHint', {
          count: c.exercises.length,
          minutes,
        })}
      />
      <View style={{ gap: t.space.sm }}>
        {c.exercises.map((e, i) => (
          <ExerciseRow key={e.id} ex={e} n={i + 1} />
        ))}
      </View>

      <SectionTitle
        icon={id === 'neck' ? 'laptop' : 'footprints'}
        title={tr(`body.setup.checkTitle.${id}`)}
        hint={tr('body.home.checkCount', {
          done: checkDone,
          total: c.checklist.length,
        })}
      />
      <BodyChecklist items={c.checklist} doneIds={s.checkDoneIds} onToggle={(v) => useCampusStore.getState().toggleBodyCheck(id, v)} />

      <SectionTitle icon="flask" title={tr('body.home.testTitle')} />
      <TestResult id={id} answers={s.answers} />

      <SectionTitle icon="bulb" title={tr('body.home.factsTitle')} />
      <View style={{ gap: t.space.sm }}>
        {c.facts.map((f) => {
          const open = openFact === f.id;
          return (
            <Card key={f.id} padded={false} style={{ overflow: 'hidden' }}>
              <Pressable
                onPress={() => setOpenFact(open ? null : f.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 14,
                  minHeight: t.touch,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: t.space.sm,
                    paddingVertical: 3,
                    borderRadius: t.radius.pill,
                    backgroundColor: tint(t.colors.danger, '26'),
                  }}
                >
                  <AppText variant="tiny" weight="800" color={t.colors.danger}>
                    {tr('body.home.myth')}
                  </AppText>
                </View>
                <AppText weight="700" style={{ flex: 1 }}>
                  {f.myth}
                </AppText>
                <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
                  <Icon name="chevron" color={t.colors.textMuted} size={18} />
                </View>
              </Pressable>
              {open ? (
                <View
                  style={{
                    marginHorizontal: 14,
                    marginBottom: 14,
                    padding: t.space.md,
                    gap: 6,
                    borderRadius: t.radius.md,
                    backgroundColor: tint(t.colors.success, '14'),
                    borderLeftWidth: 3,
                    borderLeftColor: t.colors.success,
                  }}
                >
                  <AppText variant="tiny" weight="800" color={t.colors.success}>
                    {tr('body.home.fact')}
                  </AppText>
                  <AppText variant="small">{f.fact}</AppText>
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      <SectionTitle icon="book" title={tr('body.home.guideTitle')} hint={tr('body.home.guideBody', { count: c.steps.length })} />
      <Button label={tr('body.home.guideOpen')} icon="book" variant="secondary" onPress={() => router.push(`/campus/${id}/guide`)} />

      <SectionTitle icon="handshake" title={tr('body.home.helpTitle')} />
      <GroupCard>
        {c.help.map((h) => (
          <View key={h.id} style={{ gap: t.space.xs }}>
            <AppText weight="800">{h.title}</AppText>
            <AppText variant="small" muted>
              {h.text}
            </AppText>
          </View>
        ))}
      </GroupCard>

      <Button label={tr('body.home.reset')} variant="ghost" icon="trash" onPress={() => setResetStep(1)} style={{ marginTop: 6 }} />

      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="700" muted>
          {tr('body.home.sources')}
        </AppText>
        {c.sources.map((src) => (
          <Pressable key={src.url} onPress={() => void Linking.openURL(src.url)} accessibilityRole="link">
            <AppText variant="small" color={t.colors.primary}>
              {src.title}
            </AppText>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setDisclaimerOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: disclaimerOpen }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space.xs,
            alignSelf: 'flex-start',
            minHeight: t.touch,
            marginTop: t.space.xs,
          }}
        >
          <AppText variant="tiny" weight="700" muted>
            {tr('body.home.disclaimerToggle')}
          </AppText>
          <View
            style={{
              transform: [{ rotate: disclaimerOpen ? '90deg' : '0deg' }],
            }}
          >
            <Icon name="chevron" color={t.colors.textMuted} size={14} />
          </View>
        </Pressable>
        {disclaimerOpen ? (
          <AppText variant="tiny" muted>
            {tr('body.home.disclaimer')}
          </AppText>
        ) : null}
      </View>

      {measureOpen ? <MeasureDialog id={id} content={c} visible onClose={() => setMeasureOpen(false)} initial={last?.value ?? (c.measure.better === 'lower' ? 5 : 0)} /> : null}

      <Dialog
        visible={resetStep > 0}
        title={resetStep === 1 ? tr('body.reset.title') : tr('body.reset.confirmTitle')}
        message={resetStep === 1 ? tr('body.reset.body') : tr('body.reset.confirmBody')}
        onDismiss={() => setResetStep(0)}
        actions={[
          {
            label: resetStep === 1 ? tr('common.continue') : tr('body.reset.confirm'),
            variant: 'danger',
            onPress: () => {
              if (resetStep === 1) setResetStep(2);
              else {
                setResetStep(0);
                useCampusStore.getState().resetBody(id);
              }
            },
          },
          {
            label: tr('common.cancel'),
            variant: 'ghost',
            onPress: () => setResetStep(0),
          },
        ]}
      />
    </Screen>
  );
}
