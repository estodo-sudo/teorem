import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Icon, Screen, useTheme } from '@/components';
import { CAMPS } from '@/features/camps/registry';
import { CAMPUSES, CampusCard, campusEmoji, GlossaryCard, SeeAllCard } from '@/features/content/cards';
import { GLOSSARY, STORIES } from '@/features/content/data';
import { storyOfTheDay } from '@/features/content/daily';
import { StoryBubble } from '@/features/content/StoryBubble';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useProgressStore } from '@/stores/progressStore';

/** Camps, campuses and "Neden, Nedir ve Ne Demek?" show this many rows, then a "see all" row. */
const PREVIEW_ROWS = 3;

export default function Discover() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const content = useProgressStore((s) => s.content);
  const access = useAccess();
  const read = content.readStoryIds;
  const daily = storyOfTheDay(toDateKey(), STORIES, read);
  const favorites = STORIES.filter((s) => content.favoriteStoryIds.includes(s.id));
  const openStory = (id: string) => openGated('stories', { pathname: '/story/[storyId]', params: { storyId: id } });

  return (
    <Screen>
      <AppText variant="h1" accessibilityRole="header">
        {tr('discover.title')}
      </AppText>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="h2">{tr('stories.title')}</AppText>
          <AppText muted>{tr('stories.readCount', { read: read.filter((id) => STORIES.some((s) => s.id === id)).length, total: STORIES.length })}</AppText>
        </View>
        {daily ? (
          <Card onPress={() => openStory(daily.id)} accessibilityLabel={`${tr('stories.ofTheDay')}: ${daily.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.primary, borderColor: t.colors.primary }}>
            <AppText variant="h1">{daily.emoji}</AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="small" weight="700" color={t.colors.primaryText} style={{ opacity: 0.8 }}>
                {tr('stories.ofTheDay')}
              </AppText>
              <AppText weight="800" color={t.colors.primaryText}>
                {daily.title}
              </AppText>
            </View>
            <Icon name={access('stories') ? 'play' : 'lock'} color={t.colors.primaryText} size={20} />
          </Card>
        ) : null}
        {favorites.length ? (
          <>
            <AppText variant="h3">{tr('stories.favorites')}</AppText>
            <BubbleRow items={favorites.map((s) => ({ story: s, read: read.includes(s.id) }))} onOpen={openStory} />
          </>
        ) : null}
        <View style={{ gap: 6 }}>
          <AppText variant="h3">{tr('stories.allRow')}</AppText>
          <BubbleRow items={STORIES.map((s) => ({ story: s, read: read.includes(s.id) }))} onOpen={openStory} />
        </View>
      </View>

      <AppText variant="h2" style={{ marginTop: 8 }}>
        {tr('camps.title')}
      </AppText>
      {CAMPS.slice(0, PREVIEW_ROWS).map((c) => (
        <c.Card key={c.id} />
      ))}
      {CAMPS.length > PREVIEW_ROWS ? (
        <SeeAllCard
          label={tr('camps.seeAll')}
          hint={tr('camps.moreCount', { count: CAMPS.length - PREVIEW_ROWS })}
          emojis={CAMPS.slice(PREVIEW_ROWS).map((c) => c.emoji)}
          moreCount={CAMPS.length - PREVIEW_ROWS}
          onPress={() => router.push('/camps')}
        />
      ) : null}

      <AppText variant="h2" style={{ marginTop: 8 }}>
        {tr('courses.title')}
      </AppText>
      {CAMPUSES.slice(0, PREVIEW_ROWS).map((c) => (
        <CampusCard key={c.id} entry={c} />
      ))}
      {CAMPUSES.length > PREVIEW_ROWS ? (
        <SeeAllCard
          label={tr('courses.seeAll')}
          hint={tr('courses.moreCount', { count: CAMPUSES.length - PREVIEW_ROWS })}
          emojis={CAMPUSES.slice(PREVIEW_ROWS).map(campusEmoji)}
          moreCount={CAMPUSES.length - PREVIEW_ROWS}
          onPress={() => router.push('/course')}
        />
      ) : null}

      <AppText variant="h2" style={{ marginTop: 8 }}>
        {tr('glossary.title')}
      </AppText>
      <AppText muted>{tr('glossary.subtitle')}</AppText>
      {GLOSSARY.slice(0, PREVIEW_ROWS).map((g) => (
        <GlossaryCard key={g.id} term={g} detail="short" />
      ))}
      {GLOSSARY.length > PREVIEW_ROWS ? (
        <SeeAllCard
          label={tr('glossary.seeAll')}
          hint={tr('glossary.moreCount', { count: GLOSSARY.length - PREVIEW_ROWS })}
          emojis={GLOSSARY.slice(PREVIEW_ROWS).map((g) => g.emoji)}
          moreCount={GLOSSARY.length - PREVIEW_ROWS}
          onPress={() => router.push('/glossary')}
        />
      ) : null}
    </Screen>
  );
}

function BubbleRow({ items, onOpen }: { items: { story: (typeof STORIES)[number]; read: boolean }[]; onOpen: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
      {items.map(({ story, read }) => (
        <StoryBubble key={story.id} story={story} read={read} onPress={() => onOpen(story.id)} />
      ))}
    </ScrollView>
  );
}
