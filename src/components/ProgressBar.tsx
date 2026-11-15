import { View } from 'react-native';

import { useTheme } from './useTheme';

interface Props {
  value: number; // 0..1
  color?: string;
  height?: number;
  accessibilityLabel?: string;
}

export function ProgressBar({ value, color, height = 8, accessibilityLabel }: Props) {
  const t = useTheme();
  const v = Math.min(1, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{
        height,
        borderRadius: height,
        backgroundColor: t.colors.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${v * 100}%`,
          height: '100%',
          borderRadius: height,
          backgroundColor: color ?? t.colors.accent,
        }}
      />
    </View>
  );
}
