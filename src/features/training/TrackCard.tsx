import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, useTheme } from '@/components';
import { Card, IconTile, Progress } from '@/components/ui';
import { toDateKey } from '@/lib/date';
import { useTrainingStore } from '@/stores/trainingStore';

import { todayPlanDay } from './plan';
import { roadmapNodes, weekTheme } from './roadmap';

/**
 * Program header (SPEC_UI_V3 §7.2.1): the programme, level, this week's theme and the week's progress
 * bar. One programme for everyone (user decision 2026-11-22): no track to change, no positions.
 */
export function TrackCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const planWeek = Math.min(3, Math.floor(todayPlanDay(training, today) / 7));
  const strip = roadmapNodes(training, today).filter((n) => n.week === planWeek);
  const done = strip.filter((n) => n.state === 'done').length;
  const weekLabel = tr('training.weekProgress', { done, total: strip.length });

  return (
    <Card style={{ padding: t.space.gutter, gap: t.space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
        <IconTile icon="pulse" size="lg" />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" muted>
            {tr('training.programmeKicker')}
          </AppText>
          <AppText variant="title3">{tr('profile.training.programme')}</AppText>
        </View>
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
    </Card>
  );
}

