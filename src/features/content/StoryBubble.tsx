import { Pressable, View } from 'react-native';

import { AppText, useTheme } from '@/components';

import type { Story } from './data';

export function StoryBubble({ story, read, onPress, size = 68, showLabel = true }: { story: Story; read: boolean; onPress: () => void; size?: number; showLabel?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={story.title} style={{ width: size + 16, alignItems: 'center', gap: 4 }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: read ? t.colors.border : t.colors.accent, padding: 3 }}>
        <View style={{ flex: 1, borderRadius: size, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: size * 0.42, lineHeight: size * 0.52 }}>{story.emoji}</AppText>
        </View>
      </View>
      {showLabel ? (
        <AppText variant="tiny" numberOfLines={2} center muted={read}>
          {story.title}
        </AppText>
      ) : null}
    </Pressable>
  );
}
