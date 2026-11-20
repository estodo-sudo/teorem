import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, Screen } from '@/components';
import { lightTheme } from '@/config/theme';
import { STORIES } from '@/features/content/data';
import { StoryPlayer } from '@/features/content/storyPlayer/StoryPlayer';
import { checkAchievements } from '@/features/gamification/service';
import { useProgressStore } from '@/stores/progressStore';
import { goBack } from '@/lib/nav';
import { IconTile } from '@/components/ui';

export default function StoryScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { t: tr } = useTranslation();
  const story = STORIES.find((s) => s.id === storyId);
  const fav = useProgressStore((s) => (storyId ? s.content.favoriteStoryIds.includes(storyId) : false));
  const toggleFav = useProgressStore((s) => s.toggleFavorite);
  const [done, setDone] = useState(false);
  const close = () => (router.canGoBack() ? goBack() : router.replace('/discover'));

  if (!story) {
    return (
      <Screen>
        <AppText>{tr('stories.notFound')}</AppText>
        <Button label={tr('common.close')} onPress={close} />
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen footer={<Button label={tr('common.done')} variant="accent" size="lg" onPress={close} />}>
        <View style={{ alignItems: 'center', gap: 8, marginTop: 24 }}>
          <IconTile icon={story.icon} tone="knowledge" size="lg" round />
          <AppText variant="h2" center>
            {story.title}
          </AppText>
          <AppText muted center>
            {tr('stories.finished')}
          </AppText>
        </View>
        <Button
          label={fav ? tr('stories.unfavorite') : tr('stories.favorite')}
          variant="secondary"
          icon={fav ? 'starFilled' : 'star'}
          onPress={() => toggleFav(story.id)}
        />
        <Card style={{ gap: 6 }}>
          <AppText weight="700">{tr('stories.sources')}</AppText>
          {story.sources.map((s) => (
            <Pressable key={s.url} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link">
              <AppText variant="small" style={{ textDecorationLine: 'underline' }}>
                {s.title}
              </AppText>
            </Pressable>
          ))}
          <AppText variant="tiny" muted>
            {tr('stories.disclaimer')}
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <StoryPlayer
      title={story.title}
      slides={story.slides}
      onClose={close}
      onFinish={() => {
        useProgressStore.getState().markStoryRead(story.id);
        checkAchievements();
        setDone(true);
      }}
      headerRight={
        <Pressable onPress={() => toggleFav(story.id)} accessibilityRole="button" accessibilityLabel={fav ? tr('stories.unfavorite') : tr('stories.favorite')} hitSlop={10} style={{ padding: 8 }}>
          <Icon name={fav ? 'starFilled' : 'star'} color={lightTheme.focus.text} size={24} />
        </Pressable>
      }
    />
  );
}
