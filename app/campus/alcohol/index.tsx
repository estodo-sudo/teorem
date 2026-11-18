import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, ProgressRing, Screen, useTheme } from '@/components';
import { ALC } from '@/features/campus/alcohol/content';
import { alcPhase, auditBand, auditScore, DAILY_MAX, dayTotal, dryDays, dryMs, FREE_DAYS_TARGET, lastDays, longestDryDays, thisWeek, withdrawalRisk } from '@/features/campus/alcohol/logic';
import { AuditScale, DayBars, DrinkSheet, WithdrawalBanner } from '@/features/campus/alcohol/ui';
import { CampusHero, GroupCard, HeroStat, InfoToggle, SectionTitle, tint } from '@/features/campus/shared/ui';
import { toDateKey } from '@/lib/date';
import { useClock } from '@/lib/useNow';
import { useCampusStore } from '@/stores/campusStore';

const fmt = (n: number) => String(n).replace('.', ',');

export default function AlcCampusHome() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const s = useCampusStore((x) => x.alcohol);
  const { now, refresh } = useClock(30_000);
  const phase = alcPhase(s);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  useEffect(() => {
    if (phase === 'setup') router.replace('/campus/alcohol/setup');
  }, [phase]);

  if (phase === 'setup') {
    return (
      <Screen>
        <Header title={ALC.title} />
      </Screen>
    );
  }

  const cut = s.mode === 'cut';
  const onHero = t.colors.primaryText;
  const week = thisWeek(s, now);
  const todayStd = dayTotal(s, toDateKey(now));
  const dry = dryMs(s, now);
  const days = dryDays(s, now);
  const quitDone = !cut && days >= s.quitGoalDays;
  const risk = withdrawalRisk(s.withdrawal);
  const band = s.audit ? auditBand(auditScore(s.audit), ALC.audit.bands) : undefined;
  const reasons = ALC.reasons.filter((r) => s.reasonIds.includes(r.id));
  const triggers = ALC.triggers.filter((x) => s.triggerIds.includes(x.id));
  const left = Math.max(0, Math.round((week.limit - week.total) * 10) / 10);

  return (
    <Screen>
      <Header title={ALC.title} />

      {risk ? <WithdrawalBanner /> : null}

      <CampusHero color={t.colors.primary}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' }}>
          <AppText variant="tiny" weight="800" color={onHero} style={{ letterSpacing: 1 }}>
            {ALC.paths[s.mode].emoji} {cut ? tr('acampus.home.cutLabel') : tr('acampus.home.quitLabel')}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing
            size={112}
            stroke={11}
            value={cut ? Math.min(1, week.total / week.limit) : Math.min(1, days / s.quitGoalDays)}
            color={cut ? (week.over ? t.colors.danger : t.colors.warning) : t.colors.success}
            trackColor="rgba(255,255,255,0.18)"
          >
            <AppText variant="h3" weight="800" color={onHero}>
              {cut ? tr('acampus.home.ringCut', { total: fmt(week.total), limit: week.limit }) : tr('acampus.home.ringQuit', { done: Math.min(days, s.quitGoalDays), goal: s.quitGoalDays })}
            </AppText>
            {cut ? (
              <AppText variant="tiny" color={onHero} style={{ opacity: 0.8 }}>
                {tr('acampus.home.stdUnit')}
              </AppText>
            ) : null}
          </ProgressRing>
          <View style={{ flex: 1, gap: 4 }}>
            {cut ? (
              <>
                <AppText variant="h2" weight="800" color={onHero}>
                  {week.over ? tr('acampus.home.cutOver') : left > 0 ? tr('acampus.home.cutLeft', { left: fmt(left) }) : tr('acampus.home.cutAt')}
                </AppText>
                <AppText variant="small" color={onHero} style={{ opacity: 0.85 }}>
                  {tr('acampus.home.weekResets')}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="display" color={onHero} style={{ lineHeight: 50 }}>
                  {tr('acampus.home.days', { count: days })}
                </AppText>
                <AppText weight="700" color={onHero} style={{ opacity: 0.9 }}>
                  {tr('acampus.home.hoursMinutes', { hours: Math.floor((dry % 86_400_000) / 3_600_000), minutes: Math.floor((dry % 3_600_000) / 60_000) })}
                </AppText>
                <AppText variant="small" color={onHero} style={{ opacity: 0.85 }}>
                  {tr('acampus.home.goalOf', { goal: s.quitGoalDays })}
                </AppText>
              </>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {cut ? (
            <HeroStat label={tr('acampus.home.today')} value={fmt(todayStd)} color={onHero} />
          ) : (
            <HeroStat label={tr('acampus.home.longest')} value={tr('acampus.home.days', { count: longestDryDays(s, now) })} color={onHero} />
          )}
          <HeroStat label={tr('acampus.home.freeDays')} value={cut ? tr('acampus.home.freeDaysValue', { done: week.freeDays, target: FREE_DAYS_TARGET }) : String(week.freeDays)} color={onHero} />
          <HeroStat label={tr('acampus.home.weekTotal')} value={fmt(week.total)} color={onHero} />
        </View>
        <InfoToggle light title={cut ? ALC.info.statsCut.title : ALC.info.statsQuit.title} text={cut ? ALC.info.statsCut.text : ALC.info.statsQuit.text} />
      </CampusHero>

      {quitDone ? (
        <Card style={{ gap: 10, borderColor: t.colors.success, borderWidth: 2, backgroundColor: tint(t.colors.success, '14') }}>
          <AppText variant="h3" color={t.colors.success}>
            🎉 {tr('acampus.home.quitDoneTitle', { goal: s.quitGoalDays })}
          </AppText>
          <AppText variant="small">{tr('acampus.home.quitDoneBody')}</AppText>
          <Button label={tr('acampus.home.newGoal')} variant="primary" onPress={() => router.push({ pathname: '/campus/alcohol/setup', params: { edit: '1' } })} />
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button label={tr('acampus.home.addDrink')} icon="plus" variant="accent" size="lg" accessibilityHint={tr('acampus.home.addHint')} onPress={() => setSheetOpen(true)} />
        {toast ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceAlt }} accessibilityLiveRegion="polite">
            <AppText variant="small" style={{ flex: 1 }}>
              {toast}
            </AppText>
            <Pressable
              onPress={() => {
                useCampusStore.getState().undoLastDrink();
                setToast(null);
                refresh();
              }}
              accessibilityRole="button"
              hitSlop={8}
            >
              <AppText variant="small" weight="800" color={t.colors.primary}>
                {tr('acampus.home.undo')}
              </AppText>
            </Pressable>
          </View>
        ) : null}
        {cut && todayStd > DAILY_MAX ? (
          <View style={{ padding: 12, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.warning, backgroundColor: tint(t.colors.warning, '14') }}>
            <AppText variant="small">⚠️ {tr('acampus.home.dailyWarn')}</AppText>
          </View>
        ) : null}
        {!cut ? (
          <AppText variant="small" muted center>
            {tr('acampus.home.quitDrinkNote')}
          </AppText>
        ) : null}
        <InfoToggle title={ALC.info.std.title} text={ALC.info.std.text} />
      </View>

      <SectionTitle emoji="📊" title={tr('acampus.home.chartTitle')} hint={tr('acampus.home.chartHint')} />
      <Card>
        <DayBars days={lastDays(s, now)} locale={locale} />
      </Card>

      <SectionTitle emoji="💡" title={tr('acampus.home.tipsTitle')} hint={tr('acampus.home.tipsHint')} />
      <GroupCard>
        {ALC.tips.map((x) => (
          <View key={x.id} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tint(t.colors.primary, '1A'), alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="h3">{x.emoji}</AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText weight="800">{x.title}</AppText>
              <AppText variant="small">{x.text}</AppText>
            </View>
          </View>
        ))}
      </GroupCard>

      <SectionTitle emoji="🧭" title={tr('acampus.home.plansTitle')} />
      {triggers.length ? (
        <GroupCard>
          {triggers.map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="h3">{x.emoji}</AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="small" weight="800" color={t.colors.primary}>
                  {tr('acampus.home.plansIf', { trigger: x.label })}
                </AppText>
                <AppText variant="small">{x.plan}</AppText>
              </View>
            </View>
          ))}
        </GroupCard>
      ) : (
        <AppText variant="small" muted>
          {tr('acampus.home.plansEmpty')}
        </AppText>
      )}

      {reasons.length ? (
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
      ) : null}

      <SectionTitle emoji="🔥" title={tr('acampus.home.sexualTitle')} />
      <GroupCard>
        {ALC.sexual.map((x) => (
          <View key={x.id} style={{ gap: 2 }}>
            <AppText weight="800">{x.title}</AppText>
            <AppText variant="small">{x.text}</AppText>
          </View>
        ))}
      </GroupCard>

      {band ? (
        <>
          <SectionTitle emoji="🧪" title={tr('acampus.home.auditTitle')} />
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <AppText variant="h3">{band.title}</AppText>
              <AppText variant="h3" weight="800">
                {tr('acampus.home.auditScore', { score: auditScore(s.audit) })}
              </AppText>
            </View>
            <AuditScale score={auditScore(s.audit)} />
            <AppText variant="small" muted>
              {band.text}
            </AppText>
            <InfoToggle title={ALC.info.audit.title} text={ALC.info.audit.text} />
          </Card>
        </>
      ) : null}

      <SectionTitle emoji="📘" title={tr('acampus.home.guideTitle')} hint={tr('acampus.home.guideBody', { count: ALC.steps.length })} />
      <Button label={tr('acampus.home.guideOpen')} icon="book" variant="secondary" onPress={() => router.push('/campus/alcohol/guide')} />

      <SectionTitle emoji="🤝" title={tr('acampus.home.helpTitle')} />
      <GroupCard>
        {ALC.help.map((h) => (
          <View key={h.id} style={{ gap: 6 }}>
            <AppText weight="800">{h.title}</AppText>
            <AppText variant="small" muted>
              {h.text}
            </AppText>
            {h.phone ? (
              <Button label={tr('acampus.home.callAmatem', { phone: h.phone })} icon="bell" variant="secondary" onPress={() => void Linking.openURL(`tel:${h.phone}`)} />
            ) : null}
          </View>
        ))}
      </GroupCard>

      <View style={{ gap: 8, marginTop: 6 }}>
        <Button label={tr('acampus.home.editPlan')} variant="secondary" icon="gear" onPress={() => router.push({ pathname: '/campus/alcohol/setup', params: { edit: '1' } })} />
        <Button label={tr('acampus.home.reset')} variant="ghost" icon="trash" onPress={() => setResetStep(1)} />
      </View>

      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="700" muted>
          {tr('acampus.home.sources')}
        </AppText>
        {ALC.sources.map((src) => (
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
            {tr('acampus.home.disclaimerToggle')}
          </AppText>
          <View style={{ transform: [{ rotate: disclaimerOpen ? '90deg' : '0deg' }] }}>
            <Icon name="chevron" color={t.colors.textMuted} size={14} />
          </View>
        </Pressable>
        {disclaimerOpen ? (
          <AppText variant="tiny" muted>
            {tr('acampus.home.disclaimer')}
          </AppText>
        ) : null}
      </View>

      <DrinkSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPick={(d) => {
          useCampusStore.getState().logDrink(d.id, d.std);
          const total = dayTotal(useCampusStore.getState().alcohol, toDateKey(new Date()));
          setToast(tr('acampus.home.added', { title: d.title, total: fmt(total) }));
          setSheetOpen(false);
          refresh();
        }}
      />

      <Dialog
        visible={resetStep > 0}
        title={resetStep === 1 ? tr('acampus.resetDialog.title') : tr('acampus.resetDialog.confirmTitle')}
        message={resetStep === 1 ? tr('acampus.resetDialog.body') : tr('acampus.resetDialog.confirmBody')}
        onDismiss={() => setResetStep(0)}
        actions={[
          {
            label: resetStep === 1 ? tr('common.continue') : tr('acampus.resetDialog.confirm'),
            variant: 'danger',
            onPress: () => {
              if (resetStep === 1) setResetStep(2);
              else {
                setResetStep(0);
                useCampusStore.getState().resetAlc();
              }
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setResetStep(0) },
        ]}
      />
    </Screen>
  );
}
