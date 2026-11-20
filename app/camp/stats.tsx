import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_ONBOARDING as ONB, CAMP_REWARDS } from '@/features/camps/smoking/content';
import { diaryReport, logsOfAttempt, triggerFrequency } from '@/features/camps/smoking/engine/diary';
import { currentPhase } from '@/features/camps/smoking/engine/phase';
import { resistedCount } from '@/features/camps/smoking/engine/sos';
import { cravingsPerDay, cumulativeSavings, smokeFreeCalendar, weeklyIntensity, type HeatCell } from '@/features/camps/smoking/engine/stats';
import { campAttempt } from '@/features/camps/smoking/state';
import { fmtTL, HourChart, MiniBars, PremiumLock } from '@/features/camps/smoking/ui';
import { useAccess } from '@/features/purchases/useGate';
import { SectionTitle, tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

/** Statistics: smoke-free calendar, cravings, intensity trend, triggers, savings, badges, diary hours. */
export default function CampStats() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const premium = useAccess()('camp');
  const ev = useCampEventsStore();
  const [now] = useState(() => new Date());
  const attempt = campAttempt(camp);
  const quitDone = attempt ? currentPhase(attempt, now) !== 'preparation' : false;
  const perDay = cravingsPerDay(ev.cravings, now, 14);
  const intensity = weeklyIntensity(ev.cravings, now, 6);
  const triggers = triggerFrequency(camp.profile?.triggers ?? [], attempt ? logsOfAttempt(ev.cigarettes, attempt.id) : [], ev.cravings)
    .filter((x) => x.count > 0)
    .slice(0, 5);
  const maxTrig = Math.max(1, ...triggers.map((x) => x.count));
  const savings = attempt && camp.profile && quitDone ? cumulativeSavings(camp.prices, camp.profile.perDay, attempt, ev.cigarettes, now, 30) : [];
  const prep = attempt ? diaryReport(logsOfAttempt(ev.cigarettes, attempt.id).filter((l) => !l.isSlip)) : null;
  const earned = camp.badges.filter((b) => b.unlockedAt).length;
  const cell = (c: HeatCell) =>
    c === 'free'
      ? { backgroundColor: t.colors.success }
      : c === 'slip'
        ? { backgroundColor: t.colors.warning }
        : c === 'today'
          ? { backgroundColor: t.colors.surface, borderWidth: 2, borderColor: t.colors.primary }
          : { backgroundColor: t.colors.surfaceAlt };

  return (
    <Screen>
      <Header title={tr('camp.stats.title')} onBack={() => goBack('/camp')} />

      <SectionTitle tone="smokefree" icon="calendar" title={tr('camp.stats.calendar')} hint={tr('camp.stats.calendarHint')} />
      {attempt && quitDone ? (
        <Card style={{ gap: t.space.xs }}>
          {smokeFreeCalendar(attempt, ev.cigarettes, now, 13).map((row, w) => (
            <View key={w} style={{ flexDirection: 'row', gap: t.space.xs }}>
              {row.map((c, i) => (
                <View key={i} style={[{ flex: 1, aspectRatio: 1, maxHeight: 26, borderRadius: 5 }, cell(c)]} />
              ))}
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
            {(['free', 'slip', 'today'] as HeatCell[]).map((c) => (
              <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[{ width: 12, height: 12, borderRadius: 3 }, cell(c)]} />
                <AppText variant="tiny" muted>
                  {tr(`camp.stats.legend.${c}`)}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : (
        <Card>
          <AppText variant="small" muted>
            {tr('camp.stats.notYet')}
          </AppText>
        </Card>
      )}

      {premium ? (
        <>
          <SectionTitle tone="smokefree" icon="waves" title={tr('camp.stats.cravings')} hint={tr('camp.stats.cravingsHint', { count: resistedCount(ev.cravings) })} />
          <Card>
            <MiniBars
              values={perDay.map((d) => d.count)}
              labels={perDay.map((d, i) => (i % 3 === 0 || i === perDay.length - 1 ? d.day.slice(8) : null))}
              color={t.colors.breathe}
              a11y={tr('camp.stats.cravingsA11y', { list: perDay.map((d) => d.count).join(', ') })}
            />
          </Card>

          <SectionTitle tone="smokefree" icon="trendDown" title={tr('camp.stats.intensity')} hint={tr('camp.stats.intensityHint')} />
          <Card>
            <MiniBars
              values={intensity}
              labels={intensity.map((_, i) => tr('camp.stats.weekAgo', { n: intensity.length - 1 - i }))}
              color={t.colors.accent}
              valueLabels
              a11y={tr('camp.stats.intensityA11y', { list: intensity.map((v) => v ?? '–').join(', ') })}
            />
          </Card>

          <SectionTitle tone="smokefree" icon="zap" title={tr('camp.stats.triggers')} />
          <Card style={{ gap: t.space.sm }}>
            {triggers.length ? (
              triggers.map((x) => {
                const o = ONB.triggers.find((y) => y.id === x.trigger)!;
                return (
                  <View key={x.trigger} style={{ gap: 3 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <AppText variant="small" weight="700">
                        {o.label}
                      </AppText>
                      <AppText variant="small" muted>
                        {x.count}
                      </AppText>
                    </View>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.surfaceAlt }}>
                      <View style={{ width: `${(x.count / maxTrig) * 100}%`, height: 8, borderRadius: 4, backgroundColor: t.colors.warning }} />
                    </View>
                  </View>
                );
              })
            ) : (
              <AppText variant="small" muted>
                {tr('camp.stats.noData')}
              </AppText>
            )}
          </Card>

          {savings.length ? (
            <>
              <SectionTitle tone="smokefree" icon="wallet" title={tr('camp.stats.savings')} hint={tr('camp.stats.savingsHint', { amount: fmtTL(savings[savings.length - 1]!.amount) })} />
              <Card>
                <MiniBars values={savings.map((p) => p.amount)} color={t.colors.success} a11y={tr('camp.stats.savingsHint', { amount: fmtTL(savings[savings.length - 1]!.amount) })} />
              </Card>
            </>
          ) : null}
        </>
      ) : (
        <PremiumLock title={tr('camp.premium.stats')} />
      )}

      <SectionTitle tone="smokefree" icon="medal" title={tr('camp.stats.badges')} hint={tr('camp.stats.badgesHint', { earned, total: CAMP_REWARDS.badges.length })} />
      <Button label={tr('camp.rewards.title')} icon="trophy" variant="secondary" onPress={() => router.push('/camp/rewards')} />

      {prep && prep.total ? (
        <>
          <SectionTitle tone="smokefree" icon="clock" title={tr('camp.stats.prepHours')} hint={tr('camp.stats.prepHoursHint', { count: prep.total })} />
          <Card style={{ backgroundColor: tint(t.colors.primary, '08') }}>
            <HourChart hours={prep.hours} top={prep.topHours.map((h) => h.hour)} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
