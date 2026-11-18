import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, ProgressRing, Screen, useTheme } from '@/components';
import { PC } from '@/features/campus/porn/content';
import { bpsBand, bpsScore, cleanDays, cleanMs, goalReached, listProgress, longestCleanDays, pcPhase, riskMap } from '@/features/campus/porn/logic';
import { LapseAnalysisDialog, PcEnvChecklist, PornHarmsCard, RiskMapCard } from '@/features/campus/porn/ui';
import { CampusHero, GroupCard, HeroStat, InfoToggle, SectionTitle, tint } from '@/features/campus/shared/ui';
import { useClock } from '@/lib/useNow';
import { useCampusStore } from '@/stores/campusStore';

export default function PcCampusHome() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const s = useCampusStore((x) => x.porn);
  const { now, refresh } = useClock(30_000);
  const phase = pcPhase(s);
  const [lapseOpen, setLapseOpen] = useState(false);
  const [openFact, setOpenFact] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  useEffect(() => {
    if (phase === 'setup') router.replace('/campus/porn/setup');
  }, [phase]);

  if (phase === 'setup') {
    return (
      <Screen>
        <Header title={PC.title} />
      </Screen>
    );
  }

  const onHero = t.colors.primaryText;
  const ms = cleanMs(s, now);
  const days = cleanDays(s, now);
  const values = PC.values.filter((v) => s.valueIds.includes(v.id));
  const env = listProgress(PC.env.map((e) => e.id), s.envDoneIds);
  const band = s.bps ? bpsBand(bpsScore(s.bps), PC.bps.bands) : undefined;

  return (
    <Screen>
      <Header title={PC.title} />

      <CampusHero color={t.colors.primary}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' }}>
          <AppText variant="tiny" weight="800" color={onHero} style={{ letterSpacing: 1 }}>
            {PC.emoji} {tr('pcampus.home.heroLabel')}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing size={112} stroke={11} value={Math.min(1, days / s.goalDays)} color={t.colors.success} trackColor="rgba(255,255,255,0.18)">
            <AppText variant="h3" weight="800" color={onHero}>
              {tr('pcampus.home.ring', { done: Math.min(days, s.goalDays), goal: s.goalDays })}
            </AppText>
          </ProgressRing>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="display" color={onHero} style={{ lineHeight: 50 }}>
              {tr('pcampus.home.days', { count: days })}
            </AppText>
            <AppText weight="700" color={onHero} style={{ opacity: 0.9 }}>
              {tr('pcampus.home.hoursMinutes', { hours: Math.floor((ms % 86_400_000) / 3_600_000), minutes: Math.floor((ms % 3_600_000) / 60_000) })}
            </AppText>
            <AppText variant="small" color={onHero} style={{ opacity: 0.85 }}>
              {tr('pcampus.home.goalOf', { goal: s.goalDays })}
            </AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <HeroStat label={tr('pcampus.home.longest')} value={tr('pcampus.home.days', { count: longestCleanDays(s, now) })} color={onHero} />
          <HeroStat label={tr('pcampus.home.urgesBeaten')} value={String(s.urges.length)} color={onHero} />
          <HeroStat label={tr('pcampus.home.daysLeft')} value={String(Math.max(0, s.goalDays - days))} color={onHero} />
        </View>
        <InfoToggle light title={tr('pcampus.home.statsInfo')} text={tr('pcampus.home.statsInfoText')} />
      </CampusHero>

      {goalReached(s, now) ? (
        <Card style={{ gap: 10, borderColor: t.colors.success, borderWidth: 2, backgroundColor: tint(t.colors.success, '14') }}>
          <AppText variant="h3" color={t.colors.success}>
            🎉 {tr('pcampus.home.goalDoneTitle', { goal: s.goalDays })}
          </AppText>
          <AppText variant="small">{tr('pcampus.home.goalDoneBody')}</AppText>
          <Button label={tr('pcampus.home.newGoal')} variant="primary" onPress={() => router.push({ pathname: '/campus/porn/setup', params: { edit: '1' } })} />
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button label={tr('pcampus.home.urgeButton')} icon="wind" variant="accent" size="lg" accessibilityHint={tr('pcampus.home.urgeHint')} onPress={() => router.push('/campus/porn/urge')} />
        <Button label={tr('pcampus.home.lapseButton')} icon="flame" variant="secondary" onPress={() => setLapseOpen(true)} style={{ borderWidth: 1.5, borderColor: t.colors.danger }} />
        <PornHarmsCard />
      </View>

      {values.length ? (
        <>
          <SectionTitle emoji="🧭" title={tr('pcampus.home.valuesTitle')} hint={tr('pcampus.home.valuesHint')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {values.map((v) => (
              <View key={v.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: t.radius.pill, backgroundColor: tint(t.colors.primary, '1A'), borderWidth: 1, borderColor: tint(t.colors.primary, '40') }}>
                <AppText>{v.emoji}</AppText>
                <AppText variant="small" weight="700">
                  {v.label}
                </AppText>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle emoji="🗺️" title={tr('pcampus.home.riskTitle')} hint={tr('pcampus.home.riskHint')} />
      <RiskMapCard map={riskMap(s.lapses)} />

      {!env.complete ? (
        <Card style={{ borderColor: t.colors.primary, borderWidth: 2 }}>
          <PcEnvChecklist doneIds={s.envDoneIds} onToggle={(id) => useCampusStore.getState().togglePcEnv(id)} title={tr('pcampus.home.envTitle')} subtitle={tr('pcampus.home.envHint')} />
        </Card>
      ) : (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: t.colors.success, borderWidth: 2, backgroundColor: tint(t.colors.success, '14') }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.success, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" color="#FFFFFF" size={26} strokeWidth={3} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="h3" color={t.colors.success}>
              {tr('pcampus.home.envDoneTitle')}
            </AppText>
            <AppText variant="small" muted>
              {tr('pcampus.home.envDoneBody', { count: env.total })}
            </AppText>
          </View>
        </Card>
      )}

      <SectionTitle emoji="💡" title={tr('pcampus.home.factsTitle')} />
      <View style={{ gap: 8 }}>
        {PC.facts.map((f) => {
          const open = openFact === f.id;
          return (
            <Card key={f.id} padded={false} style={{ overflow: 'hidden' }}>
              <Pressable onPress={() => setOpenFact(open ? null : f.id)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, minHeight: t.touch }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: t.radius.pill, backgroundColor: tint(t.colors.danger, '26') }}>
                  <AppText variant="tiny" weight="800" color={t.colors.danger}>
                    {tr('pcampus.home.myth')}
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
                    {tr('pcampus.home.fact')}
                  </AppText>
                  <AppText variant="small">{f.fact}</AppText>
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      {band ? (
        <>
          <SectionTitle emoji="🧪" title={tr('pcampus.home.bpsTitle')} />
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <AppText variant="h3">{band.title}</AppText>
              <AppText variant="h3" weight="800">
                {tr('pcampus.home.bpsScore', { score: bpsScore(s.bps) })}
              </AppText>
            </View>
            <AppText variant="small" muted>
              {band.text}
            </AppText>
            {s.valuesConflict ? (
              <AppText variant="small" muted>
                {PC.bps.valuesNote}
              </AppText>
            ) : null}
            <InfoToggle title={PC.bps.info.title} text={PC.bps.info.text} />
          </Card>
        </>
      ) : null}

      <SectionTitle emoji="📘" title={tr('pcampus.home.guideTitle')} hint={tr('pcampus.home.guideBody', { count: PC.steps.length })} />
      <Button label={tr('pcampus.home.guideOpen')} icon="book" variant="secondary" onPress={() => router.push('/campus/porn/guide')} />

      <SectionTitle emoji="🤝" title={tr('pcampus.home.helpTitle')} />
      <GroupCard>
        {PC.help.map((h) => (
          <View key={h.id} style={{ gap: 4 }}>
            <AppText weight="800">{h.title}</AppText>
            <AppText variant="small" muted>
              {h.text}
            </AppText>
          </View>
        ))}
      </GroupCard>

      <View style={{ gap: 8, marginTop: 6 }}>
        <Button label={tr('pcampus.home.editPlan')} variant="secondary" icon="gear" onPress={() => router.push({ pathname: '/campus/porn/setup', params: { edit: '1' } })} />
        <Button label={tr('pcampus.home.reset')} variant="ghost" icon="trash" onPress={() => setResetStep(1)} />
      </View>

      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="700" muted>
          {tr('pcampus.home.sources')}
        </AppText>
        {PC.sources.map((src) => (
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
            {tr('pcampus.home.disclaimerToggle')}
          </AppText>
          <View style={{ transform: [{ rotate: disclaimerOpen ? '90deg' : '0deg' }] }}>
            <Icon name="chevron" color={t.colors.textMuted} size={14} />
          </View>
        </Pressable>
        {disclaimerOpen ? (
          <AppText variant="tiny" muted>
            {tr('pcampus.home.disclaimer')}
          </AppText>
        ) : null}
      </View>

      <LapseAnalysisDialog
        visible={lapseOpen}
        onClose={() => {
          setLapseOpen(false);
          refresh();
        }}
      />

      <Dialog
        visible={resetStep > 0}
        title={resetStep === 1 ? tr('pcampus.resetDialog.title') : tr('pcampus.resetDialog.confirmTitle')}
        message={resetStep === 1 ? tr('pcampus.resetDialog.body') : tr('pcampus.resetDialog.confirmBody')}
        onDismiss={() => setResetStep(0)}
        actions={[
          {
            label: resetStep === 1 ? tr('common.continue') : tr('pcampus.resetDialog.confirm'),
            variant: 'danger',
            onPress: () => {
              if (resetStep === 1) setResetStep(2);
              else {
                setResetStep(0);
                useCampusStore.getState().resetPc();
              }
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setResetStep(0) },
        ]}
      />
    </Screen>
  );
}
