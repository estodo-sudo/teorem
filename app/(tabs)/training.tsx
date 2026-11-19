import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Screen, useTheme } from '@/components';
import { GlossaryCard } from '@/features/content/cards';
import { GLOSSARY, type GlossaryTerm } from '@/features/content/data';
import { advancedToday, todayPlanDay, todayWeekIndex } from '@/features/training/plan';
import { deloadOnPlanDay, roadmapNodes, weekIndexForPlanDay, weekTheme } from '@/features/training/roadmap';
import { strengthFallingTwoWeeks } from '@/features/training/schedule';
import { useHistoryStore } from '@/stores/historyStore';
import { DayNode, DayPreview, FunctionalTasksCard } from '@/features/training/RoadmapViews';
import { TrainingFitnessSection } from '@/features/fitness/TrainingFitnessSection';
import { TrainingMindSection } from '@/features/mind/TrainingMindSection';
import { WorkoutCard } from '@/features/today/WorkoutCard';
import { TrackCard } from '@/features/training/TrackCard';
import { toDateKey } from '@/lib/date';
import { useTrainingStore } from '@/stores/trainingStore';
import type { ExerciseType } from '@/types';

/** Sexual-health topics from "Neden, Nedir ve Ne Demek?" shown on the training tab. */
const TOPIC_IDS = ['premature-ejaculation', 'erectile-dysfunction', 'masturbation'];
const TOPICS = TOPIC_IDS.map((id) => GLOSSARY.find((g) => g.id === id)).filter((g): g is GlossaryTerm => !!g);

const TYPES: ExerciseType[] = ['slow_hold', 'quick_flick', 'max_contraction', 'elevator', 'endurance', 'knack', 'release'];

export default function TrainingTab() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const todayIdx = todayPlanDay(training, today);
  const completedDays = advancedToday(training, today) ? todayIdx + 1 : training.planDayIndex;
  const nodes = roadmapNodes(training, today);
  const week = Math.min(3, Math.floor(todayIdx / 7));
  const strip = nodes.filter((n) => n.week === week);
  const [preview, setPreview] = useState<number | null>(null);
  const falling = useHistoryStore((h) => strengthFallingTwoWeeks(h.strengthTests));

  return (
    <Screen>
      <AppText variant="h1" accessibilityRole="header">
        {tr('training.title')}
      </AppText>
      <WorkoutCard />
      <TrackCard />
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="h3">{tr('training.planTitle', { plan: training.planNumber })}</AppText>
          <AppText muted>{tr('training.planProgress', { done: completedDays })}</AppText>
        </View>
        <AppText variant="small" weight="800" muted>
          {weekTheme(week).title}
          {week !== 3 && strip.some((n) => deloadOnPlanDay(training, today, n.day, falling)) ? ` · ${tr('today.workout.deload')}` : ''}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {strip.map((n) => (
            <DayNode key={n.day} node={n} size={40} onPress={() => setPreview(n.day)} />
          ))}
        </View>
        <AppText variant="small" muted>
          {tr('training.planHint')}
        </AppText>
        <Button label={tr('training.roadmap.open')} icon="compass" variant="secondary" onPress={() => router.push('/kegel/plan')} />
      </Card>
      <FunctionalTasksCard track={training.track} weekIndex={todayWeekIndex(training, today)} />
      {preview !== null ? <DayPreview visible day={preview} week={weekIndexForPlanDay(training, today, preview)} training={training} onClose={() => setPreview(null)} /> : null}
      <View style={{ gap: 10 }}>
        <AppText variant="h2" style={{ marginTop: 8 }}>
          {tr('training.topicsTitle')}
        </AppText>
        {TOPICS.map((term) => (
          <GlossaryCard key={term.id} term={term} />
        ))}
      </View>
      <TrainingFitnessSection />
      <TrainingMindSection />
      <AppText variant="h2" style={{ marginTop: 8 }}>
        {tr('training.exercisesTitle')}
      </AppText>
      <View style={{ gap: 10 }}>
        {TYPES.map((type) => (
          <Card key={type} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 10, alignSelf: 'stretch', borderRadius: 5, backgroundColor: type === 'release' ? t.colors.breathe : t.colors.contract }} />
            <View style={{ flex: 1 }}>
              <AppText weight="700">{tr(`exercise.${type}.name`)}</AppText>
              <AppText variant="small" muted>
                {tr(`exercise.${type}.desc`)}
              </AppText>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
