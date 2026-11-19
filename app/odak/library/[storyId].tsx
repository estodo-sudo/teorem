import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { ODAK_LIBRARY, ODAK_SOURCES } from '@/features/camps/odak/content';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { StoryPlayer } from '@/features/content/storyPlayer/StoryPlayer';
import { goBack } from '@/lib/nav';

/** One library story: slides in the shared story player, then its sources. */
export default function OdakStory() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const story = ODAK_LIBRARY.find((s) => s.id === storyId);
  const [finished, setFinished] = useState(false);
  const back = () => goBack('/odak/library');

  if (!story) {
    return (
      <Screen>
        <Header title={tr('odak.library.title')} onBack={back} right={<QuickExitButton />} />
      </Screen>
    );
  }
  if (!finished) {
    return (
      <StoryPlayer
        title={story.title}
        slides={story.slides}
        onClose={back}
        onFinish={() => {
          void useOdakStore.getState().markRead(story.id);
          setFinished(true);
        }}
        endLabel={tr('odak.library.finish')}
      />
    );
  }
  return (
    <Screen footer={<Button label={tr('odak.library.back')} size="lg" onPress={() => router.replace('/odak/library')} />}>
      <Header title={story.title} onBack={back} right={<QuickExitButton />} />
      <Card style={{ alignItems: 'center', gap: 8, padding: 20 }}>
        <AppText variant="display">{story.emoji}</AppText>
        <AppText weight="800" center>
          {tr('odak.library.done')}
        </AppText>
      </Card>
      <Card style={{ gap: 6 }}>
        <AppText variant="small" weight="700" muted>
          {tr('odak.skills.sources')}
        </AppText>
        {ODAK_SOURCES.filter((s) => story.sourceIds.includes(s.id)).map((s) => (
          <Pressable key={s.id} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link" style={{ minHeight: 48, justifyContent: 'center' }}>
            <AppText variant="small" color={t.colors.primary}>
              {`${s.org} – ${s.title} (${s.year})`}
            </AppText>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
