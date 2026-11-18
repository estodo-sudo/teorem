import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, ProgressRing, Screen, useTheme } from '@/components';
import { MC } from '@/features/campus/masturbation/content';
import {
  calendar,
  CHECK_QUESTION_COUNT,
  checkBand,
  checkScore,
  listProgress,
  mcPhase,
  quitDays,
  quitElapsedMs,
  quitGoalReached,
  quitProgress,
  thisWeek,
  urgeStats,
  weekHistory,
  weeksWithinStreak,
} from '@/features/campus/masturbation/logic';
import { CalendarGrid, EnvChecklist, HarmsCard, LapseDialog, UseDialog, WeekBars } from '@/features/campus/masturbation/ui';
import { CampusHero, GroupCard, HeroStat, SectionTitle, tint } from '@/features/campus/shared/ui';
import { useClock } from '@/lib/useNow';
import { useCampusStore } from '@/stores/campusStore';

export default function McCampusHome() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const s = useCampusStore((x) => x.masturbation);
  const { now, refresh } = useClock(30_000);
  const phase = mcPhase(s);
  const [lapseOpen, setLapseOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [openFact, setOpenFact] = useState<string | null>(null);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  useEffect(() => {
    if (phase === 'setup') router.replace('/campus/masturbation/setup');
  }, [phase]);

  if (phase === 'setup') {
    return (
      <Screen>
        <Header title={MC.title} />
      </Screen>
    );
  }

  const control = s.mode === 'control';
  const onHero = t.colors.primaryText;
  const stats = urgeStats(s.urges);
  const env = listProgress(MC.env.map((e) => e.id), s.envDoneIds);
  const reasons = MC.reasons.filter((r) => s.reasonIds.includes(r.id));
  const triggers = MC.triggers.filter((x) => s.triggerIds.includes(x.id));
  const topTrigger = stats.topTriggerId ? MC.triggers.find((x) => x.id === stats.topTriggerId) : undefined;
  const topAction = stats.topActionId ? MC.urge.actions.find((x) => x.id === stats.topActionId) : undefined;
  const band = s.checkAnswers ? checkBand(checkScore(s.checkAnswers), MC.check.bands) : undefined;
  const help = MC.help[0];

  // Control path
  const week = thisWeek(s, now);
  // Quit path
  const elapsed = quitElapsedMs(s, now);
  const days = quitDays(s, now);
  const done = quitGoalReached(s, now);

  return (
    <Screen>
      <Header title={MC.title} />

      <CampusHero color={t.colors.primary}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' }}>
          <AppText variant="tiny" weight="800" color={onHero} style={{ letterSpacing: 1 }}>
            {MC.paths[s.mode].emoji} {control ? tr('mcampus.home.controlLabel') : tr('mcampus.home.quitLabel')}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing
            size={112}
            stroke={11}
            value={control ? Math.min(1, week.limit ? week.used / week.limit : 0) : quitProgress(s, now)}
            color={control && week.over ? t.colors.danger : t.colors.success}
            trackColor="rgba(255,255,255,0.18)"
          >
            <AppText variant="h2" weight="800" color={onHero}>
              {control ? tr('mcampus.home.weekValue', { used: week.used, limit: week.limit }) : tr('mcampus.home.quitRing', { done: Math.min(days, s.goalDays), goal: s.goalDays })}
            </AppText>
          </ProgressRing>
          <View style={{ flex: 1, gap: 4 }}>
            {control ? (
              <>
                <AppText variant="h2" weight="800" color={onHero}>
                  {week.over ? tr('mcampus.home.weekOver') : week.left > 0 ? tr('mcampus.home.weekLeft', { count: week.left }) : tr('mcampus.home.weekNone')}
                </AppText>
                <AppText variant="small" color={onHero} style={{ opacity: 0.85 }}>
                  {tr('mcampus.home.weekResets')}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="display" color={onHero} style={{ lineHeight: 50 }}>
                  {tr('mcampus.home.days', { count: days })}
                </AppText>
                <AppText weight="700" color={onHero} style={{ opacity: 0.9 }}>
                  {tr('smoking.home.hoursMinutes', { hours: Math.floor((elapsed % 86_400_000) / 3_600_000), minutes: Math.floor((elapsed % 3_600_000) / 60_000) })}
                </AppText>
                <AppText variant="small" color={onHero} style={{ opacity: 0.85 }}>
                  {tr('mcampus.home.goalOf', { goal: s.goalDays })}
                </AppText>
              </>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {control ? (
            <>
              <HeroStat label={tr('mcampus.home.limitLabel')} value={String(week.limit)} color={onHero} />
              <HeroStat label={tr('mcampus.home.weeksWithin')} value={String(weeksWithinStreak(s, now))} color={onHero} />
            </>
          ) : (
            <>
              <HeroStat label={tr('mcampus.home.daysLeft')} value={String(Math.max(0, s.goalDays - days))} color={onHero} />
              <HeroStat label={tr('mcampus.home.attempt')} value={String(s.attempt)} color={onHero} />
            </>
          )}
          <HeroStat label={tr('mcampus.home.urgesBeaten')} value={String(stats.passed)} color={onHero} />
        </View>
      </CampusHero>

      {done ? (
        <Card style={{ gap: 10, borderColor: t.colors.success, borderWidth: 2, backgroundColor: tint(t.colors.success, '14') }}>
          <AppText variant="h3" color={t.colors.success}>
            🎉 {tr('mcampus.home.quitDoneTitle', { goal: s.goalDays })}
          </AppText>
          <AppText variant="small">{tr('mcampus.home.quitDoneBody')}</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label={tr('mcampus.home.quitRestart')} variant="primary" onPress={() => useCampusStore.getState().restartQuit()} style={{ flex: 1 }} />
            <Button label={tr('mcampus.home.switchControl')} variant="secondary" onPress={() => router.push({ pathname: '/campus/masturbation/setup', params: { edit: '1' } })} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button label={tr('mcampus.home.sos')} icon="wind" variant="accent" size="lg" accessibilityHint={tr('mcampus.home.sosHint')} onPress={() => router.push('/campus/masturbation/urge')} />
        {control ? (
          <Button label={tr('mcampus.home.useButton')} icon="plus" variant="secondary" onPress={() => setUseOpen(true)} style={{ borderWidth: 1.5, borderColor: t.colors.warning }} />
        ) : (
          <Button label={tr('mcampus.home.lapseButton')} icon="flame" variant="secondary" onPress={() => setLapseOpen(true)} style={{ borderWidth: 1.5, borderColor: t.colors.danger }} />
        )}
        {stats.total > 0 ? (
          <AppText variant="small" muted center>
            {tr('mcampus.home.urgeSummary', { total: stats.total, passed: stats.passed })}
            {topAction ? `  ·  ${tr('mcampus.home.topAction', { action: topAction.title })}` : ''}
          </AppText>
        ) : null}
      </View>

      <HarmsCard />

      {control ? (
        <>
          <SectionTitle emoji="📊" title={tr('mcampus.home.historyTitle')} hint={tr('mcampus.home.historyHint')} />
          <Card>
            <WeekBars weeks={weekHistory(s, now)} locale={locale} />
          </Card>
        </>
      ) : null}

      <SectionTitle emoji="📅" title={tr('mcampus.home.calendarTitle')} />
      <Card style={{ gap: 10 }}>
        <CalendarGrid days={calendar(s, now)} locale={locale} mode={s.mode} />
        {topTrigger ? (
          <AppText variant="small" muted>
            🎯 {tr('mcampus.home.topTrigger', { trigger: topTrigger.label })}
          </AppText>
        ) : null}
      </Card>

      {!env.complete ? (
        <Card style={{ borderColor: t.colors.primary, borderWidth: 2 }}>
          <EnvChecklist doneIds={s.envDoneIds} onToggle={(id) => useCampusStore.getState().toggleMcEnv(id)} title={tr('mcampus.home.envTitle')} subtitle={tr('mcampus.home.envHint')} />
        </Card>
      ) : (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: t.colors.success, borderWidth: 2, backgroundColor: tint(t.colors.success, '14') }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.success, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" color="#FFFFFF" size={26} strokeWidth={3} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="h3" color={t.colors.success}>
              {tr('mcampus.home.envDoneTitle')}
            </AppText>
            <AppText variant="small" muted>
              {tr('mcampus.home.envDoneBody', { count: env.total })}
            </AppText>
          </View>
        </Card>
      )}

      {reasons.length ? (
        <>
          <SectionTitle emoji="🌱" title={tr('mcampus.home.reasonsTitle')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {reasons.map((r) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: t.radius.pill, backgroundColor: tint(t.colors.primary, '1A'), borderWidth: 1, borderColor: tint(t.colors.primary, '40') }}>
                <AppText>{r.emoji}</AppText>
                <AppText variant="small" weight="700">
                  {r.label}
                </AppText>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle emoji="🧩" title={tr('mcampus.home.plansTitle')} />
      {triggers.length ? (
        <GroupCard>
          {triggers.map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="h3">{x.emoji}</AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="small" weight="800" color={t.colors.primary}>
                  {tr('mcampus.home.plansIf', { trigger: x.label })}
                </AppText>
                <AppText variant="small">{x.plan}</AppText>
              </View>
            </View>
          ))}
        </GroupCard>
      ) : (
        <AppText variant="small" muted>
          {tr('mcampus.home.plansEmpty')}
        </AppText>
      )}

      <SectionTitle emoji="💡" title={tr('mcampus.home.factsTitle')} />
      <View style={{ gap: 8 }}>
        {MC.facts.map((f) => {
          const open = openFact === f.id;
          return (
            <Card key={f.id} padded={false} style={{ overflow: 'hidden' }}>
              <Pressable
                onPress={() => setOpenFact(open ? null : f.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, minHeight: t.touch }}
              >
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: t.radius.pill, backgroundColor: tint(t.colors.danger, '26') }}>
                  <AppText variant="tiny" weight="800" color={t.colors.danger}>
                    {tr('mcampus.home.myth')}
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
                <View style={{ marginHorizontal: 14, marginBottom: 14, padding: 12, gap: 6, borderRadius: t.radius.md, backgroundColor: tint(t.colors.success, '14'), borderLeftWidth: 3, borderLeftColor: t.colors.success }}>
                  <AppText variant="tiny" weight="800" color={t.colors.success}>
                    {tr('mcampus.home.fact')}
                  </AppText>
                  <AppText variant="small">{f.fact}</AppText>
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      <SectionTitle emoji="📘" title={tr('mcampus.home.guideTitle')} hint={tr('mcampus.home.guideBody', { count: MC.steps.length })} />
      <Button label={tr('mcampus.home.guideOpen')} icon="book" variant="secondary" onPress={() => router.push('/campus/masturbation/guide')} />

      {band ? (
        <Card style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="small" weight="700" muted>
              {tr('mcampus.home.checkTitle')}
            </AppText>
            <AppText variant="small" muted>
              {tr('mcampus.home.checkScore', { score: checkScore(s.checkAnswers), total: CHECK_QUESTION_COUNT })}
            </AppText>
          </View>
          <AppText weight="800">{band.title}</AppText>
          <AppText variant="small" muted>
            {band.text}
          </AppText>
        </Card>
      ) : null}

      {help ? (
        <>
          <SectionTitle emoji="🤝" title={tr('mcampus.home.helpTitle')} />
          <Card style={{ gap: 6 }}>
            <AppText weight="800">{help.title}</AppText>
            <AppText variant="small" muted>
              {help.text}
            </AppText>
          </Card>
        </>
      ) : null}

      <View style={{ gap: 8, marginTop: 6 }}>
        <Button label={tr('mcampus.home.editPlan')} variant="secondary" icon="gear" onPress={() => router.push({ pathname: '/campus/masturbation/setup', params: { edit: '1' } })} />
        <Button label={tr('mcampus.home.reset')} variant="ghost" icon="trash" onPress={() => setResetStep(1)} />
      </View>

      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="700" muted>
          {tr('mcampus.home.sources')}
        </AppText>
        {MC.sources.map((src) => (
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
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: t.touch, marginTop: 4 }}
        >
          <AppText variant="tiny" weight="700" muted>
            {tr('mcampus.home.disclaimerToggle')}
          </AppText>
          <View style={{ transform: [{ rotate: disclaimerOpen ? '90deg' : '0deg' }] }}>
            <Icon name="chevron" color={t.colors.textMuted} size={14} />
          </View>
        </Pressable>
        {disclaimerOpen ? (
          <AppText variant="tiny" muted>
            {tr('mcampus.home.disclaimer')}
          </AppText>
        ) : null}
      </View>

      <LapseDialog
        visible={lapseOpen}
        onClose={() => {
          setLapseOpen(false);
          refresh();
        }}
      />
      <UseDialog
        visible={useOpen}
        onClose={() => {
          setUseOpen(false);
          refresh();
        }}
        onTryUrge={() => {
          setUseOpen(false);
          router.push('/campus/masturbation/urge');
        }}
      />

      <Dialog
        visible={resetStep > 0}
        title={resetStep === 1 ? tr('mcampus.resetDialog.title') : tr('mcampus.resetDialog.confirmTitle')}
        message={resetStep === 1 ? tr('mcampus.resetDialog.body') : tr('mcampus.resetDialog.confirmBody')}
        onDismiss={() => setResetStep(0)}
        actions={[
          {
            label: resetStep === 1 ? tr('common.continue') : tr('mcampus.resetDialog.confirm'),
            variant: 'danger',
            onPress: () => {
              if (resetStep === 1) setResetStep(2);
              else {
                setResetStep(0);
                useCampusStore.getState().resetMc();
              }
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setResetStep(0) },
        ]}
      />
    </Screen>
  );
}
