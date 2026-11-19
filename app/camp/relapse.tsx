import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_CHECKIN as CHK, CAMP_ONBOARDING as ONB, CAMP_SOS as SOS } from '@/features/camps/smoking/content';
import { learnings } from '@/features/camps/smoking/engine/checkin';
import { totalSmokeFreeDays } from '@/features/camps/smoking/engine/counters';
import { currentAttempt, MAX_PREP_DAYS, quitDateIn, RELAPSE_PREP_DAYS } from '@/features/camps/smoking/state';
import type { ToolId } from '@/features/camps/smoking/types';
import { NumberStepper, useCampDate } from '@/features/camps/smoking/ui';
import { SectionTitle, tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

const TOOL_LABEL: Partial<Record<ToolId, string>> = { surf: SOS.surf.title, breath: SOS.breath.title, delay: SOS.delay.title, four_e: SOS.fourE.title, reasons: SOS.reasons.title, game: SOS.game.title };

/**
 * Relapse ("smoking regularly again"): what this attempt taught → a new quit day after a short
 * (3-day) preparation. Earlier data stays; the next attempt is "Deneme #N+1".
 */
export default function CampRelapse() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const camp = useCampStore();
  const ev = useCampEventsStore();
  const attempt = currentAttempt(camp);
  const [now] = useState(() => new Date());
  const [days, setDays] = useState<number>(RELAPSE_PREP_DAYS);
  const back = () => goBack('/camp');

  if (!attempt) {
    return (
      <Screen>
        <Header title={CHK.relapse.title} onBack={back} />
      </Screen>
    );
  }
  const l = learnings(attempt, ev.cigarettes, ev.cravings, camp.plans, totalSmokeFreeDays(attempt, ev.cigarettes, now));
  const trig = (id: string) => ONB.triggers.find((x) => x.id === id);

  return (
    <Screen
      footer={
        <Button
          label={CHK.relapse.confirm}
          size="lg"
          variant="accent"
          onPress={() => {
            useCampStore.getState().relapse(quitDateIn(days, new Date()));
            router.replace('/camp');
          }}
        />
      }
    >
      <Header title={CHK.relapse.title} onBack={back} />
      <AppText>{CHK.relapse.intro}</AppText>

      <SectionTitle emoji="🧭" title={CHK.relapse.learned} hint={tr('camp.relapse.attempt', { n: attempt.attemptNo })} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Card style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <AppText variant="h2" color={t.colors.success}>
            {l.smokeFreeDays}
          </AppText>
          <AppText variant="tiny" muted center>
            {tr('camp.relapse.days')}
          </AppText>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <AppText variant="h2" color={t.colors.success}>
            {l.resisted}
          </AppText>
          <AppText variant="tiny" muted center>
            {tr('camp.relapse.resisted')}
          </AppText>
        </Card>
      </View>
      {l.hardTriggers.length ? (
        <Card style={{ gap: 6 }}>
          <AppText weight="800">{tr('camp.relapse.hard')}</AppText>
          {l.hardTriggers.map((x) => (
            <AppText key={x.trigger} variant="small">
              {trig(x.trigger)?.emoji} {trig(x.trigger)?.label} · {tr('camp.diary.times', { count: x.count })}
            </AppText>
          ))}
        </Card>
      ) : null}
      {l.helpfulTools.length ? (
        <Card style={{ gap: 6, backgroundColor: tint(t.colors.success, '10') }}>
          <AppText weight="800">{tr('camp.relapse.helped')}</AppText>
          {l.helpfulTools.map((x) => (
            <AppText key={x.tool} variant="small">
              ✓ {TOOL_LABEL[x.tool] ?? tr(`camp.relapse.tool.${x.tool}`)} · {tr('camp.diary.times', { count: x.count })}
            </AppText>
          ))}
        </Card>
      ) : null}
      {l.usedPlans.length ? (
        <Card style={{ gap: 6 }}>
          <AppText weight="800">{tr('camp.relapse.plans')}</AppText>
          {l.usedPlans.map((p) => (
            <AppText key={p.id} variant="small">
              {tr('camp.plan.if')} {p.ifText}, {tr('camp.plan.then')} {p.thenText}.
            </AppText>
          ))}
        </Card>
      ) : null}

      <SectionTitle emoji="📅" title={CHK.relapse.plan} hint={CHK.relapse.planHint} />
      <Card style={{ gap: 10 }}>
        <NumberStepper label={tr('camp.onb.method.inDays')} value={days} onChange={setDays} min={RELAPSE_PREP_DAYS} max={MAX_PREP_DAYS} unit={tr('camp.onb.method.daysUnit')} quick={[3, 5, 7]} />
        <AppText variant="small" weight="700" center>
          {tr('camp.onb.method.quitOn', { date: fmtDate(quitDateIn(days, now)) })}
        </AppText>
      </Card>
    </Screen>
  );
}
