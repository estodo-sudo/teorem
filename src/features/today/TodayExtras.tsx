import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, useTheme } from '@/components';
import { CHALLENGES, NUTRITION_DAYS, NUTRITION_PLAN, STORIES } from '@/features/content/data';
import { nutritionDayIndex, nutritionTasksForDay, storyOfTheDay } from '@/features/content/daily';
import { StoryBubble } from '@/features/content/StoryBubble';
import { recommendedRoutine, routineDurationSec } from '@/features/fitness/routines';
import { strengthTestDue } from '@/features/progress/stats';
import { openGated } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';

/** Secondary cards on the Today screen. */
export function TodayExtras() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const today = toDateKey();
  const startedAt = useProfileStore((s) => s.profile.createdAt);
  const read = useProgressStore((s) => s.content.readStoryIds);
  const activity = useProfileStore((s) => s.profile.activity);
  const tests = useHistoryStore((s) => s.strengthTests);

  // Today's 3 foods come from the 28-day plan, counted from the first app day (information only, nothing to tick).
  const dayIdx = nutritionDayIndex(toDateKey(new Date(startedAt)), today, NUTRITION_DAYS);

  const story = storyOfTheDay(today, STORIES, read);
  const routine = recommendedRoutine(activity);
  const due = strengthTestDue(tests, today);
  const [openId, setOpenId] = useState<string | null>(null);
  const challenges = nutritionTasksForDay(NUTRITION_PLAN, CHALLENGES, dayIdx);

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
        <Card style={{ gap: 12 }}>
          <View style={{ gap: 2 }}>
            <AppText variant="h3">{tr('today.challenges')}</AppText>
            <AppText variant="small" muted>
              {tr('today.challengesHint', { day: dayIdx + 1, total: NUTRITION_DAYS })}
            </AppText>
          </View>
          {challenges.map((c) => {
            const open = openId === c.id;
            return (
              <View key={c.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="h3">{c.emoji}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="700">{c.text}</AppText>
                    <AppText variant="tiny" muted>
                      {tr(`challengeCategory.${c.category}`)}
                    </AppText>
                  </View>
                  <Pressable
                    onPress={() => setOpenId(open ? null : c.id)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={tr('today.challengeWhyA11y', { task: c.text })}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 10,
                      minHeight: 32,
                      borderRadius: t.radius.pill,
                      backgroundColor: open ? t.colors.info : t.colors.surfaceAlt,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <AppText variant="tiny">💡</AppText>
                    <AppText variant="tiny" weight="800" color={open ? t.colors.infoText : t.colors.text}>
                      {tr('today.challengeWhy')}
                    </AppText>
                  </Pressable>
                </View>
                {open ? (
                  <View style={{ marginLeft: 56, padding: 12, gap: 6, borderRadius: t.radius.lg, borderTopLeftRadius: 4, backgroundColor: t.colors.surfaceAlt, borderLeftWidth: 3, borderLeftColor: t.colors.info }}>
                    <AppText variant="small">{c.why}</AppText>
                    <Pressable onPress={() => void Linking.openURL(c.source.url)} accessibilityRole="link">
                      <AppText variant="tiny" muted>
                        {tr('today.challengeSource', { title: c.source.title })}
                      </AppText>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
          <AppText variant="tiny" muted>
            {tr('today.challengesNote')}
          </AppText>
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
