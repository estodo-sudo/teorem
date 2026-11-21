import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Screen } from '@/components';
import { STORIES, type Story } from '@/features/content/data';
import { StoryViewer } from '@/features/content/story/StoryViewer';
import { checkAchievements } from '@/features/gamification/service';
import { goBack } from '@/lib/nav';
import { useProgressStore } from '@/stores/progressStore';

/** The story after this one: the next unread one in order, else simply the next one. */
function nextStoryOf(id: string, read: string[]): Story | undefined {
  const i = STORIES.findIndex((s) => s.id === id);
  if (i < 0 || STORIES.length < 2) return undefined;
  const rest = [...STORIES.slice(i + 1), ...STORIES.slice(0, i)];
  return rest.find((s) => !read.includes(s.id)) ?? rest[0];
}

export default function StoryScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { t: tr } = useTranslation();
  const story = STORIES.find((s) => s.id === storyId);
  const saved = useProgressStore((s) => (storyId ? s.content.favoriteStoryIds.includes(storyId) : false));
  const read = useProgressStore((s) => s.content.readStoryIds);
  // Read once on open, so the viewer does not jump while the position is being saved.
  const [startAt] = useState(() => (storyId ? (useProgressStore.getState().content.storyPositions?.[storyId] ?? 0) : 0));
  const close = () => (router.canGoBack() ? goBack() : router.replace('/discover'));

  if (!story) {
    return (
      <Screen>
        <AppText>{tr('stories.notFound')}</AppText>
        <Button label={tr('common.close')} onPress={close} />
      </Screen>
    );
  }

  const store = useProgressStore.getState;
  return (
    <StoryViewer
      key={story.id}
      story={story}
      startAt={startAt}
      saved={saved}
      onToggleSave={() => store().toggleFavorite(story.id)}
      onIndex={(i) => store().setStoryPosition(story.id, i)}
      onReachedEnd={() => {
        store().markStoryRead(story.id);
        store().setStoryPosition(story.id, null);
        checkAchievements();
      }}
      onClose={close}
      nextStory={nextStoryOf(story.id, read)}
      onOpenStory={(id) => router.replace({ pathname: '/story/[storyId]', params: { storyId: id } })}
    />
  );
}
