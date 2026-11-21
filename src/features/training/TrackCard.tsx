import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';
import { Button, Card, IconTile, Progress } from '@/components/ui';
import { toDateKey } from '@/lib/date';
import { useTrainingStore } from '@/stores/trainingStore';

import { todayPlanDay, todayWeekIndex } from './plan';
import { positionCard } from './player/playerUi';
import { roadmapNodes, weekTheme } from './roadmap';
import { TRACK_ICON } from './trackIcons';
import { KEGEL_TRACKS, positionsFor } from './tracks';

/**
 * Program header (SPEC_UI_V3 §7.2.1): the active track (change it), level, this week's theme and the
 * week's progress bar; this week's positions underneath.
 */
export function TrackCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const track = KEGEL_TRACKS.find((x) => x.id === training.track) ?? KEGEL_TRACKS[0]!;
  const week = todayWeekIndex(training, today);
  const planWeek = Math.min(3, Math.floor(todayPlanDay(training, today) / 7));
  const strip = roadmapNodes(training, today).filter((n) => n.week === planWeek);
  const done = strip.filter((n) => n.state === 'done').length;
  const weekLabel = tr('training.weekProgress', { done, total: strip.length });

  return (
    <Card style={{ padding: t.space.gutter, gap: t.space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
        <IconTile icon={TRACK_ICON[track.id]} size="lg" />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" muted>
            {tr('training.activeTrack')}
          </AppText>
          <AppText variant="title3">{track.title}</AppText>
        </View>
        <Button label={tr('kegel.card.change')} size="sm" variant="ghost" onPress={() => router.push('/kegel/tracks')} />
      </View>
      <View style={{ gap: t.space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.space.sm, flexWrap: 'wrap' }}>
          <AppText variant="callout">{tr('training.levelTheme', { level: training.level, theme: weekTheme(planWeek).title })}</AppText>
          <AppText variant="footnote" muted tabular>
            {weekLabel}
          </AppText>
        </View>
        <Progress value={strip.length ? done / strip.length : 0} label={weekLabel} />
      </View>
      <View style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-start' }}>
        <Icon name="body" size="sm" color={t.tokens.mutedForeground} />
        <AppText variant="footnote" muted style={{ flex: 1 }}>
          {tr('kegel.card.positions', {
            list: positionsFor(training.track, week)
              .map((p) => positionCard(p).title)
              .join(' · '),
          })}
        </AppText>
      </View>
    </Card>
  );
}

