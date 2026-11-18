import { useState } from 'react';
import { Linking, Pressable, Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_CHECKIN, CAMP_ONBOARDING as ONB, CAMP_SUPPORT as SUP } from '@/features/camp/content';
import { exportDoctorSummary } from '@/features/camp/device';
import { totalSmokeFreeDays } from '@/features/camp/engine/counters';
import { doctorSummary, summaryHtml, supporterText } from '@/features/camp/engine/summary';
import { campAttempt } from '@/features/camp/state';
import { fmtTL, PremiumLock, useCampDate } from '@/features/camp/ui';
import { isMinor } from '@/features/camp/engine/premium';
import { useAccess } from '@/features/purchases/useGate';
import { SectionTitle, tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

/**
 * Destek ve profesyonel yardım: 112, ALO 171, smoking cessation clinics, Yeşilay (YEDAM 115),
 * ready messages for the supporter (share sheet) and the "show my doctor" PDF summary.
 * Always free; institutional details carry a "last verified" date.
 */
export default function CampSupport() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const camp = useCampStore();
  const premium = useAccess()('camp');
  const ev = useCampEventsStore();
  const attempt = campAttempt(camp);
  const [now] = useState(() => new Date());
  const [exportState, setExportState] = useState<'idle' | 'busy' | 'failed'>('idle');
  const call = (n: string) => void Linking.openURL(`tel:${n}`);
  const vars = { supporter: camp.profile?.supporterName ?? tr('camp.coach.yourSupporter'), date: attempt ? fmtDate(attempt.actualQuitDateTime ?? attempt.plannedQuitDate) : '', days: attempt ? totalSmokeFreeDays(attempt, ev.cigarettes, now) : 0 };

  const exportSummary = async () => {
    const s = doctorSummary(camp, ev, new Date());
    if (!s) return;
    setExportState('busy');
    const label = (list: { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? id;
    const rows: [string, string][] = [
      [tr('camp.support.doc.attempt'), `#${s.attemptNo}`],
      [tr('camp.support.doc.quitDate'), fmtDate(s.quitDate)],
      [tr('camp.support.doc.phase'), ONB.phases.find((p) => p.id === s.phase)?.title ?? s.phase],
      [tr('camp.support.doc.smokeFree'), tr('camp.support.doc.days', { count: s.smokeFreeDays })],
      [tr('camp.support.doc.sinceLast'), tr('camp.support.doc.days', { count: s.sinceLastDays })],
      [tr('camp.support.doc.before'), tr('camp.support.doc.perDay', { count: s.perDayBefore, years: s.years })],
      [tr('camp.support.doc.products'), s.products.map((p) => label(ONB.products, p)).join(', ')],
      [tr('camp.support.doc.hsi'), `${s.hsiScore}/6 · ${ONB.hsiBands[s.hsiLevel as 'low' | 'mid' | 'high']?.title ?? ''}`],
      [tr('camp.support.doc.slips'), String(s.slips)],
      [tr('camp.support.doc.cravings'), tr('camp.support.doc.cravingsValue', { total: s.cravings.total, resisted: s.cravings.resisted, before: s.cravings.avgBefore ?? '–', after: s.cravings.avgAfter ?? '–' })],
      [tr('camp.support.doc.checkins'), String(s.checkins)],
      [tr('camp.support.doc.symptoms'), s.topSymptoms.map((x) => `${CAMP_CHECKIN.symptoms.find((y) => y.id === x.id)?.label ?? x.id} (${x.count})`).join(', ') || '–'],
      [tr('camp.support.doc.mood'), s.moodLast7 === null ? '–' : `${String(s.moodLast7).replace('.', ',')} / 5`],
      [tr('camp.support.doc.triggers'), s.topTriggers.map((x) => label(ONB.triggers, x.id)).join(', ') || '–'],
      [tr('camp.support.doc.saved'), `${fmtTL(s.savedTRY)} TL`],
    ];
    const html = summaryHtml(tr('camp.support.doc.title'), tr('camp.support.doc.subtitle', { date: fmtDate(s.generatedAt) }), rows, SUP.doctor.note);
    const ok = await exportDoctorSummary(html, tr('camp.support.doc.title'));
    setExportState(ok ? 'idle' : 'failed');
  };

  return (
    <Screen>
      <Header title={tr('camp.support.title')} onBack={() => goBack('/camp')} />

      <Pressable onPress={() => call('112')} accessibilityRole="button" accessibilityLabel={`${SUP.emergency.title}. ${SUP.emergency.text}`}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: t.colors.danger, backgroundColor: tint(t.colors.danger, '10') }}>
          <AppText variant="h2">🚑</AppText>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="800" color={t.colors.danger}>
              {SUP.emergency.title}
            </AppText>
            <AppText variant="small">{SUP.emergency.text}</AppText>
          </View>
        </Card>
      </Pressable>

      <Card style={{ gap: 10, borderWidth: 2, borderColor: t.colors.success }}>
        <AppText variant="h3">📞 {SUP.alo171.title}</AppText>
        <AppText variant="small" weight="700">
          {SUP.alo171.hours}
        </AppText>
        <AppText variant="small">{SUP.alo171.cost}</AppText>
        {SUP.alo171.offers.map((o) => (
          <AppText key={o} variant="small">
            ✓ {o}
          </AppText>
        ))}
        <Button label={tr('camp.ui.call171')} icon="bell" variant="primary" onPress={() => call(SUP.alo171.number)} />
      </Card>

      <Card style={{ gap: 6 }}>
        <AppText variant="h3">🏥 {SUP.clinics.title}</AppText>
        <AppText variant="small">{isMinor(camp.profile?.ageRange) ? ONB.under18 : SUP.clinics.text}</AppText>
      </Card>

      <Card style={{ gap: 8 }}>
        <AppText variant="h3">💚 {SUP.yesilay.title}</AppText>
        <AppText variant="small">{SUP.yesilay.text}</AppText>
        <Button label={tr('camp.support.callYesilay', { number: SUP.yesilay.number })} variant="secondary" onPress={() => call(SUP.yesilay.number)} />
      </Card>
      <AppText variant="tiny" muted>
        {tr('camp.support.lastVerified', { date: SUP.lastVerified })}
      </AppText>

      <SectionTitle emoji="🤝" title={tr('camp.support.supporterTitle')} hint={SUP.supporter.intro} />
      {SUP.supporter.messages.map((m) => {
        const text = supporterText(m.text, vars);
        return (
          <Card key={m.id} style={{ gap: 8 }}>
            <AppText variant="tiny" weight="800" color={t.colors.primary}>
              {m.label.toLocaleUpperCase('tr')}
            </AppText>
            <AppText variant="small">{text}</AppText>
            <Button label={tr('camp.support.share')} icon="sparkle" variant="secondary" onPress={() => void Share.share({ message: text }).catch(() => undefined)} />
          </Card>
        );
      })}

      <SectionTitle emoji="🩺" title={tr('camp.support.doctorTitle')} hint={SUP.doctor.intro} />
      {premium ? (
        <Button label={exportState === 'busy' ? tr('camp.support.doctorBusy') : tr('camp.support.doctorButton')} icon="book" variant="primary" disabled={!camp.profile || exportState === 'busy'} onPress={() => void exportSummary()} />
      ) : (
        <PremiumLock title={tr('camp.premium.doctor')} />
      )}
      {exportState === 'failed' ? (
        <AppText variant="small" color={t.colors.danger} accessibilityLiveRegion="polite">
          {tr('camp.support.doctorFailed')}
        </AppText>
      ) : null}
      <AppText variant="tiny" muted>
        {SUP.doctor.note}
      </AppText>
    </Screen>
  );
}
