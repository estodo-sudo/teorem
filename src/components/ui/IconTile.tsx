import { View } from 'react-native';

import type { ModuleTone } from '@/config/theme';
import { Icon, type IconName } from '../Icon';
import { useTheme } from '../useTheme';

/** Icon box (§4.1): 40 / 48 px, radius 12, module tone soft background + tone icon. Replaces emoji. */
export function IconTile({ icon, tone = 'kegel', size = 'sm', round, color, background }: { icon: IconName; tone?: ModuleTone; size?: 'sm' | 'lg' | number; round?: boolean; color?: string; background?: string }) {
  const t = useTheme();
  const px = typeof size === 'number' ? size : t.tile[size];
  const c = t.tone[tone];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: px, height: px, borderRadius: round ? px / 2 : t.radius.md, backgroundColor: background ?? c.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={px >= t.tile.lg ? 'lg' : 'md'} color={color ?? c.fg} />
    </View>
  );
}
