import { View } from 'react-native';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { useTheme } from '../useTheme';
import { uiHaptic } from './haptic';
import { IconTile } from './IconTile';
import { ScalePressable } from './pressable';

export interface OptionCardProps {
  label: string;
  description?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  /** true → checkbox (several can be picked), false → radio (one). */
  multi?: boolean;
  testID?: string;
}

/**
 * Selection card (SPEC_UI_V3 §7.9): ≥ 64 px, icon tile on the left, title and description; selected =
 * soft primary fill + 1.5 px primary border + Check. Unselected shows an empty circle (radio) or box.
 */
export function OptionCard({ label, description, icon, selected, onPress, multi, testID }: OptionCardProps) {
  const t = useTheme();
  const k = t.tokens;
  return (
    <ScalePressable
      onPress={() => {
        uiHaptic('selection');
        onPress();
      }}
      testID={testID}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space.md,
        minHeight: 64,
        paddingHorizontal: t.space.lg,
        paddingVertical: t.space.md,
        borderRadius: t.radius.lg,
        borderWidth: selected ? t.border.medium : t.border.thin,
        borderColor: selected ? k.primary : k.border,
        backgroundColor: selected ? k.primarySoft : k.card,
      }}
    >
      {icon ? <IconTile icon={icon} background={selected ? k.card : undefined} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description ? (
          <AppText variant="footnote" muted>
            {description}
          </AppText>
        ) : null}
      </View>
      {selected ? (
        <View style={{ width: 24, height: 24, borderRadius: multi ? t.radius.sm - 2 : 12, backgroundColor: k.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={16} color={k.primaryForeground} strokeWidth={2.5} />
        </View>
      ) : (
        <View style={{ width: 24, height: 24, borderRadius: multi ? t.radius.sm - 2 : 12, borderWidth: t.border.medium, borderColor: k.subtle }} />
      )}
    </ScalePressable>
  );
}
