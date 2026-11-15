import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, useTheme } from '@/components';
import { CHALLENGES, STORIES } from '@/features/content/data';
import { pickDailyChallenges, storyOfTheDay } from '@/features/content/daily';
import { StoryBubble } from '@/features/content/StoryBubble';
import { recommendedRoutine, routineDurationSec } from '@/features/fitness/routines';
import { checkAchievements } from '@/features/gamification/service';
import { strengthTestDue } from '@/features/progress/stats';
import { openGated } from '@/features/purchases/useGate';
import { addDays, toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';

/** Secondary cards on the Today screen. */
export function TodayExtras() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const today = toDateKey();
  const log = useProgressStore((s) => s.challengeLogs[today]);
  const yesterday = useProgressStore((s) => s.challengeLogs[addDays(today, -1)]);
  const read = useProgressStore((s) => s.content.readStoryIds);
  const activity = useProfileStore((s) => s.profile.activity);
  const tests = useHistoryStore((s) => s.strengthTests);

  // Create today's challenge set once (deterministic per date).
  useEffect(() => {
    if (!log && CHALLENGES.length) {
      const picks = pickDailyChallenges(today, CHALLENGES, yesterday?.challengeIds ?? []);
      useProgressStore.getState().setChallengeLog({ date: today, challengeIds: picks.map((c) => c.id), completedIds: [] });
    }
  }, [log, today, yesterday]);

  const story = storyOfTheDay(today, STORIES, read);
  const routine = recommendedRoutine(activity);
  const due = strengthTestDue(tests, today);
  const challenges = (log?.challengeIds ?? []).map((id) => CHALLENGES.find((c) => c.id === id)).filter(Boolean) as typeof CHALLENGES;

  return (
    <View style={{ gap: 16 }}>
      {due ? (
        <Card onPress={() => openGated('strengthTest', '/strength-test')} accessibilityLabel={tr('today.strengthDue')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: t.colors.accent }}>
          <AppText variant="h2">📏</AppText>
          <View style={{ flex: 1 }}>
            <AppText weight="700">{tr('today.strengthDue')}</AppText>
            <AppText variant="small" muted>
              {tr('today.strengthDueBody')}
            </AppText>
          </View>
          <Icon name="chevron" color={t.colors.textMuted} size={18} />
        </Card>
      ) : null}

      {challenges.length ? (
        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="h3">{tr('today.challenges')}</AppText>
            <AppText muted>{`${log?.completedIds.length ?? 0}/${challenges.length}`}</AppText>
          </View>
          {challenges.map((c) => {
            const done = log?.completedIds.includes(c.id) ?? false;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  useProgressStore.getState().toggleChallenge(today, c.id);
                  checkAchievements();
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={c.text}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}
              >
                <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: done ? t.colors.success : t.colors.border, backgroundColor: done ? t.colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {done ? <Icon name="check" color="#FFFFFF" size={16} strokeWidth={3} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ textDecorationLine: done ? 'line-through' : 'none' }} muted={done}>
                    {c.text}
                  </AppText>
                  <AppText variant="tiny" muted>
                    {tr(`challengeCategory.${c.category}`)}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      {story ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StoryBubble showLabel={false} story={story} read={read.includes(story.id)} onPress={() => openGated('stories', { pathname: '/story/[storyId]', params: { storyId: story.id } })} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="small" weight="700" color={t.colors.accent}>
              {tr('stories.ofTheDay')}
            </AppText>
            <AppText weight="700">{story.title}</AppText>
            <AppText variant="small" muted>
              {tr('stories.minutes', { count: story.minutes })}
            </AppText>
          </View>
        </Card>
      ) : null}

      <Card onPress={() => openGated('fitness', { pathname: '/fitness/[routineId]', params: { routineId: routine.id } })} accessibilityLabel={tr('today.fitness', { name: routine.name })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="h2">🏋️</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="small" weight="700" color={t.colors.accent}>
            {tr('today.fitnessLabel')}
          </AppText>
          <AppText weight="700">{tr('today.fitness', { name: routine.name })}</AppText>
          <AppText variant="small" muted>
            {tr('common.minutes', { count: Math.round(routineDurationSec(routine) / 60) })}
          </AppText>
        </View>
        <Icon name="chevron" color={t.colors.textMuted} size={18} />
      </Card>

      <Button label={tr('today.breathing')} variant="secondary" icon="wind" onPress={() => openGated('mind', '/mind/breathing')} />
      <Button label={tr('today.achievements')} variant="ghost" icon="trophy" onPress={() => router.push('/achievements')} />
    </View>
  );
}
