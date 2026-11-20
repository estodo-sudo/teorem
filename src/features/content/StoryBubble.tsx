import { Pressable, View } from 'react-native';

import { AppText, useTheme } from '@/components';
import { IconTile } from '@/components/ui/IconTile';

import type { Story } from './data';

/**
 * Story bubble (SPEC_UI_V3 §7.7): a 64 px round icon tile in the story's tone; unread stories carry a
 * 2 px primary ring, read ones none. The label wraps instead of being cut.
 */
export function StoryBubble({ story, read, onPress, size = 64, showLabel = true }: { story: Story; read: boolean; onPress: () => void; size?: number; showLabel?: boolean }) {
  const t = useTheme();
  const ring = t.border.thick;
  const gap = 3;
  const outer = size + 2 * (ring + gap);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={story.title} style={{ width: outer + t.space.md, alignItems: 'center', gap: t.space.xs }}>
      <View style={{ width: outer, height: outer, borderRadius: outer / 2, borderWidth: ring, borderColor: read ? 'transparent' : t.tokens.primary, alignItems: 'center', justifyContent: 'center' }}>
        <IconTile icon={story.icon} tone={story.tone ?? 'knowledge'} size={size} round />
      </View>
      {showLabel ? (
        <AppText variant="caption" center muted={read} style={{ fontWeight: read ? '400' : '500' }}>
          {story.title}
        </AppText>
      ) : null}
    </Pressable>
  );
}
