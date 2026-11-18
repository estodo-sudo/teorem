import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, ProgressBar, ProgressRing, Screen, useTheme } from '@/components';
import { SMOKING } from '@/features/campus/smoking/content';
import {
  cigsAvoided,
  cravingPeakPart,
  cravingStats,
  DAY_MS,
  daysUntilQuit,
  formatThousands,
  KEY_MILESTONE_DAYS,
  keyMilestoneProgress,
  moneySaved,
  nextMilestone,
  prepProgress,
  topSymptom,
  recommendedGuideStep,
  smokeFreeMs,
  smokingPhase,
  splitDuration,
} from '@/features/campus/smoking/logic';
import { CampusHero, GroupCard, HeroStat, SectionTitle, tint } from '@/features/campus/shared/ui';
import { PrepChecklist, SlipDialog } from '@/features/campus/smoking/ui';
import { useClock } from '@/lib/useNow';
import { useCampusStore } from '@/stores/campusStore';

export default function SmokingCampusHome() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const s = useCampusStore((x) => x.smoking);
  const { now, refresh: refreshClock } = useClock(30_000);
  const phase = smokingPhase(s, now);
  const [slipOpen, setSlipOpen] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [startNowOpen, setStartNowOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // First visit (or after a reset): go through the plan wizard.
  useEffect(() => {
    if (phase === 'setup') router.replace('/campus/smoking/setup');
  }, [phase]);

  if (phase === 'setup') {
    return (
      <Screen>
        <Header title={SMOKING.title} />
      </Screen>
    );
  }

  const elapsed = smokeFreeMs(s, now);
  const dur = splitDuration(elapsed);
  const saved = moneySaved(s, now);
  const stats = cravingStats(s.cravings);
  const next = nextMilestone(SMOKING.milestones, elapsed);
  const ring = keyMilestoneProgress(s, now);
  const ringDays = Math.min(KEY_MILESTONE_DAYS, Math.floor(elapsed / DAY_MS));
  const reasons = SMOKING.reasons.filter((r) => s.reasonIds.includes(r.id));
  const triggers = SMOKING.triggers.filter((x) => s.triggerIds.includes(x.id));
  const topSym = topSymptom(s.symptomLogs);
  const topSymInfo = topSym ? SMOKING.withdrawal.symptoms.find((x) => x.id === topSym.id) : undefined;
  const suggestedId = recommendedGuideStep(s, now);
  const suggested = SMOKING.steps.find((x) => x.id === suggestedId);
  const prep = prepProgress(SMOKING.prep.map((p) => p.id), s.prepDoneIds);
  const peakPart = cravingPeakPart(s.cravings);
  const topTrigger = stats.topTriggerId ? SMOKING.triggers.find((x) => x.id === stats.topTriggerId) : undefined;
  const onPrimary = t.colors.primaryText;

  return (
    <Screen>
      <Header title={SMOKING.title} />

      {phase === 'smokeFree' ? (
        <CampusHero color={t.colors.primary}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' }}>
            <AppText variant="tiny" weight="800" color={onPrimary} style={{ letterSpacing: 1 }}>
              🚭 {tr('smoking.home.smokeFreeLabel')}
              {s.attempt > 1 ? ` · ${tr('smoking.home.attempt', { count: s.attempt })}` : ''}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <ProgressRing size={104} stroke={10} value={ring} color={t.colors.success} trackColor="rgba(255,255,255,0.18)">
                <AppText weight="800" color={onPrimary}>
                  {tr('smoking.home.ringValue', { done: ringDays })}
                </AppText>
              </ProgressRing>
              <AppText variant="tiny" weight="700" color={onPrimary} style={{ opacity: 0.85 }}>
                {tr('smoking.home.ringTitle')}
              </AppText>
            </View>
            <View style={{ flex: 1 }} accessible accessibilityLabel={`${tr('smoking.home.smokeFreeLabel')}: ${tr('smoking.home.days', { count: dur.days })} ${tr('smoking.home.hoursMinutes', { hours: dur.hours, minutes: dur.minutes })}`}>
              <AppText variant="display" color={onPrimary} style={{ lineHeight: 50 }}>
                {tr('smoking.home.days', { count: dur.days })}
              </AppText>
              <AppText weight="700" color={onPrimary} style={{ opacity: 0.9 }}>
                {tr('smoking.home.hoursMinutes', { hours: dur.hours, minutes: dur.minutes })}
              </AppText>
              <AppText variant="small" color={onPrimary} style={{ opacity: 0.8, marginTop: 4 }}>
                {ring >= 1 ? tr('smoking.home.ringDone') : tr('smoking.home.ringBody')}
              </AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <HeroStat label={tr('smoking.home.saved')} value={s.packPrice > 0 ? tr('smoking.home.savedValue', { amount: formatThousands(saved) }) : tr('smoking.home.savedNoPrice')} color={onPrimary} />
            <HeroStat label={tr('smoking.home.avoided')} value={tr('smoking.home.avoidedValue', { count: cigsAvoided(s, now) })} color={onPrimary} />
            <HeroStat label={tr('smoking.home.cravingsBeaten')} value={String(stats.passed)} color={onPrimary} />
          </View>
        </CampusHero>
      ) : (
        <CampusHero color={t.colors.primary}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' }}>
            <AppText variant="tiny" weight="800" color={onPrimary} style={{ letterSpacing: 1 }}>
              ⏳ {tr('smoking.prep.countdown').toLocaleUpperCase('tr-TR')}
            </AppText>
          </View>
          <View style={{ gap: 4 }}>
            <AppText variant="display" color={onPrimary}>
              {tr('smoking.prep.countdownValue', { count: daysUntilQuit(s, now) })}
            </AppText>
            <AppText weight="700" color={onPrimary} style={{ opacity: 0.9 }}>
              {tr('smoking.prep.quitDate', { date: new Date(s.quitAt!).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) })}
            </AppText>
          </View>
          <Button label={tr('smoking.prep.startNow')} variant="secondary" onPress={() => setStartNowOpen(true)} />
        </CampusHero>
      )}

      <View style={{ gap: 10 }}>
        <Button label={tr('smoking.home.sos')} icon="wind" variant="accent" size="lg" accessibilityHint={tr('smoking.home.sosHint')} onPress={() => router.push('/campus/smoking/craving')} />
        <Button label={tr('smoking.symptoms.button')} icon="help" variant="info" size="lg" accessibilityHint={tr('smoking.symptoms.buttonHint')} onPress={() => router.push('/campus/smoking/symptoms')} />
        {topSym && topSymInfo ? (
          <AppText variant="small" muted center>
            {tr('smoking.symptoms.homeSummary', { title: topSymInfo.title, count: topSym.count })}
          </AppText>
        ) : null}
      </View>

      {stats.total > 0 ? (
        <>
          <SectionTitle emoji="📈" title={tr('smoking.home.insightsTitle')} />
          <GroupCard>
            <AppText variant="small">🛡️ {tr('smoking.home.cravingSummary', { total: stats.total, passed: stats.passed })}</AppText>
            {topTrigger ? <AppText variant="small">🎯 {tr('smoking.home.topTrigger', { trigger: topTrigger.label })}</AppText> : null}
            {peakPart ? <AppText variant="small">🕒 {tr('smoking.home.insightsPeak', { part: tr(`smoking.home.dayPart.${peakPart}`) })}</AppText> : null}
          </GroupCard>
        </>
      ) : null}

      {!prep.complete ? (
        <Card style={{ borderColor: t.colors.accent, borderWidth: 2 }}>
          <PrepChecklist doneIds={s.prepDoneIds} onToggle={(id) => useCampusStore.getState().togglePrep(id)} title={tr('smoking.prep.title')} subtitle={tr('smoking.prep.homeHint')} />
        </Card>
      ) : (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: t.colors.success, borderWidth: 2 }} accessibilityRole="summary">
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.success, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" color="#FFFFFF" size={26} strokeWidth={3} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="h3" color={t.colors.success}>
              {tr('smoking.prep.doneTitle')}
            </AppText>
            <AppText variant="small" muted>
              {tr('smoking.prep.doneBody', { count: prep.total })}
            </AppText>
          </View>
        </Card>
      )}

      {phase === 'smokeFree' ? (
        <Card onPress={() => router.push('/campus/smoking/health')} accessibilityLabel={tr('smoking.home.allHealth')} style={{ gap: 10, backgroundColor: tint(t.colors.success, '12'), borderColor: tint(t.colors.success, '55') }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: tint(t.colors.success, '33'), alignItems: 'center', justifyContent: 'center' }}>
              <AppText>❤️</AppText>
            </View>
            <AppText variant="small" weight="800" color={t.colors.success} style={{ flex: 1 }}>
              {tr('smoking.home.nextHealth').toLocaleUpperCase('tr-TR')}
            </AppText>
            <Icon name="chevron" color={t.colors.textMuted} size={18} />
          </View>
          {next ? (
            <>
              <AppText variant="h3">{next.milestone.label}</AppText>
              <AppText variant="small">{next.milestone.text}</AppText>
              <ProgressBar value={next.progress} height={8} color={t.colors.success} />
            </>
          ) : (
            <AppText>{tr('smoking.home.healthAllDone')}</AppText>
          )}
        </Card>
      ) : null}

      {reasons.length ? (
        <>
          <SectionTitle emoji="🌱" title={tr('smoking.home.reasonsTitle')} />
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

      <SectionTitle emoji="🧩" title={tr('smoking.home.plansTitle')} />
      {triggers.length ? (
        <GroupCard>
          {triggers.map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="h3">{x.emoji}</AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="small" weight="800" color={t.colors.primary}>
                  {tr('smoking.home.plansIf', { trigger: x.label })}
                </AppText>
                <AppText variant="small">{x.plan}</AppText>
              </View>
            </View>
          ))}
        </GroupCard>
      ) : (
        <AppText variant="small" muted>
          {tr('smoking.home.plansEmpty')}
        </AppText>
      )}

      <SectionTitle emoji="📘" title={tr('smoking.home.guideTitle')} hint={tr('smoking.home.guideBody', { count: SMOKING.steps.length })} />
      {suggested ? (
        <Pressable
          onPress={() => router.push({ pathname: '/campus/smoking/guide', params: { step: suggested.id } })}
          accessibilityRole="button"
          accessibilityLabel={tr('smoking.home.guideSuggested', { title: suggested.title })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: t.touch, borderRadius: t.radius.lg, backgroundColor: tint(t.colors.primary, '1A'), borderWidth: 1, borderColor: tint(t.colors.primary, '40') }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="h3">{suggested.emoji}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="tiny" weight="800" color={t.colors.primary}>
              {tr('smoking.home.guideNow')}
            </AppText>
            <AppText weight="800">{suggested.title}</AppText>
          </View>
          <Icon name="chevron" color={t.colors.textMuted} size={18} />
        </Pressable>
      ) : null}
      <Button label={tr('smoking.home.guideOpen')} icon="book" variant="secondary" onPress={() => router.push('/campus/smoking/guide')} />

      <SectionTitle emoji="🤝" title={tr('smoking.home.helpTitle')} />
      <GroupCard>
        {SMOKING.help.map((h) => (
          <View key={h.id} style={{ gap: 6 }}>
            <AppText weight="800">{h.title}</AppText>
            <AppText variant="small" muted>
              {h.text}
            </AppText>
            {h.phone ? <Button label={tr('smoking.home.call', { phone: h.phone })} icon="bell" variant="secondary" onPress={() => void Linking.openURL(`tel:${h.phone}`)} /> : null}
          </View>
        ))}
      </GroupCard>

      {phase === 'smokeFree' ? <Button label={tr('smoking.home.slipButton')} icon="flame" variant="secondary" onPress={() => setSlipOpen(true)} style={{ borderWidth: 1.5, borderColor: t.colors.danger }} /> : null}
      <Button label={tr('smoking.home.editPlan')} variant="secondary" icon="gear" onPress={() => router.push({ pathname: '/campus/smoking/setup', params: { edit: '1' } })} />
      <Button label={tr('smoking.home.reset')} variant="ghost" icon="trash" onPress={() => setResetStep(1)} />

      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="700" muted>
          {tr('smoking.home.sources')}
        </AppText>
        {SMOKING.sources.map((src) => (
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
            {tr('smoking.home.disclaimerToggle')}
          </AppText>
          <View style={{ transform: [{ rotate: disclaimerOpen ? '90deg' : '0deg' }] }}>
            <Icon name="chevron" color={t.colors.textMuted} size={14} />
          </View>
        </Pressable>
        {disclaimerOpen ? (
          <AppText variant="tiny" muted>
            {tr('smoking.home.disclaimer')}
          </AppText>
        ) : null}
      </View>

      <SlipDialog
        visible={slipOpen}
        onClose={() => {
          setSlipOpen(false);
          refreshClock();
        }}
      />

      <Dialog
        visible={startNowOpen}
        title={tr('smoking.prep.startNowTitle')}
        message={tr('smoking.prep.startNowBody')}
        onDismiss={() => setStartNowOpen(false)}
        actions={[
          {
            label: tr('common.start'),
            variant: 'accent',
            onPress: () => {
              const { cigsPerDay, packPrice, reasonIds, triggerIds } = useCampusStore.getState().smoking;
              useCampusStore.getState().saveSmokingSetup({ quitAt: new Date().toISOString(), cigsPerDay, packPrice, reasonIds, triggerIds });
              refreshClock();
              setStartNowOpen(false);
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setStartNowOpen(false) },
        ]}
      />

      <Dialog
        visible={resetStep > 0}
        title={resetStep === 1 ? tr('smoking.resetDialog.title') : tr('smoking.resetDialog.confirmTitle')}
        message={resetStep === 1 ? tr('smoking.resetDialog.body') : tr('smoking.resetDialog.confirmBody')}
        onDismiss={() => setResetStep(0)}
        actions={[
          {
            label: resetStep === 1 ? tr('common.continue') : tr('smoking.resetDialog.confirm'),
            variant: 'danger',
            onPress: () => {
              if (resetStep === 1) setResetStep(2);
              else {
                setResetStep(0);
                useCampusStore.getState().resetSmoking();
              }
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setResetStep(0) },
        ]}
      />
    </Screen>
  );
}
