import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, Screen, useTheme } from '@/components';
import { CAMP_ONBOARDING as ONB } from '@/features/camp/content';
import { diaryReport, hourRange, logsByDay, logsOfAttempt, REPORT_MIN_LOGS, todayCount } from '@/features/camp/engine/diary';
import { currentAttempt } from '@/features/camp/state';
import { HourChart, useCampDate } from '@/features/camp/ui';
import { InfoToggle, SectionTitle, tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

const MOOD_EMOJI = ['', '😣', '😕', '😐', '🙂', '😄'];
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Cigarette diary: during preparation every cigarette is logged with its trigger and need; the
 * report shows the riskiest hours and situations and the "autopilot" cigarettes to drop first.
 */
export default function CampDiary() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const camp = useCampStore();
  const all = useCampEventsStore((s) => s.cigarettes);
  const attempt = currentAttempt(camp);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const logs = attempt ? logsOfAttempt(all, attempt.id) : [];
  const prep = logs.filter((l) => !l.isSlip);
  const report = diaryReport(prep);
  const trig = (id?: string) => ONB.triggers.find((x) => x.id === id);

  return (
    <Screen>
      <Header title={tr('camp.diary.title')} onBack={() => goBack('/camp')} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: tint(t.colors.primary, '1F'), alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="h1">{todayCount(logs, new Date())}</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="800">{tr('camp.diary.today')}</AppText>
          <AppText variant="small" muted>
            {attempt?.status === 'active' ? tr('camp.diary.activeHint') : tr('camp.diary.prepHint')}
          </AppText>
        </View>
      </Card>
      <Button label={tr('camp.diary.log')} icon="plus" variant="primary" onPress={() => router.push('/camp/log-cigarette')} />

      <SectionTitle emoji="📊" title={tr('camp.diary.reportTitle')} hint={tr('camp.diary.reportHint')} />
      {report.total >= REPORT_MIN_LOGS ? (
        <View style={{ gap: 10 }}>
          <Card style={{ gap: 12 }}>
            <AppText weight="800">{tr('camp.diary.hoursTitle')}</AppText>
            <HourChart hours={report.hours} top={report.topHours.map((h) => h.hour)} />
            {report.topHours.map((h) => (
              <View key={h.hour} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="small" weight="700">
                  🕒 {hourRange(h.hour)}
                </AppText>
                <AppText variant="small" muted>
                  {tr('camp.diary.times', { count: h.count })}
                </AppText>
              </View>
            ))}
          </Card>
          {report.topTriggers.length ? (
            <Card style={{ gap: 8 }}>
              <AppText weight="800">{tr('camp.diary.triggersTitle')}</AppText>
              {report.topTriggers.map((x) => (
                <View key={x.trigger} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="small" weight="700">
                    {trig(x.trigger)?.emoji} {trig(x.trigger)?.label}
                  </AppText>
                  <AppText variant="small" muted>
                    {tr('camp.diary.times', { count: x.count })}
                  </AppText>
                </View>
              ))}
              <Button label={tr('camp.diary.toPlans')} variant="secondary" onPress={() => router.push('/camp/triggers')} />
            </Card>
          ) : null}
          <Card style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: t.colors.accent }}>
            <AppText weight="800">{tr('camp.diary.statsTitle', { perDay: String(report.perDay).replace('.', ','), days: report.days })}</AppText>
            {report.autopilot ? <AppText variant="small">{tr('camp.diary.autopilot', { count: report.autopilot, share: Math.round(report.autopilotShare * 10) })}</AppText> : null}
            {report.avgNeed !== null ? (
              <AppText variant="small" muted>
                {tr('camp.diary.avgNeed', { avg: String(report.avgNeed).replace('.', ',') })}
              </AppText>
            ) : null}
            <InfoToggle title={tr('camp.diary.autopilotInfoTitle')} text={tr('camp.diary.autopilotInfo')} />
          </Card>
        </View>
      ) : (
        <Card>
          <AppText variant="small" muted>
            {tr('camp.diary.reportSoon', { count: Math.max(0, REPORT_MIN_LOGS - report.total) })}
          </AppText>
        </Card>
      )}

      <SectionTitle emoji="🗒️" title={tr('camp.diary.historyTitle')} />
      {logs.length ? (
        logsByDay(logs).map((g) => (
          <View key={g.day} style={{ gap: 6 }}>
            <AppText variant="small" weight="800" muted>
              {fmtDate(`${g.day}T12:00:00`)} · {tr('camp.diary.times', { count: g.logs.length })}
            </AppText>
            {g.logs.map((l) => (
              <Card key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                <AppText weight="800" style={{ width: 48 }}>
                  {hhmm(l.at)}
                </AppText>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="small" weight="700">
                    {l.trigger ? `${trig(l.trigger)?.emoji} ${trig(l.trigger)?.label}` : tr('camp.diary.noTrigger')}
                    {l.mood ? `  ${MOOD_EMOJI[l.mood]}` : ''}
                  </AppText>
                  <AppText variant="tiny" muted>
                    {[l.need ? tr('camp.diary.needShort', { n: l.need }) : null, l.tag, l.isSlip ? tr('camp.diary.slip') : null].filter(Boolean).join(' · ')}
                  </AppText>
                </View>
                <Pressable onPress={() => setRemoveId(l.id)} accessibilityRole="button" accessibilityLabel={tr('camp.diary.remove')} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="trash" color={t.colors.textMuted} size={18} />
                </Pressable>
              </Card>
            ))}
          </View>
        ))
      ) : (
        <AppText muted>{tr('camp.diary.empty')}</AppText>
      )}

      <Dialog
        visible={removeId !== null}
        title={tr('camp.diary.removeTitle')}
        message={tr('camp.diary.removeBody')}
        onDismiss={() => setRemoveId(null)}
        actions={[
          {
            label: tr('camp.diary.removeConfirm'),
            variant: 'danger',
            onPress: () => {
              if (removeId) useCampEventsStore.getState().removeCigarette(removeId);
              setRemoveId(null);
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setRemoveId(null) },
        ]}
      />
    </Screen>
  );
}
