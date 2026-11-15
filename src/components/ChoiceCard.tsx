import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { useTheme } from './useTheme';

interface Props {
  label: string;
  description?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}

/** Large, one-hand-friendly selection card used in onboarding & feedback. */
export function ChoiceCard({ label, description, emoji, selected, onPress, multi }: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={({ pressed }) => [
        styles.card,
        {
          minHeight: 64,
          borderRadius: t.radius.lg,
          backgroundColor: selected ? (t.dark ? t.colors.surfaceAlt : '#FFF3EB') : t.colors.surface,
          borderColor: selected ? t.colors.accent : t.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {emoji ? (
        <AppText variant="h2" style={{ marginRight: 12 }} accessible={false}>
          {emoji}
        </AppText>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="700">
          {label}
        </AppText>
        {description ? (
          <AppText variant="small" muted>
            {description}
          </AppText>
        ) : null}
      </View>
      <View
        style={[
          styles.dot,
          {
            borderColor: selected ? t.colors.accent : t.colors.border,
            backgroundColor: selected ? t.colors.accent : 'transparent',
            borderRadius: multi ? 6 : 12,
          },
        ]}
      >
        {selected ? <Icon name="check" size={16} color={t.colors.accentText} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 2 },
  dot: { width: 24, height: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
