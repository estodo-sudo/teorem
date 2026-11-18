import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_LIBRARY, CAMP_ONBOARDING, campSources } from '@/features/camp/content';
import { isMinor, MEDICATION_STORIES, storyIsFree } from '@/features/camp/engine/premium';
import { useCampStore } from '@/stores/campStore';
import { PremiumLock } from '@/features/camp/ui';
import { StoryPlayer } from '@/features/content/storyPlayer/StoryPlayer';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';

/** One library story, then its sources and the "not medical advice" note. */
export default function CampLibraryStory() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const story = CAMP_LIBRARY.stories.find((s) => s.id === storyId);
  const [done, setDone] = useState(false);
  const back = () => goBack('/camp/library');
  const premium = useAccess()('camp');
  const minor = isMinor(useCampStore((x) => x.profile?.ageRange));

  if (!story) {
    return (
      <Screen>
        <Header title={tr('camp.library.title')} onBack={back} />
      </Screen>
    );
  }
  if (minor && MEDICATION_STORIES.includes(story.id)) {
    return (
      <Screen>
        <Header title={story.title} onBack={back} />
        <Card>
          <AppText variant="small">{CAMP_ONBOARDING.under18}</AppText>
        </Card>
      </Screen>
    );
  }
  if (!premium && !storyIsFree(story.id)) {
    return (
      <Screen>
        <Header title={story.title} onBack={back} />
        <PremiumLock title={tr('camp.premium.story', { title: story.title })} />
      </Screen>
    );
  }
  if (!done) return <StoryPlayer title={story.title} slides={story.slides} onClose={back} onFinish={() => setDone(true)} />;
  return (
    <Screen footer={<Button label={tr('camp.library.back')} size="lg" variant="primary" onPress={back} />}>
      <Header title={story.title} onBack={back} />
      <View style={{ alignItems: 'center', gap: 6, marginTop: 16 }}>
        <AppText variant="display">{story.emoji}</AppText>
        <AppText variant="h2" center>
          {story.title}
        </AppText>
      </View>
      <Card style={{ gap: 6 }}>
        <AppText variant="small" weight="700" muted>
          {tr('camp.skills.sources')}
        </AppText>
        {campSources(story.sourceIds).map((s) => (
          <Pressable key={s.id} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link">
            <AppText variant="small" color={t.colors.primary}>
              {`${s.org} – ${s.title}`}
            </AppText>
          </Pressable>
        ))}
        <AppText variant="tiny" muted>
          {tr('camp.library.disclaimer')}
        </AppText>
      </Card>
    </Screen>
  );
}
