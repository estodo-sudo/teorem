import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, Screen, useTheme } from '@/components';
import { Badge, Button, Card, OptionCard, ScalePressable } from '@/components/ui';
import { chooseTrack, confirmSurgeryClearance } from '@/features/training/kegelProfile';
import { todayWeekIndex } from '@/features/training/plan';
import { positionCard } from '@/features/training/player/playerUi';
import { TRACK_ICON } from '@/features/training/trackIcons';
import { functionalUnlocked, KEGEL_TRACKS, positionsFor } from '@/features/training/tracks';
import { sexCtx, useSex } from '@/i18n/sex';
import { toDateKey } from '@/lib/date';
import { goBack } from '@/lib/nav';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { TrackId } from '@/types';

/**
 * Program izleri (SPEC_KEGEL_V2 §3) — ui-v2: the user picks the track on icon radio cards. The
 * relaxation track is suggested after the screening; the gentle track (prostate surgery for men, after
 * giving birth for women) opens only with "my doctor approved" (§11.3).
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
  // The gentle, cleared track: prostate surgery for men, after giving birth for women.
  const ctx = sexCtx(useSex());

  const pick = (id: TrackId) => {
    if (id === 'surgery' && !cleared) return setSurgeryOpen(true);
    chooseTrack(id);
  };

  return (
    <Screen>
      <Header title={tr('kegel.tracks.title')} onBack={() => goBack('/(tabs)/profile')} />
      <AppText style={{ ...t.type.body, color: t.tokens.mutedForeground }}>{tr('kegel.tracks.intro')}</AppText>

      <View style={{ gap: t.space.sm }} accessibilityRole="radiogroup">
        {KEGEL_TRACKS.map((tk) => {
          const selected = training.track === tk.id;
          const locked = tk.id === 'surgery' && !cleared;
          const suggested = tk.id === 'relax' && profile?.hypertonicFlag;
          return (
            <View key={tk.id} style={{ gap: t.space.xs }}>
              <OptionCard icon={locked ? 'lock' : TRACK_ICON[tk.id]} label={tk.title} description={tk.note ? `${tk.text} ${tk.note}` : tk.text} selected={selected} onPress={() => pick(tk.id)} />
              {suggested || locked ? (
                <View style={{ flexDirection: 'row', gap: t.space.xs, paddingLeft: t.space.lg }}>
                  {suggested ? <Badge variant="success" label={tr('kegel.tracks.suggested')} /> : null}
                  {locked ? <Badge variant="outline" icon="lock" label={tr('kegel.tracks.needsClearance', ctx)} /> : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {surgeryOpen && !cleared ? (
        <Card style={{ padding: t.space.xl, gap: t.space.md, borderColor: t.tokens.warning, borderWidth: t.border.thick }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
            <Icon name="alert" size="md" color={t.tokens.warning} />
            <AppText style={{ ...t.type.subheading, flex: 1, color: t.tokens.cardForeground }}>{tr('kegel.tracks.surgeryTitle', ctx)}</AppText>
          </View>
          <AppText style={{ ...t.type.small, color: t.tokens.cardForeground }}>{tr('kegel.tracks.surgeryText', ctx)}</AppText>
          <AppText style={{ ...t.type.small, fontWeight: '700', color: t.tokens.destructive }}>{tr('kegel.tracks.catheter', ctx)}</AppText>
          <ScalePressable
            onPress={() => setDoctorOk(!doctorOk)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: doctorOk }}
            accessibilityLabel={tr('kegel.tracks.doctorOk', ctx)}
            style={{ minHeight: t.touch, flexDirection: 'row', alignItems: 'center', gap: t.space.md }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: t.radius.sm - 2,
                borderWidth: t.border.thick,
                borderColor: doctorOk ? t.tokens.accent : t.tokens.input,
                backgroundColor: doctorOk ? t.tokens.accent : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {doctorOk ? <Icon name="check" color={t.tokens.accentForeground} size={16} strokeWidth={3} /> : null}
            </View>
            <AppText style={{ ...t.type.body, fontWeight: '700', flex: 1, color: t.tokens.cardForeground }}>{tr('kegel.tracks.doctorOk', ctx)}</AppText>
          </ScalePressable>
          <Button
            label={tr('kegel.tracks.openSurgery')}
            disabled={!doctorOk}
            fullWidth
            onPress={() => {
              confirmSurgeryClearance();
              chooseTrack('surgery');
              setSurgeryOpen(false);
            }}
          />
        </Card>
      ) : null}

      <Card style={{ padding: t.space.xl, gap: t.space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
          <Icon name="body" size="md" color={t.tokens.primary} />
          <AppText style={{ ...t.type.subheading, flex: 1, color: t.tokens.cardForeground }}>{tr('kegel.tracks.positionsTitle', { week: week + 1 })}</AppText>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.xs }}>
          {positionsFor(training.track, week).map((p) => (
            <Badge key={p} variant="secondary" label={positionCard(p).title} />
          ))}
        </View>
        <AppText style={{ ...t.type.small, color: t.tokens.mutedForeground }}>{functionalUnlocked(week) ? tr('kegel.tracks.functionalOn') : tr('kegel.tracks.positionsHint')}</AppText>
      </Card>

      <Button label={profile ? tr('kegel.tracks.rescreen') : tr('kegel.tracks.screen')} icon="compass" variant="secondary" onPress={() => router.push('/kegel/screening')} fullWidth />
    </Screen>
  );
}
