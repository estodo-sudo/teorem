import { View } from 'react-native';

import { AppText } from '../AppText';
import { useTheme } from '../useTheme';

/** Step progress (SPEC_UI_V3 §7.9): a thin bar and a "1 / 7" caption. `label` is read by screen readers. */
export function SegmentedSteps({ total, current, label }: { total: number; current: number; label: string }) {
  const t = useTheme();
  const frac = Math.min(1, (current + 1) / Math.max(1, total));
  return (
    <View style={{ gap: t.space.xs }} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 1, max: total, now: current + 1 }}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: t.tokens.muted, overflow: 'hidden' }}>
        <View style={{ width: `${frac * 100}%`, height: '100%', borderRadius: 2, backgroundColor: t.tokens.primary }} />
      </View>
      <AppText variant="caption" muted tabular style={{ alignSelf: 'flex-end' }}>
        {`${current + 1} / ${total}`}
      </AppText>
    </View>
  );
}
