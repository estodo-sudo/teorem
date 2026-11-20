import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme, type IconName } from '@/components';
import { Badge, Button, Card, IconTile, ListItem, Sheet } from '@/components/ui';
import type { ModuleTone } from '@/config/theme';
import { recommendedRoutine, routineDurationSec, ROUTINES } from '@/features/fitness/routines';
import { strengthTestDue } from '@/features/progress/stats';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { ExerciseDemo } from '@/features/training/ExerciseDemo';
import { generateMicroSet } from '@/features/training/generateSession';
import { todayPlanDay, todayWeekIndex } from '@/features/training/plan';
import { roadmapNodes, weekIndexForPlanDay } from '@/features/training/roadmap';
import { DayPreview, FunctionalTasksCard, WeekStrip } from '@/features/training/RoadmapViews';
import { buildTodaySession } from '@/features/training/service';
import { MuscleProfileCard, TrackCard } from '@/features/training/TrackCard';
import { useSessionStarter } from '@/features/training/useSessionStarter';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useKegelStore } from '@/stores/kegelStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { KegelExerciseType } from '@/types';

const LIBRARY: { type: KegelExerciseType; icon: IconName }[] = [
  { type: 'slow_hold', icon: 'clock' },
  { type: 'quick_flick', icon: 'pulse' },
  { type: 'max_contraction', icon: 'target' },
  { type: 'elevator', icon: 'layers' },
  { type: 'endurance', icon: 'timer' },
  { type: 'knack', icon: 'zap' },
  { type: 'release', icon: 'leaf' },
  { type: 'breath', icon: 'wind' },
];
const ROUTINE_ICON: Record<string, IconName> = { beginner: 'leaf', intermediate: 'layers', advanced: 'trophy' };
const MIND: { route: '/mind/breathing' | '/mind/unload' | '/mind/body-scan'; key: string; icon: IconName }[] = [
  { route: '/mind/breathing', key: 'breathing', icon: 'wind' },
  { route: '/mind/unload', key: 'unload', icon: 'leaf' },
  { route: '/mind/body-scan', key: 'bodyScan', icon: 'body' },
];

/**
 * Antrenman — ui-v3 (SPEC_UI_V3 §7.2): the program hub, not a copy of Today. Program header, this week's
 * strip (→ full plan), quick start, the exercise library, pelvic fitness and the mind tools.
 */
export default function TrainingTab() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const nodes = roadmapNodes(training, today);
  const week = Math.min(3, Math.floor(todayPlanDay(training, today) / 7));
  const [preview, setPreview] = useState<number | null>(null);
  const [demo, setDemo] = useState<KegelExerciseType | null>(null);

  return (
    <Screen contentStyle={{ gap: t.space.xxl }}>
      <AppText variant="title1" accessibilityRole="header">
        {tr('training.title')}
      </AppText>

      <View style={{ gap: t.space.md }}>
        <TrackCard />
        <MuscleProfileCard />
      </View>

      <Section title={tr('training.thisWeek')} action={<Button label={tr('training.seePlan')} variant="ghost" size="sm" onPress={() => router.push('/kegel/plan')} />}>
        <Card style={{ padding: t.space.lg }}>
          <WeekStrip training={training} today={today} nodes={nodes} week={week} onPreview={setPreview} />
        </Card>
      </Section>

      <FunctionalTasksCard track={training.track} weekIndex={todayWeekIndex(training, today)} />

      <QuickStart />

      <Section title={tr('training.library')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md }}>
          {LIBRARY.map((x) => (
            <Card key={x.type} onPress={() => setDemo(x.type)} accessibilityLabel={tr('training.howToA11y', { name: tr(`exercise.${x.type}.name`) })} style={{ flexBasis: '47%', flexGrow: 1, padding: t.space.lg, gap: t.space.sm }}>
              <IconTile icon={x.icon} tone={x.type === 'release' || x.type === 'breath' ? 'mind' : 'kegel'} />
              <AppText variant="bodyStrong">{tr(`exercise.${x.type}.name`)}</AppText>
              <AppText variant="footnote" muted>
                {tr('training.howTo')}
              </AppText>
            </Card>
          ))}
        </View>
      </Section>

      <FitnessSection />
      <MindSection />

      {preview !== null ? <DayPreview visible day={preview} week={weekIndexForPlanDay(training, today, preview)} training={training} onClose={() => setPreview(null)} /> : null}
      <Sheet visible={demo !== null} onClose={() => setDemo(null)} title={demo ? tr(`exercise.${demo}.name`) : undefined}>
        {demo ? (
          <View style={{ alignItems: 'center', gap: t.space.lg }}>
            <ExerciseDemo type={demo} />
            <AppText variant="body" style={{ alignSelf: 'stretch' }}>
              {tr(`exercise.${demo}.desc`)}
            </AppText>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.sm }}>
        <AppText variant="title2" accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </AppText>
        {action}
      </View>
      {children}
    </View>
  );
}

