import { useState } from 'react';
import { Linking, Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Screen, useTheme } from '@/components';
import { exportDoctorSummary } from '@/features/camps/core/share';
import { summaryHtml } from '@/features/camps/core/summaryHtml';
import { fill, ODAK_ONBOARDING as ONB, ODAK_SUMMARY as SM, ODAK_SUPPORT as S, odakToolLabel } from '@/features/camps/odak/content';
import { programStart } from '@/features/camps/odak/engine/checkin';
import { ODAK_PHASE_ORDER, odakPhase, programDay } from '@/features/camps/odak/engine/phase';
import { summaryNumbers } from '@/features/camps/odak/engine/stats';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { OdakLock } from '@/features/camps/odak/ui';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';

/**
 * Destek ve profesyonel yardım (SPEC_ODAK_KAMPI 5.11): 112 always on top, Yeşilay 115, MHRS 182
 * (both flagged for checking before release), when to see a specialist, neutral supporter messages and
 * the specialist summary (made on the device, shared only by the user, after a privacy warning). Always free.
 */
export default function OdakSupport() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { goal, events, urges, checkins, screenings } = useOdakStore();
  const [confirm, setConfirm] = useState(false);
  const premium = useAccess()('odak');
  const [failed, setFailed] = useState(false);
  const call = (phone: string) => void Linking.openURL(`tel:${phone}`);

  const share = async () => {
    setConfirm(false);
    if (!goal) return;
    const now = new Date();
    const n = summaryNumbers({ goal, events, urges, checkins, now });
    const R = SM.rows;
    const none = SM.none;
    const trig = (id: string) => ONB.triggers.options.find((o) => o.id === id)?.label ?? id;
    const tool = (id: string) => odakToolLabel(id) || id;
    const goalText = [ONB.summary.goalLabels.porn[goal.porn], ONB.summary.goalLabels.mast[goal.mast]]
      .filter(Boolean)
      .map((x) => (x ?? '').replace('{n}', String(goal.porn === 'reduce' ? (goal.pornWeeklyMax ?? '') : (goal.mastPauseDays ?? goal.mastWeeklyMax ?? ''))))
      .join(' · ');
    const last = (type: string) => [...screenings].reverse().find((s) => s.type === type);
    const bps = screenings.filter((s) => s.type === 'BPS');
    const phase = odakPhase(programStart(goal), now);
    const rows: [string, string][] = [
      [R.date, now.toLocaleDateString('tr-TR')],
      [R.day, fill(SM.dayN, { n: programDay(programStart(goal), now) })],
      [R.phase, ONB.summary.phases[ODAK_PHASE_ORDER.indexOf(phase)]?.name ?? ''],
      [R.goal, goalText],
      [R.fitTotal, String(n.fitTotal)],
      [R.longest, String(n.longest)],
      [R.current, String(n.current)],
      [R.urges, String(n.urges)],
      [R.managed, String(n.managed)],
      [R.urgeIntensity, n.urgeIntensity === null ? none : String(n.urgeIntensity).replace('.', ',')],
      [R.slipDays14, String(n.slipDays14)],
      [R.slipDays30, String(n.slipDays30)],
      [R.triggers, n.triggers.length ? n.triggers.map(trig).join(', ') : none],
      [R.tools, n.tools.length ? n.tools.map(tool).join(', ') : none],
      [R.bps, bps.length ? bps.map((s) => `${new Date(s.at).toLocaleDateString('tr-TR')}: ${s.score}/10`).join(' · ') : none],
      [R.phq2, last('PHQ2') ? `${last('PHQ2')!.score}/6` : none],
      [R.gad2, last('GAD2') ? `${last('GAD2')!.score}/6` : none],
      [R.mood, n.mood14 === null ? none : String(n.mood14).replace('.', ',')],
      [R.sleep, n.sleep14 === null ? none : String(n.sleep14).replace('.', ',')],
    ];
    const ok = await exportDoctorSummary(summaryHtml(SM.title, SM.subtitle, rows, SM.note), S.summary.title);
    setFailed(!ok);
  };

  return (
    <Screen>
      <Header title={S.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />

      <Card style={{ gap: t.space.sm, backgroundColor: t.tokens.destructiveSoft, borderColor: t.tokens.destructiveSoft }}>
        <AppText variant="h3">{S.emergency.title}</AppText>
        <AppText variant="small">{S.emergency.text}</AppText>
        <Button label={S.emergency.button} variant="danger" onPress={() => call(S.emergency.phone)} />
      </Card>

      {S.help.map((h) => (
        <Card key={h.id} style={{ gap: t.space.sm }}>
          <AppText variant="h3">
            {h.title}
          </AppText>
          <AppText variant="small">{h.text}</AppText>
          <Button label={h.button} icon="bell" variant="secondary" onPress={() => call(h.phone)} />
          <AppText variant="tiny" muted>
            {tr('camp.ui.lastVerified', { date: h.lastVerified })}
          </AppText>
        </Card>
      ))}

      <Card style={{ gap: 6 }}>
        <AppText variant="h3">{S.expert.title}</AppText>
        <AppText variant="small">{S.expert.text}</AppText>
      </Card>

      <Card style={{ gap: t.space.sm }}>
        <AppText variant="h3">{S.supporter.title}</AppText>
        <AppText variant="small" muted>
          {S.supporter.desc}
        </AppText>
        {S.supporter.templates.map((m) => (
          <View key={m} style={{ gap: 6, padding: 10, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceAlt }}>
            <AppText variant="small">“{m}”</AppText>
            <Button label={S.supporter.share} variant="ghost" onPress={() => void Share.share({ message: m }).catch(() => undefined)} />
          </View>
        ))}
      </Card>

      <Card style={{ gap: t.space.sm }}>
        <AppText variant="h3">{S.summary.title}</AppText>
        <AppText variant="small">{S.summary.desc}</AppText>
        {premium ? <Button label={S.summary.button} icon="book" disabled={!goal} onPress={() => setConfirm(true)} /> : <OdakLock title={tr('odak.premium.summary')} />}
        {failed ? (
          <AppText variant="small" color={t.colors.danger}>
            {S.summary.failed}
          </AppText>
        ) : null}
      </Card>

      <Dialog
        visible={confirm}
        title={S.summary.title}
        message={S.summary.privacy}
        onDismiss={() => setConfirm(false)}
        actions={[
          { label: S.summary.confirm, variant: 'primary', onPress: () => void share() },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setConfirm(false) },
        ]}
      />
    </Screen>
  );
}
