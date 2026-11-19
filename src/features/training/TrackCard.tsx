import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, useTheme } from '@/components';
import { toDateKey } from '@/lib/date';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';

import { needsScreening, rescreenReminder } from './kegelProfile';
import { todayWeekIndex } from './plan';
import { positionCard } from './player/playerUi';
import { KEGEL_TRACKS, positionsFor } from './tracks';

/**
 * Training tab: the active track (change it), this week's positions, and — once — the muscle profile
 * screening for users who have not done it (existing users after the update included).
 */
export function TrackCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const profile = useKegelStore((s) => s.profile);
  const skipped = useKegelStore((s) => s.screeningSkippedAt);
  const track = KEGEL_TRACKS.find((x) => x.id === training.track) ?? KEGEL_TRACKS[0]!;
  const week = todayWeekIndex(training, toDateKey());
  const ask = needsScreening({ profile, screeningSkippedAt: skipped });
  const rescreen = rescreenReminder({ profile }, training.track);

  return (
    <View style={{ gap: 10 }}>
      {ask || rescreen ? (
        <Card style={{ gap: 8, borderLeftWidth: 4, borderLeftColor: t.colors.breathe }}>
          <AppText weight="800">{rescreen ? tr('kegel.card.rescreenTitle') : tr('kegel.card.screenTitle')}</AppText>
          <AppText variant="small" muted>
            {rescreen ? tr('kegel.card.rescreenText') : tr('kegel.card.screenText')}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label={tr('kegel.card.screenStart')} variant="accent" style={{ flex: 1 }} onPress={() => router.push('/kegel/screening')} />
            {ask ? <Button label={tr('kegel.card.later')} variant="ghost" style={{ flex: 1 }} onPress={() => useKegelStore.getState().skipScreening(new Date().toISOString())} /> : null}
          </View>
        </Card>
      ) : null}
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppText variant="h2">{track.emoji}</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="small" weight="800" muted>
              {tr('kegel.card.track')}
            </AppText>
            <AppText weight="800">{track.title}</AppText>
          </View>
          <Button label={tr('kegel.card.change')} variant="secondary" onPress={() => router.push('/kegel/tracks')} />
        </View>
        <AppText variant="small" muted>
          {tr('kegel.card.positions', {
            list: positionsFor(training.track, week)
              .map((p) => positionCard(p).title)
              .join(' · '),
          })}
        </AppText>
      </Card>
    </View>
  );
}