/** Quick start (§7.2.3): today's session · micro set · strength test, as three compact cards. */
function QuickStart() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const hypertonic = useKegelStore((s) => s.profile?.hypertonicFlag ?? false);
  const tests = useHistoryStore((s) => s.strengthTests);
  const today = toDateKey();
  const { go, dialog } = useSessionStarter();
  const session = buildTodaySession(training, today);
  const micro = generateMicroSet({ track: training.track, level: training.level, hypertonic, seed: `${today}-micro`, weekIndex: todayWeekIndex(training, today) });
  const due = strengthTestDue(tests, today);
  const items: { key: string; icon: IconName; tone: ModuleTone; title: string; meta: string; onPress: () => void }[] = [
    { key: 'main', icon: 'play', tone: 'kegel', title: tr('training.quickMain'), meta: tr('common.minutes', { count: Math.max(1, Math.round(session.plannedSec / 60)) }), onPress: () => go(today, session.contractions) },
    { key: 'micro', icon: 'pulse', tone: 'kegel', title: tr('training.quickMicro'), meta: tr('common.seconds', { count: micro.plannedSec }), onPress: () => go('micro', micro.contractions) },
    { key: 'test', icon: 'chart', tone: 'mind', title: tr('training.quickTest'), meta: due ? tr('training.quickTestDue') : tr('training.quickTestMeta'), onPress: () => openGated('strengthTest', '/strength-test') },
  ];
  return (
    <Section title={tr('training.quickStart')}>
      <View style={{ flexDirection: 'row', gap: t.space.sm }}>
        {items.map((x) => (
          <Card key={x.key} onPress={x.onPress} accessibilityLabel={`${x.title}, ${x.meta}`} style={{ flex: 1, padding: t.space.md, gap: t.space.sm }}>
            <IconTile icon={x.icon} tone={x.tone} />
            <AppText variant="footnote" style={{ fontWeight: '600' }}>
              {x.title}
            </AppText>
            <AppText variant="caption" muted style={{ fontWeight: '400' }}>
              {x.meta}
            </AppText>
          </Card>
        ))}
      </View>
      {dialog}
    </Section>
  );
}

/** Pelvic fitness routines (§7.2.5): one card of rows; the suggested one carries a badge, no coloured border. */
function FitnessSection() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const activity = useProfileStore((s) => s.profile.activity);
  const rec = recommendedRoutine(activity);
  const access = useAccess()('fitness');
  return (
    <Section title={tr('fitness.title')}>
      <AppText variant="footnote" muted>
        {tr('fitness.subtitle')}
      </AppText>
      <Card style={{ paddingHorizontal: t.space.lg }}>
        {ROUTINES.map((r, i) => (
          <ListItem
            key={r.id}
            divider={i > 0}
            icon={ROUTINE_ICON[r.id] ?? 'body'}
            title={r.name}
            description={tr('fitness.cardMeta', { count: r.steps.length, min: Math.round(routineDurationSec(r) / 60) })}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
                {r.id === rec.id ? <Badge label={tr('fitness.recommended')} /> : null}
                <Icon name={access ? 'chevron' : 'lock'} size="md" color={t.tokens.subtle} />
              </View>
            }
            onPress={() => openGated('fitness', { pathname: '/fitness/[routineId]', params: { routineId: r.id } })}
          />
        ))}
      </Card>
    </Section>
  );
}

/** Mind tools (breathing, unload, body scan), in the mind tone. */
function MindSection() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const access = useAccess();
  return (
    <Section title={tr('mind.title')}>
      <AppText variant="footnote" muted>
        {tr('mind.subtitle')}
      </AppText>
      <Card style={{ paddingHorizontal: t.space.lg }}>
        {MIND.map((m, i) => (
          <ListItem
            key={m.key}
            divider={i > 0}
            icon={m.icon}
            tone="mind"
            title={tr(`mind.${m.key}.title`)}
            description={tr(`mind.${m.key}.card`)}
            right={<Icon name={access('mind') ? 'chevron' : 'lock'} size="md" color={t.tokens.subtle} />}
            onPress={() => openGated('mind', m.route)}
          />
        ))}
      </Card>
      <AppText variant="caption" muted style={{ fontWeight: '400' }}>
        {tr('mind.note')}
      </AppText>
    </Section>
  );
}
