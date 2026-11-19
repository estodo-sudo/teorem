import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, Screen, useTheme } from '@/components';
import { chooseTrack, confirmSurgeryClearance } from '@/features/training/kegelProfile';
import { todayWeekIndex } from '@/features/training/plan';
import { positionCard } from '@/features/training/player/playerUi';
import { functionalUnlocked, KEGEL_TRACKS, positionsFor } from '@/features/training/tracks';
import { toDateKey } from '@/lib/date';
import { goBack } from '@/lib/nav';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { TrackId } from '@/types';

/**
 * Program izleri (SPEC_KEGEL_V2 §3): the user picks the track. The relaxation track is suggested after
 * the screening; the prostate surgery track opens only with "my doctor approved" (§11.3).
 */
export default function TracksScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const profile = useKegelStore((s) => s.profile);
  const cleared = useKegelStore((s) => Boolean(s.surgeryClearance));
  const [surgeryOpen, setSurgeryOpen] = useState(false);
  const [doctorOk, setDoctorOk] = useState(false);
  const week = todayWeekIndex(training, toDateKey());

  const pick = (id: TrackId) => {
    if (id === 'surgery' && !cleared) return setSurgeryOpen(true);
    chooseTrack(id);
  };

  return (
    <Screen>
      <Header title={tr('kegel.tracks.title')} onBack={() => goBack('/(tabs)/training')} />
      <AppText muted>{tr('kegel.tracks.intro')}</AppText>

      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {KEGEL_TRACKS.map((tk) => {
          const selected = training.track === tk.id;
          const locked = tk.id === 'surgery' && !cleared;
          const suggested = tk.id === 'relax' && profile?.hypertonicFlag;
          return (
            <Pressable
              key={tk.id}
              onPress={() => pick(tk.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${tk.title}. ${tk.text}${locked ? `. ${tr('kegel.tracks.needsClearance')}` : ''}`}
              style={({ pressed }) => ({ minHeight: 64, gap: 6, padding: 14, borderRadius: t.radius.lg, borderWidth: 2, borderColor: selected ? t.colors.accent : t.colors.border, backgroundColor: t.colors.surface, opacity: pressed ? 0.85 : 1 })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AppText variant="h2">{tk.emoji}</AppText>
                <AppText weight="800" style={{ flex: 1 }}>
                  {tk.title}
                </AppText>
                {suggested ? (
                  <AppText variant="small" weight="800" color={t.colors.breathe}>
                    {tr('kegel.tracks.suggested')}
                  </AppText>
                ) : null}
                {locked ? <Icon name="lock" color={t.colors.textMuted} size={18} /> : selected ? <Icon name="check" color={t.colors.accent} size={20} /> : null}
              </View>
              <AppText variant="small" muted>
                {tk.text}
              </AppText>
              {tk.note ? (
                <AppText variant="small" muted style={{ fontStyle: 'italic' }}>
                  {tk.note}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {surgeryOpen && !cleared ? (
        <Card style={{ gap: 10, borderLeftWidth: 4, borderLeftColor: t.colors.warning }}>
          <AppText variant="h3">{tr('kegel.tracks.surgeryTitle')}</AppText>
          <AppText>{tr('kegel.tracks.surgeryText')}</AppText>
          <AppText weight="700" color={t.colors.danger}>
            {tr('kegel.tracks.catheter')}
          </AppText>
          <Pressable onPress={() => setDoctorOk(!doctorOk)} accessibilityRole="checkbox" accessibilityState={{ checked: doctorOk }} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: doctorOk ? t.colors.accent : t.colors.border, backgroundColor: doctorOk ? t.colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}
            >
              {doctorOk ? <Icon name="check" color={t.colors.accentText} size={16} /> : null}
            </View>
            <AppText weight="700" style={{ flex: 1 }}>
              {tr('kegel.tracks.doctorOk')}
            </AppText>
          </Pressable>
          <Button
            label={tr('kegel.tracks.openSurgery')}
            variant="accent"
            disabled={!doctorOk}
            onPress={() => {
              confirmSurgeryClearance();
              chooseTrack('surgery');
              setSurgeryOpen(false);
            }}
          />
        </Card>
      ) : null}

      <Card style={{ gap: 8 }}>
        <AppText variant="h3">{tr('kegel.tracks.positionsTitle', { week: week + 1 })}</AppText>
        <AppText>
          {positionsFor(training.track, week)
            .map((p) => `${positionCard(p).emoji} ${positionCard(p).title}`)
            .join('  ·  ')}
        </AppText>
        <AppText variant="small" muted>
          {functionalUnlocked(week) ? tr('kegel.tracks.functionalOn') : tr('kegel.tracks.positionsHint')}
        </AppText>
      </Card>

      <Button label={profile ? tr('kegel.tracks.rescreen') : tr('kegel.tracks.screen')} icon="compass" variant="secondary" onPress={() => router.push('/kegel/screening')} />
    </Screen>
  );
}
