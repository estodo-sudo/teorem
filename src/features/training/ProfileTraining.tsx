import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';
import { Button, Card, IconTile, Sheet } from '@/components/ui';
import { toDateKey } from '@/lib/date';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { KegelExerciseType } from '@/types';

import { ExerciseDemo } from './ExerciseDemo';
import { EXERCISE_GUIDE } from './exerciseGuide';
import { needsScreening, rescreenReminder } from './kegelProfile';
import { todayPlanDay } from './plan';
import { weekTheme } from './roadmap';
import { KEGEL_TRACKS } from './tracks';

/** "Kegel antrenmanı" and "Seviye 1 · 1. hafta: Kası tanı" (one programme for everyone; no track to pick). */
export function ActiveTrackCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const planWeek = Math.min(3, Math.floor(todayPlanDay(training, toDateKey()) / 7));
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, padding: t.space.lg }}>
      <IconTile icon="pulse" />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{tr('profile.training.programme')}</AppText>
        <AppText variant="footnote" muted>
          {tr('profile.training.levelWeek', { level: training.level, theme: weekTheme(planWeek).title })}
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
export function ExerciseGuide() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [demo, setDemo] = useState<KegelExerciseType | null>(null);
  return (
    <>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {EXERCISE_GUIDE.map((x, i) => (
          <Pressable
            key={x.type}
            onPress={() => setDemo(x.type)}
            accessibilityRole="button"
            accessibilityLabel={tr('training.howToA11y', { name: tr(`exercise.${x.type}.name`) })}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 56, paddingHorizontal: t.space.lg, paddingVertical: t.space.sm, borderTopWidth: i ? 1 : 0, borderTopColor: t.tokens.border, backgroundColor: pressed ? t.tokens.muted : 'transparent' })}
          >
            <IconTile icon={x.icon} tone={x.type === 'release' || x.type === 'breath' ? 'mind' : 'kegel'} size="sm" />
            <AppText variant="body" style={{ flex: 1 }}>
              {tr(`exercise.${x.type}.name`)}
            </AppText>
            <Icon name="chevron" size="sm" color={t.tokens.subtle} />
          </Pressable>
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
