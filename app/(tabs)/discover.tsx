import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Icon, ProgressBar, Screen, useTheme, type IconName } from '@/components';
import { COURSES, STORIES } from '@/features/content/data';
import { storyOfTheDay } from '@/features/content/daily';
import { StoryBubble } from '@/features/content/StoryBubble';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useProgressStore } from '@/stores/progressStore';

const MIND: { route: '/mind/breathing' | '/mind/unload' | '/mind/body-scan'; key: string; icon: IconName }[] = [
  { route: '/mind/breathing', key: 'breathing', icon: 'wind' },
  { route: '/mind/unload', key: 'unload', icon: 'leaf' },
  { route: '/mind/body-scan', key: 'bodyScan', icon: 'body' },
];

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
        {tr('courses.title')}
      </AppText>
      {COURSES.map((c) => {
        const done = content.courseProgress[c.id]?.completedLessonIds.length ?? 0;
        return (
          <Card
            key={c.id}
            onPress={() => openGated('courses', { pathname: '/course/[courseId]', params: { courseId: c.id } })}
            accessibilityLabel={`${c.title}, ${tr('courses.progress', { done, total: c.lessons.length })}`}
            style={{ gap: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppText variant="h1">{c.emoji}</AppText>
              <View style={{ flex: 1 }}>
                <AppText weight="800">{c.title}</AppText>
                <AppText variant="small" muted numberOfLines={2}>
                  {c.description}
                </AppText>
              </View>
              <Icon name={access('courses') ? 'chevron' : 'lock'} color={t.colors.textMuted} size={18} />
            </View>
            <ProgressBar value={done / c.lessons.length} height={6} />
          </Card>
        );
      })}

      <AppText variant="h2" style={{ marginTop: 8 }}>
        {tr('mind.title')}
      </AppText>
      <AppText muted>{tr('mind.subtitle')}</AppText>
      {MIND.map((m) => (
        <Card key={m.key} onPress={() => openGated('mind', m.route)} accessibilityLabel={tr(`mind.${m.key}.title`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={m.icon} color={t.colors.breathe} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="700">{tr(`mind.${m.key}.title`)}</AppText>
            <AppText variant="small" muted>
              {tr(`mind.${m.key}.card`)}
            </AppText>
          </View>
          <Icon name={access('mind') ? 'chevron' : 'lock'} color={t.colors.textMuted} size={18} />
        </Card>
      ))}
      <AppText variant="small" muted>
        {tr('mind.note')}
      </AppText>
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
