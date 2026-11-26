import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';
import { SHOW_COMING_SOON } from '@/config/app';
import { Button, Card, IconTile, Sheet } from '@/components/ui';
import { ExplorePhoto } from '@/features/content/explore/ExploreCards';
import { toDateKey } from '@/lib/date';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { KegelExerciseType } from '@/types';

import { ExerciseDemo } from './ExerciseDemo';
import { EXERCISE_GUIDE, LOCKED_EXERCISES } from './exerciseGuide';
import { needsScreening, rescreenReminder } from './kegelProfile';
import { currentPlanWeek, weekTheme } from './roadmap';
import { KEGEL_TRACKS } from './tracks';

/** "Kegel antrenmanı" and "Seviye 1 · 1. hafta: Kası tanı" (one programme for everyone; no track to pick). */
export function ActiveTrackCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const { stage: planStage, week: planWeek } = currentPlanWeek(training, toDateKey());
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, padding: t.space.lg }}>
      <IconTile icon="pulse" />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{tr('profile.training.programme')}</AppText>
        <AppText variant="footnote" muted>
          {tr('profile.training.levelWeek', { level: training.level, theme: weekTheme(planWeek, planStage).title })}
        </AppText>
      </View>
    </Card>
  );
}

/**
 * "Kas yapını öğrenelim" (was "Kas profilini tamamla"). Not done yet: a short explanation and "Başla"
 * (no "Daha sonra"). Done: one line with the result and "Güncelle".
 */
export function MuscleStructureCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const profile = useKegelStore((s) => s.profile);
  const skipped = useKegelStore((s) => s.screeningSkippedAt);
  const ask = needsScreening({ profile, screeningSkippedAt: skipped }) || !profile;
  const rescreen = rescreenReminder({ profile }, training.track);

  if (ask) {
    return (
      <Card style={{ gap: t.space.md, padding: t.space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
          <IconTile icon="body" tone="mind" />
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            {tr('profile.training.muscleTitle')}
          </AppText>
        </View>
        <AppText variant="callout" muted>
          {tr('kegel.card.screenText')}
        </AppText>
        <Button label={tr('kegel.card.screenStart')} variant="secondary" onPress={() => router.push('/kegel/screening')} fullWidth />
      </Card>
    );
  }
  const track = KEGEL_TRACKS.find((x) => x.id === profile!.primaryTrack) ?? KEGEL_TRACKS[0]!;
  const summary = tr('profile.training.muscleSummary', { track: track.title, relax: tr(profile!.hypertonicFlag ? 'profile.training.relaxFirst' : 'profile.training.relaxOk') });
  return (
    <Pressable onPress={() => router.push('/kegel/screening')} accessibilityRole="button" accessibilityLabel={`${summary}. ${tr('profile.training.update')}`} accessibilityHint={rescreen ? tr('kegel.card.rescreenText') : undefined}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, padding: t.space.lg }}>
        <IconTile icon="body" tone="mind" />
        <AppText variant="callout" style={{ flex: 1 }}>
          {summary}
        </AppText>
        <AppText variant="callout" weight="600" color={t.tokens.primary}>
          {rescreen ? tr('profile.training.rescreen') : tr('profile.training.update')}
        </AppText>
      </Card>
    </Pressable>
  );
}

/** "Egzersiz rehberi": the 8 moves as list rows; a row opens its animated how-to. */
type Theme = ReturnType<typeof useTheme>;
const rowStyle = (t: Theme, i: number): ViewStyle => ({ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 72, paddingHorizontal: t.space.lg, paddingVertical: t.space.md, borderTopWidth: i ? 1 : 0, borderTopColor: t.tokens.border });
const coverStyle = (t: Theme): ViewStyle => ({ width: 52, height: 52, borderRadius: t.radius.button });

export function ExerciseGuide() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [demo, setDemo] = useState<KegelExerciseType | null>(null);
  return (
    <>
      {/* 12 moves, one under the other: the 3 of the programme open, 9 locked "for higher levels" (2026-11-22). */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {EXERCISE_GUIDE.map((x, i) => (
          <Pressable
            key={x.type}
            onPress={() => setDemo(x.type)}
            accessibilityRole="button"
            accessibilityLabel={tr('training.howToA11y', { name: tr(`exercise.${x.type}.name`) })}
            style={({ pressed }) => [rowStyle(t, i), { backgroundColor: pressed ? t.tokens.muted : 'transparent' }]}
          >
            <ExplorePhoto icon={x.icon} tone="kegel" iconSize="lg" style={coverStyle(t)} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">{tr(`exercise.${x.type}.name`)}</AppText>
              <AppText variant="footnote" muted numberOfLines={2}>
                {tr(`exercise.${x.type}.desc`)}
              </AppText>
            </View>
            <Icon name="chevron" size="sm" color={t.tokens.subtle} />
          </Pressable>
        ))}
        {/* Locked "İlerleyen seviyelerde açılacak" rows: hidden while SHOW_COMING_SOON is off (2026-11-23). */}
        {(SHOW_COMING_SOON ? LOCKED_EXERCISES : []).map((x, i) => (
          <View key={x.id} style={rowStyle(t, EXERCISE_GUIDE.length + i)} accessible accessibilityLabel={`${tr('exerciseSoon.title', { n: EXERCISE_GUIDE.length + i + 1 })}. ${tr('exerciseSoon.locked')}`}>
            <View style={[coverStyle(t), { alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.muted }]}>
              <Icon name="lock" size="md" color={t.tokens.mutedForeground} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong" muted>
                {tr('exerciseSoon.title', { n: EXERCISE_GUIDE.length + i + 1 })}
              </AppText>
              <AppText variant="footnote" muted>
                {tr('exerciseSoon.locked')}
              </AppText>
            </View>
          </View>
        ))}
      </Card>
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
    </>
  );
}
