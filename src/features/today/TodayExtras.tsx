import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Card, IconTile, Progress, ScalePressable, Sheet } from '@/components/ui';
import type { ModuleTone } from '@/config/theme';
import { CHALLENGES, NUTRITION_DAYS, NUTRITION_PLAN, STORIES, type StoryCategory } from '@/features/content/data';
import { nutritionDayIndex, nutritionTasksForDay, storyOfTheDay } from '@/features/content/daily';
import { recommendedRoutine, routineDurationSec } from '@/features/fitness/routines';
import { openGated } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import type { ChallengeCategory } from '@/types';

const STORY_ICON: Record<StoryCategory, IconName> = { menHealth: 'shield', relationships: 'user', nutrition: 'leaf', sleep: 'moon', stress: 'wind', exercise: 'body' };
const FOOD_ICON: Record<ChallengeCategory, IconName> = { snack: 'leaf', fruit: 'sun', plate: 'layers' };

/** Size of a "Senin için" card (§7.1.4). */
const CARD_W = 240;
const CARD_H = 140;

/**
 * "Senin için" — ui-v3 (SPEC_UI_V3 §7.1.4): one horizontal row of small cards (story of the day,
 * suggested routine, nutrition tip, camps). The nutrition list (information only) opens in a sheet.
 */
export function TodayExtras() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const today = toDateKey();
  const startedAt = useProfileStore((s) => s.profile.createdAt);
  const read = useProgressStore((s) => s.content.readStoryIds);
  const activity = useProfileStore((s) => s.profile.activity);
  const [foodOpen, setFoodOpen] = useState(false);

  const dayIdx = nutritionDayIndex(toDateKey(new Date(startedAt)), today, NUTRITION_DAYS);
  const story = storyOfTheDay(today, STORIES, read);
  const routine = recommendedRoutine(activity);
  const foods = nutritionTasksForDay(NUTRITION_PLAN, CHALLENGES, dayIdx);

  return (
    <View style={{ gap: t.space.md }}>
      <AppText variant="title2" accessibilityRole="header">
        {tr('today.forYou')}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -t.space.gutter }} contentContainerStyle={{ paddingHorizontal: t.space.gutter, gap: t.space.md }}>
        {story ? (
          <ForYouCard
            icon={STORY_ICON[story.category]}
            tone="knowledge"
            kicker={tr('today.forYouStory')}
            title={story.title}
            meta={tr('stories.minutes', { count: story.minutes })}
            onPress={() => openGated('stories', { pathname: '/story/[storyId]', params: { storyId: story.id } })}
          />
        ) : null}
        <ForYouCard
          icon="body"
          tone="kegel"
          kicker={tr('today.forYouFitness')}
          title={tr('today.fitness', { name: routine.name })}
          meta={tr('common.minutes', { count: Math.round(routineDurationSec(routine) / 60) })}
          onPress={() => openGated('fitness', { pathname: '/fitness/[routineId]', params: { routineId: routine.id } })}
        />
        {foods.length ? <ForYouCard icon="leaf" tone="campus" kicker={tr('today.nutritionTitle')} title={tr('today.nutritionSub')} meta={tr('today.challengesHint', { day: dayIdx + 1, total: NUTRITION_DAYS })} onPress={() => setFoodOpen(true)} /> : null}
        <ForYouCard icon="compass" tone="smokefree" kicker={tr('today.campTitle')} title={tr('today.campSub')} meta={tr('today.campOpen')} onPress={() => router.push('/camps')} />
      </ScrollView>

      <Sheet visible={foodOpen} onClose={() => setFoodOpen(false)} title={tr('today.nutritionTitle')} description={tr('today.challengesHint', { day: dayIdx + 1, total: NUTRITION_DAYS })}>
        <FoodList dayIdx={dayIdx} />
      </Sheet>
    </View>
  );
}

function ForYouCard({ icon, tone, kicker, title, meta, onPress }: { icon: IconName; tone: ModuleTone; kicker: string; title: string; meta: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={`${kicker}. ${title}. ${meta}`} style={{ width: CARD_W, minHeight: CARD_H, padding: t.space.lg, gap: t.space.sm, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
        <IconTile icon={icon} tone={tone} />
        <AppText variant="caption" muted style={{ flex: 1 }}>
          {kicker}
        </AppText>
      </View>
      <AppText variant="title3">{title}</AppText>
      <AppText variant="footnote" muted>
        {meta}
      </AppText>
    </Card>
  );
}

/** Today's 3 foods (information only, nothing to tick); "Neden?" opens the reason and the source. */
function FoodList({ dayIdx }: { dayIdx: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const items = nutritionTasksForDay(NUTRITION_PLAN, CHALLENGES, dayIdx);
  return (
    <View style={{ gap: t.space.md }}>
      <Progress value={(dayIdx + 1) / NUTRITION_DAYS} label={tr('today.challengesHint', { day: dayIdx + 1, total: NUTRITION_DAYS })} />
      {items.map((c, i) => {
        const open = openId === c.id;
        return (
          <View key={c.id} style={{ gap: t.space.sm, paddingTop: i ? t.space.md : 0, borderTopWidth: i ? t.border.thin : 0, borderTopColor: t.tokens.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: t.touch }}>
              <IconTile icon={FOOD_ICON[c.category]} tone="campus" />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{c.text}</AppText>
                <AppText variant="footnote" muted>
                  {tr(`challengeCategory.${c.category}`)}
                </AppText>
              </View>
              <ScalePressable
                onPress={() => setOpenId(open ? null : c.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={tr('today.challengeWhyA11y', { task: c.text })}
                hitSlop={(t.touch - 36) / 2}
                style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.md, minHeight: 36, borderRadius: t.radius.pill, backgroundColor: open ? t.tokens.primarySoft : t.tokens.muted }}
              >
                <Icon name={open ? 'chevronUp' : 'info'} size="sm" color={open ? t.tokens.primary : t.tokens.mutedForeground} />
                <AppText variant="footnote" style={{ fontWeight: '500', color: open ? t.tokens.primary : t.tokens.foreground }}>
                  {tr('today.challengeWhy')}
                </AppText>
              </ScalePressable>
            </View>
            {open ? (
              <View style={{ gap: t.space.xs, padding: t.space.md, borderRadius: t.radius.md, backgroundColor: t.tokens.muted }}>
                <AppText variant="callout">{c.why}</AppText>
                <ScalePressable onPress={() => void Linking.openURL(c.source.url)} accessibilityRole="link" accessibilityLabel={tr('today.challengeSource', { title: c.source.title })} style={{ minHeight: t.touch, justifyContent: 'center' }}>
                  <AppText variant="footnote" muted style={{ textDecorationLine: 'underline' }}>
                    {tr('today.challengeSource', { title: c.source.title })}
                  </AppText>
                </ScalePressable>
              </View>
            ) : null}
          </View>
        );
      })}
      <AppText variant="footnote" muted>
        {tr('today.challengesNote')}
      </AppText>
    </View>
  );
}
