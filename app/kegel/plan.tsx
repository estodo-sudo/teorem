import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, Screen, useTheme } from '@/components';
import { Badge, Card, ScalePressable } from '@/components/ui';
import { todayPlanDay } from '@/features/training/plan';
import { deloadOnPlanDay, roadmapNodes, weekIndexForPlanDay, weekTheme, type RoadmapNode } from '@/features/training/roadmap';
import { DayNode, DayPreview } from '@/features/training/RoadmapViews';
import { strengthFallingTwoWeeks } from '@/features/training/schedule';
import { TrackCard } from '@/features/training/TrackCard';
import { toDateKey } from '@/lib/date';
import { goBack } from '@/lib/nav';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

/** Node size and row height of the day path (§7.3: 44 px nodes). */
const NODE = 44;
const ROW = 56;

/**
 * Plan yol haritası — ui-v3 (SPEC_UI_V3 §7.3): no repeated "today's workout" card. The four weeks fold;
 * only the active week is open, the others are one line with their progress ("3/7"). Inside a week the
 * days sit on a thin straight line; deload days carry a small leaf. Tap a day for its session.
 */
export default function PlanScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const nodes = roadmapNodes(training, today);
  const planWeek = Math.min(3, Math.floor(todayPlanDay(training, today) / 7));
  const [open, setOpen] = useState<number | null>(planWeek);
  const [preview, setPreview] = useState<number | null>(null);
  const falling = useHistoryStore((h) => strengthFallingTwoWeeks(h.strengthTests));

  return (
    <Screen>
      <Header title={tr('training.roadmap.title', { plan: training.planNumber })} onBack={() => goBack('/')} />
      <TrackCard />
      <View style={{ gap: t.space.md }}>
        {[0, 1, 2, 3].map((w) => (
          <WeekSection
            key={w}
            week={w}
            nodes={nodes.filter((n) => n.week === w)}
            current={w === planWeek}
            open={open === w}
            onToggle={() => setOpen(open === w ? null : w)}
            isDeload={(day) => w !== 3 && deloadOnPlanDay(training, today, day, falling)}
            onPreview={setPreview}
          />
        ))}
      </View>
      {preview !== null ? <DayPreview visible day={preview} week={weekIndexForPlanDay(training, today, preview)} training={training} onClose={() => setPreview(null)} /> : null}
    </Screen>
  );
}

function WeekSection({ week, nodes, current, open, onToggle, isDeload, onPreview }: { week: number; nodes: RoadmapNode[]; current: boolean; open: boolean; onToggle: () => void; isDeload: (day: number) => boolean; onPreview: (day: number) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const k = t.tokens;
  const theme = weekTheme(week);
  const done = nodes.filter((n) => n.state === 'done').length;
  const finished = done === nodes.length && nodes.length > 0;
  return (
    <Card>
      <ScalePressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={tr('training.weekA11y', { title: theme.title, done, total: nodes.length })}
        style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingHorizontal: t.space.lg, paddingVertical: t.space.md }}
      >
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: finished ? k.primary : current ? k.primarySoft : k.muted }}>
          {finished ? (
            <Icon name="check" size="sm" color={k.primaryForeground} />
          ) : (
            <AppText variant="footnote" tabular style={{ fontWeight: '600', color: current ? k.primary : k.mutedForeground }}>
              {week + 1}
            </AppText>
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title3" accessibilityRole="header">
            {theme.title}
          </AppText>
          {current ? <Badge label={tr('training.weekStatus.current')} /> : null}
        </View>
        <AppText variant="footnote" muted tabular>
          {tr('training.weekCount', { done, total: nodes.length })}
        </AppText>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size="md" color={k.subtle} />
      </ScalePressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(t.motion.normal).reduceMotion(ReduceMotion.System)} style={{ paddingHorizontal: t.space.lg, paddingBottom: t.space.lg, gap: t.space.md }}>
          <AppText variant="callout" muted>
            {theme.text}
          </AppText>
          <View accessibilityRole="list">
            {nodes.map((n, i) => {
              const deload = isDeload(n.day);
              const last = i === nodes.length - 1;
              return (
                <View key={n.day} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, height: ROW }}>
                  <View style={{ width: NODE, height: ROW, alignItems: 'center', justifyContent: 'center' }}>
                    {/* Thin straight connector between the days */}
                    {i > 0 ? <View style={{ position: 'absolute', top: 0, height: (ROW - NODE) / 2, width: t.border.thick, backgroundColor: k.border }} /> : null}
                    {!last ? <View style={{ position: 'absolute', bottom: 0, height: (ROW - NODE) / 2, width: t.border.thick, backgroundColor: k.border }} /> : null}
                    <DayNode node={n} size={NODE} deload={deload} onPress={() => onPreview(n.day)} />
                  </View>
                  <AppText variant="body" style={{ flex: 1, color: n.state === 'future' ? k.mutedForeground : k.foreground }}>
                    {tr('training.dayLabel', { day: n.day + 1 })}
                  </AppText>
                  {deload ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs }}>
                      <Icon name="leaf" size="sm" color={t.tone.mind.fg} />
                      <AppText variant="footnote" muted>
                        {tr('training.deloadDay')}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}
    </Card>
  );
}
