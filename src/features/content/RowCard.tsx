import { View } from 'react-native';

import { AppText, Card, Icon, useTheme, type IconName } from '@/components';
import { IconTile } from '@/components/ui/IconTile';
import type { ModuleTone } from '@/config/theme';

/**
 * List-row card for camps, campuses and courses (SPEC_UI_V3 §7.7): module-tone icon tile, title, one
 * status line, an optional thin progress line and a chevron (or a lock). Uses the plain (non-animated)
 * card so camp definitions stay importable in tests.
 */
export function RowCard({ icon, tone, title, status, progress, danger, locked, onPress, accessibilityLabel }: { icon: IconName; tone: ModuleTone; title: string; status?: string; progress?: number; danger?: boolean; locked?: boolean; onPress: () => void; accessibilityLabel?: string }) {
  const t = useTheme();
  const p = progress === undefined ? null : Math.min(1, Math.max(0, progress));
  return (
    <Card onPress={onPress} accessibilityLabel={accessibilityLabel ?? (status ? `${title}, ${status}` : title)} style={{ padding: t.space.lg, gap: t.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
        <IconTile icon={icon} tone={tone} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title3">{title}</AppText>
          {status ? (
            <AppText variant="footnote" muted>
              {status}
            </AppText>
          ) : null}
        </View>
        <Icon name={locked ? 'lock' : 'chevron'} size="md" color={t.tokens.subtle} />
      </View>
      {p !== null && p > 0 ? (
        <View accessibilityElementsHidden importantForAccessibility="no" style={{ height: 4, borderRadius: 2, backgroundColor: t.tokens.muted, overflow: 'hidden', marginLeft: t.tile.sm + t.space.md }}>
          <View style={{ width: `${p * 100}%`, height: '100%', backgroundColor: danger ? t.tokens.destructive : t.tone[tone].fg }} />
        </View>
      ) : null}
    </Card>
  );
}
