import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_CHECKIN as CHK } from '@/features/camps/smoking/content';
import { checkinDue, CRAVING_COUNTS, moodAlert } from '@/features/camps/smoking/engine/checkin';
import { currentPhase } from '@/features/camps/smoking/engine/phase';
import { currentAttempt } from '@/features/camps/smoking/state';
import type { Score5, SymptomId } from '@/features/camps/smoking/types';
import { SafetyCard } from '@/features/camps/smoking/ui';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

/** Daily check-in (≤30 s): smoked today? · strong urges · mood · withdrawal symptoms → tips. */
export default function CampCheckin() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const checkins = useCampEventsStore((s) => s.checkins);
  const [now] = useState(() => new Date());
  const attempt = currentAttempt(camp);
  const slot = attempt ? checkinDue(checkins, currentPhase(attempt, now), now).slot : null;
  const [smoked, setSmoked] = useState<boolean | null>(null);
  const [cravings, setCravings] = useState<number | null>(null);
  const [mood, setMood] = useState<Score5 | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomId[]>([]);
  const [saved, setSaved] = useState(false);
  const back = () => goBack('/camp');
  const ready = smoked !== null && mood !== null;

  const chip = (on: boolean) => ({
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: t.radius.pill,
    borderWidth: 1.5,
    borderColor: on ? t.colors.primary : t.colors.border,
    backgroundColor: on ? tint(t.colors.primary, '1F') : t.colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 6,
  });

  if (saved) {
    const picked = CHK.symptoms.filter((s) => symptoms.includes(s.id));
    const alert = moodAlert(useCampEventsStore.getState().checkins, new Date());
    return (
      <Screen footer={smoked ? <Button label={tr('camp.checkin.toSlip')} size="lg" variant="primary" onPress={() => router.replace('/camp/slip')} /> : <Button label={tr('camp.checkin.done')} size="lg" variant="primary" onPress={back} />}>
        <Header title={tr('camp.checkin.title')} close onBack={back} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <AppText variant="display">{smoked ? '🌱' : '✅'}</AppText>
          <AppText variant="h2" center accessibilityRole="header">
            {smoked ? tr('camp.checkin.savedSmoked') : tr('camp.checkin.saved')}
          </AppText>
        </View>
        {alert ? <SafetyCard /> : null}
        {picked.length ? (
          <>
            <AppText variant="h3">{tr('camp.checkin.tipsTitle')}</AppText>
            {picked.map((s) => (
              <Card key={s.id} style={{ gap: 6 }}>
                <AppText weight="800">
                  {s.emoji} {s.label}
                </AppText>
                <AppText variant="small">{s.tip}</AppText>
                <View style={{ padding: 8, borderRadius: t.radius.md, backgroundColor: tint(t.colors.success, '14') }}>
                  <AppText variant="small" weight="700" color={t.colors.success}>
                    ⏳ {s.eases}
                  </AppText>
                </View>
              </Card>
            ))}
            <AppText variant="tiny" muted>
              {tr('camp.checkin.tipsSource')}
            </AppText>
          </>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label={tr('camp.checkin.save')}
          size="lg"
          variant="primary"
          disabled={!ready}
          onPress={() => {
            if (smoked === null || mood === null) return;
            useCampEventsStore.getState().logCheckin({ smoked, cravingCount: cravings ?? 0, mood, symptoms });
            setSaved(true);
          }}
        />
      }
    >
      <Header title={slot === 'morning' ? tr('camp.checkin.morning') : slot === 'evening' ? tr('camp.checkin.evening') : tr('camp.checkin.title')} close onBack={back} />
      <AppText muted>{tr('camp.checkin.intro')}</AppText>

      <AppText weight="800">{tr('camp.checkin.smoked')}</AppText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[false, true].map((v) => (
          <Pressable key={String(v)} onPress={() => setSmoked(v)} accessibilityRole="radio" accessibilityState={{ selected: smoked === v }} style={[chip(smoked === v), { flex: 1 }]}>
            <AppText weight="800">{v ? tr('camp.checkin.yes') : tr('camp.checkin.no')}</AppText>
          </Pressable>
        ))}
      </View>
      {smoked ? (
        <AppText variant="small" muted>
          {tr('camp.checkin.smokedNote')}
        </AppText>
      ) : null}

      <AppText weight="800">{tr('camp.checkin.cravings')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CRAVING_COUNTS.map((n, i) => (
          <Pressable key={n} onPress={() => setCravings(n)} accessibilityRole="radio" accessibilityState={{ selected: cravings === n }} style={[chip(cravings === n), { minWidth: 52 }]}>
            <AppText weight="800">{i === CRAVING_COUNTS.length - 1 ? tr('camp.checkin.orMore', { n }) : n === 5 ? '4–5' : String(n)}</AppText>
          </Pressable>
        ))}
      </View>

      <AppText weight="800">{tr('camp.checkin.mood')}</AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {CHK.moods.map((m) => {
          const on = mood === m.v;
          return (
            <Pressable
              key={m.v}
              onPress={() => setMood(m.v)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={m.label}
              style={{ alignItems: 'center', gap: 4, width: 62, paddingVertical: 8, borderRadius: t.radius.lg, borderWidth: 2, borderColor: on ? t.colors.accent : 'transparent', backgroundColor: on ? tint(t.colors.accent, '1A') : 'transparent' }}
            >
              <AppText style={{ fontSize: 30, lineHeight: 36 }}>{m.emoji}</AppText>
              <AppText variant="tiny" weight="700" center>
                {m.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText weight="800">{tr('camp.checkin.symptoms')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CHK.symptoms.map((s) => {
          const on = symptoms.includes(s.id);
          return (
            <Pressable key={s.id} onPress={() => setSymptoms((x) => (on ? x.filter((y) => y !== s.id) : [...x, s.id]))} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={chip(on)}>
              <AppText>{s.emoji}</AppText>
              <AppText variant="small" weight="700">
                {s.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
