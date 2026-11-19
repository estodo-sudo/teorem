import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { WorkoutCard } from '@/features/today/WorkoutCard';
import { todayPlanDay, todayWeekIndex } from '@/features/training/plan';
import { deloadOnPlanDay, roadmapNodes, weekIndexForPlanDay, weekTheme } from '@/features/training/roadmap';
import { strengthFallingTwoWeeks } from '@/features/training/schedule';
import { useHistoryStore } from '@/stores/historyStore';
import { DayNode, DayPreview, FunctionalTasksCard } from '@/features/training/RoadmapViews';
import { KEGEL_TRACKS } from '@/features/training/tracks';
import { toDateKey } from '@/lib/date';
import { goBack } from '@/lib/nav';
import { useTrainingStore } from '@/stores/trainingStore';

/** Zig-zag offsets (fraction of the width) so the path winds down the screen. */
const NODE = 48;
const ROW = 64;
const WIND = [0.5, 0.72, 0.85, 0.72, 0.5, 0.28, 0.15, 0.28];

/**
 * Plan yol haritası (SPEC_KEGEL_V2 §8): the 30-day plan as a winding path, one node per day, under
 * week headers. Tap a day for its session. Top: track (change), level, this week's theme, duration
 * chips and start (today card). From week 6: the functional tasks strip.
 */
export default function PlanScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const nodes = roadmapNodes(training, today);
  const [preview, setPreview] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const track = KEGEL_TRACKS.find((x) => x.id === training.track) ?? KEGEL_TRACKS[0]!;
  const planWeek = Math.min(3, Math.floor(todayPlanDay(training, today) / 7));
  const week = todayWeekIndex(training, today);
  const falling = useHistoryStore((h) => strengthFallingTwoWeeks(h.strengthTests));

  return (
    <Screen>
      <Header title={tr('training.roadmap.title', { plan: training.planNumber })} onBack={() => goBack('/(tabs)/training')} />
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppText variant="h2">{track.emoji}</AppText>
          <View style={{ flex: 1 }}>
            <AppText weight="800">{track.title}</AppText>
            <AppText variant="small" muted>
              {tr('training.roadmap.level', { level: training.level })} · {weekTheme(planWeek).title}
            </AppText>
          </View>
          <Button label={tr('kegel.card.change')} variant="secondary" onPress={() => router.push('/kegel/tracks')} />
        </View>
        <AppText variant="small" muted>
          {weekTheme(planWeek).text}
        </AppText>
      </Card>
      <WorkoutCard />
      <FunctionalTasksCard track={training.track} weekIndex={week} />

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap: 4 }}>
        {[0, 1, 2, 3].map((w) => {
          const weekNodes = nodes.filter((n) => n.week === w);
          // Node centres on a winding path that always stays inside the width.
          const span = Math.max(0, width - NODE);
          const pts = weekNodes.map((n, i) => ({ n, x: WIND[n.day % WIND.length]! * span + NODE / 2, y: i * ROW + ROW / 2 }));
          const height = weekNodes.length * ROW;
          return (
            <View key={w} style={{ gap: 4 }}>
              <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.colors.border, marginTop: w ? 8 : 0 }}>
                <AppText weight="800">
                  {weekTheme(w).title}
                  {w !== 3 && weekNodes.some((n) => deloadOnPlanDay(training, today, n.day, falling)) ? ` · ${tr('today.workout.deload')}` : ''}
                </AppText>
              </View>
              <View style={{ height }}>
                {width > 0 ? (
                  <Svg width={width} height={height} style={{ position: 'absolute' }} pointerEvents="none">
                    {pts.slice(1).map((p, i) => (
                      <Line
                        key={p.n.day}
                        x1={pts[i]!.x}
                        y1={pts[i]!.y}
                        x2={p.x}
                        y2={p.y}
                        stroke={p.n.state === 'future' ? t.colors.border : t.colors.accent}
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeDasharray={p.n.state === 'future' ? '2 8' : undefined}
                      />
                    ))}
                  </Svg>
                ) : null}
                {pts.map((p) => (
                  <View key={p.n.day} style={{ position: 'absolute', left: p.x - NODE / 2, top: p.y - NODE / 2 }}>
                    <DayNode node={p.n} onPress={() => setPreview(p.n.day)} />
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {preview !== null ? <DayPreview visible day={preview} week={weekIndexForPlanDay(training, today, preview)} training={training} onClose={() => setPreview(null)} /> : null}
    </Screen>
  );
}
